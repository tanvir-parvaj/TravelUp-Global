const { pool } = require('../config/db');

async function seedCoxBazarData() {
    try {
        console.log("Seeding rich Cox's Bazar DMS Data...");

        const coxMapEmbed = `<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d118844.75782705256!2d91.9161706691462!3d21.434444555029407!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30adc7ea2ab928c3%3A0x3b53a1d500e9d00b!2sCox's%20Bazar!5e0!3m2!1sen!2sbd!4v1700000000000!5m2!1sen!2sbd" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>`;

        // 1. Get or create Cox's Bazar Destination
        const [existing] = await pool.query("SELECT id FROM destinations WHERE destination_code = 'CBD001' OR name_en = 'Cox\\'s Bazar' LIMIT 1");
        let destId;

        if (existing.length > 0) {
            destId = existing[0].id;
            await pool.query(`
                UPDATE destinations SET
                    destination_code = 'CBD001',
                    slug = 'cox-s-bazar',
                    name_en = ?,
                    country = 'Bangladesh',
                    division_state = 'Chattogram',
                    city = ?,
                    category = 'Beach',
                    travel_type = 'domestic',
                    short_desc_en = ?,
                    average_duration = '3 Days / 2 Nights',
                    map_embed_code = ?,
                    timezone = 'Asia/Dhaka',
                    currency_code = 'BDT',
                    tags = 'Beach,Nature,Family Friendly,Adventure,Honeymoon',
                    recommended_for = 'Family,Couple,Honeymoon,Friends,Solo',
                    is_featured = 1,
                    is_trending = 1,
                    status = 'active',
                    visibility = 'public',
                    is_homepage_show = 1,
                    is_search_show = 1,
                    is_booking_enabled = 1,
                    is_custom_trip_enabled = 1,
                    is_recommendation_enabled = 1,
                    is_review_enabled = 1
                WHERE id = ?
            `, [
                "Cox's Bazar",
                "Cox's Bazar",
                "The world's longest natural sea beach with stunning views, resorts, and coastal seafood.",
                coxMapEmbed,
                destId
            ]);
        } else {
            const [ins] = await pool.query(`
                INSERT INTO destinations (
                    name_en, slug, destination_code, country, division_state, city, category,
                    travel_type, short_desc_en, average_duration, map_embed_code, timezone, currency_code,
                    image_url, tags, recommended_for, is_featured, is_trending, status, visibility
                ) VALUES (
                    ?, 'cox-s-bazar', 'CBD001', 'Bangladesh', 'Chattogram', ?, 'Beach',
                    'domestic', ?, '3 Days / 2 Nights', ?, 'Asia/Dhaka', 'BDT',
                    'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1200&q=80',
                    'Beach,Nature,Family Friendly,Adventure,Honeymoon', 'Family,Couple,Honeymoon,Friends,Solo',
                    1, 1, 'active', 'public'
                )
            `, [
                "Cox's Bazar",
                "Cox's Bazar",
                "The world's longest natural sea beach with stunning views, resorts, and coastal seafood.",
                coxMapEmbed
            ]);
            destId = ins.insertId;
        }

        console.log('Destination ID:', destId);

        // 2. Hotels
        const hotels = [
            {
                code: 'H-CBD001', name: 'Sea Pearl Beach Resort & Spa', star: 5, type: 'Resort',
                area: 'Inani Beach', city: "Cox's Bazar", country: 'Bangladesh',
                address: "Plot #45, Inani, Marine Drive, Cox's Bazar", phone: '+8801844016001', email: 'info@seapearl.com',
                cover: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
                tier: 'luxury', base: 10000, sell: 12000,
                amenities: 'WiFi,Swimming Pool,Spa,Beach Access,Restaurant,Gym,Kids Club'
            },
            {
                code: 'H-CBD002', name: 'Hotel Long Beach', star: 4, type: 'Hotel',
                area: 'Kalatoli', city: "Cox's Bazar", country: 'Bangladesh',
                address: "14 Kalatoli Road, Cox's Bazar", phone: '+8801755660000', email: 'reservation@longbeachhotelbd.com',
                cover: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80',
                tier: 'premium', base: 5500, sell: 6500,
                amenities: 'WiFi,Swimming Pool,Restaurant,Airport Transfer,Room Service'
            },
            {
                code: 'H-CBD003', name: 'Sayeman Beach Resort', star: 5, type: 'Resort',
                area: 'Marine Drive', city: "Cox's Bazar", country: 'Bangladesh',
                address: "Marine Drive, Kolatoli, Cox's Bazar", phone: '+8801755699999', email: 'info@sayemanresort.com',
                cover: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80',
                tier: 'luxury', base: 9500, sell: 11500,
                amenities: 'WiFi,Infinity Pool,Beach Access,Spa,Sea View Rooms'
            },
            {
                code: 'H-CBD004', name: 'Hotel The Cox Today', star: 4, type: 'Hotel',
                area: 'Kolatoli Circle', city: "Cox's Bazar", country: 'Bangladesh',
                address: "Plot-7, Road-02, Hotel Motel Zone", phone: '+8801755598446', email: 'sales@hotelthecoxtoday.com',
                cover: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80',
                tier: 'standard', base: 4800, sell: 5800,
                amenities: 'WiFi,Swimming Pool,Parking,Restaurant'
            },
            {
                code: 'H-CBD005', name: 'Ocean Paradise Hotel & Resort', star: 5, type: 'Resort',
                area: 'Medical Road', city: "Cox's Bazar", country: 'Bangladesh',
                address: "28-29 Hotel Motel Zone, Kolatoli Road", phone: '+8801938846761', email: 'reservation@oceanparadise.com',
                cover: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80',
                tier: 'premium', base: 7800, sell: 9200,
                amenities: 'WiFi,Pool,Spa,BBQ Terrace,Gym'
            }
        ];

        for (const h of hotels) {
            const [exist] = await pool.query("SELECT id FROM hotels WHERE hotel_code = ?", [h.code]);
            if (exist.length === 0) {
                await pool.query(`
                    INSERT INTO hotels (
                        destination_id, hotel_code, name_en, star_rating, hotel_type, area_name, city, country,
                        address, phone, email, cover_image, tier, base_price, selling_price, amenities_json,
                        is_active, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'active')
                `, [
                    destId, h.code, h.name, h.star, h.type, h.area, h.city, h.country,
                    h.address, h.phone, h.email, h.cover, h.tier, h.base, h.sell, h.amenities
                ]);
            }
        }

        // 3. Restaurants
        const restaurants = [
            { code: 'R-CBD001', name: 'Sugandha Restaurant', cuisine: 'Seafood & Bengali', tier: 'standard', halal: 1, veg: 1, fam: 0, img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80', addr: "Plot #4, Sugandha Point, Beach Road, Cox's Bazar", rating: 4.8 },
            { code: 'R-CBD002', name: 'The Ocean View Restaurant', cuisine: 'Continental & Coastal Seafood', tier: 'premium', halal: 1, veg: 1, fam: 1, img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80', addr: "Sayeman Beachfront, Marine Drive", rating: 4.9 },
            { code: 'R-CBD003', name: 'Mermaid Cafe & Eatery', cuisine: 'Organic, Seafood & Italian', tier: 'premium', halal: 1, veg: 1, fam: 1, img: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=600&q=80', addr: "Pechardwip Beach, Marine Drive", rating: 4.7 },
            { code: 'R-CBD004', name: 'Jhaubon Restaurant', cuisine: 'Traditional Bangladeshi', tier: 'budget', halal: 1, veg: 1, fam: 0, img: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', addr: "Kalatoli Road, Main Market", rating: 4.5 }
        ];

        for (const r of restaurants) {
            const [exist] = await pool.query("SELECT id FROM restaurants WHERE restaurant_code = ? OR (destination_id = ? AND name_en = ?)", [r.code, destId, r.name]);
            if (exist.length === 0) {
                await pool.query(`
                    INSERT INTO restaurants (
                        destination_id, restaurant_code, name_en, cuisine_type, price_level, is_halal, is_vegetarian,
                        is_family_friendly, image_url, address, rating, is_active, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'active')
                `, [destId, r.code, r.name, r.cuisine, r.tier, r.halal, r.veg, r.fam, r.img, r.addr, r.rating]);
            }
        }

        // 4. Foods
        const foods = [
            { code: 'F-CBD001', name: 'Shutki Bhorta & Loitta Fry', cat: 'Local Seafood', cuisine: 'Coastal Bengali', spicy: 'Medium', price: '৳220 - ৳450', where: 'Sugandha & Jhaubon Restaurant', desc: "Authentic dried fish delicacy and crispy golden loitta fish, iconic taste of Cox's Bazar.", img: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80' },
            { code: 'F-CBD002', name: 'Grilled Seafood Platter', cat: 'Fresh Seafood', cuisine: 'Coastal BBQ', spicy: 'Medium', price: '৳850 - ৳1,800', where: 'The Ocean View & Mermaid Beach Cafe', desc: "Platter of jumbo tiger prawns, grilled calamari, and butter-garlic sea crab.", img: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=600&q=80' },
            { code: 'F-CBD003', name: 'Koral Fish Charcoal BBQ', cat: 'Seafood', cuisine: 'Live BBQ', spicy: 'Hot', price: '৳700 - ৳1,500', where: 'Kolatoli Night Beach Stalls', desc: "Fresh coral fish caught live and grilled over glowing charcoal embers.", img: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80' }
        ];

        for (const f of foods) {
            const [exist] = await pool.query("SELECT id FROM foods WHERE food_code = ?", [f.code]);
            if (exist.length === 0) {
                await pool.query(`
                    INSERT INTO foods (
                        destination_id, food_code, name_en, category, cuisine, is_halal, is_vegetarian, is_vegan,
                        spicy_level, price_range, where_to_find, description_en, image_url, status
                    ) VALUES (?, ?, ?, ?, ?, 1, 0, 0, ?, ?, ?, ?, ?, 'active')
                `, [destId, f.code, f.name, f.cat, f.cuisine, f.spicy, f.price, f.where, f.desc, f.img]);
            }
        }

        // 5. Transportation (Intercity)
        const transports = [
            { code: 'T-CBD001', title: 'Green Line Paribahan AC Sleeper', type: 'bus', serv: 'intercity', cap: 32, base: 1600, sell: 1800, img: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80', prov: 'Green Line Paribahan', route: "Dhaka ➔ Cox's Bazar", orig: 'Dhaka', dest: "Cox's Bazar", dur: '7 Hours', cls: 'AC Sleeper' },
            { code: 'T-CBD002', title: 'US-Bangla Direct Flight (Boeing 737)', type: 'flight', serv: 'airport_transfer', cap: 160, base: 4000, sell: 4500, img: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=600&q=80', prov: 'US-Bangla Airlines', route: "Dhaka (DAC) ➔ Cox's Bazar (CXB)", orig: 'Dhaka', dest: "Cox's Bazar", dur: '55 Minutes', cls: 'Economy' }
        ];

        for (const t of transports) {
            const [exist] = await pool.query("SELECT id FROM transportation WHERE service_code = ?", [t.code]);
            if (exist.length === 0) {
                await pool.query(`
                    INSERT INTO transportation (
                        destination_id, service_code, title_en, vehicle_type, service_type, city, country,
                        capacity_passengers, base_price, selling_price, image_url, provider_name,
                        route_name, origin, destination, duration, class_type, is_active, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'active')
                `, [destId, t.code, t.title, t.type, t.serv, "Cox's Bazar", 'Bangladesh', t.cap, t.base, t.sell, t.img, t.prov, t.route, t.orig, t.dest, t.dur, t.cls]);
            }
        }

        // 6. Local Transportation
        const localTransports = [
            { code: 'LT-CBD001', prov: 'Green Line Local Desk', vtype: '4x4 Tourist Jeep (Chander Gari)', model: 'Mahindra 4WD', cap: 12, ac: 0, drv: 1, fuel: 1, hr: 600, day: 4500, trip: 0, air: 1200, area: 'Himchari & Inani Marine Drive', hours: '6:00 AM - 8:00 PM', phone: '+8801811223344', img: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80' },
            { code: 'LT-CBD002', prov: 'Cox CNG Drivers Union', vtype: 'CNG Auto-Rickshaw', model: 'Bajaj Maxima', cap: 4, ac: 0, drv: 1, fuel: 1, hr: 250, day: 1500, trip: 100, air: 350, area: 'City Center, Laboni, Kolatoli', hours: '24 Hours', phone: '+8801822334455', img: 'https://images.unsplash.com/photo-1596707324310-a94f6f437021?auto=format&fit=crop&w=600&q=80' },
            { code: 'LT-CBD003', prov: 'Marine Drive Rent-A-Car', vtype: 'Private AC Sedan', model: 'Toyota Allion', cap: 4, ac: 1, drv: 1, fuel: 1, hr: 500, day: 3800, trip: 0, air: 800, area: "All Cox's Bazar & Marine Drive", hours: '24 Hours', phone: '+8801833445566', img: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=600&q=80' }
        ];

        for (const lt of localTransports) {
            const [exist] = await pool.query("SELECT id FROM local_transportation WHERE service_code = ?", [lt.code]);
            if (exist.length === 0) {
                await pool.query(`
                    INSERT INTO local_transportation (
                        destination_id, service_code, provider_name, vehicle_type, vehicle_model, capacity, is_ac,
                        driver_included, fuel_included, hourly_rate, daily_rate, per_trip_rate,
                        airport_transfer_rate, service_area, operating_hours, contact_phone, image_url,
                        status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
                `, [destId, lt.code, lt.prov, lt.vtype, lt.model, lt.cap, lt.ac, lt.drv, lt.fuel, lt.hr, lt.day, lt.trip, lt.air, lt.area, lt.hours, lt.phone, lt.img]);
            }
        }

        // 7. Attractions
        const attractions = [
            { code: 'A-CBD001', name: "Cox's Bazar Main Sea Beach", cat: 'Beach', dist: 0, time: 0, img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80', rat: 4.9, desc: "The world's longest natural unbroken sandy sea beach, stretching over 120 kilometers.", feeBdt: 0, feeUsd: 0, hours: 'Open 24/7', best: 'Nov - Mar', dur: '4 - 6 Hours', fam: 1, wheel: 1, photo: 1 },
            { code: 'A-CBD002', name: 'Himchari National Park & Waterfall', cat: 'Waterfall & Hills', dist: 12, time: 25, img: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=600&q=80', rat: 4.7, desc: "Stunning hilltop panorama of the Bay of Bengal with fresh forest springs and waterfalls.", feeBdt: 50, feeUsd: 0.5, hours: '8:00 AM - 5:30 PM', best: 'Nov - Feb', dur: '2 - 3 Hours', fam: 1, wheel: 0, photo: 1 },
            { code: 'A-CBD003', name: 'Inani Coral Stone Beach', cat: 'Beach', dist: 24, time: 40, img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80', rat: 4.8, desc: "Crystal clear waters and ancient green-tinted coral stones set against coastal hills.", feeBdt: 0, feeUsd: 0, hours: '6:00 AM - 6:30 PM', best: 'Nov - Mar', dur: '3 - 4 Hours', fam: 1, wheel: 1, photo: 1 }
        ];

        for (const a of attractions) {
            const [exist] = await pool.query("SELECT id FROM attractions WHERE attraction_code = ? OR (destination_id = ? AND name_en = ?)", [a.code, destId, a.name]);
            if (exist.length === 0) {
                await pool.query(`
                    INSERT INTO attractions (
                        destination_id, attraction_code, name_en, category, distance_km, travel_time_min, image_url,
                        rating, description_en, entry_fee_bdt, entry_fee_usd, opening_hours, best_time,
                        recommended_duration, is_family_friendly, is_wheelchair_friendly, is_photography_allowed,
                        status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
                `, [destId, a.code, a.name, a.cat, a.dist, a.time, a.img, a.rat, a.desc, a.feeBdt, a.feeUsd, a.hours, a.best, a.dur, a.fam, a.wheel, a.photo]);
            }
        }

        // 8. Activities
        const activities = [
            { code: 'ACT-CBD001', name: 'Laboni Beach Surfing Lesson', cat: 'Water Sports', dur: 2.0, diff: 'moderate', age: 12, img: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=600&q=80', desc: "Learn how to ride waves with certified local surf instructors and gear included.", bdt: 1500, usd: 15, type: 'Per Person', min: 1, max: 8, guide: 1, pickup: 0, cancel: 1, inc: 'Surfboard, Wetsuit, Instructor' },
            { code: 'ACT-CBD002', name: 'Saint Martin Coral Cruise', cat: 'Boat Tour', dur: 7.0, diff: 'easy', age: 5, img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80', desc: "Full day catamaran cruise across blue waters to Saint Martin coral island.", bdt: 2200, usd: 22, type: 'Per Person', min: 1, max: 50, guide: 1, pickup: 1, cancel: 1, inc: 'Cruise ticket, life jacket, light snack' },
            { code: 'ACT-CBD003', name: 'Sunset Parasailing Adventure', cat: 'Adventure', dur: 0.5, diff: 'easy', age: 14, img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80', desc: "Fly high above the Bay of Bengal coastline with breathtaking sunset views.", bdt: 2500, usd: 25, type: 'Per Person', min: 1, max: 4, guide: 1, pickup: 0, cancel: 1, inc: 'Safety harness, speed boat tow, instructor' }
        ];

        for (const act of activities) {
            const [exist] = await pool.query("SELECT id FROM activities WHERE activity_code = ? OR (destination_id = ? AND name_en = ?)", [act.code, destId, act.name]);
            if (exist.length === 0) {
                await pool.query(`
                    INSERT INTO activities (
                        destination_id, activity_code, name_en, category, duration_hours, difficulty_level, min_age,
                        image_url, description_en, price_bdt, price_usd, price_type, min_participants,
                        max_participants, is_guide_included, is_pickup_available, is_cancellation_allowed,
                        included_items, is_active, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'active')
                `, [destId, act.code, act.name, act.cat, act.dur, act.diff, act.age, act.img, act.desc, act.bdt, act.usd, act.type, act.min, act.max, act.guide, act.pickup, act.cancel, act.inc]);
            }
        }

        // 9. Tour Guides
        const guides = [
            { code: 'G-CBD001', name: 'Tanvir Rahman', lang: 'Bengali, English', spec: 'Coastal Heritage & Beach Tours', exp: 8, cert: 'Govt Certified Tour Guide', day: 2500, hr: 400, type: 'Per Day', status: 'available', phone: '+8801711223344', email: 'tanvir.guide@travelup.com', rating: 4.9, img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', bio: 'Experienced local historian and coastal trail leader.' },
            { code: 'G-CBD002', name: 'Rafiq Ahmed', lang: 'Bengali, English, Hindi', spec: 'Marine Drive & Photography Guide', exp: 6, cert: 'Eco-Tourism Specialist', day: 2000, hr: 350, type: 'Per Day', status: 'available', phone: '+8801722334455', email: 'rafiq.guide@travelup.com', rating: 4.8, img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', bio: 'Specialist in photography hotspots and hidden waterfalls.' }
        ];

        for (const g of guides) {
            const [exist] = await pool.query("SELECT id FROM tour_guides WHERE guide_code = ?", [g.code]);
            if (exist.length === 0) {
                await pool.query(`
                    INSERT INTO tour_guides (
                        destination_id, guide_code, name, languages, specialization, experience_years, certification,
                        daily_rate, hourly_rate, price_type, availability_status, contact_phone,
                        contact_email, rating, profile_photo, bio, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
                `, [destId, g.code, g.name, g.lang, g.spec, g.exp, g.cert, g.day, g.hr, g.type, g.status, g.phone, g.email, g.rating, g.img, g.bio]);
            }
        }

        console.log("✅ Cox's Bazar rich inventory seeded successfully!");
        process.exit(0);
    } catch (e) {
        console.error('Error seeding data:', e);
        process.exit(1);
    }
}

seedCoxBazarData();
