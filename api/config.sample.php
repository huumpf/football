<?php
// Copy this file to config.php and fill in your database credentials. config.php
// is git-ignored and must be uploaded to the server once, by hand — deploys
// never touch it.

return [
    // 'mysql' in production, 'sqlite' for local development/tests.
    'driver' => 'mysql',

    // --- MySQL (production) ---
    'host' => 'localhost',
    'name' => 'your_database',
    'user' => 'your_db_user',
    'pass' => 'your_db_password',
    'charset' => 'utf8mb4',

    // --- SQLite (local only) ---
    'sqlite_path' => __DIR__ . '/data/football.sqlite',
];
