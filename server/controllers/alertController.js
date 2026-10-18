const { pool } = require('../config/db');

// Get active alerts
exports.getActiveAlerts = async (req, res) => {
    try {
        const [alerts] = await pool.query(`
            SELECT a.*, d.name_en as dest_name_en, d.name_bn as dest_name_bn 
            FROM travel_alerts a
            LEFT JOIN destinations d ON a.destination_id = d.id
            WHERE a.is_active = TRUE
            ORDER BY a.created_at DESC
        `);
        return res.json({ success: true, count: alerts.length, alerts });
    } catch (error) {
        console.error('Fetch alerts error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch travel alerts.' });
    }
};

// Admin: Create alert
exports.createAlert = async (req, res) => {
    try {
        const { destination_id, title_en, title_bn, severity, message_en, message_bn } = req.body;

        await pool.query(`
            INSERT INTO travel_alerts (destination_id, title_en, title_bn, severity, message_en, message_bn, is_active)
            VALUES (?, ?, ?, ?, ?, ?, TRUE)
        `, [destination_id || null, title_en, title_bn, severity || 'info', message_en, message_bn]);

        return res.status(201).json({ success: true, message: 'Alert published successfully!' });
    } catch (error) {
        console.error('Create alert error:', error);
        return res.status(500).json({ success: false, message: 'Failed to create alert.' });
    }
};
