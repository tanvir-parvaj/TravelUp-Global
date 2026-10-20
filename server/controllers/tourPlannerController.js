const { pool } = require('../config/db');

/**
 * Get Tour Planner Inventory from MySQL Database
 * Query params: destination (optional), slot_key (optional)
 */
exports.getInventory = async (req, res) => {
    try {
        const { destination, slot_key } = req.query;

        let query = 'SELECT * FROM tour_planner_inventory WHERE is_active = 1';
        const params = [];

        if (destination && destination !== 'all') {
            query += ' AND (destination_slug = ? OR destination_slug = "all")';
            params.push(destination);
        }

        if (slot_key) {
            query += ' AND slot_key = ?';
            params.push(slot_key);
        }

        query += ' ORDER BY slot_key ASC, price ASC';

        const [rows] = await pool.query(query, params);

        // Group rows by slot_key for immediate consumption by the PC Builder UI
        const groupedInventory = {};
        rows.forEach(row => {
            if (!groupedInventory[row.slot_key]) {
                groupedInventory[row.slot_key] = [];
            }

            let parsedDetails = null;
            if (row.details_json) {
                try {
                    parsedDetails = JSON.parse(row.details_json);
                } catch (e) {
                    parsedDetails = null;
                }
            }

            groupedInventory[row.slot_key].push({
                id: row.id,
                name: row.name,
                sub: row.sub,
                price: parseFloat(row.price),
                img: row.img,
                hasSeats: Boolean(row.has_seats),
                hasRooms: Boolean(row.has_rooms),
                bogie: row.bogie,
                scenario: row.scenario_tag,
                destination: row.destination_slug,
                details: parsedDetails
            });
        });

        return res.json({
            success: true,
            count: rows.length,
            inventory: groupedInventory
        });
    } catch (error) {
        console.error('Error fetching tour planner inventory:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve database inventory',
            error: error.message
        });
    }
};

/**
 * Save Trip / Book Custom Itinerary into MySQL Database
 */
exports.saveTrip = async (req, res) => {
    try {
        const {
            trip_type = 'round_trip',
            origin_upazila,
            destination_slug,
            departure_date,
            return_date,
            travelers_count = 1,
            adults_count = 1,
            children_count = 0,
            infants_count = 0,
            grand_total,
            per_person_cost,
            lead_name,
            lead_phone,
            lead_email,
            emergency_phone,
            dietary_notes,
            payment_method = 'bKash',
            components_data
        } = req.body;

        if (!origin_upazila || !destination_slug || !departure_date || !grand_total) {
            return res.status(400).json({
                success: false,
                message: 'Missing required trip booking parameters'
            });
        }

        // Generate clean enterprise PNR code (e.g. TUG-TRIP-97A24)
        const tripCode = 'TUG-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);

        const componentsJson = typeof components_data === 'string' 
            ? components_data 
            : JSON.stringify(components_data || {});

        const [result] = await pool.query(`
            INSERT INTO tour_planner_trips 
            (trip_code, trip_type, origin_upazila, destination_slug, departure_date, return_date,
             travelers_count, adults_count, children_count, infants_count, grand_total, per_person_cost,
             lead_name, lead_phone, lead_email, emergency_phone, dietary_notes,
             status, payment_status, payment_method, components_data)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', 'paid', ?, ?)
        `, [
            tripCode, trip_type, origin_upazila, destination_slug, departure_date, return_date || null,
            travelers_count, adults_count, children_count, infants_count, grand_total, per_person_cost,
            lead_name || 'Valued Traveler', lead_phone || '+880 1700-000000', lead_email || 'traveler@travelup.com',
            emergency_phone || null, dietary_notes || null, payment_method, componentsJson
        ]);

        return res.status(201).json({
            success: true,
            message: 'Trip successfully booked and stored in MySQL database',
            trip_id: result.insertId,
            trip_code: tripCode,
            booking_ref: tripCode,
            status: 'confirmed',
            payment_status: 'paid',
            created_at: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error saving trip to database:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to record booking in MySQL',
            error: error.message
        });
    }
};

/**
 * Retrieve Stored Trip from MySQL Database by Trip Code
 * Used for Split-Bill link, Viewing Saved Itinerary, and Digital Vouchers
 */
