const { pool } = require('../config/db');

// Helper to sanitize Google Maps iframe
function sanitizeMapEmbed(rawCode) {
    if (!rawCode) return null;
    const match = rawCode.match(/src=["'](https:\/\/(?:www\.)?google\.com\/maps\/embed[^"']+)["']/i);
    if (match && match[1]) {
        return match[1];
    }
    if (rawCode.startsWith('https://www.google.com/maps/embed') || rawCode.startsWith('https://maps.google.com/')) {
        return rawCode;
    }
    return null;
}

// 1. Get all destinations with search, tab counters, and filters
exports.getAllDestinations = async (req, res) => {
    try {
        const { search, category, type, status, maxPrice, sort } = req.query;

        let query = 'SELECT * FROM destinations WHERE (deleted_at IS NULL)';
        const params = [];

        // Tab filter: domestic vs international vs all
        if (type && type !== 'all') {
            query += ' AND travel_type = ?';
            params.push(type);
        }

        // Status filter: active vs inactive vs draft vs all
        if (status && status !== 'all') {
            query += ' AND status = ?';
            params.push(status);
        }

        // Text search across name, code, slug, country, division, city
        if (search) {
            query += ' AND (name_en LIKE ? OR name_bn LIKE ? OR destination_code LIKE ? OR slug LIKE ? OR country LIKE ? OR city LIKE ? OR division_state LIKE ?)';
            const term = `%${search}%`;
            params.push(term, term, term, term, term, term, term);
        }

        if (category && category !== 'all') {
            query += ' AND category = ?';
            params.push(category);
        }

        if (maxPrice) {
            query += ' AND price_bdt <= ?';
            params.push(parseFloat(maxPrice));
        }

        if (sort === 'price_asc') {
            query += ' ORDER BY price_bdt ASC';
        } else if (sort === 'price_desc') {
            query += ' ORDER BY price_bdt DESC';
        } else if (sort === 'rating') {
            query += ' ORDER BY rating DESC';
        } else if (sort === 'name_asc') {
            query += ' ORDER BY name_en ASC';
        } else {
            query += ' ORDER BY id ASC';
        }

        const [destinations] = await pool.query(query, params);

        // Compute live tab counts for UI pills
        const [[counts]] = await pool.query(`
            SELECT 
                COUNT(*) as total_all,
                SUM(CASE WHEN travel_type = 'domestic' THEN 1 ELSE 0 END) as total_domestic,
                SUM(CASE WHEN travel_type = 'international' THEN 1 ELSE 0 END) as total_international,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as total_active,
                SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as total_draft,
                SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as total_inactive
            FROM destinations 
            WHERE (deleted_at IS NULL)
        `);

        return res.json({
            success: true,
            count: destinations.length,
            counts: {
                all: counts.total_all || 0,
                domestic: counts.total_domestic || 0,
                international: counts.total_international || 0,
                active: counts.total_active || 0,
                draft: counts.total_draft || 0,
                inactive: counts.total_inactive || 0
            },
            destinations
        });
    } catch (error) {
        console.error('Error fetching destinations:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch destinations.' });
    }
};

// 2. Get single destination by ID with ALL related inventory entities
exports.getDestinationById = async (req, res) => {
    try {
        const { id } = req.params;

        const [destinations] = await pool.query('SELECT * FROM destinations WHERE id = ? AND deleted_at IS NULL', [id]);
        if (destinations.length === 0) {
            return res.status(404).json({ success: false, message: 'Destination not found.' });
        }

        const destination = destinations[0];

        // Fetch associated packages
        const [packages] = await pool.query('SELECT * FROM packages WHERE destination_id = ?', [id]);
        destination.packages = packages;

        // Fetch reviews
        const [reviews] = await pool.query(`
            SELECT r.*, u.name as user_name, u.avatar_url 
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.destination_id = ?
            ORDER BY r.created_at DESC
        `, [id]);
        destination.reviews = reviews;

        // Fetch Relational Master Entities for this Destination:
        // 1. Hotels
        const [hotels] = await pool.query('SELECT * FROM hotels WHERE destination_id = ? AND status != "deleted"', [id]);
        // 2. Restaurants
        const [restaurants] = await pool.query('SELECT * FROM restaurants WHERE destination_id = ?', [id]);
        // 3. Foods
        const [foods] = await pool.query('SELECT * FROM foods WHERE destination_id = ?', [id]);
        // 4. Transportation
        const [transport] = await pool.query('SELECT * FROM transportation WHERE destination_id = ?', [id]);
        // 5. Local Transportation
        const [local_transport] = await pool.query('SELECT * FROM local_transportation WHERE destination_id = ?', [id]);
        // 6. Attractions
        const [attractions] = await pool.query('SELECT * FROM attractions WHERE destination_id = ?', [id]);
        // 7. Activities
        const [activities] = await pool.query('SELECT * FROM activities WHERE destination_id = ?', [id]);
        // 8. Tour Guides
        const [guides] = await pool.query('SELECT * FROM tour_guides WHERE destination_id = ?', [id]);

        destination.inventory = {
            hotels,
            restaurants,
            foods,
            transport,
            local_transport,
            attractions,
            activities,
            guides
        };

        const totalItems = hotels.length + restaurants.length + foods.length + transport.length +
            local_transport.length + attractions.length + activities.length + guides.length;

        destination.inventoryCounts = {
            hotels: hotels.length,
            restaurants: restaurants.length,
            foods: foods.length,
            transport: transport.length,
            local_transport: local_transport.length,
            attractions: attractions.length,
            activities: activities.length,
            guides: guides.length,
            total: totalItems
        };

        return res.json({ success: true, destination });
    } catch (error) {
        console.error('Error fetching destination details:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch destination details.' });
    }
};

