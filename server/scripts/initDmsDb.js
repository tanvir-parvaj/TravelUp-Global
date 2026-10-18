const { pool } = require('../config/db');

async function runDmsMigration() {
    console.log('🚀 Running Destination Management System (DMS) Database Migration...');

    try {
        // 1. Countries Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS countries (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                code VARCHAR(10) NOT NULL UNIQUE,
                currency_name VARCHAR(100) DEFAULT 'BDT',
                currency_code VARCHAR(10) DEFAULT 'BDT',
                timezone VARCHAR(50) DEFAULT 'Asia/Dhaka',
                flag_emoji VARCHAR(10) DEFAULT '🇧🇩',
                status ENUM('active', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 2. Divisions / States Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS divisions_states (
                id INT AUTO_INCREMENT PRIMARY KEY,
                country_id INT NOT NULL,
                country_name VARCHAR(100) NOT NULL,
                name VARCHAR(100) NOT NULL,
                type VARCHAR(50) DEFAULT 'Division',
                status ENUM('active', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_country (country_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 3. Cities Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cities (
                id INT AUTO_INCREMENT PRIMARY KEY,
                country_id INT NOT NULL,
                division_id INT DEFAULT NULL,
                name VARCHAR(100) NOT NULL,
                status ENUM('active', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_div (division_id),
                INDEX idx_cntry (country_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 4. Destination Durations
        await pool.query(`
            CREATE TABLE IF NOT EXISTS destination_durations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                days INT NOT NULL,
                nights INT NOT NULL,
                label VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 5. Foods Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS foods (
                id INT AUTO_INCREMENT PRIMARY KEY,
                destination_id INT NOT NULL,
                food_code VARCHAR(50) NOT NULL,
                name_en VARCHAR(150) NOT NULL,
                name_bn VARCHAR(150) DEFAULT NULL,
                local_name VARCHAR(150) DEFAULT NULL,
                category VARCHAR(100) DEFAULT 'Local Seafood',
                cuisine VARCHAR(100) DEFAULT 'Bangladeshi / Coastal',
                is_halal TINYINT(1) DEFAULT 1,
                is_vegetarian TINYINT(1) DEFAULT 0,
                is_vegan TINYINT(1) DEFAULT 0,
                spicy_level ENUM('Mild', 'Medium', 'Hot', 'Extra Hot') DEFAULT 'Medium',
                price_range VARCHAR(100) DEFAULT '৳250 - ৳800',
                where_to_find TEXT,
                description_en TEXT,
                image_url TEXT,
                status ENUM('active', 'draft', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_food_dest (destination_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 6. Local Transportation Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS local_transportation (
                id INT AUTO_INCREMENT PRIMARY KEY,
                destination_id INT NOT NULL,
                service_code VARCHAR(50) NOT NULL,
                provider_name VARCHAR(150) NOT NULL,
                vehicle_type VARCHAR(100) NOT NULL,
                vehicle_model VARCHAR(100) DEFAULT NULL,
                capacity INT DEFAULT 4,
                is_ac TINYINT(1) DEFAULT 0,
                driver_included TINYINT(1) DEFAULT 1,
                fuel_included TINYINT(1) DEFAULT 1,
                hourly_rate DECIMAL(10,2) DEFAULT 0,
                daily_rate DECIMAL(10,2) DEFAULT 0,
                per_trip_rate DECIMAL(10,2) DEFAULT 0,
                airport_transfer_rate DECIMAL(10,2) DEFAULT 0,
                service_area VARCHAR(200) DEFAULT NULL,
                operating_hours VARCHAR(100) DEFAULT '6:00 AM - 11:00 PM',
                contact_phone VARCHAR(50) DEFAULT NULL,
                booking_method VARCHAR(100) DEFAULT 'Direct / Counter / App',
                cancellation_policy TEXT,
                image_url TEXT,
                status ENUM('active', 'draft', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_loc_dest (destination_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 7. Tour Guides Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tour_guides (
                id INT AUTO_INCREMENT PRIMARY KEY,
                destination_id INT NOT NULL,
                guide_code VARCHAR(50) NOT NULL,
                name VARCHAR(150) NOT NULL,
                languages VARCHAR(200) DEFAULT 'Bengali, English',
                specialization VARCHAR(150) DEFAULT 'Coastal Heritage & Beach Tours',
                experience_years INT DEFAULT 5,
                certification VARCHAR(150) DEFAULT 'Govt Certified Tour Guide',
                daily_rate DECIMAL(10,2) DEFAULT 2500,
                hourly_rate DECIMAL(10,2) DEFAULT 400,
                price_type VARCHAR(50) DEFAULT 'Per Day',
                availability_status ENUM('available', 'busy', 'on_tour') DEFAULT 'available',
                contact_phone VARCHAR(50) DEFAULT NULL,
                contact_email VARCHAR(100) DEFAULT NULL,
                rating DECIMAL(2,1) DEFAULT 4.9,
                profile_photo TEXT,
                bio TEXT,
                status ENUM('active', 'draft', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_guide_dest (destination_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 8. Destination Inventory Links (Many-to-Many support)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS destination_inventory_links (
                id INT AUTO_INCREMENT PRIMARY KEY,
                destination_id INT NOT NULL,
                inventory_type ENUM('hotel', 'restaurant', 'food', 'transport', 'local_transport', 'attraction', 'activity', 'guide') NOT NULL,
                inventory_id INT NOT NULL,
                is_primary TINYINT(1) DEFAULT 1,
                status ENUM('active', 'draft', 'pending', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uniq_dest_item (destination_id, inventory_type, inventory_id),
                INDEX idx_dest_link (destination_id, inventory_type)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 9. Add missing columns to existing tables safely
        const alterStatements = [
            // destinations
            `ALTER TABLE destinations ADD COLUMN IF NOT EXISTS map_embed_code TEXT AFTER longitude`,
            `ALTER TABLE destinations ADD COLUMN IF NOT EXISTS visibility VARCHAR(30) DEFAULT 'public' AFTER status`,
            `ALTER TABLE destinations ADD COLUMN IF NOT EXISTS is_homepage_show TINYINT(1) DEFAULT 1`,
            `ALTER TABLE destinations ADD COLUMN IF NOT EXISTS is_search_show TINYINT(1) DEFAULT 1`,
            `ALTER TABLE destinations ADD COLUMN IF NOT EXISTS is_booking_enabled TINYINT(1) DEFAULT 1`,
            `ALTER TABLE destinations ADD COLUMN IF NOT EXISTS is_custom_trip_enabled TINYINT(1) DEFAULT 1`,
            `ALTER TABLE destinations ADD COLUMN IF NOT EXISTS is_recommendation_enabled TINYINT(1) DEFAULT 1`,
            `ALTER TABLE destinations ADD COLUMN IF NOT EXISTS is_review_enabled TINYINT(1) DEFAULT 1`,
            `ALTER TABLE destinations ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255)`,
            `ALTER TABLE destinations ADD COLUMN IF NOT EXISTS meta_description TEXT`,
            `ALTER TABLE destinations ADD COLUMN IF NOT EXISTS meta_keywords TEXT`,
            `ALTER TABLE destinations ADD COLUMN IF NOT EXISTS canonical_slug VARCHAR(200)`,
            `ALTER TABLE destinations ADD COLUMN IF NOT EXISTS social_share_image TEXT`,
            `ALTER TABLE destinations ADD COLUMN IF NOT EXISTS recommended_for TEXT`,
            `ALTER TABLE destinations ADD COLUMN IF NOT EXISTS tags TEXT`,
            `ALTER TABLE destinations ADD COLUMN IF NOT EXISTS additional_info_json LONGTEXT`,
            `ALTER TABLE destinations ADD COLUMN IF NOT EXISTS image_roles_json LONGTEXT`,

            // hotels
            `ALTER TABLE hotels ADD COLUMN IF NOT EXISTS description_en TEXT`,
            `ALTER TABLE hotels ADD COLUMN IF NOT EXISTS short_desc_en VARCHAR(255)`,
            `ALTER TABLE hotels ADD COLUMN IF NOT EXISTS map_embed_code TEXT`,
            `ALTER TABLE hotels ADD COLUMN IF NOT EXISTS chain VARCHAR(100)`,
            `ALTER TABLE hotels ADD COLUMN IF NOT EXISTS brand VARCHAR(100)`,
            `ALTER TABLE hotels ADD COLUMN IF NOT EXISTS rooms_json LONGTEXT`,
            `ALTER TABLE hotels ADD COLUMN IF NOT EXISTS policies_json LONGTEXT`,
            `ALTER TABLE hotels ADD COLUMN IF NOT EXISTS meal_plans_json TEXT`,
            `ALTER TABLE hotels ADD COLUMN IF NOT EXISTS gallery_json LONGTEXT`,

            // restaurants
            `ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS restaurant_code VARCHAR(50)`,
            `ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS restaurant_type VARCHAR(50) DEFAULT 'Restaurant'`,
            `ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS is_vegan TINYINT(1) DEFAULT 0`,
            `ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS is_family_friendly TINYINT(1) DEFAULT 1`,
            `ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS description_en TEXT`,
            `ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS short_desc_en VARCHAR(255)`,
            `ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS address VARCHAR(255)`,
            `ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS map_embed_code TEXT`,
            `ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS phone VARCHAR(50)`,
            `ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS website VARCHAR(150)`,
            `ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS opening_hours VARCHAR(100)`,
            `ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS gallery_json LONGTEXT`,
            `ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'active'`,

            // transportation
            `ALTER TABLE transportation ADD COLUMN IF NOT EXISTS provider_name VARCHAR(150)`,
            `ALTER TABLE transportation ADD COLUMN IF NOT EXISTS route_name VARCHAR(150)`,
            `ALTER TABLE transportation ADD COLUMN IF NOT EXISTS origin VARCHAR(100)`,
            `ALTER TABLE transportation ADD COLUMN IF NOT EXISTS destination VARCHAR(100)`,
            `ALTER TABLE transportation ADD COLUMN IF NOT EXISTS duration VARCHAR(50)`,
            `ALTER TABLE transportation ADD COLUMN IF NOT EXISTS class_type VARCHAR(50) DEFAULT 'Economy'`,
            `ALTER TABLE transportation ADD COLUMN IF NOT EXISTS baggage_allowance VARCHAR(100)`,
            `ALTER TABLE transportation ADD COLUMN IF NOT EXISTS booking_requirement TEXT`,
            `ALTER TABLE transportation ADD COLUMN IF NOT EXISTS cancellation_policy TEXT`,
            `ALTER TABLE transportation ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50)`,
            `ALTER TABLE transportation ADD COLUMN IF NOT EXISTS contact_email VARCHAR(100)`,
            `ALTER TABLE transportation ADD COLUMN IF NOT EXISTS description_en TEXT`,
            `ALTER TABLE transportation ADD COLUMN IF NOT EXISTS gallery_json LONGTEXT`,

            // attractions
            `ALTER TABLE attractions ADD COLUMN IF NOT EXISTS attraction_code VARCHAR(50)`,
            `ALTER TABLE attractions ADD COLUMN IF NOT EXISTS description_en TEXT`,
            `ALTER TABLE attractions ADD COLUMN IF NOT EXISTS short_desc_en VARCHAR(255)`,
            `ALTER TABLE attractions ADD COLUMN IF NOT EXISTS entry_fee_bdt DECIMAL(10,2) DEFAULT 0`,
            `ALTER TABLE attractions ADD COLUMN IF NOT EXISTS entry_fee_usd DECIMAL(10,2) DEFAULT 0`,
            `ALTER TABLE attractions ADD COLUMN IF NOT EXISTS opening_hours VARCHAR(100)`,
            `ALTER TABLE attractions ADD COLUMN IF NOT EXISTS best_time VARCHAR(100)`,
            `ALTER TABLE attractions ADD COLUMN IF NOT EXISTS recommended_duration VARCHAR(100)`,
            `ALTER TABLE attractions ADD COLUMN IF NOT EXISTS is_family_friendly TINYINT(1) DEFAULT 1`,
            `ALTER TABLE attractions ADD COLUMN IF NOT EXISTS is_wheelchair_friendly TINYINT(1) DEFAULT 0`,
            `ALTER TABLE attractions ADD COLUMN IF NOT EXISTS is_photography_allowed TINYINT(1) DEFAULT 1`,
            `ALTER TABLE attractions ADD COLUMN IF NOT EXISTS address VARCHAR(255)`,
            `ALTER TABLE attractions ADD COLUMN IF NOT EXISTS map_embed_code TEXT`,
            `ALTER TABLE attractions ADD COLUMN IF NOT EXISTS gallery_json LONGTEXT`,
            `ALTER TABLE attractions ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'active'`,

            // activities
            `ALTER TABLE activities ADD COLUMN IF NOT EXISTS activity_code VARCHAR(50)`,
            `ALTER TABLE activities ADD COLUMN IF NOT EXISTS description_en TEXT`,
            `ALTER TABLE activities ADD COLUMN IF NOT EXISTS short_desc_en VARCHAR(255)`,
            `ALTER TABLE activities ADD COLUMN IF NOT EXISTS price_bdt DECIMAL(10,2) DEFAULT 0`,
            `ALTER TABLE activities ADD COLUMN IF NOT EXISTS price_usd DECIMAL(10,2) DEFAULT 0`,
            `ALTER TABLE activities ADD COLUMN IF NOT EXISTS price_type VARCHAR(50) DEFAULT 'Per Person'`,
            `ALTER TABLE activities ADD COLUMN IF NOT EXISTS min_participants INT DEFAULT 1`,
            `ALTER TABLE activities ADD COLUMN IF NOT EXISTS max_participants INT DEFAULT 10`,
            `ALTER TABLE activities ADD COLUMN IF NOT EXISTS is_guide_included TINYINT(1) DEFAULT 1`,
            `ALTER TABLE activities ADD COLUMN IF NOT EXISTS is_pickup_available TINYINT(1) DEFAULT 0`,
            `ALTER TABLE activities ADD COLUMN IF NOT EXISTS is_cancellation_allowed TINYINT(1) DEFAULT 1`,
            `ALTER TABLE activities ADD COLUMN IF NOT EXISTS included_items TEXT`,
            `ALTER TABLE activities ADD COLUMN IF NOT EXISTS excluded_items TEXT`,
            `ALTER TABLE activities ADD COLUMN IF NOT EXISTS required_equipment TEXT`,
            `ALTER TABLE activities ADD COLUMN IF NOT EXISTS gallery_json LONGTEXT`,
            `ALTER TABLE activities ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'active'`
        ];

        for (const sql of alterStatements) {
            try {
                await pool.query(sql);
            } catch (err) {
                // Ignore duplicate column errors if MariaDB/MySQL doesn't support IF NOT EXISTS in ALTER
                if (!err.message.includes('Duplicate column')) {
                    console.warn('Note during alter:', err.message);
                }
            }
        }

        // 10. Seed Default Countries
        const defaultCountries = [
            ['Bangladesh', 'BD', 'Bangladeshi Taka', 'BDT', 'Asia/Dhaka', '🇧🇩', 'active'],
            ['Indonesia', 'ID', 'Indonesian Rupiah', 'IDR', 'Asia/Jakarta', '🇮🇩', 'active'],
            ['Thailand', 'TH', 'Thai Baht', 'THB', 'Asia/Bangkok', '🇹🇭', 'active'],
            ['Malaysia', 'MY', 'Malaysian Ringgit', 'MYR', 'Asia/Kuala_Lumpur', '🇲🇾', 'active'],
            ['Singapore', 'SG', 'Singapore Dollar', 'SGD', 'Asia/Singapore', '🇸🇬', 'active'],
            ['Japan', 'JP', 'Japanese Yen', 'JPY', 'Asia/Tokyo', '🇯🇵', 'active'],
            ['United Arab Emirates', 'AE', 'UAE Dirham', 'AED', 'Asia/Dubai', '🇦🇪', 'active'],
            ['France', 'FR', 'Euro', 'EUR', 'Europe/Paris', '🇫🇷', 'active'],
            ['Italy', 'IT', 'Euro', 'EUR', 'Europe/Rome', '🇮🇹', 'active'],
            ['Maldives', 'MV', 'Maldivian Rufiyaa', 'MVR', 'Indian/Maldives', '🇲🇻', 'active'],
            ['Turkey', 'TR', 'Turkish Lira', 'TRY', 'Europe/Istanbul', '🇹🇷', 'active'],
            ['Nepal', 'NP', 'Nepalese Rupee', 'NPR', 'Asia/Kathmandu', '🇳🇵', 'active'],
            ['Bhutan', 'BT', 'Bhutanese Ngultrum', 'BTN', 'Asia/Thimphu', '🇧🇹', 'active']
        ];

        for (const c of defaultCountries) {
            await pool.query(`
                INSERT IGNORE INTO countries (name, code, currency_name, currency_code, timezone, flag_emoji, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, c);
        }

        // Fetch Bangladesh ID
        const [[bd]] = await pool.query("SELECT id FROM countries WHERE code = 'BD'");
        const bdId = bd ? bd.id : 1;

        // Seed Bangladesh Divisions
        const bdDivisions = ['Dhaka', 'Chattogram', 'Sylhet', 'Rajshahi', 'Khulna', 'Barishal', 'Rangpur', 'Mymensingh'];
        for (const d of bdDivisions) {
            const [existing] = await pool.query("SELECT id FROM divisions_states WHERE country_id = ? AND name = ?", [bdId, d]);
            if (existing.length === 0) {
                await pool.query("INSERT INTO divisions_states (country_id, country_name, name, type) VALUES (?, 'Bangladesh', ?, 'Division')", [bdId, d]);
            }
        }

        // Fetch Chattogram Division ID
        const [[ctg]] = await pool.query("SELECT id FROM divisions_states WHERE name = 'Chattogram' AND country_id = ?", [bdId]);
        const ctgId = ctg ? ctg.id : null;

        // Seed Cities
        const cities = [
            [bdId, ctgId, "Cox's Bazar"],
            [bdId, ctgId, "Chattogram"],
            [bdId, ctgId, "Rangamati"],
            [bdId, ctgId, "Bandarban"],
            [bdId, ctgId, "Sajek Valley"]
        ];

        for (const ci of cities) {
            const [exist] = await pool.query("SELECT id FROM cities WHERE country_id = ? AND name = ?", [ci[0], ci[2]]);
            if (exist.length === 0) {
                await pool.query("INSERT INTO cities (country_id, division_id, name) VALUES (?, ?, ?)", ci);
            }
        }

        // Seed Durations
        const durations = [
            [1, 0, '1 Day'],
            [2, 1, '2 Days / 1 Night'],
            [3, 2, '3 Days / 2 Nights'],
            [4, 3, '4 Days / 3 Nights'],
            [5, 4, '5 Days / 4 Nights'],
            [7, 6, '7 Days / 6 Nights'],
            [10, 9, '10 Days / 9 Nights']
        ];
        for (const du of durations) {
            const [exists] = await pool.query("SELECT id FROM destination_durations WHERE label = ?", [du[2]]);
            if (exists.length === 0) {
                await pool.query("INSERT INTO destination_durations (days, nights, label) VALUES (?, ?, ?)", du);
            }
        }

        console.log('✅ DMS Migration and Seed completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runDmsMigration();
