const { pool } = require('../config/db');

// 1. Get current user's wishlist items
exports.getUserWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const [items] = await pool.query(`
            SELECT w.id, w.user_id, w.destination_id, w.package_id, w.created_at,
                   d.name_en AS dest_name_en, d.name_bn AS dest_name_bn, d.country, d.city, 
                   d.price_bdt AS dest_price_bdt, d.price_usd AS dest_price_usd, d.image_url AS dest_image_url, 
                   d.rating AS dest_rating, d.category AS dest_category,
                   p.title_en AS pkg_title_en, p.price_bdt AS pkg_price_bdt, p.price_usd AS pkg_price_usd,
                   p.duration_days AS pkg_duration_days
            FROM wishlists w
            LEFT JOIN destinations d ON w.destination_id = d.id
            LEFT JOIN packages p ON w.package_id = p.id
            WHERE w.user_id = ?
            ORDER BY w.created_at DESC
        `, [userId]);

        return res.json({ success: true, count: items.length, data: items });
    } catch (err) {
        console.error('Error fetching wishlist:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch wishlist' });
    }
};

// 2. Add destination or package to wishlist
exports.addToWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { destination_id, package_id } = req.body;

        if (!destination_id && !package_id) {
            return res.status(400).json({ success: false, message: 'destination_id or package_id required' });
        }

        // Check if already in wishlist
        const [existing] = await pool.query(`
            SELECT id FROM wishlists 
            WHERE user_id = ? AND (
                (destination_id = ? AND destination_id IS NOT NULL) OR 
                (package_id = ? AND package_id IS NOT NULL)
            )
        `, [userId, destination_id || null, package_id || null]);

        if (existing.length > 0) {
            return res.json({ success: true, message: 'Already in wishlist', id: existing[0].id });
        }

        const [result] = await pool.query(`
            INSERT INTO wishlists (user_id, destination_id, package_id)
            VALUES (?, ?, ?)
        `, [userId, destination_id || null, package_id || null]);

        return res.status(201).json({
            success: true,
            message: 'Saved to wishlist ❤️',
            id: result.insertId
        });
    } catch (err) {
        console.error('Error adding to wishlist:', err);
        return res.status(500).json({ success: false, message: 'Failed to add to wishlist' });
    }
};

// 3. Remove item from wishlist by wishlist id
exports.removeFromWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        await pool.query('DELETE FROM wishlists WHERE id = ? AND user_id = ?', [id, userId]);
        return res.json({ success: true, message: 'Removed from wishlist' });
    } catch (err) {
        console.error('Error removing from wishlist:', err);
        return res.status(500).json({ success: false, message: 'Failed to remove from wishlist' });
    }
};

// 4. Remove by destination ID
exports.removeByDestination = async (req, res) => {
    try {
        const userId = req.user.id;
        const { destId } = req.params;

        await pool.query('DELETE FROM wishlists WHERE destination_id = ? AND user_id = ?', [destId, userId]);
        return res.json({ success: true, message: 'Removed from wishlist' });
    } catch (err) {
        console.error('Error removing destination from wishlist:', err);
        return res.status(500).json({ success: false, message: 'Failed to remove destination from wishlist' });
    }
};