// 3. Get destination inventory with filtering & pagination
exports.getDestinationInventory = async (req, res) => {
    try {
        const { id } = req.params;
        const { type, search } = req.query;

        const results = {};
        const fetchAll = !type || type === 'all' || type === 'overview';

        if (fetchAll || type === 'hotels') {
            let sql = 'SELECT * FROM hotels WHERE destination_id = ?';
            const params = [id];
            if (search) {
                sql += ' AND (name_en LIKE ? OR hotel_code LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }
            const [rows] = await pool.query(sql, params);
            results.hotels = rows;
        }

        if (fetchAll || type === 'restaurants') {
            let sql = 'SELECT * FROM restaurants WHERE destination_id = ?';
            const params = [id];
            if (search) {
                sql += ' AND (name_en LIKE ? OR restaurant_code LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }
            const [rows] = await pool.query(sql, params);
            results.restaurants = rows;
        }

        if (fetchAll || type === 'foods') {
            let sql = 'SELECT * FROM foods WHERE destination_id = ?';
            const params = [id];
            if (search) {
                sql += ' AND (name_en LIKE ? OR food_code LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }
            const [rows] = await pool.query(sql, params);
            results.foods = rows;
        }

        if (fetchAll || type === 'transport') {
            let sql = 'SELECT * FROM transportation WHERE destination_id = ?';
            const params = [id];
            if (search) {
                sql += ' AND (title_en LIKE ? OR service_code LIKE ? OR provider_name LIKE ?)';
                params.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }
            const [rows] = await pool.query(sql, params);
            results.transport = rows;
        }

        if (fetchAll || type === 'local_transport') {
            let sql = 'SELECT * FROM local_transportation WHERE destination_id = ?';
            const params = [id];
            if (search) {
                sql += ' AND (vehicle_type LIKE ? OR service_code LIKE ? OR provider_name LIKE ?)';
                params.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }
            const [rows] = await pool.query(sql, params);
            results.local_transport = rows;
        }

        if (fetchAll || type === 'attractions') {
            let sql = 'SELECT * FROM attractions WHERE destination_id = ?';
            const params = [id];
            if (search) {
                sql += ' AND (name_en LIKE ? OR attraction_code LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }
            const [rows] = await pool.query(sql, params);
            results.attractions = rows;
        }

        if (fetchAll || type === 'activities') {
            let sql = 'SELECT * FROM activities WHERE destination_id = ?';
            const params = [id];
            if (search) {
                sql += ' AND (name_en LIKE ? OR activity_code LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }
            const [rows] = await pool.query(sql, params);
            results.activities = rows;
        }

        if (fetchAll || type === 'guides') {
            let sql = 'SELECT * FROM tour_guides WHERE destination_id = ?';
            const params = [id];
            if (search) {
                sql += ' AND (name LIKE ? OR guide_code LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }
            const [rows] = await pool.query(sql, params);
            results.guides = rows;
        }

        // Summary counts
        const [h] = await pool.query('SELECT COUNT(*) as c FROM hotels WHERE destination_id = ?', [id]);
        const [r] = await pool.query('SELECT COUNT(*) as c FROM restaurants WHERE destination_id = ?', [id]);
        const [f] = await pool.query('SELECT COUNT(*) as c FROM foods WHERE destination_id = ?', [id]);
        const [t] = await pool.query('SELECT COUNT(*) as c FROM transportation WHERE destination_id = ?', [id]);
        const [lt] = await pool.query('SELECT COUNT(*) as c FROM local_transportation WHERE destination_id = ?', [id]);
        const [a] = await pool.query('SELECT COUNT(*) as c FROM attractions WHERE destination_id = ?', [id]);
        const [act] = await pool.query('SELECT COUNT(*) as c FROM activities WHERE destination_id = ?', [id]);
        const [g] = await pool.query('SELECT COUNT(*) as c FROM tour_guides WHERE destination_id = ?', [id]);

        const counts = {
            hotels: h[0].c,
            restaurants: r[0].c,
            foods: f[0].c,
            transport: t[0].c,
            local_transport: lt[0].c,
            attractions: a[0].c,
            activities: act[0].c,
            guides: g[0].c,
            total: h[0].c + r[0].c + f[0].c + t[0].c + lt[0].c + a[0].c + act[0].c + g[0].c
        };

        return res.json({ success: true, counts, inventory: results });
    } catch (error) {
        console.error('Error fetching inventory:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch inventory.' });
    }
};

// 4. Create new inventory item directly under a destination ("+ Add New" in-place)
exports.createInventoryItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.params; // hotel, restaurant, food, transport, local_transport, attraction, activity, guide
        const data = req.body;

        // Verify destination exists
        const [dest] = await pool.query('SELECT id, name_en, city, country FROM destinations WHERE id = ?', [id]);
        if (dest.length === 0) {
            return res.status(404).json({ success: false, message: 'Destination not found.' });
        }
        const destination = dest[0];

        let insertId;
        let itemCode;

        if (type === 'hotel') {
            itemCode = data.hotel_code || ('H-' + Math.floor(1000 + Math.random() * 9000));
            const [result] = await pool.query(`
                INSERT INTO hotels (
                    destination_id, hotel_code, name_en, star_rating, hotel_type, area_name,
                    city, country, address, phone, email, cover_image, tier, base_price,
                    selling_price, amenities_json, description_en, short_desc_en, map_embed_code,
                    chain, brand, is_active, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
            `, [
                id, itemCode, data.name_en, data.star_rating || 3, data.hotel_type || 'Hotel',
                data.area_name || destination.city, destination.city, destination.country,
                data.address || null, data.phone || null, data.email || null,
                data.cover_image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
                data.tier || 'standard', data.base_price || 0, data.selling_price || 0,
                data.amenities_json || 'WiFi,Swimming Pool', data.description_en || null,
                data.short_desc_en || null, data.map_embed_code || null,
                data.chain || null, data.brand || null, data.status || 'active'
            ]);
            insertId = result.insertId;

        } else if (type === 'restaurant') {
            itemCode = data.restaurant_code || ('R-' + Math.floor(1000 + Math.random() * 9000));
            const [result] = await pool.query(`
                INSERT INTO restaurants (
                    destination_id, restaurant_code, name_en, cuisine_type, price_level,
                    is_halal, is_vegetarian, is_vegan, is_family_friendly, description_en,
                    short_desc_en, address, map_embed_code, phone, website, opening_hours,
                    image_url, rating, is_active, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
            `, [
                id, itemCode, data.name_en, data.cuisine_type || 'Local', data.price_level || 'standard',
                data.is_halal ? 1 : 0, data.is_vegetarian ? 1 : 0, data.is_vegan ? 1 : 0,
                data.is_family_friendly ? 1 : 0, data.description_en || null, data.short_desc_en || null,
                data.address || null, data.map_embed_code || null, data.phone || null, data.website || null,
                data.opening_hours || null, data.image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
                data.rating || 4.7, data.status || 'active'
            ]);
            insertId = result.insertId;

        } else if (type === 'food') {
            itemCode = data.food_code || ('F-' + Math.floor(1000 + Math.random() * 9000));
            const [result] = await pool.query(`
                INSERT INTO foods (
                    destination_id, food_code, name_en, local_name, category, cuisine,
                    is_halal, is_vegetarian, is_vegan, spicy_level, price_range, where_to_find,
                    description_en, image_url, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                id, itemCode, data.name_en, data.local_name || null, data.category || 'Specialty',
                data.cuisine || 'Local', data.is_halal ? 1 : 0, data.is_vegetarian ? 1 : 0,
                data.is_vegan ? 1 : 0, data.spicy_level || 'Medium', data.price_range || null,
                data.where_to_find || null, data.description_en || null,
                data.image_url || 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80',
                data.status || 'active'
            ]);
            insertId = result.insertId;

        } else if (type === 'transport') {
            itemCode = data.service_code || ('T-' + Math.floor(1000 + Math.random() * 9000));
            const [result] = await pool.query(`
                INSERT INTO transportation (
                    destination_id, service_code, title_en, vehicle_type, service_type,
                    city, country, capacity_passengers, base_price, selling_price, image_url,
                    provider_name, route_name, origin, destination, duration, class_type,
                    baggage_allowance, booking_requirement, cancellation_policy, contact_phone,
                    description_en, is_active, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
            `, [
                id, itemCode, data.title_en || data.service_name || 'Transit Service',
                data.vehicle_type || 'bus', data.service_type || 'intercity',
                destination.city, destination.country, data.capacity_passengers || 40,
                data.base_price || 0, data.selling_price || 0,
                data.image_url || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
                data.provider_name || 'Transport Provider', data.route_name || null,
                data.origin || 'Dhaka', data.destination || destination.city,
                data.duration || null, data.class_type || 'Economy', data.baggage_allowance || null,
                data.booking_requirement || null, data.cancellation_policy || null, data.contact_phone || null,
                data.description_en || null, data.status || 'active'
            ]);
            insertId = result.insertId;

        } else if (type === 'local_transport') {
            itemCode = data.service_code || ('LT-' + Math.floor(1000 + Math.random() * 9000));
            const [result] = await pool.query(`
                INSERT INTO local_transportation (
                    destination_id, service_code, provider_name, vehicle_type, vehicle_model,
                    capacity, is_ac, driver_included, fuel_included, hourly_rate, daily_rate,
                    per_trip_rate, airport_transfer_rate, service_area, operating_hours,
                    contact_phone, booking_method, cancellation_policy, image_url, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                id, itemCode, data.provider_name || 'Local Driver', data.vehicle_type || 'CNG',
                data.vehicle_model || null, data.capacity || 4, data.is_ac ? 1 : 0,
                data.driver_included ? 1 : 0, data.fuel_included ? 1 : 0, data.hourly_rate || 0,
                data.daily_rate || 0, data.per_trip_rate || 0, data.airport_transfer_rate || 0,
                data.service_area || destination.city, data.operating_hours || '24 Hours',
                data.contact_phone || null, data.booking_method || 'Direct', data.cancellation_policy || null,
                data.image_url || 'https://images.unsplash.com/photo-1596707324310-a94f6f437021?auto=format&fit=crop&w=600&q=80',
                data.status || 'active'
            ]);
            insertId = result.insertId;

        } else if (type === 'attraction') {
            itemCode = data.attraction_code || ('A-' + Math.floor(1000 + Math.random() * 9000));
            const [result] = await pool.query(`
                INSERT INTO attractions (
                    destination_id, attraction_code, name_en, category, distance_km, travel_time_min,
                    image_url, rating, description_en, short_desc_en, entry_fee_bdt, entry_fee_usd,
                    opening_hours, best_time, recommended_duration, is_family_friendly,
                    is_wheelchair_friendly, is_photography_allowed, address, map_embed_code, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                id, itemCode, data.name_en, data.category || 'Sightseeing', data.distance_km || 0,
                data.travel_time_min || 0,
                data.image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
                data.rating || 4.8, data.description_en || null, data.short_desc_en || null,
                data.entry_fee_bdt || 0, data.entry_fee_usd || 0, data.opening_hours || 'Open 24/7',
                data.best_time || null, data.recommended_duration || '2 Hours',
                data.is_family_friendly ? 1 : 0, data.is_wheelchair_friendly ? 1 : 0,
                data.is_photography_allowed ? 1 : 0, data.address || null, data.map_embed_code || null,
                data.status || 'active'
            ]);
            insertId = result.insertId;

        } else if (type === 'activity') {
            itemCode = data.activity_code || ('ACT-' + Math.floor(1000 + Math.random() * 9000));
            const [result] = await pool.query(`
                INSERT INTO activities (
                    destination_id, activity_code, name_en, category, duration_hours, difficulty_level,
                    min_age, image_url, description_en, short_desc_en, price_bdt, price_usd, price_type,
                    min_participants, max_participants, is_guide_included, is_pickup_available,
                    is_cancellation_allowed, included_items, excluded_items, required_equipment,
                    is_active, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
            `, [
                id, itemCode, data.name_en, data.category || 'Adventure', data.duration_hours || 2.0,
                data.difficulty_level || 'easy', data.min_age || 0,
                data.image_url || 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=600&q=80',
                data.description_en || null, data.short_desc_en || null, data.price_bdt || 0,
                data.price_usd || 0, data.price_type || 'Per Person', data.min_participants || 1,
                data.max_participants || 10, data.is_guide_included ? 1 : 0, data.is_pickup_available ? 1 : 0,
                data.is_cancellation_allowed ? 1 : 0, data.included_items || null, data.excluded_items || null,
                data.required_equipment || null, data.status || 'active'
            ]);
            insertId = result.insertId;

        } else if (type === 'guide') {
            itemCode = data.guide_code || ('G-' + Math.floor(1000 + Math.random() * 9000));
            const [result] = await pool.query(`
                INSERT INTO tour_guides (
                    destination_id, guide_code, name, languages, specialization, experience_years,
                    certification, daily_rate, hourly_rate, price_type, availability_status,
                    contact_phone, contact_email, rating, profile_photo, bio, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                id, itemCode, data.name, data.languages || 'Bengali, English',
                data.specialization || 'Local Tour Guide', data.experience_years || 3,
                data.certification || null, data.daily_rate || 2000, data.hourly_rate || 300,
                data.price_type || 'Per Day', data.availability_status || 'available',
                data.contact_phone || null, data.contact_email || null, data.rating || 4.8,
                data.profile_photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
                data.bio || null, data.status || 'active'
            ]);
            insertId = result.insertId;

        } else {
            return res.status(400).json({ success: false, message: `Unknown inventory type "${type}".` });
        }

        // Link in junction table as primary
        await pool.query(`
            INSERT IGNORE INTO destination_inventory_links (destination_id, inventory_type, inventory_id, is_primary, status)
            VALUES (?, ?, ?, 1, 'active')
        `, [id, type, insertId]);

        return res.status(201).json({
            success: true,
            message: `${type.toUpperCase()} created and linked to ${destination.name_en} successfully!`,
            id: insertId,
            item_code: itemCode
        });
    } catch (error) {
        console.error('Error creating inventory item:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to create inventory item.' });
    }
};

// 5. Delete or unlink inventory item
exports.deleteInventoryItem = async (req, res) => {
    try {
        const { id, type, itemId } = req.params;

        const tableMap = {
            hotel: 'hotels',
            restaurant: 'restaurants',
            food: 'foods',
            transport: 'transportation',
            local_transport: 'local_transportation',
            attraction: 'attractions',
            activity: 'activities',
            guide: 'tour_guides'
        };

        const targetTable = tableMap[type];
        if (!targetTable) {
            return res.status(400).json({ success: false, message: 'Invalid inventory type.' });
        }

        await pool.query(`DELETE FROM ${targetTable} WHERE id = ? AND destination_id = ?`, [itemId, id]);
        await pool.query(`DELETE FROM destination_inventory_links WHERE destination_id = ? AND inventory_type = ? AND inventory_id = ?`, [id, type, itemId]);

        return res.json({ success: true, message: `Inventory item deleted successfully.` });
    } catch (error) {
        console.error('Delete inventory error:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete inventory item.' });
    }
};

// 6. Link existing item (Many-to-Many support)
exports.linkExistingInventory = async (req, res) => {
    try {
        const { id } = req.params;
        const { inventory_type, inventory_id } = req.body;

        if (!inventory_type || !inventory_id) {
            return res.status(400).json({ success: false, message: 'Inventory type and ID are required.' });
        }

        await pool.query(`
            INSERT INTO destination_inventory_links (destination_id, inventory_type, inventory_id, is_primary, status)
            VALUES (?, ?, ?, 0, 'active')
            ON DUPLICATE KEY UPDATE status = 'active'
        `, [id, inventory_type, inventory_id]);

        return res.json({ success: true, message: 'Existing service linked to destination successfully!' });
    } catch (error) {
        console.error('Link inventory error:', error);
        return res.status(500).json({ success: false, message: 'Failed to link inventory item.' });
    }
};

// 7. Location Lookups & Inline Creation ("+ Add New" Dropdowns)
exports.getCountries = async (req, res) => {
    try {
        const [countries] = await pool.query('SELECT * FROM countries WHERE status = "active" ORDER BY name ASC');
        return res.json({ success: true, countries });
    } catch (error) {
        console.error('Get countries error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch countries.' });
    }
};

exports.createCountry = async (req, res) => {
    try {
        const { name, code, currency_name, currency_code, timezone, flag_emoji } = req.body;
        if (!name || !code) {
            return res.status(400).json({ success: false, message: 'Country name and code are required.' });
        }

        const [result] = await pool.query(`
            INSERT INTO countries (name, code, currency_name, currency_code, timezone, flag_emoji, status)
            VALUES (?, ?, ?, ?, ?, ?, 'active')
        `, [
            name.trim(),
            code.trim().toUpperCase(),
            currency_name || 'USD',
            currency_code || 'USD',
            timezone || 'UTC',
            flag_emoji || '🌍'
        ]);

        return res.status(201).json({
            success: true,
            message: `Country "${name}" added successfully!`,
            country: {
                id: result.insertId,
                name,
                code: code.toUpperCase(),
                currency_name,
                currency_code,
                timezone,
                flag_emoji: flag_emoji || '🌍'
            }
        });
    } catch (error) {
        console.error('Create country error:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to create country.' });
    }
};

exports.getDivisions = async (req, res) => {
    try {
        const { country_id, country_name } = req.query;
        let sql = 'SELECT * FROM divisions_states WHERE status = "active"';
        const params = [];

        if (country_id) {
            sql += ' AND country_id = ?';
            params.push(country_id);
        } else if (country_name) {
            sql += ' AND country_name = ?';
            params.push(country_name);
        }

        sql += ' ORDER BY name ASC';
        const [divisions] = await pool.query(sql, params);
        return res.json({ success: true, divisions });
    } catch (error) {
        console.error('Get divisions error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch divisions.' });
    }
};

