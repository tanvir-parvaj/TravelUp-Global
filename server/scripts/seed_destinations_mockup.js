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

        console.log('Seeding destinations to match mockup Screen 2...');

        const destinations = [
            // Domestic
            {
                name_en: "Cox's Bazar",
                name_bn: "কক্সবাজার",
                slug: "coxs-bazar",
                destination_code: "CBD001",
                travel_type: "domestic",
                country: "Bangladesh",
                division_state: "Chittagong",
                city: "Cox's Bazar",
                category: "Beach",
                description_en: "The world's longest unbroken natural sea beach, with golden sand, scenic hills, and vibrant seafood.",
                short_desc_en: "World's longest natural sea beach with stunning views.",
                image_url: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=600&q=80",
                price_bdt: 12500,
                price_usd: 110,
                latitude: 21.4272,
                longitude: 92.0058,
                status: "active",
                is_featured: 1,
                is_trending: 1
            },
            {
                name_en: "Saint Martin",
                name_bn: "সেন্ট মার্টিন",
                slug: "saint-martin",
                destination_code: "SMD002",
                travel_type: "domestic",
                country: "Bangladesh",
                division_state: "Chittagong",
                city: "Cox's Bazar",
                category: "Beach",
                description_en: "The only coral island in Bangladesh, surrounded by crystalline blue waters, coconut groves, and fresh seafood.",
                short_desc_en: "Coral island with crystal blue waters and tropical calm.",
                image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
                price_bdt: 14000,
                price_usd: 125,
                latitude: 20.6272,
                longitude: 92.3225,
                status: "active",
                is_featured: 1,
                is_trending: 1
            },
            {
                name_en: "Sajek Valley",
                name_bn: "সাজেক ভ্যালি",
                slug: "sajek-valley",
                destination_code: "SJD003",
                travel_type: "domestic",
                country: "Bangladesh",
                division_state: "Rangamati",
                city: "Baghaichhari",
                category: "Mountain",
                description_en: "Famous for being above the clouds, Sajek Valley features rolling green hills, wooden cottages, and misty dawns.",
                short_desc_en: "Queen of Hills above the clouds.",
                image_url: "https://images.unsplash.com/photo-1622308644420-a6f9f2139e76?auto=format&fit=crop&w=600&q=80",
                price_bdt: 11500,
                price_usd: 100,
                latitude: 23.3821,
                longitude: 92.2938,
                status: "active",
                is_featured: 1,
                is_trending: 1
            },
            {
                name_en: "Sylhet",
                name_bn: "সিলেট",
                slug: "sylhet",
                destination_code: "SYD004",
                travel_type: "domestic",
                country: "Bangladesh",
                division_state: "Sylhet",
                city: "Sylhet",
                category: "Adventure",
                description_en: "Land of tea gardens, waterfalls, and scenic rivers including Jaflong, Ratargul Swamp Forest, and Bichnakandi.",
                short_desc_en: "Lush tea gardens, waterfalls, and tranquil swamp forests.",
                image_url: "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=600&q=80",
                price_bdt: 9500,
                price_usd: 85,
                latitude: 24.8949,
                longitude: 91.8687,
                status: "active",
                is_featured: 0,
                is_trending: 1
            },
            {
                name_en: "Bandarban",
                name_bn: "বান্দরবান",
                slug: "bandarban",
                destination_code: "BBD006",
                travel_type: "domestic",
                country: "Bangladesh",
                division_state: "Chittagong",
                city: "Bandarban",
                category: "Mountain",
                description_en: "Home to the highest peaks of Bangladesh, breathtaking tribal culture, and majestic waterfalls like Nilgiri and Boga Lake.",
                short_desc_en: "Highest peaks, tribal villages, and misty hillscapes.",
                image_url: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=600&q=80",
                price_bdt: 13500,
                price_usd: 120,
                latitude: 22.1953,
                longitude: 92.2184,
                status: "active",
                is_featured: 1,
                is_trending: 0
            },
            {
                name_en: "Sundarbans",
                name_bn: "সুন্দরবন",
                slug: "sundarbans",
                destination_code: "SND008",
                travel_type: "domestic",
                country: "Bangladesh",
                division_state: "Khulna",
                city: "Mongla",
                category: "Wildlife",
                description_en: "The world's largest mangrove forest, home of the Royal Bengal Tiger, spotted deer, and scenic river cruises.",
                short_desc_en: "UNESCO World Heritage mangrove forest and wildlife safari.",
                image_url: "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=600&q=80",
                price_bdt: 18000,
                price_usd: 160,
                latitude: 21.9497,
                longitude: 89.1833,
                status: "active",
                is_featured: 1,
                is_trending: 0
            },

            // International
            {
                name_en: "Bangkok",
                name_bn: "ব্যাংকক",
                slug: "bangkok",
                destination_code: "BKK001",
                travel_type: "international",
                country: "Thailand",
                division_state: "Central Thailand",
                city: "Bangkok",
                category: "City",
                description_en: "Vibrant capital of Thailand, renowned for grand ornate shrines, bustling floating markets, and energetic street life.",
                short_desc_en: "Dynamic metropolis with Grand Palace, vibrant markets, and rooftop dining.",
                image_url: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=600&q=80",
                price_bdt: 45000,
                price_usd: 390,
                latitude: 13.7563,
                longitude: 100.5018,
                status: "active",
                visa_required: 1,
                visa_type: "E-Visa on Arrival / Sticker Visa",
                visa_processing_time: "3-5 business days",
                passport_notes: "Passport must have at least 6 months validity.",
                is_featured: 1,
                is_trending: 1
            },
            {
                name_en: "Dubai",
                name_bn: "দুবাই",
                slug: "dubai",
                destination_code: "DXB002",
                travel_type: "international",
                country: "UAE",
                division_state: "Dubai Emirate",
                city: "Dubai",
                category: "City",
                description_en: "Ultramodern oasis famed for luxury shopping, futuristic architecture including Burj Khalifa, and desert safaris.",
                short_desc_en: "Luxury, Burj Khalifa, Desert Safari, and high-end shopping.",
                image_url: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=600&q=80",
                price_bdt: 85000,
                price_usd: 750,
                latitude: 25.2048,
                longitude: 55.2708,
                status: "active",
                visa_required: 1,
                visa_type: "UAE Tourist Visa (30 Days)",
                visa_processing_time: "2-3 business days",
                passport_notes: "Minimum 6 months validity required.",
                is_featured: 1,
                is_trending: 1
            },
            {
                name_en: "Singapore",
                name_bn: "সিঙ্গাপুর",
                slug: "singapore",
                destination_code: "SIN003",
                travel_type: "international",
                country: "Singapore",
                division_state: "Central Region",
                city: "Singapore",
                category: "City",
                description_en: "World-class city-state featuring Gardens by the Bay, Marina Bay Sands, Universal Studios, and immaculate cleanliness.",
                short_desc_en: "Futuristic city-garden with Marina Bay Sands and Sentosa.",
                image_url: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=600&q=80",
                price_bdt: 72000,
                price_usd: 630,
                latitude: 1.3521,
                longitude: 103.8198,
                status: "active",
                visa_required: 1,
                visa_type: "Singapore E-Visa",
                visa_processing_time: "4-6 business days",
                is_featured: 1,
                is_trending: 1
            },
            {
                name_en: "Malaysia",
                name_bn: "মালয়েশিয়া",
                slug: "malaysia",
                destination_code: "KUL004",
                travel_type: "international",
                country: "Malaysia",
                division_state: "Federal Territory",
                city: "Kuala Lumpur",
                category: "City",
                description_en: "Twin Towers, Batu Caves, Genting Highlands, and diverse culture combining Malay, Chinese, and Indian influences.",
                short_desc_en: "Petronas Twin Towers, Batu Caves, and tropical rainforests.",
                image_url: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=600&q=80",
                price_bdt: 62000,
                price_usd: 540,
                latitude: 3.1390,
                longitude: 101.6869,
                status: "active",
                visa_required: 1,
                visa_type: "MDAC & E-Visa",
                visa_processing_time: "2-4 business days",
                is_featured: 1,
                is_trending: 1
            },
            {
                name_en: "Bali",
                name_bn: "বালি",
                slug: "bali",
                destination_code: "DPS005",
                travel_type: "international",
                country: "Indonesia",
                division_state: "Bali",
                city: "Denpasar",
                category: "Beach",
                description_en: "Island of the Gods with dramatic volcano peaks, emerald rice terraces, and mystical Hindu temples.",
                short_desc_en: "Tropical paradise, rice terraces, surfing, and temple culture.",
                image_url: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80",
                price_bdt: 58000,
                price_usd: 510,
                latitude: -8.4095,
                longitude: 115.1889,
                status: "active",
                visa_required: 1,
                visa_type: "Visa on Arrival (VOA)",
                visa_processing_time: "Instant on arrival / 24 hrs online",
                is_featured: 1,
                is_trending: 1
            },
            {
                name_en: "Maldives",
                name_bn: "মালদ্বীপ",
                slug: "maldives",
                destination_code: "MLE007",
                travel_type: "international",
                country: "Maldives",
                division_state: "Kaafu Atoll",
                city: "Male",
                category: "Beach",
                description_en: "Pure luxury overwater bungalows, turquoise lagoons, and world-class marine life with whale sharks and manta rays.",
                short_desc_en: "Overwater private villas, vibrant coral reefs, and pristine atolls.",
                image_url: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=600&q=80",
                price_bdt: 120000,
                price_usd: 1050,
                latitude: 3.2028,
                longitude: 73.2207,
                status: "active",
                visa_required: 0,
                visa_type: "Free 30-Day Visa on Arrival for Bangladeshis",
                is_featured: 1,
                is_trending: 1
            }
        ];

        for (const d of destinations) {
            // Check if destination with code or slug exists
            const [existing] = await pool.query(
                'SELECT id FROM destinations WHERE destination_code = ? OR slug = ? OR name_en = ?',
                [d.destination_code, d.slug, d.name_en]
            );

            if (existing.length > 0) {
                // Update
                await pool.query(`
                    UPDATE destinations SET
                        name_en = ?, name_bn = ?, slug = ?, destination_code = ?, travel_type = ?,
                        country = ?, division_state = ?, city = ?, category = ?, description_en = ?,
                        short_desc_en = ?, image_url = ?, price_bdt = ?, price_usd = ?,
                        latitude = ?, longitude = ?, status = ?, is_featured = ?, is_trending = ?,
                        visa_required = ?, visa_type = ?, visa_processing_time = ?, passport_notes = ?
                    WHERE id = ?
                `, [
                    d.name_en, d.name_bn, d.slug, d.destination_code, d.travel_type,
                    d.country, d.division_state, d.city, d.category, d.description_en,
                    d.short_desc_en, d.image_url, d.price_bdt, d.price_usd,
                    d.latitude, d.longitude, d.status, d.is_featured, d.is_trending,
                    d.visa_required || 0, d.visa_type || null, d.visa_processing_time || null, d.passport_notes || null,
                    existing[0].id
                ]);
                console.log(`Updated destination: ${d.name_en} (${d.destination_code})`);
            } else {
                // Insert
                await pool.query(`
                    INSERT INTO destinations (
                        name_en, name_bn, slug, destination_code, travel_type,
                        country, division_state, city, category, description_en,
                        short_desc_en, image_url, price_bdt, price_usd,
                        latitude, longitude, status, is_featured, is_trending,
                        visa_required, visa_type, visa_processing_time, passport_notes
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    d.name_en, d.name_bn, d.slug, d.destination_code, d.travel_type,
                    d.country, d.division_state, d.city, d.category, d.description_en,
                    d.short_desc_en, d.image_url, d.price_bdt, d.price_usd,
                    d.latitude, d.longitude, d.status, d.is_featured, d.is_trending,
                    d.visa_required || 0, d.visa_type || null, d.visa_processing_time || null, d.passport_notes || null
                ]);
                console.log(`Inserted destination: ${d.name_en} (${d.destination_code})`);
            }
        }

        console.log('✅ Mockup destinations seeded successfully!');
        process.exit(0);
    } catch (e) {
        console.error('Seeding error:', e);
        process.exit(1);
    }
})();
