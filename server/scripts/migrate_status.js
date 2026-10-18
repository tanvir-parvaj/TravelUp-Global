const { pool } = require('../config/db');

async function migrate() {
    try {
        const [cols] = await pool.query("SHOW COLUMNS FROM users LIKE 'status'");
        if (cols.length === 0) {
            await pool.query("ALTER TABLE users ADD COLUMN status ENUM('active', 'inactive') DEFAULT 'active' AFTER role");
            console.log('✅ Added status column to users table.');
        } else {
            console.log('ℹ️ Status column already exists.');
        }

        const [users] = await pool.query('SELECT id, name, email, role, status FROM users LIMIT 5');
        console.log('Sample users in DB:', users);
        process.exit(0);
    } catch (e) {
        console.error('Migration error:', e);
        process.exit(1);
    }
}

migrate();