exports.createDivision = async (req, res) => {
    try {
        const { country_id, country_name, name, type } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: 'Division/State name is required.' });
        }

        const [result] = await pool.query(`
            INSERT INTO divisions_states (country_id, country_name, name, type, status)
            VALUES (?, ?, ?, ?, 'active')
        `, [country_id || 1, country_name || 'Bangladesh', name.trim(), type || 'Division']);

        return res.status(201).json({
            success: true,
            message: `Division/State "${name}" added successfully!`,
            division: {
                id: result.insertId,
                country_id,
                country_name,
                name: name.trim(),
                type: type || 'Division'
            }
        });
    } catch (error) {
        console.error('Create division error:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to create division.' });
    }
};

exports.getCities = async (req, res) => {
    try {
        const { country_id, division_id } = req.query;
        let sql = 'SELECT * FROM cities WHERE status = "active"';
        const params = [];

        if (division_id) {
            sql += ' AND division_id = ?';
            params.push(division_id);
        } else if (country_id) {
            sql += ' AND country_id = ?';
            params.push(country_id);
        }

        sql += ' ORDER BY name ASC';
        const [cities] = await pool.query(sql, params);
        return res.json({ success: true, cities });
    } catch (error) {
        console.error('Get cities error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch cities.' });
    }
};

