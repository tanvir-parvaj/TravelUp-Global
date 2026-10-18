const { pool } = require('../config/db');

async function fixCategories() {
    try {
        console.log('Updating destination_categories table...');
        
        // Add columns if they do not exist
        const alterStatements = [
            `ALTER TABLE destination_categories ADD COLUMN name_en VARCHAR(100) DEFAULT NULL`,
            `ALTER TABLE destination_categories ADD COLUMN name_bn VARCHAR(100) DEFAULT NULL`,
            `ALTER TABLE destination_categories ADD COLUMN icon VARCHAR(50) DEFAULT '📍'`,
            `ALTER TABLE destination_categories ADD COLUMN is_active TINYINT(1) DEFAULT 1`
        ];

        for (const sql of alterStatements) {
            try {
                await pool.query(sql);
            } catch (err) {
                if (!err.message.includes('Duplicate column')) {
                    console.warn(err.message);
                }
            }
        }

        // Set name_en from category_name if null
        await pool.query('UPDATE destination_categories SET name_en = category_name WHERE name_en IS NULL');

        const masterCategories = [
            ['Beach', '🏖️'],
            ['Mountain', '🏔️'],
            ['Island', '🏝️'],
            ['City', '🏙️'],
            ['Historical', '🏛️'],
            ['Religious', '🕌'],
            ['Nature', '🌿'],
            ['Wildlife', '🐘'],
            ['Adventure', '🧗'],
            ['Luxury', '💎'],
            ['Honeymoon', '💑'],
            ['Family', '👨‍👩‍👧'],
            ['Shopping', '🛍️'],
            ['Wellness', '🧘']
        ];

        for (const [name, icon] of masterCategories) {
            const [rows] = await pool.query('SELECT id FROM destination_categories WHERE name_en = ? LIMIT 1', [name]);
            if (rows.length === 0) {
                await pool.query(
                    'INSERT INTO destination_categories (destination_id, category_name, name_en, icon, is_active) VALUES (?, ?, ?, ?, ?)',
                    [1, name, name, icon, 1]
                );
            } else {
                await pool.query('UPDATE destination_categories SET icon = ? WHERE name_en = ?', [icon, name]);
            }
        }

        console.log('✅ destination_categories updated and seeded successfully!');
        process.exit(0);
    } catch (e) {
        console.error('Error fixing categories:', e);
        process.exit(1);
    }
}

fixCategories();
