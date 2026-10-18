const { pool } = require('../config/db');

async function updateDb() {
    try {
        console.log('Connecting to Hostinger MySQL Database...');
        
        // 1. Add organization column to users table if not exists
        const [userCols] = await pool.query('DESCRIBE users');
        const hasOrg = userCols.some(c => c.Field === 'organization');
        if (!hasOrg) {
            await pool.query('ALTER TABLE users ADD COLUMN organization VARCHAR(150) NULL AFTER phone');
            console.log('✅ Added organization column to users table');
        } else {
            console.log('ℹ️ organization column already exists in users');
        }

        // 2. Create leads table if not exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS leads (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(150) NOT NULL,
                phone VARCHAR(30) NULL,
                destination_interest VARCHAR(100) NULL,
                budget_range VARCHAR(50) NULL,
                travelers_count INT DEFAULT 1,
                travel_dates VARCHAR(100) NULL,
                source VARCHAR(50) DEFAULT 'website',
                status ENUM('new', 'contacted', 'qualified', 'booked', 'closed') DEFAULT 'new',
                notes TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ Checked/created leads table successfully');

        // 3. Insert a demo lead if empty
        const [existingLeads] = await pool.query('SELECT COUNT(*) as count FROM leads');
        if (existingLeads[0].count === 0) {
            await pool.query(`
                INSERT INTO leads (name, email, phone, destination_interest, budget_range, travelers_count, travel_dates, source, status, notes)
                VALUES ('Tanvir Parvaj', 'papelali809@gmail.com', '+880 1700-000000', 'Bali, Indonesia', '$1,000 - $2,000', 2, '2026-11-15', 'trip_builder', 'new', 'Interested in luxury beachfront villa and private car transfer')
            `);
            console.log('✅ Inserted initial demo lead');
        }

        const [cols] = await pool.query('DESCRIBE users');
        console.log('Updated users columns:', cols.map(c => c.Field).join(', '));

        const [leadsCols] = await pool.query('DESCRIBE leads');
        console.log('Leads table columns:', leadsCols.map(c => c.Field).join(', '));

        console.log('🎉 Database verification and updates completed successfully!');
    } catch (err) {
        console.error('❌ Database update error:', err);
    } finally {
        process.exit(0);
    }
}

updateDb();
