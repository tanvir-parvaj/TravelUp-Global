const { pool } = require('../config/db');

// 1. Get all restaurants
exports.getAllRestaurants = async (req, res) => {
    try {
        const { search, destination_id, price_level, is_halal, is_vegetarian } = req.query;

        let query = `
            SELECT r.*, 
                   COALESCE(r.name_en, r.restaurant_code, 'Restaurant') AS name,
                   d.name_en AS destination_name, 
                   d.name_en AS dest_name_en, 
                   d.travel_type, 
                   d.country AS destination_country
            FROM restaurants r
            LEFT JOIN destinations d ON r.destination_id = d.id
            WHERE 1=1
        `;
        const params = [];

        if (destination_id && destination_id !== 'all') {
            query += ' AND r.destination_id = ?';
            params.push(destination_id);
        }

        if (price_level && price_level !== 'all') {
            query += ' AND r.price_level = ?';
            params.push(price_level);
        }

        if (is_halal !== undefined && is_halal !== 'all') {
            query += ' AND r.is_halal = ?';
            params.push(is_halal === '1' || is_halal === 'true' ? 1 : 0);
        }

        if (is_vegetarian !== undefined && is_vegetarian !== 'all') {
            query += ' AND r.is_vegetarian = ?';
            params.push(is_vegetarian === '1' || is_vegetarian === 'true' ? 1 : 0);
        }

        if (search) {
            query += ' AND (r.name_en LIKE ? OR r.cuisine_type LIKE ? OR d.name_en LIKE ?)';
            const term = `%${search}%`;
            params.push(term, term, term);
        }

        query += ' ORDER BY r.id DESC';

        const [restaurants] = await pool.query(query, params);

        const [[counts]] = await pool.query(`
            SELECT 
                COUNT(*) as total_all,
                SUM(CASE WHEN is_halal = 1 THEN 1 ELSE 0 END) as total_halal,
                SUM(CASE WHEN is_vegetarian = 1 THEN 1 ELSE 0 END) as total_vegetarian,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as total_active
            FROM restaurants
        `);

        return res.json({
            success: true,
            restaurants,
            counts: {
                all: counts.total_all || 0,
                halal: counts.total_halal || 0,
                vegetarian: counts.total_vegetarian || 0,
                active: counts.total_active || 0
            }
        });
    } catch (error) {
        console.error('Error fetching restaurants:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch restaurants.' });
    }
};

// 2. Get restaurant by ID with prices
exports.getRestaurantById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(`
            SELECT r.*, d.name_en as destination_name, d.travel_type
            FROM restaurants r
            LEFT JOIN destinations d ON r.destination_id = d.id
            WHERE r.id = ?
        `, [id]);

        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Restaurant not found.' });

        const restaurant = rows[0];
        const [prices] = await pool.query('SELECT * FROM restaurant_prices WHERE restaurant_id = ?', [id]);
        restaurant.prices = prices;

        return res.json({ success: true, restaurant });
    } catch (error) {
        console.error('Error fetching restaurant details:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch restaurant details.' });
    }
};

// 3. Create restaurant
exports.createRestaurant = async (req, res) => {
    try {
        const {
            destination_id, name_en, name, name_bn, cuisine_type,
            price_level, is_halal, is_vegetarian, image_url, rating, is_active
        } = req.body;

        const restName = name_en || name;
        if (!restName || !destination_id) {
            return res.status(400).json({ success: false, message: 'Restaurant Name and Destination are required.' });
        }

        const [result] = await pool.query(`
            INSERT INTO restaurants (
                destination_id, name_en, name_bn, cuisine_type, price_level,
                is_halal, is_vegetarian, image_url, rating, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            destination_id, restName, name_bn || restName, cuisine_type || 'Multi-Cuisine',
            price_level || 'standard', is_halal ? 1 : 0, is_vegetarian ? 1 : 0,
            image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80',
            rating || 4.7, is_active !== undefined ? (is_active ? 1 : 0) : 1
        ]);

        return res.status(201).json({
            success: true,
            message: `Restaurant "${restName}" registered successfully!`,
            id: result.insertId,
            restaurant: {
                id: result.insertId,
                name_en: restName,
                destination_id,
                cuisine_type: cuisine_type || 'Multi-Cuisine',
                is_halal: is_halal ? 1 : 0
            }
        });
    } catch (error) {
        console.error('Error creating restaurant:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to create restaurant.' });
    }
};

// 4. Update restaurant
exports.updateRestaurant = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            destination_id, name_en, name_bn, cuisine_type,
            price_level, is_halal, is_vegetarian, image_url, rating, is_active
        } = req.body;

        await pool.query(`
            UPDATE restaurants SET
                destination_id = COALESCE(?, destination_id),
                name_en = COALESCE(?, name_en),
                name_bn = COALESCE(?, name_bn),
                cuisine_type = COALESCE(?, cuisine_type),
                price_level = COALESCE(?, price_level),
                is_halal = COALESCE(?, is_halal),
                is_vegetarian = COALESCE(?, is_vegetarian),
                image_url = COALESCE(?, image_url),
                rating = COALESCE(?, rating),
                is_active = COALESCE(?, is_active)
            WHERE id = ?
        `, [destination_id, name_en, name_bn, cuisine_type, price_level, is_halal, is_vegetarian, image_url, rating, is_active, id]);

        return res.json({ success: true, message: `Restaurant #${id} updated successfully.` });
    } catch (error) {
        console.error('Error updating restaurant:', error);
        return res.status(500).json({ success: false, message: 'Failed to update restaurant.' });
    }
};

// 5. Toggle restaurant status
exports.toggleRestaurantStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT is_active, status FROM restaurants WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Restaurant not found.' });
        const currentActive = rows[0].is_active === 1 || rows[0].status === 'active';
        const newActive = currentActive ? 0 : 1;
        const newStatus = newActive ? 'active' : 'inactive';
        await pool.query('UPDATE restaurants SET is_active = ?, status = ? WHERE id = ?', [newActive, newStatus, id]);
        return res.json({ success: true, message: `Status updated to ${newStatus}.`, newStatus });
    } catch (error) {
        console.error('Error toggling restaurant status:', error);
        return res.status(500).json({ success: false, message: 'Failed to toggle status.' });
    }
};

// 6. Delete restaurant
exports.deleteRestaurant = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM restaurant_prices WHERE restaurant_id = ?', [id]);
        await pool.query('DELETE FROM restaurants WHERE id = ?', [id]);
        return res.json({ success: true, message: `Restaurant #${id} deleted successfully.` });
    } catch (error) {
        console.error('Error deleting restaurant:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete restaurant.' });
    }
};
