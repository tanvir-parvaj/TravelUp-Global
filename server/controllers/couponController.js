const { pool } = require('../config/db');

// 1. Get all coupons
exports.getAllCoupons = async (req, res) => {
    try {
        const [coupons] = await pool.query('SELECT * FROM coupons ORDER BY id DESC');
        return res.json({ success: true, coupons });
    } catch (error) {
        console.error('Error fetching coupons:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch coupons.' });
    }
};

// 2. Validate and apply coupon during booking
exports.validateCoupon = async (req, res) => {
    try {
        const { code, total_amount, travel_type } = req.body;

        if (!code) {
            return res.status(400).json({ success: false, message: 'Coupon code is required.' });
        }

        const cleanCode = code.trim().toUpperCase();
        const [rows] = await pool.query('SELECT * FROM coupons WHERE code = ? AND status = "active"', [cleanCode]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Invalid or inactive promo code.' });
        }

        const coupon = rows[0];

        // Expiry check
        if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
            return res.status(400).json({ success: false, message: 'This promo code has expired.' });
        }

        // Travel type check
        if (coupon.travel_type !== 'all' && travel_type && coupon.travel_type !== travel_type) {
            return res.status(400).json({
                success: false,
                message: `This promo code is only valid for ${coupon.travel_type} trips.`
            });
        }

        const amount = parseFloat(total_amount) || 0;
        if (amount < parseFloat(coupon.min_booking_amount || 0)) {
            return res.status(400).json({
                success: false,
                message: `Minimum booking amount for this code is ${coupon.min_booking_amount}.`
            });
        }

        let discount = 0;
        if (coupon.discount_type === 'percentage') {
            discount = (amount * parseFloat(coupon.discount_value)) / 100;
            const maxCap = parseFloat(coupon.max_discount_amount || 99999);
            if (discount > maxCap) discount = maxCap;
        } else {
            discount = Math.min(parseFloat(coupon.discount_value), amount);
        }

        discount = Math.round(discount * 100) / 100;
        const finalAmount = Math.max(0, amount - discount);

        return res.json({
            success: true,
            valid: true,
            message: `Coupon "${cleanCode}" applied! You save $${discount}.`,
            discount,
            final_amount: finalAmount,
            coupon: {
                id: coupon.id,
                code: coupon.code,
                title: coupon.title,
                discount_type: coupon.discount_type,
                discount_value: coupon.discount_value
            }
        });
    } catch (error) {
        console.error('Error validating coupon:', error);
        return res.status(500).json({ success: false, message: 'Failed to validate coupon.' });
    }
};

// 3. Create coupon
exports.createCoupon = async (req, res) => {
    try {
        const {
            code, title, discount_type, discount_value,
            min_booking_amount, max_discount_amount, travel_type, valid_until
        } = req.body;

        if (!code || !title || !discount_value) {
            return res.status(400).json({ success: false, message: 'Code, Title, and Discount Value are required.' });
        }

        const cleanCode = code.trim().toUpperCase();

        const [result] = await pool.query(`
            INSERT INTO coupons (
                code, title, discount_type, discount_value,
                min_booking_amount, max_discount_amount, travel_type, valid_until, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
        `, [
            cleanCode, title, discount_type || 'percentage', discount_value,
            min_booking_amount || 0, max_discount_amount || 100, travel_type || 'all',
            valid_until || null
        ]);

        return res.status(201).json({
            success: true,
            message: `Coupon "${cleanCode}" created successfully!`,
            id: result.insertId,
            code: cleanCode
        });
    } catch (error) {
        console.error('Error creating coupon:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to create coupon.' });
    }
};

// 4. Delete coupon
exports.deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM coupons WHERE id = ?', [id]);
        return res.json({ success: true, message: `Coupon #${id} deleted successfully.` });
    } catch (error) {
        console.error('Error deleting coupon:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete coupon.' });
    }
};
