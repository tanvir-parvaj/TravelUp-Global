const { pool } = require('../config/db');

// Create a new lead/inquiry
exports.createLead = async (req, res) => {
    try {
        const { name, email, phone, destination_interest, budget_range, travelers_count, travel_dates, source, notes } = req.body;

        if (!name || !email) {
            return res.status(400).json({ success: false, message: 'Name and email are required to create a lead.' });
        }

        const [result] = await pool.query(
            `INSERT INTO leads (name, email, phone, destination_interest, budget_range, travelers_count, travel_dates, source, status, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', ?)`,
            [name, email, phone || null, destination_interest || null, budget_range || null, travelers_count || 1, travel_dates || null, source || 'website', notes || null]
        );

        return res.status(201).json({
            success: true,
            message: 'Lead inquiry saved successfully! Our travel specialist will contact you soon.',
            leadId: result.insertId
        });
    } catch (error) {
        console.error('Create lead error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error while saving lead.' });
    }
};

// Get all leads (Admin only)
exports.getLeads = async (req, res) => {
    try {
        const [leads] = await pool.query('SELECT * FROM leads ORDER BY created_at DESC');
        return res.json({ success: true, leads });
    } catch (error) {
        console.error('Get leads error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

// Update lead status
exports.updateLeadStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        await pool.query('UPDATE leads SET status = ?, notes = COALESCE(?, notes) WHERE id = ?', [status, notes, id]);
        return res.json({ success: true, message: 'Lead updated successfully.' });
    } catch (error) {
        console.error('Update lead error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};
