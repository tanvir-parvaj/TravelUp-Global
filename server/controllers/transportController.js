const { pool } = require('../config/db');

// 1. Get all transportation options
exports.getAllTransport = async (req, res) => {
    try {
        const { search, destination_id, vehicle_type, service_type, status } = req.query;

        let query = `
            SELECT t.*, 
                   COALESCE(t.title_en, t.service_code, 'Transport Service') AS title,
                   COALESCE(t.capacity_passengers, 4) AS capacity,
                   d.name_en AS destination_name, 
                   d.name_en AS dest_name_en, 
                   d.travel_type, 
                   d.country AS destination_country
            FROM transportation t
            LEFT JOIN destinations d ON t.destination_id = d.id
            WHERE 1=1
        `;
        const params = [];

        if (destination_id && destination_id !== 'all') {
            query += ' AND t.destination_id = ?';
            params.push(destination_id);
        }

        if (vehicle_type && vehicle_type !== 'all') {
            query += ' AND t.vehicle_type = ?';
            params.push(vehicle_type);
        }

        if (service_type && service_type !== 'all') {
            query += ' AND t.service_type = ?';
            params.push(service_type);
        }

        if (status && status !== 'all') {
            query += ' AND t.status = ?';
            params.push(status);
        }

        if (search) {
            query += ' AND (t.title_en LIKE ? OR t.service_code LIKE ? OR t.city LIKE ? OR d.name_en LIKE ?)';
            const term = `%${search}%`;
            params.push(term, term, term, term);
        }

        query += ' ORDER BY t.id DESC';

        const [transport] = await pool.query(query, params);

        // Compute counts
        const [[counts]] = await pool.query(`
            SELECT 
                COUNT(*) as total_all,
                SUM(CASE WHEN d.travel_type = 'domestic' THEN 1 ELSE 0 END) as total_domestic,
                SUM(CASE WHEN d.travel_type = 'international' THEN 1 ELSE 0 END) as total_international,
                SUM(CASE WHEN t.status = 'active' THEN 1 ELSE 0 END) as total_active,
                SUM(CASE WHEN t.status = 'inactive' THEN 1 ELSE 0 END) as total_inactive
            FROM transportation t
            LEFT JOIN destinations d ON t.destination_id = d.id
        `);

        return res.json({
            success: true,
            transport,
            transportation: transport,
            counts: {
                all: counts.total_all || 0,
                domestic: counts.total_domestic || 0,
                international: counts.total_international || 0,
                active: counts.total_active || 0,
                inactive: counts.total_inactive || 0
            }
        });
    } catch (error) {
        console.error('Error fetching transportation:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch transportation.' });
    }
};

// 2. Create new transport service
exports.createTransport = async (req, res) => {
    try {
        const {
            destination_id, service_code, title_en, title, title_bn, vehicle_type, service_type,
            city, country, capacity_passengers, capacity, base_price, selling_price, price, image_url, status
        } = req.body;

        const transTitle = title_en || title;
        if (!transTitle || !destination_id) {
            return res.status(400).json({ success: false, message: 'Transport Title and Destination are required.' });
        }

        const generatedCode = service_code || ('TRN-' + Math.floor(1000 + Math.random() * 9000));
        const finalPrice = selling_price || price || 35;
        const finalCapacity = capacity_passengers || capacity || 4;

        const [result] = await pool.query(`
            INSERT INTO transportation (
                destination_id, service_code, title_en, title_bn, vehicle_type, service_type,
                city, country, capacity_passengers, base_price, selling_price, image_url, is_active, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
        `, [
            destination_id, generatedCode, transTitle, title_bn || transTitle, vehicle_type || 'private_car', service_type || 'daily_rental',
            city || null, country || 'Bangladesh', finalCapacity, base_price || 25, finalPrice,
            image_url || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=400&q=80', status || 'active'
        ]);

        return res.status(201).json({
            success: true,
            message: `Transport service "${transTitle}" created successfully!`,
            id: result.insertId,
            service_code: generatedCode,
            transportation: {
                id: result.insertId,
                service_code: generatedCode,
                title_en: transTitle,
                vehicle_type: vehicle_type || 'private_car',
                service_type: service_type || 'daily_rental',
                selling_price: finalPrice
            }
        });
    } catch (error) {
        console.error('Error creating transportation:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to create transport.' });
    }
};

// 3. Update transport service
exports.updateTransport = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            destination_id, service_code, title_en, title_bn, vehicle_type, service_type,
            city, country, capacity_passengers, base_price, selling_price, image_url, status
        } = req.body;

        await pool.query(`
            UPDATE transportation SET
                destination_id = COALESCE(?, destination_id),
                service_code = COALESCE(?, service_code),
                title_en = COALESCE(?, title_en),
                title_bn = COALESCE(?, title_bn),
                vehicle_type = COALESCE(?, vehicle_type),
                service_type = COALESCE(?, service_type),
                city = COALESCE(?, city),
                country = COALESCE(?, country),
                capacity_passengers = COALESCE(?, capacity_passengers),
                base_price = COALESCE(?, base_price),
                selling_price = COALESCE(?, selling_price),
                image_url = COALESCE(?, image_url),
                status = COALESCE(?, status)
            WHERE id = ?
        `, [
            destination_id, service_code, title_en, title_bn, vehicle_type, service_type,
            city, country, capacity_passengers, base_price, selling_price, image_url, status, id
        ]);

        return res.json({ success: true, message: `Transport service #${id} updated successfully.` });
    } catch (error) {
        console.error('Error updating transportation:', error);
        return res.status(500).json({ success: false, message: 'Failed to update transport.' });
    }
};

// 4. Toggle transport status
exports.toggleTransportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const [trans] = await pool.query('SELECT status FROM transportation WHERE id = ?', [id]);
        if (trans.length === 0) return res.status(404).json({ success: false, message: 'Transport not found.' });

        const currentStatus = trans[0].status || 'active';
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

        await pool.query('UPDATE transportation SET status = ?, is_active = ? WHERE id = ?', [newStatus, newStatus === 'active' ? 1 : 0, id]);
        return res.json({ success: true, message: `Transport status changed to ${newStatus}.`, newStatus });
    } catch (error) {
        console.error('Error toggling transport status:', error);
        return res.status(500).json({ success: false, message: 'Failed to toggle status.' });
    }
};

// 5. Delete transport
exports.deleteTransport = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM transportation WHERE id = ?', [id]);
        return res.json({ success: true, message: `Transport service #${id} deleted successfully.` });
    } catch (error) {
        console.error('Error deleting transport:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete transport.' });
    }
};
