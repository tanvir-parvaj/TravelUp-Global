const { pool } = require('../config/db');

// 1. Get all reviews with user and destination details
exports.getAllReviews = async (req, res) => {
    try {
        const { destination_id } = req.query;
        let query = `
            SELECT r.*, u.name AS user_name, u.avatar_url,
                   d.name_en AS dest_name_en, d.country AS dest_country, d.image_url AS dest_image_url
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            JOIN destinations d ON r.destination_id = d.id
            WHERE 1=1
        `;
        const params = [];

        if (destination_id) {
            query += ' AND r.destination_id = ?';
            params.push(destination_id);
        }

        query += ' ORDER BY r.created_at DESC';

        const [reviews] = await pool.query(query, params);
        return res.json({ success: true, count: reviews.length, data: reviews });
    } catch (err) {
        console.error('Error fetching reviews:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
    }
};

// 2. Submit new review
exports.createReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { destination_id, rating, comment } = req.body;

        if (!destination_id || !rating || !comment) {
            return res.status(400).json({ success: false, message: 'Destination, rating, and review comment are required.' });
        }

        const [result] = await pool.query(`
            INSERT INTO reviews (user_id, destination_id, rating, comment)
            VALUES (?, ?, ?, ?)
        `, [userId, destination_id, parseInt(rating), comment]);

        // Update destination rating
        const [avg] = await pool.query('SELECT AVG(rating) as avgRating FROM reviews WHERE destination_id = ?', [destination_id]);
        const newRating = parseFloat(avg[0].avgRating || 4.8).toFixed(1);
        await pool.query('UPDATE destinations SET rating = ? WHERE id = ?', [newRating, destination_id]);

        return res.status(201).json({
            success: true,
            message: 'Thank you! Your verified review has been published.',
            id: result.insertId
        });
    } catch (err) {
        console.error('Error submitting review:', err);
        return res.status(500).json({ success: false, message: 'Failed to submit review' });
    }
};

// 3. Delete review (Admin or reviewer)
exports.deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM reviews WHERE id = ?', [id]);
        return res.json({ success: true, message: 'Review deleted successfully' });
    } catch (err) {
        console.error('Error deleting review:', err);
        return res.status(500).json({ success: false, message: 'Failed to delete review' });
    }
};
