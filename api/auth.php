<?php
// Account endpoints. Dispatched by ?action=register|login|logout|me.

declare(strict_types=1);

require __DIR__ . '/_bootstrap.php';

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

function register(): never
{
    $in = json_input();
    $email = strtolower(trim((string) ($in['email'] ?? '')));
    $password = (string) ($in['password'] ?? '');

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_response(['error' => 'invalid_email'], 422);
    }
    if (strlen($password) < 8) {
        json_response(['error' => 'weak_password'], 422);
    }

    $pdo = db();
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        json_response(['error' => 'email_taken'], 409);
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)');
    $stmt->execute([$email, $hash]);
    $uid = (int) $pdo->lastInsertId();

    session_regenerate_id(true);
    $_SESSION['uid'] = $uid;
    json_response(['user' => ['id' => $uid, 'email' => $email]]);
}

function login(): never
{
    $in = json_input();
    $email = strtolower(trim((string) ($in['email'] ?? '')));
    $password = (string) ($in['password'] ?? '');

    $pdo = db();
    $stmt = $pdo->prepare('SELECT id, password_hash FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $row = $stmt->fetch();

    if (!$row || !password_verify($password, $row['password_hash'])) {
        json_response(['error' => 'invalid_credentials'], 401);
    }

    session_regenerate_id(true);
    $_SESSION['uid'] = (int) $row['id'];
    json_response(['user' => ['id' => (int) $row['id'], 'email' => $email]]);
}

function logout(): never
{
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', [
            'expires' => time() - 42000,
            'path' => $p['path'],
            'domain' => $p['domain'],
            'secure' => $p['secure'],
            'httponly' => $p['httponly'],
            'samesite' => $p['samesite'] ?? 'Lax',
        ]);
    }
    session_destroy();
    json_response(['ok' => true]);
}

function me(): never
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
