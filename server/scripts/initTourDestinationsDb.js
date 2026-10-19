const { pool } = require('../config/db');
const destinations = require('../../client/data/bd_tour_destinations.json');

async function seedTourDestinations() {
    console.log('🚀 Initializing bd_tour_destinations table in MySQL...');

    const createTableSql = `
        CREATE TABLE IF NOT EXISTS bd_tour_destinations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            destination_id VARCHAR(50) NOT NULL UNIQUE,
            country_id VARCHAR(50) DEFAULT 'COUNTRY-BD',
            country_en VARCHAR(100) DEFAULT 'Bangladesh',
            country_bn VARCHAR(100) DEFAULT 'বাংলাদেশ',
            division_id VARCHAR(50) NOT NULL,
            division_name_en VARCHAR(100) NOT NULL,
            division_name_bn VARCHAR(100),
            district_id VARCHAR(50) NOT NULL,
            district_name_en VARCHAR(100) NOT NULL,
            district_name_bn VARCHAR(100),
            name_en VARCHAR(255) NOT NULL,
            name_bn VARCHAR(255),
            destination_type VARCHAR(100) DEFAULT 'Attraction',
            search_keywords TEXT,
            top_50_flag TINYINT(1) DEFAULT 0,
            popularity_rank INT DEFAULT NULL,
            why_selected TEXT,
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_division_id (division_id),
            INDEX idx_district_id (district_id),
            INDEX idx_dest_type (destination_type),
            INDEX idx_top_50 (top_50_flag),
            INDEX idx_rank (popularity_rank)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    try {
        await pool.query(createTableSql);
        console.log('✅ Table bd_tour_destinations created or already exists.');

        let inserted = 0;
        let updated = 0;

        for (const dest of destinations) {
            const [result] = await pool.query(`
                INSERT INTO bd_tour_destinations 
                (destination_id, country_id, country_en, country_bn, division_id, division_name_en, division_name_bn,
                 district_id, district_name_en, district_name_bn, name_en, name_bn, destination_type,
                 search_keywords, top_50_flag, popularity_rank, why_selected, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    country_id = VALUES(country_id),
                    country_en = VALUES(country_en),
                    country_bn = VALUES(country_bn),
                    division_id = VALUES(division_id),
                    division_name_en = VALUES(division_name_en),
                    division_name_bn = VALUES(division_name_bn),
                    district_id = VALUES(district_id),
                    district_name_en = VALUES(district_name_en),
                    district_name_bn = VALUES(district_name_bn),
                    name_en = VALUES(name_en),
                    name_bn = VALUES(name_bn),
                    destination_type = VALUES(destination_type),
                    search_keywords = VALUES(search_keywords),
                    top_50_flag = VALUES(top_50_flag),
                    popularity_rank = VALUES(popularity_rank),
                    why_selected = VALUES(why_selected),
                    is_active = VALUES(is_active)
            `, [
                dest.destination_id,
                dest.country_id,
                dest.country_en,
                dest.country_bn,
                dest.division_id,
                dest.division_name_en,
                dest.division_name_bn,
                dest.district_id,
                dest.district_name_en,
                dest.district_name_bn,
                dest.name_en,
                dest.name_bn,
                dest.destination_type,
                dest.search_keywords,
                dest.top_50_flag,
                dest.popularity_rank,
                dest.why_selected,
                dest.is_active
            ]);

            if (result.affectedRows === 1) inserted++;
            else if (result.affectedRows === 2) updated++;
        }

        console.log(`✅ Seed complete! Total: ${destinations.length} (Inserted: ${inserted}, Updated: ${updated})`);

        const [verify] = await pool.query('SELECT COUNT(*) as total FROM bd_tour_destinations');
        console.log(`📊 Verified count in bd_tour_destinations: ${verify[0].total}`);
    } catch (err) {
        console.error('❌ Error seeding tour destinations:', err);
    } finally {
        await pool.end();
    }
}

seedTourDestinations();
