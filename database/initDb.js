const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

async function initDatabase() {
    console.log('🔄 Connecting to Hostinger MySQL Server:', process.env.DB_HOST);
    
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: parseInt(process.env.DB_PORT || '3306'),
            multipleStatements: true
        });

        console.log('✅ Connected successfully!');
        
        // 1. Run Schema
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        console.log('📦 Executing schema.sql...');
        await connection.query(schemaSql);
        console.log('✅ Tables created successfully!');

        // 2. Run Seed
        const seedPath = path.join(__dirname, 'seed.sql');
        const seedSql = fs.readFileSync(seedPath, 'utf8');
        console.log('🌱 Inserting initial seed data (Destinations, Packages, Demo Users)...');
        await connection.query(seedSql);
        console.log('✅ Seed data inserted successfully!');

        console.log('\n🎉 Database Initialization Complete! TravelUp Global DB is ready to use.');
    } catch (error) {
        console.error('❌ Database Initialization Error:', error.message);
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('\n👉 Tip: Please verify if Remote MySQL is allowed from your IP in Hostinger hPanel (enter % in IP field).');
        }
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

initDatabase();
