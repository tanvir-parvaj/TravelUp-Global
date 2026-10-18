const { pool } = require('../config/db');

async function syncTravelTypesAndPackages() {
    try {
        console.log("Checking domestic packages...");
        const [existing] = await pool.query("SELECT id FROM packages WHERE title_en LIKE '%Cox%'");
        if (existing.length === 0) {
            await pool.query(`
                INSERT INTO packages (destination_id, title_en, title_bn, duration_days, price_bdt, price_usd, included_services, discount_percent, is_active)
                VALUES 
                (9, "Cox's Bazar Luxury Beach Break", "কক্সবাজার সমুদ্র সৈকত ও রিসোর্ট ছুটি", 3, 9500.00, 85.00, "Sayeman Beach Resort, Daily Buffet Breakfast, Inani Coral Beach Tour, AC Coach", 10, 1),
                (11, "Sajek Valley Cloud Kingdom Explorer", "সাজেক ভ্যালি মেঘের রাজ্য ভ্রমণ", 3, 11500.00, 105.00, "Resort in Sajek Peak, 4x4 Chander Gari Safari, Konglak Peak Trek, BBQ Night", 15, 1)
            `);
            console.log("✅ Seeded domestic packages successfully!");
        } else {
            console.log("Domestic packages already exist.");
        }

        const [allPkgs] = await pool.query(`
            SELECT p.id, p.title_en, d.name_en AS dest_name, d.travel_type 
            FROM packages p 
            JOIN destinations d ON p.destination_id = d.id
        `);
        console.log("Current active packages:", allPkgs);
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

syncTravelTypesAndPackages();
