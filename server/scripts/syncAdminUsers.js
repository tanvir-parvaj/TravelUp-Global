const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

async function setupAccounts() {
    try {
        console.log('--- Setting up guaranteed role accounts with password: admin123 ---');
        const hash = await bcrypt.hash('admin123', 10);
        
        const accounts = [
            { email: 'admin@travelupglobal.com', name: 'Tanvir Parvaj (Admin)', role: 'admin' },
            { email: 'papelali809@gmail.com', name: 'Tanvir Parvaj', role: 'admin' },
            { email: 'uploader@travelupglobal.com', name: 'Product Uploader', role: 'uploader' },
            { email: 'manager@travelupglobal.com', name: 'Operations Manager', role: 'manager' },
            { email: 'finance@travelupglobal.com', name: 'Finance Officer', role: 'accountant' },
            { email: 'support@travelupglobal.com', name: 'Customer Support', role: 'support' }
        ];

        for (const acc of accounts) {
            const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [acc.email]);
            if (existing.length > 0) {
                await pool.query(
                    'UPDATE users SET name = ?, password = ?, role = ?, status = "active" WHERE email = ?',
                    [acc.name, hash, acc.role, acc.email]
                );
                console.log(`✓ Updated ${acc.email} (${acc.role})`);
            } else {
                await pool.query(
                    'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, "active")',
                    [acc.name, acc.email, hash, acc.role]
                );
                console.log(`✓ Created ${acc.email} (${acc.role})`);
            }
        }
        console.log('--- Accounts setup successfully! Password for all is: admin123 ---');
        process.exit(0);
    } catch (err) {
        console.error('Setup error:', err);
        process.exit(1);
    }
}

setupAccounts();
