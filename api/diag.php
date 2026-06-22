<?php
// TEMPORARY diagnostic — remove after debugging. Reports the server runtime so
// we can see why the API 500s. Prints no secrets (a DB error may name the host/
// user, never the password). Delete this file once the API works.

header('Content-Type: text/plain; charset=utf-8');

echo 'PHP ' . PHP_VERSION . "\n";
echo 'pdo_mysql loaded: ' . (extension_loaded('pdo_mysql') ? 'yes' : 'NO') . "\n";
echo 'config.php present: ' . (file_exists(__DIR__ . '/config.php') ? 'yes' : 'NO') . "\n";
echo "--- include _bootstrap.php ---\n";

try {
    require __DIR__ . '/_bootstrap.php';
    echo "bootstrap: OK\n";
    try {
        db();
        echo "db connect: OK\n";
    } catch (Throwable $e) {
        echo 'db connect ERROR: ' . $e->getMessage() . "\n";
    }
} catch (Throwable $e) {
    echo 'bootstrap ERROR: ' . get_class($e) . ': ' . $e->getMessage()
        . ' @ ' . basename($e->getFile()) . ':' . $e->getLine() . "\n";
}
