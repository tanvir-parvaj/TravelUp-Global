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
