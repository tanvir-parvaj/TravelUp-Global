const { pool } = require('../config/db');

// 1. Get all flights with filtering & counts
exports.getAllFlights = async (req, res) => {
    try {
        const { search, flight_type, cabin_class, status } = req.query;

        let query = 'SELECT * FROM flights WHERE 1=1';
        const params = [];

        if (flight_type && flight_type !== 'all') {
            query += ' AND flight_type = ?';
            params.push(flight_type);
        }

        if (cabin_class && cabin_class !== 'all') {
            query += ' AND cabin_class = ?';
            params.push(cabin_class);
        }

        if (status && status !== 'all') {
            query += ' AND status = ?';
            params.push(status);
        }

        if (search) {
            query += ' AND (flight_code LIKE ? OR airline_name LIKE ? OR origin_city LIKE ? OR destination_city LIKE ?)';
            const term = `%${search}%`;
            params.push(term, term, term, term);
        }

        query += ' ORDER BY id DESC';

        const [flights] = await pool.query(query, params);

        const [[counts]] = await pool.query(`
            SELECT 
                COUNT(*) as total_all,
                SUM(CASE WHEN flight_type = 'domestic' THEN 1 ELSE 0 END) as total_domestic,
                SUM(CASE WHEN flight_type = 'international' THEN 1 ELSE 0 END) as total_international,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as total_active,
                SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as total_inactive
            FROM flights
        `);

        return res.json({
            success: true,
            flights,
            counts: {
                all: counts.total_all || 0,
                domestic: counts.total_domestic || 0,
                international: counts.total_international || 0,
                active: counts.total_active || 0,
                inactive: counts.total_inactive || 0
            }
        });
    } catch (error) {
        console.error('Error fetching flights:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch flights.' });
    }
};

// 2. Get flight by ID
exports.getFlightById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM flights WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Flight not found.' });
        return res.json({ success: true, flight: rows[0] });
    } catch (error) {
        console.error('Error fetching flight details:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch flight details.' });
    }
};

// 3. Create new flight service
exports.createFlight = async (req, res) => {
    try {
        const {
            flight_code, airline_name, airline_code, flight_type,
            origin_city, destination_city, departure_time, arrival_time,
            duration, cabin_class, base_price, selling_price, currency, baggage_allowance, status
        } = req.body;

        if (!airline_name || !origin_city || !destination_city) {
            return res.status(400).json({ success: false, message: 'Airline Name, Origin, and Destination are required.' });
        }

        const generatedCode = flight_code || ((airline_code || 'FLT') + '-' + Math.floor(100 + Math.random() * 900));

        const [result] = await pool.query(`
            INSERT INTO flights (
                flight_code, airline_name, airline_code, flight_type,
                origin_city, destination_city, departure_time, arrival_time,
                duration, cabin_class, base_price, selling_price, currency, baggage_allowance, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            generatedCode, airline_name, airline_code || 'TUG', flight_type || 'international',
            origin_city, destination_city, departure_time || '10:00 AM', arrival_time || '01:00 PM',
            duration || '3h 00m', cabin_class || 'Economy', base_price || 150, selling_price || 200,
            currency || 'USD', baggage_allowance || '20 kg Check-in', status || 'active'
        ]);

        return res.status(201).json({
            success: true,
            message: `Flight "${generatedCode}" created successfully!`,
            id: result.insertId,
            flight_code: generatedCode,
            flight: {
                id: result.insertId,
                flight_code: generatedCode,
                airline_name,
                origin_city,
                destination_city,
                flight_type: flight_type || 'international',
                selling_price: selling_price || 200,
                status: status || 'active'
            }
        });
    } catch (error) {
        console.error('Error creating flight:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to create flight.' });
    }
};

// 4. Update flight
exports.updateFlight = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            flight_code, airline_name, airline_code, flight_type,
            origin_city, destination_city, departure_time, arrival_time,
            duration, cabin_class, base_price, selling_price, currency, baggage_allowance, status
        } = req.body;

        await pool.query(`
            UPDATE flights SET
                flight_code = COALESCE(?, flight_code),
                airline_name = COALESCE(?, airline_name),
                airline_code = COALESCE(?, airline_code),
                flight_type = COALESCE(?, flight_type),
                origin_city = COALESCE(?, origin_city),
                destination_city = COALESCE(?, destination_city),
                departure_time = COALESCE(?, departure_time),
                arrival_time = COALESCE(?, arrival_time),
                duration = COALESCE(?, duration),
                cabin_class = COALESCE(?, cabin_class),
                base_price = COALESCE(?, base_price),
                selling_price = COALESCE(?, selling_price),
                currency = COALESCE(?, currency),
                baggage_allowance = COALESCE(?, baggage_allowance),
                status = COALESCE(?, status)
            WHERE id = ?
        `, [
            flight_code, airline_name, airline_code, flight_type,
            origin_city, destination_city, departure_time, arrival_time,
            duration, cabin_class, base_price, selling_price, currency, baggage_allowance, status, id
        ]);

        return res.json({ success: true, message: `Flight #${id} updated successfully.` });
    } catch (error) {
        console.error('Error updating flight:', error);
        return res.status(500).json({ success: false, message: 'Failed to update flight.' });
    }
};

// 5. Toggle status
exports.toggleFlightStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT status FROM flights WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Flight not found.' });

        const currentStatus = rows[0].status || 'active';
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

        await pool.query('UPDATE flights SET status = ? WHERE id = ?', [newStatus, id]);
        return res.json({ success: true, message: `Flight status changed to ${newStatus}.`, newStatus });
    } catch (error) {
        console.error('Error toggling flight status:', error);
        return res.status(500).json({ success: false, message: 'Failed to toggle flight status.' });
    }
};

// 6. Delete flight
exports.deleteFlight = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM flights WHERE id = ?', [id]);
        return res.json({ success: true, message: `Flight #${id} deleted successfully.` });
    } catch (error) {
        console.error('Error deleting flight:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete flight.' });
    }
};