exports.getTripByCode = async (req, res) => {
    try {
        const { tripCode } = req.params;

        const [rows] = await pool.query(
            'SELECT * FROM tour_planner_trips WHERE trip_code = ? LIMIT 1',
            [tripCode]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Itinerary not found in database'
            });
        }

        const trip = rows[0];
        try {
            trip.components_data = JSON.parse(trip.components_data);
        } catch (e) {
            // Keep as string if parsing fails
        }

        return res.json({
            success: true,
            trip
        });
    } catch (error) {
        console.error('Error retrieving trip from database:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch itinerary from MySQL',
            error: error.message
        });
    }
};

/**
 * Scenario 6: 10-Minute Temporary Seat Hold Engine (Solves Race Conditions)
 */
exports.holdSeat = async (req, res) => {
    try {
        const { slot_key, seat_id, component_id, session_id } = req.body;

        if (!slot_key || !seat_id) {
            return res.status(400).json({ success: false, message: 'slot_key and seat_id required' });
        }

        // Clean up expired holds
        await pool.query('DELETE FROM tour_planner_seat_holds WHERE held_until < NOW()');

        // Check if seat is currently held by someone else
        const [existing] = await pool.query(`
            SELECT * FROM tour_planner_seat_holds 
            WHERE slot_key = ? AND seat_id = ? AND status = 'held' AND held_by_session != ?
        `, [slot_key, seat_id, session_id || 'guest']);

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: `Seat ${seat_id} is temporarily held by another customer. Please choose another seat.`
            });
        }

        // Insert or renew hold for 10 minutes
        await pool.query(`
            INSERT INTO tour_planner_seat_holds 
            (component_id, slot_key, seat_id, held_by_session, held_until, status)
            VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), 'held')
            ON DUPLICATE KEY UPDATE held_until = DATE_ADD(NOW(), INTERVAL 10 MINUTE)
        `, [component_id || 1, slot_key, seat_id, session_id || 'guest']);

        return res.json({
            success: true,
            seat_id,
            expires_in_minutes: 10,
            message: `Seat ${seat_id} held for 10 minutes.`
        });
    } catch (error) {
        console.error('Seat hold error:', error);
        return res.status(500).json({ success: false, message: 'Failed to lock seat', error: error.message });
    }
};

/**
 * 5. Get Bangladesh Divisions from MySQL
 */
exports.getDivisions = async (req, res) => {
    try {
        const { status } = req.query;
        let query = 'SELECT * FROM bd_divisions';
        const params = [];
        if (status === 'active') {
            query += ' WHERE is_active = 1';
        } else if (status === 'inactive') {
            query += ' WHERE is_active = 0';
        } else if (status === 'all') {
            // no filter
        } else {
            query += ' WHERE is_active = 1';
        }
        query += ' ORDER BY name_en ASC';
        const [rows] = await pool.query(query, params);
        return res.json({ success: true, count: rows.length, divisions: rows });
    } catch (error) {
        console.error('Get divisions error:', error);
        return res.status(500).json({ success: false, message: 'Failed to load divisions', error: error.message });
    }
};

/**
 * 6. Get Bangladesh Districts by Division ID from MySQL
 */
exports.getDistricts = async (req, res) => {
    try {
        const { division_id, status } = req.query;
        let query = 'SELECT * FROM bd_districts WHERE 1=1';
        const params = [];
        if (division_id) {
            query += ' AND division_id = ?';
            params.push(division_id);
        }
        if (status === 'active') {
            query += ' AND is_active = 1';
        } else if (status === 'inactive') {
            query += ' AND is_active = 0';
        } else if (status === 'all') {
            // no filter
        } else {
            query += ' AND is_active = 1';
        }
        query += ' ORDER BY name_en ASC';
        const [rows] = await pool.query(query, params);
        return res.json({ success: true, count: rows.length, districts: rows });
    } catch (error) {
        console.error('Get districts error:', error);
        return res.status(500).json({ success: false, message: 'Failed to load districts', error: error.message });
    }
};

/**
 * 7. Get Bangladesh Upazilas by District ID / Division ID from MySQL
 */
exports.getUpazilas = async (req, res) => {
    try {
        const { district_id, division_id, status } = req.query;
        let query = 'SELECT * FROM bd_upazilas WHERE 1=1';
        const params = [];
        if (district_id) {
            query += ' AND district_id = ?';
            params.push(district_id);
        } else if (division_id) {
            query += ' AND division_id = ?';
            params.push(division_id);
        }
        if (status === 'active') {
            query += ' AND is_active = 1';
        } else if (status === 'inactive') {
            query += ' AND is_active = 0';
        } else if (status === 'all') {
            // no filter
        } else {
            query += ' AND is_active = 1';
        }
        query += ' ORDER BY name_en ASC';
        const [rows] = await pool.query(query, params);
        return res.json({ success: true, count: rows.length, upazilas: rows });
    } catch (error) {
        console.error('Get upazilas error:', error);
        return res.status(500).json({ success: false, message: 'Failed to load upazilas', error: error.message });
    }
};

