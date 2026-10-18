const { pool } = require('../server/config/db');

async function migrate() {
    console.log('🚀 Starting TravelUp Global Modular Platform Migration on Hostinger MySQL...');
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        // 1. Roles Table
        console.log('Creating roles table...');
        await conn.query(`
            CREATE TABLE IF NOT EXISTS roles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) NOT NULL UNIQUE,
                description VARCHAR(255),
                permissions_json TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // Insert Default Roles if not existing
        await conn.query(`
            INSERT IGNORE INTO roles (id, name, description) VALUES
            (1, 'super_admin', 'Full access to all platform systems'),
            (2, 'destination_manager', 'Manages destinations, hotels, dining, activities'),
            (3, 'package_manager', 'Manages packages, itineraries, add-ons'),
            (4, 'booking_manager', 'Manages bookings, travelers, invoices'),
            (5, 'customer', 'Standard traveler account');
        `);

        // 2. Price Audit Logs Table
        console.log('Creating price_audit_logs table...');
        await conn.query(`
            CREATE TABLE IF NOT EXISTS price_audit_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                component_type VARCHAR(50) NOT NULL,
                component_id INT NOT NULL,
                component_name VARCHAR(150),
                old_supplier_cost DECIMAL(10,2),
                new_supplier_cost DECIMAL(10,2),
                old_selling_price DECIMAL(10,2),
                new_selling_price DECIMAL(10,2),
                changed_by_admin_id INT,
                reason VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 3. Update Destinations columns if needed
        console.log('Checking destinations table columns...');
        const [destCols] = await conn.query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'destinations';
        `);
        const destColNames = destCols.map(c => c.COLUMN_NAME);

        const addColIfMissing = async (colName, colDef) => {
            if (!destColNames.includes(colName)) {
                console.log(`Adding ${colName} to destinations...`);
                await conn.query(`ALTER TABLE destinations ADD COLUMN ${colName} ${colDef};`);
            }
        };

        await addColIfMissing('short_desc_en', 'VARCHAR(255) DEFAULT NULL');
        await addColIfMissing('short_desc_bn', 'VARCHAR(255) DEFAULT NULL');
        await addColIfMissing('estimated_budget_min', 'DECIMAL(10,2) DEFAULT 500.00');
        await addColIfMissing('estimated_budget_max', 'DECIMAL(10,2) DEFAULT 2500.00');
        await addColIfMissing('best_time_en', 'VARCHAR(100) DEFAULT "Apr - Oct"');
        await addColIfMissing('best_time_bn', 'VARCHAR(100) DEFAULT "এপ্রিল - অক্টোবর"');
        await addColIfMissing('currency_code', 'VARCHAR(10) DEFAULT "USD"');
        await addColIfMissing('timezone', 'VARCHAR(50) DEFAULT "GMT+8"');
        await addColIfMissing('visa_info_en', 'TEXT DEFAULT NULL');
        await addColIfMissing('safety_info_en', 'TEXT DEFAULT NULL');
        await addColIfMissing('is_featured', 'BOOLEAN DEFAULT TRUE');
        await addColIfMissing('is_trending', 'BOOLEAN DEFAULT TRUE');
        await addColIfMissing('is_active', 'BOOLEAN DEFAULT TRUE');

        // 4. Destination Categories Table
        console.log('Creating destination_categories table...');
        await conn.query(`
            CREATE TABLE IF NOT EXISTS destination_categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                destination_id INT NOT NULL,
                category_name VARCHAR(50) NOT NULL,
                INDEX idx_dest_cat (destination_id, category_name),
                FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 5. Destination Media Table
        console.log('Creating destination_media table...');
        await conn.query(`
            CREATE TABLE IF NOT EXISTS destination_media (
                id INT AUTO_INCREMENT PRIMARY KEY,
                destination_id INT NOT NULL,
                media_type ENUM('image', 'video', '360') DEFAULT 'image',
                media_url TEXT NOT NULL,
                caption VARCHAR(255),
                is_cover BOOLEAN DEFAULT FALSE,
                sort_order INT DEFAULT 0,
                FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 6. Attractions Table
        console.log('Creating attractions table...');
        await conn.query(`
            CREATE TABLE IF NOT EXISTS attractions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                destination_id INT NOT NULL,
                name_en VARCHAR(150) NOT NULL,
                name_bn VARCHAR(150) NOT NULL,
                category VARCHAR(50) DEFAULT 'Sightseeing',
                distance_km DECIMAL(6,2) DEFAULT 0,
                travel_time_min INT DEFAULT 30,
                image_url TEXT NOT NULL,
                rating DECIMAL(2,1) DEFAULT 4.8,
                FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 7. Hotels Table & Hotel Rooms & Hotel Prices
        console.log('Creating hotels and hotel pricing tables...');
        await conn.query(`
            CREATE TABLE IF NOT EXISTS hotels (
                id INT AUTO_INCREMENT PRIMARY KEY,
                destination_id INT NOT NULL,
                name_en VARCHAR(150) NOT NULL,
                name_bn VARCHAR(150) NOT NULL,
                star_rating INT DEFAULT 4,
                area_name VARCHAR(100) DEFAULT 'Central',
                address VARCHAR(255),
                cover_image TEXT NOT NULL,
                tier ENUM('budget', 'standard', 'premium', 'luxury') DEFAULT 'standard',
                amenities_json TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        await conn.query(`
            CREATE TABLE IF NOT EXISTS hotel_rooms (
                id INT AUTO_INCREMENT PRIMARY KEY,
                hotel_id INT NOT NULL,
                room_name_en VARCHAR(150) NOT NULL,
                room_type VARCHAR(50) DEFAULT 'Deluxe',
                capacity_adults INT DEFAULT 2,
                capacity_children INT DEFAULT 1,
                image_url TEXT,
                FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        await conn.query(`
            CREATE TABLE IF NOT EXISTS hotel_prices (
                id INT AUTO_INCREMENT PRIMARY KEY,
                room_id INT NOT NULL,
                season_type ENUM('low', 'standard', 'high', 'peak') DEFAULT 'standard',
                pricing_unit VARCHAR(50) DEFAULT 'per_room_night',
                supplier_cost DECIMAL(10,2) NOT NULL,
                markup_percent DECIMAL(5,2) DEFAULT 20.00,
                tax_percent DECIMAL(5,2) DEFAULT 5.00,
                selling_price DECIMAL(10,2) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (room_id) REFERENCES hotel_rooms(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 8. Restaurants & Restaurant Prices
        console.log('Creating restaurants and restaurant pricing tables...');
        await conn.query(`
            CREATE TABLE IF NOT EXISTS restaurants (
                id INT AUTO_INCREMENT PRIMARY KEY,
                destination_id INT NOT NULL,
                name_en VARCHAR(150) NOT NULL,
                name_bn VARCHAR(150) NOT NULL,
                cuisine_type VARCHAR(100) DEFAULT 'Local & International',
                price_level ENUM('budget', 'standard', 'premium', 'luxury') DEFAULT 'standard',
                is_halal BOOLEAN DEFAULT TRUE,
                is_vegetarian BOOLEAN DEFAULT TRUE,
                image_url TEXT,
                rating DECIMAL(2,1) DEFAULT 4.7,
                is_active BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        await conn.query(`
            CREATE TABLE IF NOT EXISTS restaurant_prices (
                id INT AUTO_INCREMENT PRIMARY KEY,
                restaurant_id INT NOT NULL,
                meal_type ENUM('breakfast', 'lunch', 'dinner', 'buffet', 'all_day') DEFAULT 'dinner',
                pricing_unit VARCHAR(50) DEFAULT 'per_person_meal',
                supplier_cost DECIMAL(10,2) NOT NULL,
                markup_percent DECIMAL(5,2) DEFAULT 20.00,
                selling_price DECIMAL(10,2) NOT NULL,
                FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 9. Activities & Activity Prices
        console.log('Creating activities and activity pricing tables...');
        await conn.query(`
            CREATE TABLE IF NOT EXISTS activities (
                id INT AUTO_INCREMENT PRIMARY KEY,
                destination_id INT NOT NULL,
                name_en VARCHAR(150) NOT NULL,
                name_bn VARCHAR(150) NOT NULL,
                category VARCHAR(50) DEFAULT 'Adventure',
                duration_hours DECIMAL(4,1) DEFAULT 3.0,
                difficulty_level ENUM('easy', 'moderate', 'challenging') DEFAULT 'easy',
                min_age INT DEFAULT 5,
                image_url TEXT NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        await conn.query(`
            CREATE TABLE IF NOT EXISTS activity_prices (
                id INT AUTO_INCREMENT PRIMARY KEY,
                activity_id INT NOT NULL,
                pricing_unit VARCHAR(50) DEFAULT 'per_person',
                supplier_cost DECIMAL(10,2) NOT NULL,
                markup_percent DECIMAL(5,2) DEFAULT 20.00,
                adult_price DECIMAL(10,2) NOT NULL,
                child_price DECIMAL(10,2) DEFAULT 0.00,
                is_fixed_cost BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 10. Transportation & Transportation Prices
        console.log('Creating transportation tables...');
        await conn.query(`
            CREATE TABLE IF NOT EXISTS transportation (
                id INT AUTO_INCREMENT PRIMARY KEY,
                destination_id INT NOT NULL,
                title_en VARCHAR(150) NOT NULL,
                title_bn VARCHAR(150) NOT NULL,
                vehicle_type ENUM('public', 'private_car', 'flight', 'scooter', 'boat') DEFAULT 'private_car',
                service_type ENUM('airport_transfer', 'daily_rental', 'intercity', 'guided_driver') DEFAULT 'airport_transfer',
                capacity_passengers INT DEFAULT 4,
                image_url TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        await conn.query(`
            CREATE TABLE IF NOT EXISTS transportation_prices (
                id INT AUTO_INCREMENT PRIMARY KEY,
                transport_id INT NOT NULL,
                pricing_unit VARCHAR(50) DEFAULT 'per_vehicle_day',
                supplier_cost DECIMAL(10,2) NOT NULL,
                markup_percent DECIMAL(5,2) DEFAULT 20.00,
                selling_price DECIMAL(10,2) NOT NULL,
                is_fixed_cost BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (transport_id) REFERENCES transportation(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 11. Custom Trips & Day Itinerary Tables
        console.log('Creating custom_trips and itinerary tables...');
        await conn.query(`
            CREATE TABLE IF NOT EXISTS custom_trips (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                destination_id INT NOT NULL,
                trip_title VARCHAR(150) NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                duration_days INT DEFAULT 7,
                adults_count INT DEFAULT 2,
                children_count INT DEFAULT 0,
                travel_style ENUM('relaxation', 'adventure', 'cultural', 'luxury') DEFAULT 'relaxation',
                hotel_tier ENUM('budget', 'standard', 'premium', 'luxury') DEFAULT 'standard',
                food_pref ENUM('local_food', 'mix', 'vegetarian', 'halal') DEFAULT 'mix',
                transport_pref ENUM('public', 'private_car', 'flight', 'scooter') DEFAULT 'private_car',
                target_budget DECIMAL(10,2) DEFAULT 2000.00,
                calculated_total DECIMAL(10,2) DEFAULT 0.00,
                status ENUM('draft', 'saved', 'booked') DEFAULT 'draft',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        await conn.query(`
            CREATE TABLE IF NOT EXISTS trip_days (
                id INT AUTO_INCREMENT PRIMARY KEY,
                custom_trip_id INT NOT NULL,
                day_number INT NOT NULL,
                day_title_en VARCHAR(150) NOT NULL,
                day_title_bn VARCHAR(150),
                target_date DATE,
                FOREIGN KEY (custom_trip_id) REFERENCES custom_trips(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        await conn.query(`
            CREATE TABLE IF NOT EXISTS custom_trip_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                trip_day_id INT NOT NULL,
                component_type ENUM('hotel', 'restaurant', 'activity', 'transport', 'service') NOT NULL,
                component_id INT NOT NULL,
                item_title VARCHAR(150) NOT NULL,
                pricing_unit VARCHAR(50) DEFAULT 'per_person',
                unit_price DECIMAL(10,2) NOT NULL,
                quantity INT DEFAULT 1,
                subtotal_cost DECIMAL(10,2) NOT NULL,
                schedule_time VARCHAR(20) DEFAULT '09:00',
                FOREIGN KEY (trip_day_id) REFERENCES trip_days(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 12. Package Add-ons & Package Items
        console.log('Creating package items and add-ons...');
        await conn.query(`
            CREATE TABLE IF NOT EXISTS package_addons (
                id INT AUTO_INCREMENT PRIMARY KEY,
                package_id INT NOT NULL,
                addon_title_en VARCHAR(150) NOT NULL,
                addon_title_bn VARCHAR(150),
                description VARCHAR(255),
                price DECIMAL(10,2) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 13. Wishlists Table
        console.log('Creating wishlists table...');
        await conn.query(`
            CREATE TABLE IF NOT EXISTS wishlists (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                destination_id INT,
                package_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 14. Travel Blogs Table
        console.log('Creating blogs table...');
        await conn.query(`
            CREATE TABLE IF NOT EXISTS blogs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title_en VARCHAR(200) NOT NULL,
                title_bn VARCHAR(200),
                slug VARCHAR(200) UNIQUE,
                excerpt_en TEXT,
                content_en LONGTEXT,
                author_name VARCHAR(100) DEFAULT 'TravelUp Editorial',
                category VARCHAR(50) DEFAULT 'Tips & Guides',
                image_url TEXT,
                read_time_min INT DEFAULT 5,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        await conn.commit();
        console.log('🎉 Migration committed successfully to Hostinger MySQL!');
    } catch (err) {
        await conn.rollback();
        console.error('❌ Migration failed, rolled back:', err.message);
        throw err;
    } finally {
        conn.release();
    }
}

migrate().then(() => {
    console.log('✅ Migration process finished.');
    process.exit(0);
}).catch(err => {
    console.error('Fatal error during migration:', err);
    process.exit(1);
});
