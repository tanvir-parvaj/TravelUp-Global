const { pool } = require('../config/db');

// 1. Get all suppliers with filtering & counts
exports.getAllSuppliers = async (req, res) => {
    try {
        const { search, category, status } = req.query;

        let query = 'SELECT * FROM suppliers WHERE 1=1';
        const params = [];

        if (category && category !== 'all') {
            query += ' AND category = ?';
            params.push(category);
        }

        if (status && status !== 'all') {
            query += ' AND status = ?';
            params.push(status);
        }

        if (search) {
            query += ' AND (name LIKE ? OR supplier_code LIKE ? OR city LIKE ? OR country LIKE ? OR contact_person LIKE ?)';
            const term = `%${search}%`;
            params.push(term, term, term, term, term);
        }

        query += ' ORDER BY id DESC';

        const [suppliers] = await pool.query(query, params);

        const [[counts]] = await pool.query(`
            SELECT 
                COUNT(*) as total_all,
                SUM(CASE WHEN category = 'hotel' THEN 1 ELSE 0 END) as total_hotel,
                SUM(CASE WHEN category = 'transport' THEN 1 ELSE 0 END) as total_transport,
                SUM(CASE WHEN category = 'activity' THEN 1 ELSE 0 END) as total_activity,
                SUM(CASE WHEN category = 'visa_agent' THEN 1 ELSE 0 END) as total_visa_agent,
                SUM(CASE WHEN category = 'airline' THEN 1 ELSE 0 END) as total_airline,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as total_active,
                SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as total_inactive
            FROM suppliers
        `);

        return res.json({
            success: true,
            suppliers,
            counts: {
                all: counts.total_all || 0,
                hotel: counts.total_hotel || 0,
                transport: counts.total_transport || 0,
                activity: counts.total_activity || 0,
                visa_agent: counts.total_visa_agent || 0,
                airline: counts.total_airline || 0,
                active: counts.total_active || 0,
                inactive: counts.total_inactive || 0
            }
        });
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch suppliers.' });
    }
};

// 2. Get supplier by ID
exports.getSupplierById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Supplier not found.' });
        return res.json({ success: true, supplier: rows[0] });
    } catch (error) {
        console.error('Error fetching supplier details:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch supplier details.' });
    }
};

// 3. Create new supplier
exports.createSupplier = async (req, res) => {
    try {
        const {
            supplier_code, name, category, contact_person, email, phone,
            country, city, rating, status
        } = req.body;

        if (!name || !category) {
            return res.status(400).json({ success: false, message: 'Supplier Name and Category are required.' });
        }

        const generatedCode = supplier_code || ('SUP-' + category.substring(0, 3).toUpperCase() + '-' + Math.floor(10 + Math.random() * 90));

        const [result] = await pool.query(`
            INSERT INTO suppliers (
                supplier_code, name, category, contact_person, email, phone,
                country, city, rating, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            generatedCode, name, category, contact_person || null, email || null, phone || null,
            country || 'Bangladesh', city || null, rating || 4.8, status || 'active'
        ]);

        return res.status(201).json({
            success: true,
            message: `Supplier "${name}" registered successfully!`,
            id: result.insertId,
            supplier_code: generatedCode,
            supplier: {
                id: result.insertId,
                supplier_code: generatedCode,
                name,
                category,
                contact_person,
                email,
                phone,
                country: country || 'Bangladesh',
                city,
                rating: rating || 4.8,
                status: status || 'active'
            }
        });
    } catch (error) {
        console.error('Error creating supplier:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to create supplier.' });
    }
};

// 4. Update supplier
exports.updateSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            supplier_code, name, category, contact_person, email, phone,
            country, city, rating, status
        } = req.body;

        await pool.query(`
            UPDATE suppliers SET
                supplier_code = COALESCE(?, supplier_code),
                name = COALESCE(?, name),
                category = COALESCE(?, category),
                contact_person = COALESCE(?, contact_person),
                email = COALESCE(?, email),
                phone = COALESCE(?, phone),
                country = COALESCE(?, country),
                city = COALESCE(?, city),
                rating = COALESCE(?, rating),
                status = COALESCE(?, status)
            WHERE id = ?
        `, [supplier_code, name, category, contact_person, email, phone, country, city, rating, status, id]);

        return res.json({ success: true, message: `Supplier #${id} updated successfully.` });
    } catch (error) {
        console.error('Error updating supplier:', error);
        return res.status(500).json({ success: false, message: 'Failed to update supplier.' });
    }
};

// 5. Toggle status
exports.toggleSupplierStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT status FROM suppliers WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Supplier not found.' });

        const currentStatus = rows[0].status || 'active';
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

        await pool.query('UPDATE suppliers SET status = ? WHERE id = ?', [newStatus, id]);
        return res.json({ success: true, message: `Supplier status changed to ${newStatus}.`, newStatus });
    } catch (error) {
        console.error('Error toggling supplier status:', error);
        return res.status(500).json({ success: false, message: 'Failed to toggle status.' });
    }
};

// 6. Delete supplier
exports.deleteSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM suppliers WHERE id = ?', [id]);
        return res.json({ success: true, message: `Supplier #${id} deleted successfully.` });
    } catch (error) {
        console.error('Error deleting supplier:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete supplier.' });
    }
};
