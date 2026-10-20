const { pool } = require('../config/db');

async function setup() {
    try {
        console.log('--- Setting up Admin RBAC & Schema ---');
        
        // 1. Update users.role ENUM
        await pool.query(`
            ALTER TABLE users 
            MODIFY COLUMN role ENUM('customer', 'admin', 'manager', 'accountant', 'support', 'moderator', 'uploader') 
            DEFAULT 'customer'
        `);
        console.log('✓ users.role ENUM updated with uploader');

        // 2. Ensure papelali809@gmail.com and admin@travelupglobal.com have admin role
        await pool.query(`
            UPDATE users SET role = 'admin' WHERE email IN ('papelali809@gmail.com', 'admin@travelupglobal.com')
        `);
        console.log('✓ Super Admin accounts confirmed');

        // 3. Create or enhance staff invitations / roles table if needed
        await pool.query(`
            CREATE TABLE IF NOT EXISTS staff_invitations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(150) NOT NULL UNIQUE,
                name VARCHAR(100) NOT NULL,
                role ENUM('admin', 'manager', 'accountant', 'support', 'moderator', 'uploader') NOT NULL,
                invited_by INT,
                status ENUM('pending', 'active', 'revoked') DEFAULT 'pending',
                temp_password VARCHAR(255) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ staff_invitations table ready');

        // 4. Create or ensure transit_routes table for advanced multi-leg route & timetable management
        await pool.query(`
            CREATE TABLE IF NOT EXISTS transit_routes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                operator_name VARCHAR(150) NOT NULL,
                vehicle_type VARCHAR(100) NOT NULL DEFAULT 'AC Coach',
                vehicle_model VARCHAR(100) DEFAULT NULL,
                service_class VARCHAR(50) DEFAULT 'Economy',
                origin_district VARCHAR(100) NOT NULL,
                origin_point VARCHAR(150) NOT NULL,
                destination_district VARCHAR(100) NOT NULL,
                destination_point VARCHAR(150) NOT NULL,
                departure_time VARCHAR(20) NOT NULL,
                arrival_time VARCHAR(20) NOT NULL,
                duration_hours DECIMAL(4,1) DEFAULT 0.0,
                base_fare DECIMAL(10,2) NOT NULL,
                total_seats INT DEFAULT 36,
                available_seats INT DEFAULT 36,
                seat_layout_type VARCHAR(50) DEFAULT '2x2',
                stoppages_json LONGTEXT,
                amenities_json TEXT,
                image_url TEXT,
                tier_tag ENUM('budget', 'recommended', 'luxury') DEFAULT 'recommended',
                is_active TINYINT(1) DEFAULT 1,
                created_by INT DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ transit_routes table ready');

        console.log('--- Admin RBAC Setup Complete ---');
        process.exit(0);
    } catch (err) {
        console.error('Setup Error:', err);
        process.exit(1);
    }
}

setup();
