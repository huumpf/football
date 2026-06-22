<?php
// Shared bootstrap for every API endpoint: database handle, session cookie, and
// JSON request/response helpers. Same-origin with the SPA, so login is a plain
// session cookie — no tokens, no CORS.

declare(strict_types=1);

$config = require __DIR__ . '/config.php';

// Lazily-opened PDO handle. Driver-configurable so the same code runs against
// MySQL in production and SQLite locally (the SQLite tables are created on the
// fly; MySQL uses schema.sql, run once by hand).
function db(): PDO
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }
    global $config;

    if (($config['driver'] ?? 'mysql') === 'sqlite') {
        $dir = dirname($config['sqlite_path']);
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }
        $pdo = new PDO('sqlite:' . $config['sqlite_path']);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $pdo->exec('PRAGMA foreign_keys = ON');
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime(\'now\'))
            )'
        );
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS saves (
                user_id INTEGER PRIMARY KEY,
                state TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )'
        );
        return $pdo;
    }

    // Accept 'host' => 'db.example' (with an optional separate 'port'), or a
    // combined 'host:port' string (a common copy-paste from control panels).
    $host = $config['host'];
    $port = $config['port'] ?? null;
    if (strpos($host, ':') !== false) {
        list($host, $port) = explode(':', $host, 2);
    }
    $dsn = sprintf(
        'mysql:host=%s;%sdbname=%s;charset=%s',
        $host,
        $port ? 'port=' . $port . ';' : '',
        $config['name'],
        $config['charset'] ?? 'utf8mb4'
    );
    $pdo = new PDO($dsn, $config['user'], $config['pass']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    return $pdo;
}

// Secure cookie only once we're actually on HTTPS, so local http development
// (php -S) still keeps a session.
$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'httponly' => true,
    'secure' => $https,
    'samesite' => 'Lax',
]);
session_name('FBSESS');
session_start();

function json_response($data, $code = 200)
{
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function json_input(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === '' || $raw === false) {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function current_user_id(): ?int
{
    return isset($_SESSION['uid']) ? (int) $_SESSION['uid'] : null;
}

// Endpoints that need a logged-in user start with this; it ends the request
// with 401 when there is none.
function require_auth(): int
{
    $uid = current_user_id();
    if ($uid === null) {
        json_response(['error' => 'unauthorized'], 401);
    }
    return $uid;
}
