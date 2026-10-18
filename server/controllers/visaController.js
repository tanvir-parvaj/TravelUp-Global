const { pool } = require('../config/db');

// 1. Get all visa applications
exports.getAllVisaApplications = async (req, res) => {
    try {
        const { search, country, status } = req.query;

        let query = 'SELECT * FROM visa_applications WHERE 1=1';
        const params = [];

        if (country && country !== 'all') {
            query += ' AND country = ?';
            params.push(country);
        }

        if (status && status !== 'all') {
            query += ' AND status = ?';
            params.push(status);
        }

        if (search) {
            query += ' AND (application_no LIKE ? OR traveler_name LIKE ? OR passport_number LIKE ? OR country LIKE ?)';
            const term = `%${search}%`;
            params.push(term, term, term, term);
        }

        query += ' ORDER BY id DESC';

        const [visas] = await pool.query(query, params);

        // Counts
        const [[counts]] = await pool.query(`
            SELECT 
                COUNT(*) as total_all,
                SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as total_processing,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as total_approved,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as total_rejected,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as total_pending
            FROM visa_applications
        `);

        return res.json({
            success: true,
            visas,
            counts: {
                all: counts.total_all || 0,
                processing: counts.total_processing || 0,
                approved: counts.total_approved || 0,
                rejected: counts.total_rejected || 0,
                pending: counts.total_pending || 0
            }
        });
    } catch (error) {
        console.error('Error fetching visa applications:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch visa applications.' });
    }
};

// 2. Create visa application
exports.createVisaApplication = async (req, res) => {
    try {
        const {
            traveler_name, passport_number, country, destination_id,
            visa_type, submission_date, estimated_completion_date,
            embassy_fee, processing_fee, total_price, status, notes
        } = req.body;

        if (!traveler_name || !passport_number || !country) {
            return res.status(400).json({ success: false, message: 'Traveler Name, Passport Number, and Country are required.' });
        }

        const appNo = 'VSA-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900);

        const [result] = await pool.query(`
            INSERT INTO visa_applications (
                application_no, traveler_name, passport_number, country, destination_id,
                visa_type, submission_date, estimated_completion_date,
                embassy_fee, processing_fee, total_price, status, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            appNo, traveler_name, passport_number, country, destination_id || null,
            visa_type || 'Tourist E-Visa', submission_date || new Date(), estimated_completion_date || null,
            embassy_fee || 0, processing_fee || 1500, total_price || (parseFloat(embassy_fee || 0) + 1500),
            status || 'processing', notes || null
        ]);

        return res.status(201).json({
            success: true,
            message: `Visa Application "${appNo}" created successfully!`,
            id: result.insertId,
            application_no: appNo,
            visa: {
                id: result.insertId,
                application_no: appNo,
                traveler_name,
                passport_number,
                country,
                status: status || 'processing'
            }
        });
    } catch (error) {
        console.error('Error creating visa application:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to create visa application.' });
    }
};

// 3. Update visa application status
exports.updateVisaStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        await pool.query(`
            UPDATE visa_applications SET
                status = COALESCE(?, status),
                notes = COALESCE(?, notes)
            WHERE id = ?
        `, [status, notes, id]);

        return res.json({ success: true, message: `Visa application #${id} status updated to ${status}.` });
    } catch (error) {
        console.error('Error updating visa status:', error);
        return res.status(500).json({ success: false, message: 'Failed to update visa application.' });
    }
};

// 4. Delete visa application
exports.deleteVisaApplication = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM visa_applications WHERE id = ?', [id]);
        return res.json({ success: true, message: `Visa application #${id} deleted successfully.` });
    } catch (error) {
        console.error('Error deleting visa application:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete visa application.' });
    }
};
