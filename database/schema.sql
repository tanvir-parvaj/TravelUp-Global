-- ==============================================================
-- TravelUp Global Database Schema (MySQL)
-- Academic Project: Markup & Scripting Languages
-- ==============================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('customer', 'admin') DEFAULT 'customer',
    phone VARCHAR(30) DEFAULT NULL,
    preferred_lang VARCHAR(10) DEFAULT 'en',
    avatar_url VARCHAR(500) DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    budget_range VARCHAR(50) DEFAULT 'mid-range',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Destinations Table
CREATE TABLE IF NOT EXISTS destinations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name_en VARCHAR(150) NOT NULL,
    name_bn VARCHAR(150) NOT NULL,
    country VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    category VARCHAR(50) DEFAULT 'Beach',
    description_en TEXT,
    description_bn TEXT,
    price_bdt DECIMAL(10,2) NOT NULL,
    price_usd DECIMAL(10,2) NOT NULL,
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    image_url TEXT NOT NULL,
    rating DECIMAL(2,1) DEFAULT 4.8,
    weather_city VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Packages Table
CREATE TABLE IF NOT EXISTS packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    destination_id INT NOT NULL,
    title_en VARCHAR(200) NOT NULL,
    title_bn VARCHAR(200) NOT NULL,
    duration_days INT NOT NULL,
    price_bdt DECIMAL(10,2) NOT NULL,
    price_usd DECIMAL(10,2) NOT NULL,
    included_services TEXT,
    discount_percent INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_ref VARCHAR(50) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    destination_id INT NOT NULL,
    package_id INT DEFAULT NULL,
    start_date DATE NOT NULL,
    travelers_count INT DEFAULT 1,
    total_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'BDT',
    status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'confirmed',
    is_group BOOLEAN DEFAULT FALSE,
    group_code VARCHAR(50) DEFAULT NULL,
    special_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE,
    FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    destination_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Travel Alerts Table (Admin Emergency Announcements)
CREATE TABLE IF NOT EXISTS travel_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    destination_id INT DEFAULT NULL,
    title_en VARCHAR(255) NOT NULL,
    title_bn VARCHAR(255) NOT NULL,
    severity ENUM('info', 'warning', 'critical') DEFAULT 'info',
    message_en TEXT NOT NULL,
    message_bn TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
