const { pool } = require('../config/db');

async function migrate() {
    const alterTable = async (table, cols) => {
        for (const col of cols) {
            try {
                await pool.query('ALTER TABLE ' + table + ' ADD COLUMN ' + col);
                console.log('Added ' + col + ' to ' + table);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    // Column already exists
                } else {
                    console.log('Notice for ' + table + '.' + col + ': ' + err.message);
                }
            }
        }
    };

    await alterTable('bd_divisions', [
        'image VARCHAR(500) NULL',
        'description TEXT NULL',
        'code VARCHAR(50) NULL',
        'is_featured TINYINT(1) DEFAULT 0'
    ]);

    await alterTable('bd_districts', [
        'image VARCHAR(500) NULL',
        'description TEXT NULL',
        'code VARCHAR(50) NULL',
        'is_featured TINYINT(1) DEFAULT 0'
    ]);

    await alterTable('bd_upazilas', [
        'image VARCHAR(500) NULL',
        'description TEXT NULL',
        'code VARCHAR(50) NULL',
        'is_featured TINYINT(1) DEFAULT 0'
    ]);

    await alterTable('bd_tour_destinations', [
        'image VARCHAR(500) NULL',
        'description TEXT NULL',
        'upazila_id VARCHAR(50) NULL',
        'upazila_name_en VARCHAR(100) NULL',
        'upazila_name_bn VARCHAR(100) NULL'
    ]);

    console.log('Migration completed successfully!');
    process.exit(0);
}

migrate();


async function updateMockUpazilas() {
    await pool.query("UPDATE bd_upazilas SET image = 'images/locations/thumb_savar.png', is_featured = 1, description = 'Savar is a popular upazila in Dhaka district, known for its natural beauty and cultural heritage.', code = 'DHA-001' WHERE name_en = 'Savar' OR upazila_id LIKE '%Savar%'");
    await pool.query("UPDATE bd_upazilas SET image = 'images/locations/thumb_dhamrai.png' WHERE name_en = 'Dhamrai' OR upazila_id LIKE '%Dhamrai%'");
    await pool.query("UPDATE bd_upazilas SET image = 'images/locations/thumb_keraniganj.png' WHERE name_en = 'Keraniganj' OR upazila_id LIKE '%Keraniganj%'");
    await pool.query("UPDATE bd_upazilas SET image = 'images/locations/thumb_nawabganj.png' WHERE name_en = 'Nawabganj' AND district_name_en = 'Dhaka'");
    await pool.query("UPDATE bd_upazilas SET image = 'images/locations/thumb_dohar.png' WHERE name_en = 'Dohar' OR upazila_id LIKE '%Dohar%'");
    console.log('Updated mock upazilas in database!');
    process.exit(0);
}
updateMockUpazilas();