exports.createCity = async (req, res) => {
    try {
        const { country_id, division_id, name } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: 'City name is required.' });
        }

        const [result] = await pool.query(`
            INSERT INTO cities (country_id, division_id, name, status)
            VALUES (?, ?, ?, 'active')
        `, [country_id || 1, division_id || null, name.trim()]);

        return res.status(201).json({
            success: true,
            message: `City "${name}" added successfully!`,
            city: {
                id: result.insertId,
                country_id,
                division_id,
                name: name.trim()
            }
        });
    } catch (error) {
        console.error('Create city error:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to create city.' });
    }
};

exports.getCategories = async (req, res) => {
    try {
        const [categories] = await pool.query('SELECT MIN(id) as id, name_en, MAX(name_bn) as name_bn, MAX(icon) as icon FROM destination_categories WHERE name_en IS NOT NULL AND name_en != "" GROUP BY name_en ORDER BY name_en ASC');
        return res.json({ success: true, categories });
    } catch (error) {
        console.error('Get categories error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { name_en, name_bn, icon } = req.body;
        if (!name_en) {
            return res.status(400).json({ success: false, message: 'Category name is required.' });
        }

        const [result] = await pool.query(`
            INSERT INTO destination_categories (name_en, name_bn, icon, is_active)
            VALUES (?, ?, ?, 1)
        `, [name_en.trim(), name_bn || name_en.trim(), icon || '📍']);

        return res.status(201).json({
            success: true,
            message: `Category "${name_en}" created successfully!`,
            category: { id: result.insertId, name_en, name_bn: name_bn || name_en, icon: icon || '📍' }
        });
    } catch (error) {
        console.error('Create category error:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to create category.' });
    }
};

