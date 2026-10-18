const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'server/.env' });

(async () => {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT
        });

        await pool.query("UPDATE users SET organization = 'TravelUp Global HQ', phone = '+880 1700-000000' WHERE id = 1");
        await pool.query("UPDATE users SET organization = 'EuroTours Corp', phone = '+880 1800-000000', status = 'inactive' WHERE id = 2");
        await pool.query("UPDATE users SET name = 'Rafiqul Islam', role = 'manager', phone = '+880 1712-345678', organization = 'Operations & Tours', status = 'active' WHERE id = 4");
        await pool.query("UPDATE users SET name = 'Mahmudul Hasan', role = 'accountant', phone = '+880 1723-456789', organization = 'Finance & Accounts', status = 'active' WHERE id = 5");
        await pool.query("UPDATE users SET name = 'Nusrat Jahan', role = 'support', phone = '+880 1734-567890', organization = 'Customer Support', status = 'active' WHERE id = 7");
        await pool.query("UPDATE users SET name = 'Sadia Rahman', role = 'customer', phone = '+880 1745-678901', organization = 'Dhaka Travel Club', status = 'active' WHERE id = 8");
        await pool.query("UPDATE users SET name = 'Kazi Anowar', role = 'moderator', phone = '+880 1756-789012', organization = 'TravelUp Global HQ', status = 'active' WHERE id = 11");

        console.log('✅ Demo users updated with rich organizations, phones, and status');
        process.exit(0);
    } catch (e) {
        console.error('Seed error:', e);
        process.exit(1);
    }
})();
