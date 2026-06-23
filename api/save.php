<?php
// The logged-in user's single saved game. GET loads it, PUT replaces it.

declare(strict_types=1);

require __DIR__ . '/_bootstrap.php';

$uid = require_auth();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $pdo = db();
    $stmt = $pdo->prepare('SELECT state FROM saves WHERE user_id = ?');
    $stmt->execute([$uid]);
    $row = $stmt->fetch();
    json_response(['state' => $row ? json_decode($row['state'], true) : null]);
}

if ($method === 'PUT') {
    $raw = file_get_contents('php://input');
    if ($raw === false || strlen($raw) > 4 * 1024 * 1024) {
        json_response(['error' => 'too_large'], 413);
    }
    $in = json_decode($raw, true);
    if (!is_array($in) || !array_key_exists('state', $in)) {
        json_response(['error' => 'bad_request'], 422);
    }

    $state = json_encode($in['state'], JSON_UNESCAPED_UNICODE);
    if ($state === false) {
        json_response(['error' => 'bad_state'], 422);
    }
    $now = gmdate('Y-m-d H:i:s');
    $pdo = db();

    // Atomic upsert — no SELECT-then-write race (two concurrent first saves can
    // no longer both INSERT and collide on the primary key).
    if ($pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql') {
        $stmt = $pdo->prepare(
            'INSERT INTO saves (user_id, state, updated_at) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE state = VALUES(state), updated_at = VALUES(updated_at)'
        );
    } else {
        $stmt = $pdo->prepare(
            'INSERT INTO saves (user_id, state, updated_at) VALUES (?, ?, ?)
             ON CONFLICT(user_id) DO UPDATE SET state = excluded.state, updated_at = excluded.updated_at'
        );
    }
    $stmt->execute([$uid, $state, $now]);
    json_response(['ok' => true, 'updated_at' => $now]);
}

json_response(['error' => 'method_not_allowed'], 405);
