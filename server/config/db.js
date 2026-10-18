const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'srv1954.hstgr.io',
    user: process.env.DB_USER || 'u822738324_travelupglobal',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'u822738324_travelupglobal',
    port: parseInt(process.env.DB_PORT || '3306'),
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
});

// Test connection function
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Successfully connected to Hostinger MySQL Database!');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

module.exports = { pool, testConnection };
