const { pool } = require('../config/db');

// Get all packages with destination info
exports.getAllPackages = async (req, res) => {
    try {
        const query = `
            SELECT p.*, d.name_en AS destination_name_en, d.name_bn AS destination_name_bn, 
                   d.image_url AS destination_image, d.city, d.country
            FROM packages p
            JOIN destinations d ON p.destination_id = d.id
            ORDER BY p.id ASC
        `;
        const [packages] = await pool.query(query);

        return res.json({
            success: true,
            count: packages.length,
            data: packages
        });
    } catch (error) {
        console.error('Error fetching packages:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch packages', error: error.message });
    }
};

// Get single package details
exports.getPackageById = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT p.*, d.name_en AS destination_name_en, d.name_bn AS destination_name_bn, 
                   d.image_url AS destination_image, d.city, d.country, d.description_en AS dest_desc
            FROM packages p
            JOIN destinations d ON p.destination_id = d.id
            WHERE p.id = ?
        `;
        const [packages] = await pool.query(query, [id]);

        if (packages.length === 0) {
            return res.status(404).json({ success: false, message: 'Package not found' });
        }

        return res.json({
            success: true,
            data: packages[0]
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch package', error: error.message });
    }
};