exports.getDurations = async (req, res) => {
    try {
        const [durations] = await pool.query('SELECT * FROM destination_durations ORDER BY days ASC');
        return res.json({ success: true, durations });
    } catch (error) {
        console.error('Get durations error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch durations.' });
    }
};

exports.createDuration = async (req, res) => {
    try {
        const { days, nights } = req.body;
        const d = parseInt(days) || 1;
        const n = parseInt(nights) || 0;
        const label = n > 0 ? `${d} Days / ${n} Night${n > 1 ? 's' : ''}` : `${d} Day${d > 1 ? 's' : ''}`;

        const [result] = await pool.query(`
            INSERT INTO destination_durations (days, nights, label)
            VALUES (?, ?, ?)
        `, [d, n, label]);

        return res.status(201).json({
            success: true,
            message: `Duration "${label}" created successfully!`,
            duration: { id: result.insertId, days: d, nights: n, label }
        });
    } catch (error) {
        console.error('Create duration error:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to create duration.' });
    }
};

// 8. Validation before publishing
exports.validateDestination = async (req, res) => {
    try {
        const { slug, destination_code, name_en, city, current_id } = req.body;
        const warnings = [];

        if (slug) {
            let sql = 'SELECT id FROM destinations WHERE slug = ? AND deleted_at IS NULL';
            const params = [slug];
            if (current_id) {
                sql += ' AND id != ?';
                params.push(current_id);
            }
            const [dups] = await pool.query(sql, params);
            if (dups.length > 0) warnings.push(`Slug "${slug}" already exists in another destination.`);
        }

        if (destination_code) {
            let sql = 'SELECT id FROM destinations WHERE destination_code = ? AND deleted_at IS NULL';
            const params = [destination_code];
            if (current_id) {
                sql += ' AND id != ?';
                params.push(current_id);
            }
            const [dups] = await pool.query(sql, params);
            if (dups.length > 0) warnings.push(`Destination Code "${destination_code}" is already assigned.`);
        }

        if (name_en && city) {
            let sql = 'SELECT id FROM destinations WHERE name_en = ? AND city = ? AND deleted_at IS NULL';
            const params = [name_en, city];
            if (current_id) {
                sql += ' AND id != ?';
                params.push(current_id);
            }
            const [dups] = await pool.query(sql, params);
            if (dups.length > 0) warnings.push(`A destination with name "${name_en}" already exists in city "${city}".`);
        }

        return res.json({
            success: true,
            isValid: warnings.length === 0,
            warnings
        });
    } catch (error) {
        console.error('Validation error:', error);
        return res.status(500).json({ success: false, message: 'Validation failed.' });
    }
};

