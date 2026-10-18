const { pool } = require('../server/config/db');

async function seedModularData() {
    console.log('🌱 Starting Modular Component Seeding on Hostinger MySQL...');
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        // 1. Update Destinations with rich data
        console.log('Seeding destinations & attractions...');
        const destinationsData = [
            {
                id: 1,
                name_en: 'Bali, Indonesia',
                name_bn: 'বালি, ইন্দোনেশিয়া',
                country: 'Indonesia',
                city: 'Denpasar',
                short_desc_en: 'Tropical beaches, spiritual temples, and emerald rice terraces.',
                short_desc_bn: 'ক্রান্তীয় সৈকত, পবিত্র মন্দির এবং সবুজ ধানের সিড়ি।',
                estimated_budget_min: 500,
                estimated_budget_max: 2500,
                best_time_en: 'Apr - Oct',
                best_time_bn: 'এপ্রিল - অক্টোবর',
                currency_code: 'IDR',
                timezone: 'GMT+8',
                lat: -8.409518,
                lng: 115.188916,
                image_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
                categories: ['Beach', 'Culture', 'Adventure', 'Nature', 'Relaxation']
            },
            {
                id: 2,
                name_en: 'Santorini, Greece',
                name_bn: 'সান্তরিনি, গ্রিস',
                country: 'Greece',
                city: 'Thira',
                short_desc_en: 'Whitewashed cliffside villas overlooking turquoise caldera sunsets.',
                short_desc_bn: 'সাদা রঙের ক্লিফসাইড ভিলা ও নীলাভ এজিয়ান সাগরের সূর্যাস্ত।',
                estimated_budget_min: 850,
                estimated_budget_max: 3200,
                best_time_en: 'May - Oct',
                best_time_bn: 'মে - অক্টোবর',
                currency_code: 'EUR',
                timezone: 'GMT+3',
                lat: 36.3932,
                lng: 25.4615,
                image_url: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
                categories: ['Honeymoon', 'Luxury', 'Beach', 'Photography', 'Culture']
            },
            {
                id: 3,
                name_en: 'Paris, France',
                name_bn: 'প্যারিস, ফ্রান্স',
                country: 'France',
                city: 'Paris',
                short_desc_en: 'The city of lights, timeless fashion, world-class art, and culinary excellence.',
                short_desc_bn: 'আলোর শহর, বিশ্বমানের শিল্প, ফ্যাশন এবং সুস্বাদু রান্না।',
                estimated_budget_min: 720,
                estimated_budget_max: 2800,
                best_time_en: 'Jun - Sep',
                best_time_bn: 'জুন - সেপ্টেম্বর',
                currency_code: 'EUR',
                timezone: 'GMT+2',
                lat: 48.8566,
                lng: 2.3522,
                image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
                categories: ['City', 'Culture', 'Historical', 'Food', 'Luxury']
            },
            {
                id: 4,
                name_en: 'Tokyo, Japan',
                name_bn: 'টোকিও, জাপান',
                country: 'Japan',
                city: 'Tokyo',
                short_desc_en: 'Futuristic neon skyscrapers blending with ancient shrines and Michelin dining.',
                short_desc_bn: 'ভবিষ্যতের আধুনিক শহর, প্রাচীন মন্দির এবং বিশ্বখ্যাত সুস্বাদু খাবার।',
                estimated_budget_min: 800,
                estimated_budget_max: 3000,
                best_time_en: 'Mar - May, Sep - Nov',
                best_time_bn: 'মার্চ - মে, সেপ্টেম্বর - নভেম্বর',
                currency_code: 'JPY',
                timezone: 'GMT+9',
                lat: 35.6762,
                lng: 139.6503,
                image_url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
                categories: ['City', 'Culture', 'Food', 'Shopping', 'Adventure']
            },
            {
                id: 5,
                name_en: 'Maldives',
                name_bn: 'মালদ্বীপ',
                country: 'Maldives',
                city: 'Male',
                short_desc_en: 'Ultra-exclusive private overwater villas floating on crystal azure lagoons.',
                short_desc_bn: 'স্ফটিক স্বচ্ছ নীল সাগরের ওপর ভাসমান এক্সক্লুসিভ ওভারওয়াটার ভিলা।',
                estimated_budget_min: 1200,
                estimated_budget_max: 4500,
                best_time_en: 'Nov - Apr',
                best_time_bn: 'নভেম্বর - এপ্রিল',
                currency_code: 'USD',
                timezone: 'GMT+5',
                lat: 3.2028,
                lng: 73.2207,
                image_url: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80',
                categories: ['Beach', 'Honeymoon', 'Luxury', 'Relaxation', 'Wellness']
            },
            {
                id: 6,
                name_en: 'New York, USA',
                name_bn: 'নিউ ইয়র্ক, যুক্তরাষ্ট্র',
                country: 'USA',
                city: 'New York',
                short_desc_en: 'Iconic Broadway shows, Central Park strolls, and Manhattan skyline energy.',
                short_desc_bn: 'ম্যানহাটন স্কাইলাইন, ব্রডওয়ে শো এবং সেন্ট্রাল পার্কের রোমাঞ্চ।',
                estimated_budget_min: 890,
                estimated_budget_max: 3299,
                best_time_en: 'Apr - Jun, Sep - Nov',
                best_time_bn: 'এপ্রিল - জুন, সেপ্টেম্বর - নভেম্বর',
                currency_code: 'USD',
                timezone: 'GMT-4',
                lat: 40.7128,
                lng: -74.0060,
                image_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
                categories: ['City', 'Shopping', 'Nightlife', 'Food', 'Culture']
            },
            {
                id: 7,
                name_en: 'Dubai, UAE',
                name_bn: 'দুবাই, সংযুক্ত আরব আমিরাত',
                country: 'UAE',
                city: 'Dubai',
                short_desc_en: 'World-record architectural marvels, luxury desert safaris, and high-end malls.',
                short_desc_bn: 'বিশ্বখ্যাত আকাশচুম্বী স্থাপত্য, মরুভূমির রোমাঞ্চ এবং বিলাসবহুল লাইফস্টাইল।',
                estimated_budget_min: 760,
                estimated_budget_max: 2900,
                best_time_en: 'Nov - Mar',
                best_time_bn: 'নভেম্বর - মার্চ',
                currency_code: 'AED',
                timezone: 'GMT+4',
                lat: 25.2048,
                lng: 55.2708,
                image_url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
                categories: ['City', 'Luxury', 'Shopping', 'Adventure', 'Family']
            },
            {
                id: 8,
                name_en: 'Bangkok, Thailand',
                name_bn: 'ব্যাংকক, থাইল্যান্ড',
                country: 'Thailand',
                city: 'Bangkok',
                short_desc_en: 'Vibrant street markets, golden Buddhist shrines, and mouthwatering culinary treats.',
                short_desc_bn: 'প্রাণবন্ত স্ট্রিট ফুড, সোনালী প্যাগোডা ও ঐতিহ্যবাহী থাই সংস্কৃতি।',
                estimated_budget_min: 450,
                estimated_budget_max: 1800,
                best_time_en: 'Nov - Feb',
                best_time_bn: 'নভেম্বর - ফেব্রুয়ারি',
                currency_code: 'THB',
                timezone: 'GMT+7',
                lat: 13.7563,
                lng: 100.5018,
                image_url: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80',
                categories: ['City', 'Food', 'Culture', 'Budget', 'Shopping']
            }
        ];

        for (const dest of destinationsData) {
            await conn.query(`
                INSERT INTO destinations (id, name_en, name_bn, country, city, short_desc_en, short_desc_bn, estimated_budget_min, estimated_budget_max, best_time_en, best_time_bn, currency_code, timezone, latitude, longitude, image_url, price_bdt, price_usd)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    short_desc_en = VALUES(short_desc_en),
                    short_desc_bn = VALUES(short_desc_bn),
                    estimated_budget_min = VALUES(estimated_budget_min),
                    estimated_budget_max = VALUES(estimated_budget_max),
                    best_time_en = VALUES(best_time_en),
                    best_time_bn = VALUES(best_time_bn),
                    currency_code = VALUES(currency_code),
                    timezone = VALUES(timezone),
                    latitude = VALUES(latitude),
                    longitude = VALUES(longitude),
                    image_url = VALUES(image_url);
            `, [
                dest.id, dest.name_en, dest.name_bn, dest.country, dest.city,
                dest.short_desc_en, dest.short_desc_bn, dest.estimated_budget_min, dest.estimated_budget_max,
                dest.best_time_en, dest.best_time_bn, dest.currency_code, dest.timezone,
                dest.lat, dest.lng, dest.image_url,
                dest.estimated_budget_min * 110, dest.estimated_budget_min
            ]);

            // Add categories
            await conn.query(`DELETE FROM destination_categories WHERE destination_id = ?`, [dest.id]);
            for (const cat of dest.categories) {
                await conn.query(`INSERT INTO destination_categories (destination_id, category_name) VALUES (?, ?)`, [dest.id, cat]);
            }
        }

        // 2. Attractions for Bali
        console.log('Seeding Bali attractions...');
        await conn.query(`DELETE FROM attractions WHERE destination_id = 1`);
        await conn.query(`
            INSERT INTO attractions (destination_id, name_en, name_bn, category, distance_km, travel_time_min, image_url, rating) VALUES
            (1, 'Uluwatu Temple', 'উলুওয়াতু মন্দির', 'Temple', 25.0, 50, 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=400&q=80', 4.8),
            (1, 'Tegallalang Rice Terraces', 'তেগালালাং ধানের সিড়ি', 'Nature', 15.0, 35, 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=400&q=80', 4.9),
            (1, 'Seminyak Beach', 'সেমিনিয়াক সৈকত', 'Beach', 8.0, 20, 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=400&q=80', 4.7),
            (1, 'Mount Batur Sunrise Trek', 'মাউন্ট বাতুর ট্রেকিং', 'Adventure', 40.0, 75, 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80', 4.9);
        `);

        // 3. Hotels for Bali (Budget, Standard, Premium, Luxury)
        console.log('Seeding Bali hotels & room pricing...');
        await conn.query(`DELETE FROM hotels WHERE destination_id = 1`);
        
        // Hotel 1: Budget Stay
        const [h1] = await conn.query(`
            INSERT INTO hotels (destination_id, name_en, name_bn, star_rating, area_name, address, cover_image, tier)
            VALUES (1, 'Kuta Beach Breeze Hostel & Inn', 'কুটা বিচ ব্রিজ হোস্টেল', 3, 'Kuta', 'Jl. Pantai Kuta No. 12', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80', 'budget')
        `);
        const [r1] = await conn.query(`
            INSERT INTO hotel_rooms (hotel_id, room_name_en, room_type, capacity_adults, capacity_children)
            VALUES (?, 'Standard AC Room', 'Standard', 2, 1)
        `, [h1.insertId]);
        await conn.query(`
            INSERT INTO hotel_prices (room_id, season_type, pricing_unit, supplier_cost, markup_percent, tax_percent, selling_price)
            VALUES (?, 'standard', 'per_room_night', 25.00, 20.00, 5.00, 35.00)
        `, [r1.insertId]);

        // Hotel 2: Standard Stay
        const [h2] = await conn.query(`
            INSERT INTO hotels (destination_id, name_en, name_bn, star_rating, area_name, address, cover_image, tier)
            VALUES (1, 'Sun Island Resort & Spa', 'সান আইল্যান্ড রিসোর্ট অ্যান্ড স্পা', 4, 'Ubud', 'Jl. Raya Ubud No. 45', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80', 'standard')
        `);
        const [r2] = await conn.query(`
            INSERT INTO hotel_rooms (hotel_id, room_name_en, room_type, capacity_adults, capacity_children)
            VALUES (?, 'Deluxe Ocean View Villa', 'Deluxe', 2, 1)
        `, [h2.insertId]);
        await conn.query(`
            INSERT INTO hotel_prices (room_id, season_type, pricing_unit, supplier_cost, markup_percent, tax_percent, selling_price)
            VALUES (?, 'standard', 'per_room_night', 65.00, 20.00, 5.00, 85.00)
        `, [r2.insertId]);

        // Hotel 3: Luxury Stay
        const [h3] = await conn.query(`
            INSERT INTO hotels (destination_id, name_en, name_bn, star_rating, area_name, address, cover_image, tier)
            VALUES (1, 'The Mulia Nusa Dua Sanctuary', 'দ্য মুলিয়া নুসা দুয়া স্যাঙ্কচুয়ারি', 5, 'Nusa Dua', 'Jl. Raya Nusa Dua Selatan', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80', 'luxury')
        `);
        const [r3] = await conn.query(`
            INSERT INTO hotel_rooms (hotel_id, room_name_en, room_type, capacity_adults, capacity_children)
            VALUES (?, 'Private Pool Cliffside Suite', 'Suite', 2, 2)
        `, [h3.insertId]);
        await conn.query(`
            INSERT INTO hotel_prices (room_id, season_type, pricing_unit, supplier_cost, markup_percent, tax_percent, selling_price)
            VALUES (?, 'standard', 'per_room_night', 180.00, 25.00, 5.00, 235.00)
        `, [r3.insertId]);

        // 4. Restaurants & Meal Pricing for Bali
        console.log('Seeding Bali restaurants & dining prices...');
        await conn.query(`DELETE FROM restaurants WHERE destination_id = 1`);
        
        const [rest1] = await conn.query(`
            INSERT INTO restaurants (destination_id, name_en, name_bn, cuisine_type, price_level, is_halal, is_vegetarian, image_url, rating)
            VALUES (1, 'Warung Makan Authentic Balinese', 'ওয়ারুং মাকান লোকাল রেস্টুরেন্ট', 'Balinese Traditional', 'budget', 1, 1, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80', 4.8)
        `);
        await conn.query(`
            INSERT INTO restaurant_prices (restaurant_id, meal_type, pricing_unit, supplier_cost, markup_percent, selling_price)
            VALUES (?, 'dinner', 'per_person_meal', 8.00, 25.00, 10.00)
        `, [rest1.insertId]);

        const [rest2] = await conn.query(`
            INSERT INTO restaurants (destination_id, name_en, name_bn, cuisine_type, price_level, is_halal, is_vegetarian, image_url, rating)
            VALUES (1, 'Jimbaran Bay Sunset Seafood Grill', 'জিম্বারান বে সানসেট সীফুড', 'Seafood & Asian', 'standard', 1, 0, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80', 4.9)
        `);
        await conn.query(`
            INSERT INTO restaurant_prices (restaurant_id, meal_type, pricing_unit, supplier_cost, markup_percent, selling_price)
            VALUES (?, 'dinner', 'per_person_meal', 20.00, 25.00, 25.00)
        `, [rest2.insertId]);

        // 5. Activities for Bali
        console.log('Seeding Bali activities...');
        await conn.query(`DELETE FROM activities WHERE destination_id = 1`);
        
        const [act1] = await conn.query(`
            INSERT INTO activities (destination_id, name_en, name_bn, category, duration_hours, difficulty_level, image_url)
            VALUES (1, 'Nusa Penida Island Speedboat Day Tour', 'নুসা পেনিদা আইল্যান্ড ডে ট্যুর', 'Water Sports', 8.0, 'moderate', 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=400&q=80')
        `);
        await conn.query(`
            INSERT INTO activity_prices (activity_id, pricing_unit, supplier_cost, markup_percent, adult_price, child_price, is_fixed_cost)
            VALUES (?, 'per_person', 35.00, 20.00, 45.00, 25.00, 0)
        `, [act1.insertId]);

        const [act2] = await conn.query(`
            INSERT INTO activities (destination_id, name_en, name_bn, category, duration_hours, difficulty_level, image_url)
            VALUES (1, 'Ayung River White Water Rafting', 'আয়ুং রিভার হোয়াইট ওয়াটার রাফটিং', 'Adventure', 4.0, 'moderate', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80')
        `);
        await conn.query(`
            INSERT INTO activity_prices (activity_id, pricing_unit, supplier_cost, markup_percent, adult_price, child_price, is_fixed_cost)
            VALUES (?, 'per_person', 28.00, 25.00, 35.00, 20.00, 0)
        `, [act2.insertId]);

        const [act3] = await conn.query(`
            INSERT INTO activities (destination_id, name_en, name_bn, category, duration_hours, difficulty_level, image_url)
            VALUES (1, 'Ubud Monkey Forest & Rice Terrace Tour', 'উবুদ মাঙ্কি ফরেস্ট ও রাইস টেরেস ট্যুর', 'Culture', 6.0, 'easy', 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=400&q=80')
        `);
        await conn.query(`
            INSERT INTO activity_prices (activity_id, pricing_unit, supplier_cost, markup_percent, adult_price, child_price, is_fixed_cost)
            VALUES (?, 'per_person', 22.00, 20.00, 30.00, 15.00, 0)
        `, [act3.insertId]);

        // 6. Transportation for Bali
        console.log('Seeding Bali transportation...');
        await conn.query(`DELETE FROM transportation WHERE destination_id = 1`);
        
        const [t1] = await conn.query(`
            INSERT INTO transportation (destination_id, title_en, title_bn, vehicle_type, service_type, capacity_passengers, image_url)
            VALUES (1, 'Private Airport VIP Pick-Up & Drop', 'প্রাইভেট এয়ারপোর্ট ভিআইপি পিকআপ', 'private_car', 'airport_transfer', 4, 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=400&q=80')
        `);
        await conn.query(`
            INSERT INTO transportation_prices (transport_id, pricing_unit, supplier_cost, markup_percent, selling_price, is_fixed_cost)
            VALUES (?, 'per_vehicle_trip', 20.00, 25.00, 30.00, 1)
        `, [t1.insertId]);

        const [t2] = await conn.query(`
            INSERT INTO transportation (destination_id, title_en, title_bn, vehicle_type, service_type, capacity_passengers, image_url)
            VALUES (1, 'Full Day Private Car with English Driver', 'সারাদিনের প্রাইভেট কার ও ড্রাইভার', 'private_car', 'daily_rental', 5, 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80')
        `);
        await conn.query(`
            INSERT INTO transportation_prices (transport_id, pricing_unit, supplier_cost, markup_percent, selling_price, is_fixed_cost)
            VALUES (?, 'per_vehicle_day', 40.00, 20.00, 50.00, 1)
        `, [t2.insertId]);

        const [t3] = await conn.query(`
            INSERT INTO transportation (destination_id, title_en, title_bn, vehicle_type, service_type, capacity_passengers, image_url)
            VALUES (1, 'Honda Scoopy Scooter Rental', 'স্কুটার রেন্টাল', 'scooter', 'daily_rental', 2, 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&q=80')
        `);
        await conn.query(`
            INSERT INTO transportation_prices (transport_id, pricing_unit, supplier_cost, markup_percent, selling_price, is_fixed_cost)
            VALUES (?, 'per_vehicle_day', 8.00, 25.00, 12.00, 1)
        `, [t3.insertId]);

        // 7. Seed Package Add-ons
        console.log('Seeding package add-ons...');
        await conn.query(`DELETE FROM package_addons WHERE package_id = 1`);
        await conn.query(`
            INSERT INTO package_addons (package_id, addon_title_en, addon_title_bn, description, price) VALUES
            (1, 'Private Sunset Dinner Cruise', 'প্রাইভেট সানসেট ডিনার ক্রুজ', 'Luxury catamaran cruise with gourmet buffet and champagne', 80.00),
            (1, '5-Star Luxury Villa Upgrade', '৫-তারকা লাক্সারি ভিলা আপগ্রেড', 'Upgrade from standard hotel to private pool sanctuary', 150.00),
            (1, 'International Travel & Medical Insurance', 'আন্তর্জাতিক ট্রাভেল ইন্স্যুরেন্স', 'Comprehensive global coverage for travel safety', 30.00),
            (1, 'Fast-Track Airport Immigration VIP', 'ভিআইপি এয়ারপোর্ট ফাস্ট-ট্র্যাক', 'Skip all airport queues with dedicated concierge', 45.00);
        `);

        // 8. Seed Blogs
        console.log('Seeding travel blogs...');
        await conn.query(`DELETE FROM blogs`);
        await conn.query(`
            INSERT INTO blogs (title_en, title_bn, slug, excerpt_en, content_en, author_name, category, image_url, read_time_min) VALUES
            ('Travel Tips for Bali: Everything You Need to Know', 'বালি ভ্রমণের সেরা টিপস', 'travel-tips-for-bali', 'Insider tips on local food, sacred temple etiquette, visa extensions, and hidden beaches away from the crowds.', 'Complete guide to planning your dream vacation in Bali...', 'Sarah Ahmed', 'Tips & Guides', 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80', 5),
            ('Top 10 Places in Europe to Visit This Year', 'ইউরোপের সেরা ১০টি ভ্রমণ গন্তব্য', 'top-10-places-in-europe', 'Must-visit European destinations this summer from Santorini caldera cliffs to Swiss alpine valleys.', 'Europe offers an unmatched blend of history and scenery...', 'James Carter', 'Destination Guide', 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=600&q=80', 8),
            ('Solo Travel Guide: Smart, Safe, and Budget-Friendly', 'একাকী ভ্রমণের সহজ নির্দেশিকা', 'solo-travel-guide', 'How to travel smart, pack ultralight, stay safe, and build lifelong memories on your solo adventures.', 'Solo travel teaches self-reliance and independence...', 'Priya Saha', 'Solo Journey', 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=600&q=80', 6);
        `);

        await conn.commit();
        console.log('🎉 Seeding successfully finished and committed to Hostinger MySQL!');
    } catch (err) {
        await conn.rollback();
        console.error('❌ Seeding failed, rolled back:', err.message);
        throw err;
    } finally {
        conn.release();
    }
}

seedModularData().then(() => {
    process.exit(0);
}).catch(err => {
    process.exit(1);
});