/**
 * 8. Search Upazilas, Districts, and Divisions by Keyword from MySQL
 */
exports.searchLocations = async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        if (!q) {
            return res.json({ success: true, count: 0, results: [] });
        }
        const pattern = `%${q}%`;
        const [rows] = await pool.query(`
            SELECT upazila_id, name_en, name_bn, district_id, district_name_en, district_name_bn, division_id, division_name_en, division_name_bn
            FROM bd_upazilas
            WHERE is_active = 1 
              AND (name_en LIKE ? OR name_bn LIKE ? OR district_name_en LIKE ? OR district_name_bn LIKE ? OR division_name_en LIKE ? OR division_name_bn LIKE ?)
            ORDER BY 
              CASE WHEN name_en LIKE ? THEN 1 WHEN district_name_en LIKE ? THEN 2 ELSE 3 END,
              name_en ASC
            LIMIT 40
        `, [pattern, pattern, pattern, pattern, pattern, pattern, `${q}%`, `${q}%`]);

        return res.json({ success: true, count: rows.length, results: rows });
    } catch (error) {
        console.error('Search locations error:', error);
        return res.status(500).json({ success: false, message: 'Failed to search locations', error: error.message });
    }
};

/**
 * 9. Get Tour Destinations from bd_tour_destinations table
 * Supports filtering by district_id, division_id, top_50, type, or search keyword
 */
exports.getTourDestinations = async (req, res) => {
    try {
        const { district_id, division_id, upazila_id, top_50, type, q, status } = req.query;
        let query = 'SELECT * FROM bd_tour_destinations WHERE 1=1';
        const params = [];

        if (status === 'inactive') {
            query += ' AND is_active = 0';
        } else if (status === 'active' || (!status && status !== 'all')) {
            query += ' AND is_active = 1';
        }

        if (upazila_id) {
            query += ' AND upazila_id = ?';
            params.push(upazila_id);
        } else if (district_id) {
            query += ' AND district_id = ?';
            params.push(district_id);
        } else if (division_id) {
            query += ' AND division_id = ?';
            params.push(division_id);
        }

        if (top_50 === '1' || top_50 === 'true') {
            query += ' AND top_50_flag = 1';
        }

        if (type) {
            query += ' AND destination_type = ?';
            params.push(type);
        }

        if (q) {
            const pattern = `%${q.trim()}%`;
            query += ' AND (name_en LIKE ? OR name_bn LIKE ? OR search_keywords LIKE ? OR district_name_en LIKE ? OR upazila_name_en LIKE ?)';
            params.push(pattern, pattern, pattern, pattern, pattern);
        }

        query += ' ORDER BY CASE WHEN popularity_rank IS NOT NULL THEN popularity_rank ELSE 9999 END ASC, name_en ASC';

        const [rows] = await pool.query(query, params);
        return res.json({ success: true, count: rows.length, destinations: rows });
    } catch (error) {
        console.error('Get tour destinations error:', error);
        return res.status(500).json({ success: false, message: 'Failed to load tour destinations', error: error.message });
    }
};

/**
 * 10. Search Tour Destinations with Ranking & Relevance
 */
exports.searchTourDestinations = async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        if (!q) {
            return res.json({ success: true, count: 0, results: [] });
        }
        const pattern = `%${q}%`;
        const [rows] = await pool.query(`
            SELECT destination_id, name_en, name_bn, district_id, district_name_en, district_name_bn, 
                   division_id, division_name_en, division_name_bn, destination_type, top_50_flag, popularity_rank
            FROM bd_tour_destinations
            WHERE is_active = 1 
              AND (name_en LIKE ? OR name_bn LIKE ? OR district_name_en LIKE ? OR division_name_en LIKE ? OR search_keywords LIKE ?)
            ORDER BY 
              CASE 
                WHEN name_en LIKE ? THEN 1 
                WHEN name_bn LIKE ? THEN 2 
                WHEN district_name_en LIKE ? THEN 3 
                ELSE 4 
              END,
              CASE WHEN popularity_rank IS NOT NULL THEN popularity_rank ELSE 9999 END ASC,
              name_en ASC
            LIMIT 40
        `, [pattern, pattern, pattern, pattern, pattern, `${q}%`, `${q}%`, `${q}%`]);

        return res.json({ success: true, count: rows.length, results: rows });
    } catch (error) {
        console.error('Search tour destinations error:', error);
        return res.status(500).json({ success: false, message: 'Failed to search tour destinations', error: error.message });
    }
};