// 9. Save Draft Destination
exports.saveDestinationDraft = async (req, res) => {
    try {
        const body = req.body;
        body.status = 'draft';
        if (body.id) {
            req.params.id = body.id;
            return exports.updateDestination(req, res);
        } else {
            return exports.createDestination(req, res);
        }
    } catch (error) {
        console.error('Save draft error:', error);
        return res.status(500).json({ success: false, message: 'Failed to save draft.' });
    }
};

// 10. Admin: Create new destination (Master 6-Step Payload)
exports.createDestination = async (req, res) => {
    try {
        const {
            name_en, name_bn, slug, destination_code, travel_type,
            country, division_state, city, category,
            description_en, description_bn, short_desc_en,
            price_bdt, price_usd, latitude, longitude, map_embed_code,
            image_url, gallery_images, best_time_en, average_duration,
            timezone, currency_code, passport_notes, visa_required,
            visa_type, visa_processing_time, entry_requirements,
            is_featured, is_trending, status, visibility,
            is_homepage_show, is_search_show, is_booking_enabled,
            is_custom_trip_enabled, is_recommendation_enabled, is_review_enabled,
            seo_title, meta_description, meta_keywords, canonical_slug,
            social_share_image, recommended_for, tags, additional_info_json,
            image_roles_json
        } = req.body;

        if (!name_en || !country) {
            return res.status(400).json({ success: false, message: 'Destination Name and Country are required.' });
        }

        const generatedCode = destination_code || ('DST-' + Math.floor(1000 + Math.random() * 9000));
        const generatedSlug = slug || name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const [result] = await pool.query(`
            INSERT INTO destinations (
                name_en, name_bn, slug, destination_code, travel_type,
                country, division_state, city, category,
                description_en, description_bn, short_desc_en,
                price_bdt, price_usd, latitude, longitude, map_embed_code,
                image_url, gallery_images, best_time_en, average_duration,
                timezone, currency_code, passport_notes, visa_required,
                visa_type, visa_processing_time, entry_requirements,
                is_featured, is_trending, status, visibility,
                is_homepage_show, is_search_show, is_booking_enabled,
                is_custom_trip_enabled, is_recommendation_enabled, is_review_enabled,
                seo_title, meta_description, meta_keywords, canonical_slug,
                social_share_image, recommended_for, tags, additional_info_json,
                image_roles_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            name_en, name_bn || name_en, generatedSlug, generatedCode, travel_type || 'domestic',
            country, division_state || null, city || null, category || 'Beach',
            description_en || null, description_bn || null, short_desc_en || null,
            price_bdt || 0, price_usd || 0, latitude || 0, longitude || 0, map_embed_code || null,
            image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
            gallery_images ? (typeof gallery_images === 'string' ? gallery_images : JSON.stringify(gallery_images)) : null,
            best_time_en || null, average_duration || '3 Days 2 Nights',
            timezone || 'Asia/Dhaka', currency_code || 'BDT',
            passport_notes || null, visa_required ? 1 : 0,
            visa_type || null, visa_processing_time || null, entry_requirements || null,
            is_featured ? 1 : 0, is_trending ? 1 : 0, status || 'active', visibility || 'public',
            is_homepage_show !== undefined ? (is_homepage_show ? 1 : 0) : 1,
            is_search_show !== undefined ? (is_search_show ? 1 : 0) : 1,
            is_booking_enabled !== undefined ? (is_booking_enabled ? 1 : 0) : 1,
            is_custom_trip_enabled !== undefined ? (is_custom_trip_enabled ? 1 : 0) : 1,
            is_recommendation_enabled !== undefined ? (is_recommendation_enabled ? 1 : 0) : 1,
            is_review_enabled !== undefined ? (is_review_enabled ? 1 : 0) : 1,
            seo_title || null, meta_description || null, meta_keywords || null, canonical_slug || null,
            social_share_image || null,
            recommended_for ? (typeof recommended_for === 'string' ? recommended_for : JSON.stringify(recommended_for)) : null,
            tags ? (typeof tags === 'string' ? tags : JSON.stringify(tags)) : null,
            additional_info_json ? (typeof additional_info_json === 'string' ? additional_info_json : JSON.stringify(additional_info_json)) : null,
            image_roles_json ? (typeof image_roles_json === 'string' ? image_roles_json : JSON.stringify(image_roles_json)) : null
        ]);

        return res.status(201).json({
            success: true,
            message: `Destination "${name_en}" created successfully!`,
            id: result.insertId,
            destination_code: generatedCode,
            slug: generatedSlug
        });
    } catch (error) {
        console.error('Create destination error:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to create destination.' });
    }
};

// 11. Admin: Update destination
exports.updateDestination = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name_en, name_bn, slug, destination_code, travel_type,
            country, division_state, city, category,
            description_en, description_bn, short_desc_en,
            price_bdt, price_usd, latitude, longitude, map_embed_code,
            image_url, gallery_images, best_time_en, average_duration,
            timezone, currency_code, passport_notes, visa_required,
            visa_type, visa_processing_time, entry_requirements,
            is_featured, is_trending, status, visibility,
            is_homepage_show, is_search_show, is_booking_enabled,
            is_custom_trip_enabled, is_recommendation_enabled, is_review_enabled,
            seo_title, meta_description, meta_keywords, canonical_slug,
            social_share_image, recommended_for, tags, additional_info_json,
            image_roles_json
        } = req.body;

        const [existing] = await pool.query('SELECT id FROM destinations WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Destination not found.' });
        }

        await pool.query(`
            UPDATE destinations SET
                name_en = COALESCE(?, name_en),
                name_bn = COALESCE(?, name_bn),
                slug = COALESCE(?, slug),
                destination_code = COALESCE(?, destination_code),
                travel_type = COALESCE(?, travel_type),
                country = COALESCE(?, country),
                division_state = COALESCE(?, division_state),
                city = COALESCE(?, city),
                category = COALESCE(?, category),
                description_en = COALESCE(?, description_en),
                description_bn = COALESCE(?, description_bn),
                short_desc_en = COALESCE(?, short_desc_en),
                price_bdt = COALESCE(?, price_bdt),
                price_usd = COALESCE(?, price_usd),
                latitude = COALESCE(?, latitude),
                longitude = COALESCE(?, longitude),
                map_embed_code = COALESCE(?, map_embed_code),
                image_url = COALESCE(?, image_url),
                gallery_images = COALESCE(?, gallery_images),
                best_time_en = COALESCE(?, best_time_en),
                average_duration = COALESCE(?, average_duration),
                timezone = COALESCE(?, timezone),
                currency_code = COALESCE(?, currency_code),
                passport_notes = COALESCE(?, passport_notes),
                visa_required = COALESCE(?, visa_required),
                visa_type = COALESCE(?, visa_type),
                visa_processing_time = COALESCE(?, visa_processing_time),
                entry_requirements = COALESCE(?, entry_requirements),
                is_featured = COALESCE(?, is_featured),
                is_trending = COALESCE(?, is_trending),
                status = COALESCE(?, status),
                visibility = COALESCE(?, visibility),
                is_homepage_show = COALESCE(?, is_homepage_show),
                is_search_show = COALESCE(?, is_search_show),
                is_booking_enabled = COALESCE(?, is_booking_enabled),
                is_custom_trip_enabled = COALESCE(?, is_custom_trip_enabled),
                is_recommendation_enabled = COALESCE(?, is_recommendation_enabled),
                is_review_enabled = COALESCE(?, is_review_enabled),
                seo_title = COALESCE(?, seo_title),
                meta_description = COALESCE(?, meta_description),
                meta_keywords = COALESCE(?, meta_keywords),
                canonical_slug = COALESCE(?, canonical_slug),
                social_share_image = COALESCE(?, social_share_image),
                recommended_for = COALESCE(?, recommended_for),
                tags = COALESCE(?, tags),
                additional_info_json = COALESCE(?, additional_info_json),
                image_roles_json = COALESCE(?, image_roles_json)
            WHERE id = ?
        `, [
            name_en, name_bn, slug, destination_code, travel_type,
            country, division_state, city, category,
            description_en, description_bn, short_desc_en,
            price_bdt, price_usd, latitude, longitude, map_embed_code,
            image_url, gallery_images ? (typeof gallery_images === 'string' ? gallery_images : JSON.stringify(gallery_images)) : null,
            best_time_en, average_duration, timezone, currency_code,
            passport_notes, visa_required !== undefined ? (visa_required ? 1 : 0) : null,
            visa_type, visa_processing_time, entry_requirements,
            is_featured !== undefined ? (is_featured ? 1 : 0) : null,
            is_trending !== undefined ? (is_trending ? 1 : 0) : null,
            status, visibility,
            is_homepage_show !== undefined ? (is_homepage_show ? 1 : 0) : null,
            is_search_show !== undefined ? (is_search_show ? 1 : 0) : null,
            is_booking_enabled !== undefined ? (is_booking_enabled ? 1 : 0) : null,
            is_custom_trip_enabled !== undefined ? (is_custom_trip_enabled ? 1 : 0) : null,
            is_recommendation_enabled !== undefined ? (is_recommendation_enabled ? 1 : 0) : null,
            is_review_enabled !== undefined ? (is_review_enabled ? 1 : 0) : null,
            seo_title, meta_description, meta_keywords, canonical_slug,
            social_share_image,
            recommended_for ? (typeof recommended_for === 'string' ? recommended_for : JSON.stringify(recommended_for)) : null,
            tags ? (typeof tags === 'string' ? tags : JSON.stringify(tags)) : null,
            additional_info_json ? (typeof additional_info_json === 'string' ? additional_info_json : JSON.stringify(additional_info_json)) : null,
            image_roles_json ? (typeof image_roles_json === 'string' ? image_roles_json : JSON.stringify(image_roles_json)) : null,
            id
        ]);

        return res.json({ success: true, message: `Destination #${id} updated successfully.` });
    } catch (error) {
        console.error('Update destination error:', error);
        return res.status(500).json({ success: false, message: 'Failed to update destination.' });
    }
};

// 12. Admin: Toggle Destination Status
exports.toggleDestinationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const [dest] = await pool.query('SELECT id, status FROM destinations WHERE id = ?', [id]);
        if (dest.length === 0) {
            return res.status(404).json({ success: false, message: 'Destination not found.' });
        }

        const newStatus = dest[0].status === 'active' ? 'inactive' : 'active';
        await pool.query('UPDATE destinations SET status = ? WHERE id = ?', [newStatus, id]);

        return res.json({ success: true, message: `Destination status changed to ${newStatus}.`, newStatus });
    } catch (error) {
        console.error('Toggle destination status error:', error);
        return res.status(500).json({ success: false, message: 'Failed to toggle status.' });
    }
};

