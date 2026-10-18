const { pool } = require('../config/db');

// 1. Get all packages with filters
exports.getPackages = async (req, res) => {
    try {
        const { destination_id, travel_style, max_price, travel_type } = req.query;
        let query = `
            SELECT p.*, d.name_en AS destination_name, d.country, d.travel_type, d.image_url AS destination_image
            FROM packages p
            JOIN destinations d ON p.destination_id = d.id
            WHERE p.is_active = 1
        `;
        const params = [];

        if (travel_type) {
            query += ' AND d.travel_type = ?';
            params.push(travel_type);
        }
        if (destination_id) {
            query += ' AND p.destination_id = ?';
            params.push(destination_id);
        }
        if (travel_style) {
            query += ' AND p.travel_style = ?';
            params.push(travel_style);
        }
        if (max_price) {
            query += ' AND p.price_usd <= ?';
            params.push(max_price);
        }

        const [packages] = await pool.query(query, params);
        res.json({ success: true, count: packages.length, data: packages });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 2. Get single package by ID with add-ons and itinerary
exports.getPackageById = async (req, res) => {
    try {
        const pkgId = req.params.id;
        const [pkgRows] = await pool.query(`
            SELECT p.*, d.name_en AS destination_name, d.country, d.travel_type, d.image_url AS destination_image, d.currency_code
            FROM packages p
            JOIN destinations d ON p.destination_id = d.id
            WHERE p.id = ?
        `, [pkgId]);

        if (pkgRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Package not found' });
        }

        // Fetch optional add-ons
        const [addons] = await pool.query('SELECT * FROM package_addons WHERE package_id = ? AND is_active = 1', [pkgId]);

        res.json({
            success: true,
            package: pkgRows[0],
            addons
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 3. Calculate dynamic package total with optional add-ons (Rule #24)
exports.calculatePackagePrice = async (req, res) => {
    try {
        const { package_id, travelers = 2, selected_addon_ids = [] } = req.body;
        const [pkgRows] = await pool.query('SELECT price_usd FROM packages WHERE id = ?', [package_id]);
        if (pkgRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Package not found' });
        }

        const basePersonPrice = parseFloat(pkgRows[0].price_usd);
        let baseTotal = basePersonPrice * parseInt(travelers);
        let addonsTotal = 0;
        const itemizedAddons = [];

        if (selected_addon_ids.length > 0) {
            const [addonRows] = await pool.query('SELECT * FROM package_addons WHERE id IN (?)', [selected_addon_ids]);
            for (const add of addonRows) {
                addonsTotal += parseFloat(add.price);
                itemizedAddons.push({
                    title: add.addon_title_en,
                    price: parseFloat(add.price)
                });
            }
        }

        const finalTotal = baseTotal + addonsTotal;

        res.json({
            success: true,
            package_id,
            travelers: parseInt(travelers),
            base_price_per_person: basePersonPrice,
            base_total: baseTotal,
            addons_total: addonsTotal,
            selected_addons: itemizedAddons,
            final_total: finalTotal
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 4. Admin: Create new package
exports.createPackage = async (req, res) => {
    try {
        const {
            destination_id, title_en, title_bn, duration_days,
            price_bdt, price_usd, included_services, discount_percent
        } = req.body;

        const [result] = await pool.query(`
            INSERT INTO packages 
            (destination_id, title_en, title_bn, duration_days, price_bdt, price_usd, included_services, discount_percent, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        `, [
            destination_id || 1, title_en, title_bn || title_en, parseInt(duration_days) || 5,
            price_bdt || (price_usd * 120), price_usd || 699, included_services || 'Flight, Hotel, Tour', discount_percent || 0
        ]);

        res.status(201).json({ success: true, message: 'Package created successfully!', id: result.insertId });
    } catch (err) {
        console.error('Create package error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// 5. Admin: Delete package
exports.deletePackage = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM packages WHERE id = ?', [id]);
        res.json({ success: true, message: `Package #${id} deleted successfully.` });
    } catch (err) {
        console.error('Delete package error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