/**
 * 11. Location Summary Statistics (Divisions, Districts, Upazilas, Destinations)
 */
exports.getLocationSummary = async (req, res) => {
    try {
        const [divRows] = await pool.query('SELECT COUNT(*) as count FROM bd_divisions');
        const [distRows] = await pool.query('SELECT COUNT(*) as count FROM bd_districts');
        const [upzRows] = await pool.query('SELECT COUNT(*) as count FROM bd_upazilas');
        const [destRows] = await pool.query('SELECT COUNT(*) as count FROM bd_tour_destinations');

        return res.json({
            success: true,
            summary: {
                divisions: divRows[0].count,
                districts: distRows[0].count,
                upazilas: upzRows[0].count,
                destinations: destRows[0].count
            }
        });
    } catch (error) {
        console.error('Get location summary error:', error);
        return res.status(500).json({ success: false, message: 'Failed to load summary', error: error.message });
    }
};

/**
 * 12. Create New Location (Division, District, or Upazila)
 */
exports.createLocation = async (req, res) => {
    try {
        const { type, name_en, name, name_bn, parent_id, image, description, code, status, is_featured } = req.body;
        const locationNameEn = (name_en || name || '').trim();
        const isActive = (status === 'Inactive' || status === 0) ? 0 : 1;
        const isFeatured = is_featured ? 1 : 0;

        if (!type || !locationNameEn) {
            return res.status(400).json({ success: false, message: 'Location type and name are required' });
        }

        if (type === 'division') {
            const [maxDiv] = await pool.query('SELECT COUNT(*) as total FROM bd_divisions');
            const divNum = String(maxDiv[0].total + 1).padStart(2, '0');
            const division_id = code || `BD-DIV-${divNum}`;

            await pool.query(`
                INSERT INTO bd_divisions (division_id, name_en, name_bn, parent_country_id, image, description, code, is_active, is_featured)
                VALUES (?, ?, ?, 'COUNTRY-BD', ?, ?, ?, ?, ?)
            `, [division_id, locationNameEn, name_bn ? name_bn.trim() : locationNameEn, image || null, description || null, code || division_id, isActive, isFeatured]);

            return res.json({ success: true, message: 'Division created successfully', id: division_id });
        } else if (type === 'district') {
            if (!parent_id) {
                return res.status(400).json({ success: false, message: 'Parent division is required for district' });
            }
            const [divRows] = await pool.query('SELECT * FROM bd_divisions WHERE division_id = ? OR name_en = ?', [parent_id, parent_id]);
            const parentDiv = divRows[0] || { division_id: parent_id, name_en: 'Dhaka', name_bn: 'ঢাকা' };

            const [maxDist] = await pool.query('SELECT COUNT(*) as total FROM bd_districts WHERE division_id = ?', [parentDiv.division_id]);
            const distNum = String(maxDist[0].total + 1).padStart(2, '0');
            const district_id = code || `${parentDiv.division_id}-DIST-${distNum}`;

            await pool.query(`
                INSERT INTO bd_districts (district_id, name_en, name_bn, division_id, division_name_en, division_name_bn, image, description, code, is_active, is_featured)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [district_id, locationNameEn, name_bn ? name_bn.trim() : locationNameEn, parentDiv.division_id, parentDiv.name_en, parentDiv.name_bn || parentDiv.name_en, image || null, description || null, code || district_id, isActive, isFeatured]);

            return res.json({ success: true, message: 'District created successfully', id: district_id });
        } else if (type === 'upazila') {
            if (!parent_id) {
                return res.status(400).json({ success: false, message: 'Parent district is required for upazila' });
            }
            const [distRows] = await pool.query('SELECT * FROM bd_districts WHERE district_id = ? OR name_en = ?', [parent_id, parent_id]);
            const parentDist = distRows[0] || { district_id: parent_id, name_en: 'Dhaka', name_bn: 'ঢাকা', division_id: 'BD-DIV-06', division_name_en: 'Dhaka', division_name_bn: 'ঢাকা' };

            const [maxUpz] = await pool.query('SELECT COUNT(*) as total FROM bd_upazilas WHERE district_id = ?', [parentDist.district_id]);
            const upzNum = String(maxUpz[0].total + 1).padStart(3, '0');
            const upazila_id = code || `${parentDist.district_id}-UPZ-${upzNum}`;

            await pool.query(`
                INSERT INTO bd_upazilas (upazila_id, name_en, name_bn, district_id, district_name_en, district_name_bn, division_id, division_name_en, division_name_bn, image, description, code, is_active, is_featured)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [upazila_id, locationNameEn, name_bn ? name_bn.trim() : locationNameEn, parentDist.district_id, parentDist.name_en, parentDist.name_bn || parentDist.name_en, parentDist.division_id, parentDist.division_name_en, parentDist.division_name_bn || parentDist.division_name_en, image || null, description || null, code || upazila_id, isActive, isFeatured]);

            return res.json({ success: true, message: 'Upazila created successfully', id: upazila_id });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid location type' });
        }
    } catch (error) {
        console.error('Create location error:', error);
        return res.status(500).json({ success: false, message: 'Failed to create location', error: error.message });
    }
};

