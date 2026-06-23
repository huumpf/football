<?php
// Account endpoints. Dispatched by ?action=register|login|logout|me.

declare(strict_types=1);

require __DIR__ . '/_bootstrap.php';

// Brute-force / credential-stuffing throttle: at most MAX_ATTEMPTS failed
// login/register tries per client IP within ATTEMPT_WINDOW seconds.
const MAX_ATTEMPTS = 10;
const ATTEMPT_WINDOW = 900;

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'register':
        register();
        break;
    case 'login':
        login();
        break;
    case 'logout':
        logout();
        break;
    case 'me':
        me();
        break;
    default:
        json_response(['error' => 'unknown_action'], 404);
}

function register()
{
    $in = json_input();
    $email = strtolower(trim((string) ($in['email'] ?? '')));
    $password = (string) ($in['password'] ?? '');

    $pdo = db();
    $ip = client_ip();
    throttle_check($pdo, $ip);

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        record_attempt($pdo, $ip);
        json_response(['error' => 'invalid_email'], 422);
    }
    if (strlen($password) < 8) {
        record_attempt($pdo, $ip);
        json_response(['error' => 'weak_password'], 422);
    }

    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        record_attempt($pdo, $ip);
        json_response(['error' => 'email_taken'], 409);
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    try {
        $stmt = $pdo->prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)');
        $stmt->execute([$email, $hash]);
    } catch (PDOException $e) {
        // Lost the race with a concurrent signup for the same email: the UNIQUE
        // constraint, not the SELECT above, is what actually guarantees it.
        if ($e->getCode() === '23000') {
            record_attempt($pdo, $ip);
            json_response(['error' => 'email_taken'], 409);
        }
        throw $e;
    }
    $uid = (int) $pdo->lastInsertId();

    session_regenerate_id(true);
    $_SESSION['uid'] = $uid;
    json_response(['user' => ['id' => $uid, 'email' => $email]]);
}

function login()
{
    $in = json_input();
    $email = strtolower(trim((string) ($in['email'] ?? '')));
    $password = (string) ($in['password'] ?? '');

    $pdo = db();
    $ip = client_ip();
    throttle_check($pdo, $ip);

    $stmt = $pdo->prepare('SELECT id, password_hash FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $row = $stmt->fetch();

    if (!$row || !password_verify($password, $row['password_hash'])) {
        record_attempt($pdo, $ip);
        json_response(['error' => 'invalid_credentials'], 401);
    }

    clear_attempts($pdo, $ip);
    session_regenerate_id(true);
    $_SESSION['uid'] = (int) $row['id'];
    json_response(['user' => ['id' => (int) $row['id'], 'email' => $email]]);
}

function logout()
{
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        if (PHP_VERSION_ID >= 70300) {
            setcookie(session_name(), '', [
                'expires' => time() - 42000,
                'path' => $p['path'],
                'domain' => $p['domain'],
                'secure' => $p['secure'],
                'httponly' => $p['httponly'],
                'samesite' => isset($p['samesite']) ? $p['samesite'] : 'Lax',
            ]);
        } else {
            setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
        }
    }
    session_destroy();
    json_response(['ok' => true]);
}

function me()
{
    $uid = current_user_id();
    if ($uid === null) {
        json_response(['user' => null]);
    }
    $pdo = db();
    $stmt = $pdo->prepare('SELECT id, email FROM users WHERE id = ?');
    $stmt->execute([$uid]);
    $row = $stmt->fetch();
    json_response(['user' => $row ? ['id' => (int) $row['id'], 'email' => $row['email']] : null]);
}

function client_ip(): string
{
    return (string) ($_SERVER['REMOTE_ADDR'] ?? '');
}

// Ends the request with 429 when this IP has too many recent failed attempts.
function throttle_check(PDO $pdo, string $ip): void
{
    $since = gmdate('Y-m-d H:i:s', time() - ATTEMPT_WINDOW);
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM auth_attempts WHERE ip = ? AND created_at > ?');
    $stmt->execute([$ip, $since]);
    if ((int) $stmt->fetchColumn() >= MAX_ATTEMPTS) {
        json_response(['error' => 'too_many_attempts'], 429);
    }
}

function record_attempt(PDO $pdo, string $ip): void
{
    $stmt = $pdo->prepare('INSERT INTO auth_attempts (ip, created_at) VALUES (?, ?)');
    $stmt->execute([$ip, gmdate('Y-m-d H:i:s')]);
}

function clear_attempts(PDO $pdo, string $ip): void
{
    $stmt = $pdo->prepare('DELETE FROM auth_attempts WHERE ip = ?');
    $stmt->execute([$ip]);
}
