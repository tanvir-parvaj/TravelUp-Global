const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function migrateAndSeed() {
    console.log('🚀 Initializing Tour Planner Database Tables in Hostinger MySQL...');

    try {
        // 1. Create tour_planner_inventory table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tour_planner_inventory (
                id INT AUTO_INCREMENT PRIMARY KEY,
                slot_key VARCHAR(50) NOT NULL,
                destination_slug VARCHAR(50) DEFAULT 'all',
                name VARCHAR(255) NOT NULL,
                sub TEXT,
                price DECIMAL(10,2) NOT NULL,
                img TEXT,
                has_seats TINYINT(1) DEFAULT 0,
                has_rooms TINYINT(1) DEFAULT 0,
                bogie VARCHAR(100) DEFAULT NULL,
                scenario_tag VARCHAR(150) DEFAULT NULL,
                details_json LONGTEXT,
                is_active TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_slot_dest (slot_key, destination_slug)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ tour_planner_inventory table verified/created.');

        // 2. Create tour_planner_trips table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tour_planner_trips (
                id INT AUTO_INCREMENT PRIMARY KEY,
                trip_code VARCHAR(50) UNIQUE NOT NULL,
                trip_type ENUM('round_trip', 'one_way', 'open_return') DEFAULT 'round_trip',
                origin_upazila VARCHAR(150) NOT NULL,
                destination_slug VARCHAR(100) NOT NULL,
                departure_date DATE NOT NULL,
                return_date DATE DEFAULT NULL,
                travelers_count INT NOT NULL DEFAULT 1,
                adults_count INT NOT NULL DEFAULT 1,
                children_count INT DEFAULT 0,
                infants_count INT DEFAULT 0,
                grand_total DECIMAL(10,2) NOT NULL,
                per_person_cost DECIMAL(10,2) NOT NULL,
                lead_name VARCHAR(150) DEFAULT NULL,
                lead_phone VARCHAR(50) DEFAULT NULL,
                lead_email VARCHAR(100) DEFAULT NULL,
                emergency_phone VARCHAR(50) DEFAULT NULL,
                dietary_notes TEXT DEFAULT NULL,
                status ENUM('draft', 'saved', 'pending', 'confirmed', 'cancelled') DEFAULT 'confirmed',
                payment_status ENUM('unpaid', 'paid', 'refunded') DEFAULT 'paid',
                payment_method VARCHAR(50) DEFAULT 'bKash',
                components_data LONGTEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_trip_code (trip_code)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ tour_planner_trips table verified/created.');

        // 3. Create tour_planner_seat_holds table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tour_planner_seat_holds (
                id INT AUTO_INCREMENT PRIMARY KEY,
                component_id INT NOT NULL,
                slot_key VARCHAR(50) NOT NULL,
                seat_id VARCHAR(50) NOT NULL,
                held_by_session VARCHAR(100) NOT NULL,
                held_until DATETIME NOT NULL,
                status ENUM('held', 'booked', 'released') DEFAULT 'held',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_seat_check (slot_key, seat_id, status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ tour_planner_seat_holds table verified/created.');

        // 4. Check if inventory already seeded
        const [existingCount] = await pool.query('SELECT COUNT(*) as count FROM tour_planner_inventory');
        if (existingCount[0].count > 0) {
            console.log(`ℹ️ Inventory table already has ${existingCount[0].count} items. Refreshing entries...`);
            await pool.query('TRUNCATE TABLE tour_planner_inventory');
        }

        // 5. Extract inventory items from client/trip-planner.html
        const htmlPath = path.join(__dirname, '../../client/trip-planner.html');
        const content = fs.readFileSync(htmlPath, 'utf8');
        const invStart = content.indexOf('const inventory = {');
        const invEnd = content.indexOf('function formatSlotTitle', invStart);
        const code = content.substring(invStart, invEnd);
        const sandbox = {};
        new Function('sandbox', code + '; sandbox.inventory = inventory;')(sandbox);

        let insertedCount = 0;
        for (const slotKey in sandbox.inventory) {
            const items = sandbox.inventory[slotKey];
            for (const item of items) {
                const name = item.name || 'Unnamed Item';
                const sub = item.sub || '';
                const price = item.price || 0;
                const img = item.img || '';
                const hasSeats = item.hasSeats ? 1 : 0;
                const hasRooms = item.hasRooms ? 1 : 0;
                const bogie = item.bogie || null;
                const scenarioTag = item.scenario || null;
                const detailsJson = item.details ? JSON.stringify(item.details) : null;

                // Determine destination association
                let destSlug = 'all';
                const lowerName = (name + ' ' + sub).toLowerCase();
                if (lowerName.includes('cox') || lowerName.includes('inani') || lowerName.includes('kolatoli') || lowerName.includes('laboni')) {
                    destSlug = 'coxsbazar';
                } else if (lowerName.includes('sajek') || lowerName.includes('chander gari') || lowerName.includes('khagrachhari')) {
                    destSlug = 'sajek';
                } else if (lowerName.includes('sreemangal') || lowerName.includes('tea') || lowerName.includes('lawachara')) {
                    destSlug = 'sreemangal';
                } else if (lowerName.includes('saint martin') || lowerName.includes('chera dwip')) {
                    destSlug = 'saintmartin';
                } else if (lowerName.includes('tetulia') || lowerName.includes('panchagarh')) {
                    destSlug = 'tetulia';
                } else if (lowerName.includes('sylhet') || lowerName.includes('jaflong')) {
                    destSlug = 'jaflong';
                }

                await pool.query(`
                    INSERT INTO tour_planner_inventory 
                    (slot_key, destination_slug, name, sub, price, img, has_seats, has_rooms, bogie, scenario_tag, details_json, is_active)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                `, [slotKey, destSlug, name, sub, price, img, hasSeats, hasRooms, bogie, scenarioTag, detailsJson]);
                insertedCount++;
            }
        }

        console.log(`🎉 Successfully seeded ${insertedCount} inventory components into Hostinger MySQL tour_planner_inventory!`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration / Seeding Error:', error);
        process.exit(1);
    }
}

migrateAndSeed();