/**
 * 13. Update Existing Location
 */
exports.updateLocation = async (req, res) => {
    try {
        const { type, id } = req.params;
        const { name_en, name, name_bn, parent_id, image, description, code, status, is_featured } = req.body;
        const locationNameEn = (name_en || name || null);
        const isActive = (status === 'Inactive' || status === 0) ? 0 : 1;
        const isFeatured = is_featured ? 1 : 0;

        if (type === 'division') {
            await pool.query(`
                UPDATE bd_divisions
                SET name_en = COALESCE(?, name_en),
                    name_bn = COALESCE(?, name_bn),
                    image = COALESCE(?, image),
                    description = COALESCE(?, description),
                    code = COALESCE(?, code),
                    is_active = ?,
                    is_featured = ?
                WHERE division_id = ?
            `, [locationNameEn, name_bn, image, description, code, isActive, isFeatured, id]);
            return res.json({ success: true, message: 'Division updated successfully' });
        } else if (type === 'district') {
            let parentDiv = null;
            if (parent_id) {
                const [divRows] = await pool.query('SELECT * FROM bd_divisions WHERE division_id = ? OR name_en = ?', [parent_id, parent_id]);
                if (divRows.length > 0) parentDiv = divRows[0];
            }

            if (parentDiv) {
                await pool.query(`
                    UPDATE bd_districts
                    SET name_en = COALESCE(?, name_en),
                        name_bn = COALESCE(?, name_bn),
                        division_id = ?,
                        division_name_en = ?,
                        division_name_bn = ?,
                        image = COALESCE(?, image),
                        description = COALESCE(?, description),
                        code = COALESCE(?, code),
                        is_active = ?,
                        is_featured = ?
                    WHERE district_id = ?
                `, [locationNameEn, name_bn, parentDiv.division_id, parentDiv.name_en, parentDiv.name_bn, image, description, code, isActive, isFeatured, id]);
            } else {
                await pool.query(`
                    UPDATE bd_districts
                    SET name_en = COALESCE(?, name_en),
                        name_bn = COALESCE(?, name_bn),
                        image = COALESCE(?, image),
                        description = COALESCE(?, description),
                        code = COALESCE(?, code),
                        is_active = ?,
                        is_featured = ?
                    WHERE district_id = ?
                `, [locationNameEn, name_bn, image, description, code, isActive, isFeatured, id]);
            }
            return res.json({ success: true, message: 'District updated successfully' });
        } else if (type === 'upazila') {
            let parentDist = null;
            if (parent_id) {
                const [distRows] = await pool.query('SELECT * FROM bd_districts WHERE district_id = ? OR name_en = ?', [parent_id, parent_id]);
                if (distRows.length > 0) parentDist = distRows[0];
            }

            if (parentDist) {
                await pool.query(`
                    UPDATE bd_upazilas
                    SET name_en = COALESCE(?, name_en),
                        name_bn = COALESCE(?, name_bn),
                        district_id = ?,
                        district_name_en = ?,
                        district_name_bn = ?,
                        division_id = ?,
                        division_name_en = ?,
                        division_name_bn = ?,
                        image = COALESCE(?, image),
                        description = COALESCE(?, description),
                        code = COALESCE(?, code),
                        is_active = ?,
                        is_featured = ?
                    WHERE upazila_id = ?
                `, [locationNameEn, name_bn, parentDist.district_id, parentDist.name_en, parentDist.name_bn, parentDist.division_id, parentDist.division_name_en, parentDist.division_name_bn, image, description, code, isActive, isFeatured, id]);
            } else {
                await pool.query(`
                    UPDATE bd_upazilas
                    SET name_en = COALESCE(?, name_en),
                        name_bn = COALESCE(?, name_bn),
                        image = COALESCE(?, image),
                        description = COALESCE(?, description),
                        code = COALESCE(?, code),
                        is_active = ?,
                        is_featured = ?
                    WHERE upazila_id = ?
                `, [locationNameEn, name_bn, image, description, code, isActive, isFeatured, id]);
            }
            return res.json({ success: true, message: 'Upazila updated successfully' });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid location type' });
        }
    } catch (error) {
        console.error('Update location error:', error);
        return res.status(500).json({ success: false, message: 'Failed to update location', error: error.message });
    }
};

