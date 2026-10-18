const { pool } = require('../config/db');

// Get all destinations with filtering & accessibility options (Scenario 6)
exports.getAllDestinations = async (req, res) => {
    try {
        const { category, search, country, accessible_only, featured } = req.query;
        let query = 'SELECT * FROM destinations WHERE (status IS NULL OR status = "active") AND (deleted_at IS NULL)';
        const params = [];

        if (category && category !== 'all') {
            query += ' AND (category = ? OR travel_type = ?)';
            params.push(category, category);
        }

        if (country) {
            query += ' AND country = ?';
            params.push(country);
        }

        if (featured === 'true') {
            query += ' AND (is_featured = 1 OR is_popular = 1)';
        }

        if (search) {
            query += ' AND (name_en LIKE ? OR name_bn LIKE ? OR city LIKE ? OR country LIKE ?)';
            const term = `%${search}%`;
            params.push(term, term, term, term);
        }

        query += ' ORDER BY rating DESC, id ASC';

        const [destinations] = await pool.query(query, params);

        return res.json({
            success: true,
            count: destinations.length,
            data: destinations
        });
    } catch (error) {
        console.error('Error fetching destinations:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch destinations', error: error.message });
    }
};

// Get single destination by ID or Slug
exports.getDestinationById = async (req, res) => {
    try {
        const { id } = req.params;
        const isNumeric = !isNaN(id);
        const query = isNumeric 
            ? 'SELECT * FROM destinations WHERE id = ?' 
            : 'SELECT * FROM destinations WHERE slug = ? OR canonical_slug = ?';
        
        const [destinations] = await pool.query(query, isNumeric ? [id] : [id, id]);

        if (destinations.length === 0) {
            return res.status(404).json({ success: false, message: 'Destination not found' });
        }

        const destination = destinations[0];

        // Fetch associated hotels
        const [hotels] = await pool.query(
            'SELECT * FROM hotels WHERE destination_id = ? AND (is_active = 1 OR is_active IS NULL)',
            [destination.id]
        );

        // Fetch associated packages
        const [packages] = await pool.query(
            'SELECT * FROM packages WHERE destination_id = ?',
            [destination.id]
        );

        return res.json({
            success: true,
            data: {
                ...destination,
                hotels,
                packages
            }
        });
    } catch (error) {
        console.error('Error fetching destination details:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch destination details', error: error.message });
    }
};

// Get hotels for a specific destination with accessibility filter (Scenario 6)
exports.getHotelsByDestination = async (req, res) => {
    try {
        const { id } = req.params;
        const { accessible_only, tier } = req.query;

        let query = 'SELECT * FROM hotels WHERE destination_id = ?';
        const params = [id];

        if (tier) {
            query += ' AND tier = ?';
            params.push(tier);
        }

        const [hotels] = await pool.query(query, params);

        // Scenario 6: Strict Accessibility & Medical Ground Constraints
        // If accessible_only is true, filter for ground floor / elevator amenities
        let filteredHotels = hotels;
        if (accessible_only === 'true') {
            filteredHotels = hotels.filter(h => {
                const amenities = (h.amenities_json || '').toLowerCase();
                const desc = (h.description_en || '').toLowerCase();
                return amenities.includes('elevator') || amenities.includes('wheelchair') || 
                       amenities.includes('ground floor') || desc.includes('accessible');
            });
        }

        return res.json({
            success: true,
            count: filteredHotels.length,
            data: filteredHotels
        });
    } catch (error) {
        console.error('Error fetching hotels:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch hotels', error: error.message });
    }
};
