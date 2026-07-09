-- ─────────────────────────────────────────────────────────────────────────────
-- OpusAIMobility — TerraAI Database Schema
-- Target: opusaimobility-db RDS MySQL 8.0
-- Database: terraai
-- ─────────────────────────────────────────────────────────────────────────────

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

-- ── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) DEFAULT NULL,
    `role` ENUM('customer', 'rider', 'vendor', 'business', 'admin') DEFAULT 'customer',
    `status` ENUM('active', 'suspended', 'deleted') DEFAULT 'active',
    `avatar_url` VARCHAR(500) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE INDEX `idx_email` (`email`),
    INDEX `idx_status` (`status`),
    INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Trips / Rides ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `trips` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `customer_id` INT NOT NULL,
    `rider_id` INT DEFAULT NULL,
    `pickup_address` VARCHAR(500) DEFAULT NULL,
    `pickup_lat` DECIMAL(10, 8) DEFAULT NULL,
    `pickup_lng` DECIMAL(11, 8) DEFAULT NULL,
    `dropoff_address` VARCHAR(500) DEFAULT NULL,
    `dropoff_lat` DECIMAL(10, 8) DEFAULT NULL,
    `dropoff_lng` DECIMAL(11, 8) DEFAULT NULL,
    `status` ENUM('pending', 'accepted', 'arriving', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    `fare` DECIMAL(10, 2) DEFAULT NULL,
    `distance_km` DECIMAL(8, 2) DEFAULT NULL,
    `duration_minutes` INT DEFAULT NULL,
    `vehicle_type` VARCHAR(50) DEFAULT NULL,
    `payment_method` VARCHAR(50) DEFAULT NULL,
    `rating` TINYINT DEFAULT NULL,
    `notes` TEXT DEFAULT NULL,
    `started_at` TIMESTAMP NULL DEFAULT NULL,
    `completed_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_customer` (`customer_id`),
    INDEX `idx_rider` (`rider_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_created` (`created_at`),
    FOREIGN KEY (`customer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`rider_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Orders (Food / Delivery) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `orders` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `customer_id` INT NOT NULL,
    `rider_id` INT DEFAULT NULL,
    `vendor_id` INT DEFAULT NULL,
    `order_type` ENUM('food', 'delivery', 'errand') DEFAULT 'food',
    `status` ENUM('pending', 'confirmed', 'preparing', 'picked_up', 'in_transit', 'delivered', 'cancelled') DEFAULT 'pending',
    `total_amount` DECIMAL(10, 2) DEFAULT NULL,
    `delivery_fee` DECIMAL(10, 2) DEFAULT NULL,
    `delivery_address` VARCHAR(500) DEFAULT NULL,
    `delivery_lat` DECIMAL(10, 8) DEFAULT NULL,
    `delivery_lng` DECIMAL(11, 8) DEFAULT NULL,
    `items_json` JSON DEFAULT NULL,
    `payment_method` VARCHAR(50) DEFAULT NULL,
    `notes` TEXT DEFAULT NULL,
    `estimated_delivery` TIMESTAMP NULL DEFAULT NULL,
    `delivered_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_customer` (`customer_id`),
    INDEX `idx_rider` (`rider_id`),
    INDEX `idx_vendor` (`vendor_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_type` (`order_type`),
    FOREIGN KEY (`customer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`rider_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`vendor_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Payments / Transactions ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `transactions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `trip_id` INT DEFAULT NULL,
    `order_id` INT DEFAULT NULL,
    `type` ENUM('payment', 'payout', 'refund', 'topup', 'withdrawal') NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(3) DEFAULT 'KES',
    `gateway` VARCHAR(50) DEFAULT NULL,
    `gateway_reference` VARCHAR(255) DEFAULT NULL,
    `status` ENUM('pending', 'completed', 'failed', 'reversed') DEFAULT 'pending',
    `metadata_json` JSON DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_user` (`user_id`),
    INDEX `idx_trip` (`trip_id`),
    INDEX `idx_order` (`order_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_gateway` (`gateway`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Vehicles ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `vehicles` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `rider_id` INT NOT NULL,
    `make` VARCHAR(100) DEFAULT NULL,
    `model` VARCHAR(100) DEFAULT NULL,
    `year` INT DEFAULT NULL,
    `color` VARCHAR(50) DEFAULT NULL,
    `plate_number` VARCHAR(20) DEFAULT NULL,
    `vehicle_type` ENUM('sedan', 'suv', 'van', 'motorcycle', 'bicycle', 'ev') DEFAULT 'sedan',
    `is_electric` BOOLEAN DEFAULT FALSE,
    `battery_capacity_kwh` DECIMAL(6, 2) DEFAULT NULL,
    `status` ENUM('active', 'maintenance', 'inactive') DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_rider` (`rider_id`),
    INDEX `idx_type` (`vehicle_type`),
    UNIQUE INDEX `idx_plate` (`plate_number`),
    FOREIGN KEY (`rider_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── File Uploads ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `uploads` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `original_filename` VARCHAR(255) DEFAULT NULL,
    `s3_key` VARCHAR(500) DEFAULT NULL,
    `file_size_bytes` BIGINT DEFAULT NULL,
    `mime_type` VARCHAR(100) DEFAULT NULL,
    `upload_type` ENUM('avatar', 'document', 'vehicle_photo', 'order_photo', 'other') DEFAULT 'other',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_user` (`user_id`),
    INDEX `idx_type` (`upload_type`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Notifications ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `notifications` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `body` TEXT DEFAULT NULL,
    `data_json` JSON DEFAULT NULL,
    `is_read` BOOLEAN DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_user` (`user_id`),
    INDEX `idx_read` (`is_read`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Device Tokens (push notifications) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS `device_tokens` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `device_id` VARCHAR(255) NOT NULL,
    `token` VARCHAR(500) NOT NULL,
    `platform` ENUM('android', 'ios', 'web') DEFAULT 'android',
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_user` (`user_id`),
    INDEX `idx_device` (`device_id`),
    UNIQUE INDEX `idx_user_device` (`user_id`, `device_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Vendors / Restaurants ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `vendors` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `business_name` VARCHAR(255) NOT NULL,
    `category` VARCHAR(100) DEFAULT NULL,
    `address` VARCHAR(500) DEFAULT NULL,
    `lat` DECIMAL(10, 8) DEFAULT NULL,
    `lng` DECIMAL(11, 8) DEFAULT NULL,
    `phone` VARCHAR(20) DEFAULT NULL,
    `is_open` BOOLEAN DEFAULT TRUE,
    `rating` DECIMAL(3, 2) DEFAULT NULL,
    `logo_url` VARCHAR(500) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_user` (`user_id`),
    INDEX `idx_category` (`category`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Promo Codes ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `promo_codes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(50) NOT NULL,
    `discount_type` ENUM('percentage', 'fixed') DEFAULT 'percentage',
    `discount_value` DECIMAL(10, 2) NOT NULL,
    `max_uses` INT DEFAULT NULL,
    `uses_count` INT DEFAULT 0,
    `min_order_amount` DECIMAL(10, 2) DEFAULT NULL,
    `valid_from` TIMESTAMP NULL DEFAULT NULL,
    `valid_until` TIMESTAMP NULL DEFAULT NULL,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE INDEX `idx_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Ratings / Reviews ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `ratings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `trip_id` INT DEFAULT NULL,
    `order_id` INT DEFAULT NULL,
    `from_user_id` INT NOT NULL,
    `to_user_id` INT NOT NULL,
    `score` TINYINT NOT NULL CHECK (`score` BETWEEN 1 AND 5),
    `comment` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_trip` (`trip_id`),
    INDEX `idx_to_user` (`to_user_id`),
    FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`from_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`to_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Audit Log ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `audit_log` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT DEFAULT NULL,
    `action` VARCHAR(100) NOT NULL,
    `resource_type` VARCHAR(50) DEFAULT NULL,
    `resource_id` INT DEFAULT NULL,
    `details_json` JSON DEFAULT NULL,
    `ip_address` VARCHAR(45) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_user` (`user_id`),
    INDEX `idx_action` (`action`),
    INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Platform Settings ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `settings` (
    `key` VARCHAR(100) PRIMARY KEY,
    `value` TEXT NOT NULL,
    `description` VARCHAR(255) DEFAULT NULL,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Seed default settings ────────────────────────────────────────────────────
INSERT IGNORE INTO `settings` (`key`, `value`, `description`) VALUES
('platform_name', 'OpusAIMobility', 'Platform display name'),
('default_currency', 'KES', 'Default currency code'),
('min_fare', '150.00', 'Minimum trip fare'),
('base_fare', '100.00', 'Base fare before distance calculation'),
('per_km_rate', '35.00', 'Rate per kilometer'),
('per_minute_rate', '5.00', 'Rate per minute'),
('commission_percentage', '20.00', 'Platform commission on rider earnings'),
('max_device_tokens', '10', 'Maximum push notification device tokens per user'),
('file_upload_max_mb', '50', 'Maximum file upload size in MB'),
('presigned_url_expiry_seconds', '3600', 'S3 pre-signed URL expiration');

SET FOREIGN_KEY_CHECKS = 1;

-- ─────────────────────────────────────────────────────────────────────────────
-- Schema complete: 12 tables + seed settings
-- ─────────────────────────────────────────────────────────────────────────────