/**
 * 14. Delete Location
 */
exports.deleteLocation = async (req, res) => {
    try {
        const { type, id } = req.params;
        if (type === 'division') {
            await pool.query('DELETE FROM bd_divisions WHERE division_id = ?', [id]);
        } else if (type === 'district') {
            await pool.query('DELETE FROM bd_districts WHERE district_id = ?', [id]);
        } else if (type === 'upazila') {
            await pool.query('DELETE FROM bd_upazilas WHERE upazila_id = ?', [id]);
        } else {
            return res.status(400).json({ success: false, message: 'Invalid location type' });
        }
        return res.json({ success: true, message: 'Location deleted successfully' });
    } catch (error) {
        console.error('Delete location error:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete location', error: error.message });
    }
};

/**
 * 15. Toggle Location Status
 */
exports.toggleLocationStatus = async (req, res) => {
    try {
        const { type, id } = req.params;
        let table = 'bd_upazilas';
        let idCol = 'upazila_id';
        if (type === 'division') { table = 'bd_divisions'; idCol = 'division_id'; }
        else if (type === 'district') { table = 'bd_districts'; idCol = 'district_id'; }

        await pool.query(`UPDATE ${table} SET is_active = 1 - is_active WHERE ${idCol} = ?`, [id]);
        return res.json({ success: true, message: 'Status toggled successfully' });
    } catch (error) {
        console.error('Toggle status error:', error);
        return res.status(500).json({ success: false, message: 'Failed to toggle status', error: error.message });
    }
};

/**
 * 16. Create Tour Destination
 */
exports.createTourDestination = async (req, res) => {
    try {
        const { name_en, name_bn, division_id, district_id, upazila_id, destination_type, description, image, is_active } = req.body;
        if (!name_en || !district_id) {
            return res.status(400).json({ success: false, message: 'name_en and district_id are required' });
        }
        const [distRows] = await pool.query('SELECT * FROM bd_districts WHERE district_id = ?', [district_id]);
        const dist = distRows[0] || {};
        const destId = `DEST-${Date.now()}`;

        await pool.query(`
            INSERT INTO bd_tour_destinations 
            (destination_id, division_id, division_name_en, division_name_bn, district_id, district_name_en, district_name_bn, upazila_id, name_en, name_bn, destination_type, description, image, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            destId,
            dist.division_id || division_id || 'BD-DIV-06',
            dist.division_name_en || 'Dhaka',
            dist.division_name_bn || 'ঢাকা',
            dist.district_id,
            dist.name_en,
            dist.name_bn,
            upazila_id || null,
            name_en.trim(),
            name_bn ? name_bn.trim() : name_en.trim(),
            destination_type || 'Attraction',
            description || null,
            image || null,
            is_active !== undefined ? is_active : 1
        ]);

        return res.json({ success: true, message: 'Tour destination created successfully', id: destId });
    } catch (error) {
        console.error('Create tour destination error:', error);
        return res.status(500).json({ success: false, message: 'Failed to create destination', error: error.message });
    }
};

/**
 * 17. Delete Tour Destination
 */
exports.deleteTourDestination = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM bd_tour_destinations WHERE destination_id = ? OR id = ?', [id, id]);
        return res.json({ success: true, message: 'Tour destination deleted successfully' });
    } catch (error) {
        console.error('Delete tour destination error:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete destination', error: error.message });
    }
};


