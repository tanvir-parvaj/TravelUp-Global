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

        console.log('Connecting to MySQL to check destinations columns...');

        // Check existing columns
        const [existingCols] = await pool.query('DESCRIBE destinations');
        const colNames = existingCols.map(c => c.Field.toLowerCase());

        const addColIfMissing = async (colName, colDef) => {
            if (!colNames.includes(colName.toLowerCase())) {
                console.log(`Adding column ${colName}...`);
                await pool.query(`ALTER TABLE destinations ADD COLUMN ${colName} ${colDef}`);
                console.log(`✅ Added ${colName}`);
            } else {
                console.log(`Column ${colName} already exists.`);
            }
        };

        await addColIfMissing('travel_type', "ENUM('domestic', 'international') DEFAULT 'domestic' AFTER category");
        await addColIfMissing('destination_code', "VARCHAR(30) NULL AFTER travel_type");
        await addColIfMissing('division_state', "VARCHAR(100) NULL AFTER destination_code");
        await addColIfMissing('slug', "VARCHAR(150) NULL AFTER name_en");
        await addColIfMissing('status', "ENUM('draft', 'active', 'inactive') DEFAULT 'active' AFTER is_active");
        await addColIfMissing('gallery_images', "JSON NULL AFTER image_url");
        await addColIfMissing('average_duration', "VARCHAR(50) DEFAULT '3 Days 2 Nights'");
        await addColIfMissing('passport_notes', "TEXT NULL");
        await addColIfMissing('visa_required', "TINYINT(1) DEFAULT 0");
        await addColIfMissing('visa_type', "VARCHAR(100) NULL");
        await addColIfMissing('visa_processing_time', "VARCHAR(100) NULL");
        await addColIfMissing('entry_requirements', "TEXT NULL");
        await addColIfMissing('deleted_at', "TIMESTAMP NULL");

        console.log('✅ Destinations schema migration complete!');
        process.exit(0);
    } catch (err) {
        console.error('Migration error:', err);
        process.exit(1);
    }
})();
