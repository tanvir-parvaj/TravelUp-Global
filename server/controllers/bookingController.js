const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// Create a new booking
exports.createBooking = async (req, res) => {
    try {
        const {
            destination_id, package_id, start_date,
            travelers_count, currency, is_group, special_notes,
            customer_name, customer_email, customer_phone, payment_method, trx_id,
            travel_type, passport_number, nid_number
        } = req.body;

        let user_id = req.user ? req.user.id : null;
        let createdNewUser = false;
        let userToken = null;
        let currentUser = null;

        // If user is not already logged in, find or create account by email
        if (!user_id) {
            const email = (customer_email || 'guest@travelupglobal.com').trim().toLowerCase();
            const [existing] = await pool.query('SELECT id, name, email, role FROM users WHERE email = ?', [email]);
            if (existing.length > 0) {
                user_id = existing[0].id;
                currentUser = existing[0];
            } else {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash('TravelerPass2026!', salt);
                const userName = customer_name || 'Traveler';
                const [newUser] = await pool.query(
                    'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
                    [userName, email, hashedPassword, customer_phone || null, 'customer']
                );
                user_id = newUser.insertId;
                currentUser = { id: user_id, name: userName, email, role: 'customer' };
                createdNewUser = true;
            }

            userToken = jwt.sign(
                { id: currentUser.id, email: currentUser.email, role: currentUser.role, name: currentUser.name },
                process.env.JWT_SECRET || 'travelup_secret',
                { expiresIn: '7d' }
            );
        }

        if (!destination_id) {
            return res.status(400).json({ success: false, message: 'Destination is required.' });
        }

        // Fetch destination/package price & travel type
        let unitPriceBDT = 0;
        let unitPriceUSD = 0;
        let destTravelType = 'domestic';

        const [dests] = await pool.query('SELECT price_bdt, price_usd, travel_type FROM destinations WHERE id = ?', [destination_id]);
        if (dests.length > 0) {
            unitPriceBDT = parseFloat(dests[0].price_bdt);
            unitPriceUSD = parseFloat(dests[0].price_usd);
            if (dests[0].travel_type) destTravelType = dests[0].travel_type;
        }

        if (package_id) {
            const [pkgs] = await pool.query('SELECT price_bdt, price_usd FROM packages WHERE id = ?', [package_id]);
            if (pkgs.length > 0) {
                unitPriceBDT = parseFloat(pkgs[0].price_bdt);
                unitPriceUSD = parseFloat(pkgs[0].price_usd);
            }
        }

        const count = parseInt(travelers_count) || 1;
        const selectedCurrency = currency || 'USD';
        const calculatedPrice = (selectedCurrency === 'USD' ? unitPriceUSD : unitPriceBDT) * count;
        const totalPrice = req.body.total_price ? parseFloat(req.body.total_price) : (calculatedPrice || 1000);
        const finalTravelType = travel_type || destTravelType || 'domestic';
        const voucher_code = `VCH-${Math.floor(1000 + Math.random() * 9000)}`;

        // Generate unique reference
        const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
        const booking_ref = `TUG-${new Date().getFullYear()}-${randomHex}`;
        const group_code = is_group ? `GRP-${randomHex}` : null;
        const formattedStartDate = start_date || new Date().toISOString().split('T')[0];

        const notes = [
            special_notes,
            payment_method ? `[Payment: ${payment_method}${trx_id ? ` | TrxID: ${trx_id}` : ''}]` : null
        ].filter(Boolean).join(' ');

        const [result] = await pool.query(`
            INSERT INTO bookings 
            (booking_ref, user_id, destination_id, package_id, start_date, travelers_count, total_price, currency, status, is_group, group_code, special_notes, travel_type, passport_number, nid_number, voucher_code, payment_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, ?, ?, ?, ?, ?, 'paid')
        `, [
            booking_ref, user_id, destination_id, package_id || null,
            formattedStartDate, count, totalPrice, selectedCurrency,
            is_group ? 1 : 0, group_code, notes || null,
            finalTravelType, passport_number || null, nid_number || null, voucher_code
        ]);

        return res.status(201).json({
            success: true,
            message: 'Booking confirmed successfully!',
            booking: {
                id: result.insertId,
                booking_ref,
                voucher_code,
                travel_type: finalTravelType,
                passport_number,
                nid_number,
                destination_id,
                total_price: totalPrice,
                currency: selectedCurrency,
                start_date: formattedStartDate,
                travelers_count: count,
                group_code,
                payment_method,
                trx_id
            },
            userToken,
            currentUser
        });
    } catch (error) {
        console.error('Create booking error:', error);
        return res.status(500).json({ success: false, message: 'Failed to create booking: ' + error.message });
    }
};

// Get bookings for logged-in user
exports.getUserBookings = async (req, res) => {
    try {
        const user_id = req.user.id;
        const [bookings] = await pool.query(`
            SELECT b.*, d.name_en as dest_name_en, d.name_bn as dest_name_bn, d.image_url, d.city, d.country,
                   p.title_en as package_title_en, p.title_bn as package_title_bn
            FROM bookings b
            JOIN destinations d ON b.destination_id = d.id
            LEFT JOIN packages p ON b.package_id = p.id
            WHERE b.user_id = ?
            ORDER BY b.created_at DESC
        `, [user_id]);

        return res.json({ success: true, count: bookings.length, bookings });
    } catch (error) {
        console.error('Fetch bookings error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch bookings.' });
    }
};

// Admin: Get all bookings
exports.getAllBookings = async (req, res) => {
    try {
        const [bookings] = await pool.query(`
            SELECT b.*, u.name as customer_name, u.email as customer_email,
                   d.name_en as dest_name_en, d.name_bn as dest_name_bn
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN destinations d ON b.destination_id = d.id
            ORDER BY b.created_at DESC
        `);

        return res.json({ success: true, count: bookings.length, bookings });
    } catch (error) {
        console.error('Admin fetch bookings error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch all bookings.' });
    }
};

// Admin: Update booking status (confirmed, pending, cancelled)
exports.updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['confirmed', 'pending', 'cancelled'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status. Must be confirmed, pending, or cancelled.' });
        }

        await pool.query('UPDATE bookings SET status = ? WHERE id = ?', [status, id]);
        return res.json({ success: true, message: `Booking #${id} status successfully changed to ${status}.` });
    } catch (error) {
        console.error('Update booking status error:', error);
        return res.status(500).json({ success: false, message: 'Failed to update booking status.' });
    }
};
