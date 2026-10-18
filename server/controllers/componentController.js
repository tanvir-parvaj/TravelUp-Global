const { pool } = require('../config/db');

// 1. Get all components for a destination ecosystem
exports.getDestinationEcosystem = async (req, res) => {
    try {
        const destId = req.params.destinationId;

        // Fetch destination info
        const [dest] = await pool.query('SELECT * FROM destinations WHERE id = ?', [destId]);
        if (dest.length === 0) {
            return res.status(404).json({ success: false, message: 'Destination not found' });
        }

        // Fetch attractions
        const [attractions] = await pool.query('SELECT * FROM attractions WHERE destination_id = ?', [destId]);

        // Fetch hotels with room prices
        const [hotels] = await pool.query(`
            SELECT h.*, hr.id AS room_id, hr.room_name_en, hr.room_type, hp.selling_price AS room_price, hp.pricing_unit
            FROM hotels h
            LEFT JOIN hotel_rooms hr ON h.id = hr.hotel_id
            LEFT JOIN hotel_prices hp ON hr.id = hp.room_id
            WHERE h.destination_id = ? AND h.is_active = 1
        `, [destId]);

        // Fetch restaurants with meal prices
        const [restaurants] = await pool.query(`
            SELECT r.*, rp.meal_type, rp.selling_price AS meal_price, rp.pricing_unit
            FROM restaurants r
            LEFT JOIN restaurant_prices rp ON r.id = rp.restaurant_id
            WHERE r.destination_id = ? AND r.is_active = 1
        `, [destId]);

        // Fetch activities with ticket prices
        const [activities] = await pool.query(`
            SELECT a.*, ap.adult_price, ap.child_price, ap.pricing_unit, ap.is_fixed_cost
            FROM activities a
            LEFT JOIN activity_prices ap ON a.id = ap.activity_id
            WHERE a.destination_id = ? AND a.is_active = 1
        `, [destId]);

        // Fetch transportation options
        const [transportation] = await pool.query(`
            SELECT t.*, tp.selling_price, tp.pricing_unit, tp.is_fixed_cost
            FROM transportation t
            LEFT JOIN transportation_prices tp ON t.id = tp.transport_id
            WHERE t.destination_id = ? AND t.is_active = 1
        `, [destId]);

        res.json({
            success: true,
            destination: dest[0],
            attractions,
            hotels,
            restaurants,
            activities,
            transportation
        });
    } catch (err) {
        console.error('Error fetching destination ecosystem:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// 2. Filter Hotels
exports.getHotels = async (req, res) => {
    try {
        const { destination_id, tier, min_price, max_price } = req.query;
        let query = `
            SELECT h.*, hr.id AS room_id, hr.room_name_en, hp.selling_price, hp.pricing_unit
            FROM hotels h
            JOIN hotel_rooms hr ON h.id = hr.hotel_id
            JOIN hotel_prices hp ON hr.id = hp.room_id
            WHERE h.is_active = 1
        `;
        const params = [];

        if (destination_id) {
            query += ' AND h.destination_id = ?';
            params.push(destination_id);
        }
        if (tier) {
            query += ' AND h.tier = ?';
            params.push(tier);
        }
        if (max_price) {
            query += ' AND hp.selling_price <= ?';
            params.push(max_price);
        }

        const [hotels] = await pool.query(query, params);
        res.json({ success: true, count: hotels.length, data: hotels });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 3. Filter Activities
exports.getActivities = async (req, res) => {
    try {
        const { destination_id, category, max_price } = req.query;
        let query = `
            SELECT a.*, ap.adult_price, ap.child_price, ap.pricing_unit
            FROM activities a
            JOIN activity_prices ap ON a.id = ap.activity_id
            WHERE a.is_active = 1
        `;
        const params = [];

        if (destination_id) {
            query += ' AND a.destination_id = ?';
            params.push(destination_id);
        }
        if (category) {
            query += ' AND a.category = ?';
            params.push(category);
        }
        if (max_price) {
            query += ' AND ap.adult_price <= ?';
            params.push(max_price);
        }

        const [activities] = await pool.query(query, params);
        res.json({ success: true, count: activities.length, data: activities });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 4. Filter Transportation
exports.getTransportation = async (req, res) => {
    try {
        const { destination_id, vehicle_type } = req.query;
        let query = `
            SELECT t.*, tp.selling_price, tp.pricing_unit, tp.is_fixed_cost
            FROM transportation t
            JOIN transportation_prices tp ON t.id = tp.transport_id
            WHERE t.is_active = 1
        `;
        const params = [];

        if (destination_id) {
            query += ' AND t.destination_id = ?';
            params.push(destination_id);
        }
        if (vehicle_type) {
            query += ' AND t.vehicle_type = ?';
            params.push(vehicle_type);
        }

        const [transports] = await pool.query(query, params);
        res.json({ success: true, count: transports.length, data: transports });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
