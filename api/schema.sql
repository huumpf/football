-- Run once on the production MySQL database (e.g. in phpMyAdmin). The local
-- SQLite database is created automatically by _bootstrap.php.

-- email is VARCHAR(191), not 255: under utf8mb4 (4 bytes/char) a 255-char
-- UNIQUE index is 1020 bytes and exceeds the 767-byte limit on older MySQL.
-- 191*4 = 764 bytes fits, and 191 chars is ample for an email address.
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- One save per user: the whole game state as a JSON blob.
CREATE TABLE IF NOT EXISTS saves (
    user_id INT NOT NULL PRIMARY KEY,
    state LONGTEXT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_saves_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Failed login/register attempts, used for the per-IP brute-force throttle.
CREATE TABLE IF NOT EXISTS auth_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip VARCHAR(45) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_attempts_ip_time (ip, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