// 13. Admin: Soft Delete / Archive destination
exports.deleteDestination = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE destinations SET deleted_at = CURRENT_TIMESTAMP, status = "inactive" WHERE id = ?', [id]);
        return res.json({ success: true, message: `Destination #${id} archived successfully.` });
    } catch (error) {
        console.error('Delete destination error:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete destination.' });
    }
};

// 14. Add a review
exports.addReview = async (req, res) => {
    try {
        const { destination_id, rating, comment } = req.body;
        const user_id = req.user.id;

        if (!destination_id || !rating || !comment) {
            return res.status(400).json({ success: false, message: 'Rating, comment, and destination ID are required.' });
        }

        await pool.query(
            'INSERT INTO reviews (user_id, destination_id, rating, comment) VALUES (?, ?, ?, ?)',
            [user_id, destination_id, rating, comment]
        );

        const [avgResult] = await pool.query(
            'SELECT AVG(rating) as avgRating FROM reviews WHERE destination_id = ?',
            [destination_id]
        );
        const newRating = parseFloat(avgResult[0].avgRating || 4.8).toFixed(1);

        await pool.query('UPDATE destinations SET rating = ? WHERE id = ?', [newRating, destination_id]);

        return res.status(201).json({ success: true, message: 'Review submitted successfully!' });
    } catch (error) {
        console.error('Error adding review:', error);
        return res.status(500).json({ success: false, message: 'Failed to submit review.' });
    }
};
