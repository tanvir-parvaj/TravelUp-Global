const { pool } = require('../config/db');

// 1. Admin Analytics Dashboard (Rule #43 & Rule #64)
exports.getAnalytics = async (req, res) => {
    try {
        const [[userCount]] = await pool.query('SELECT COUNT(*) AS total FROM users');
        const [[destCount]] = await pool.query('SELECT COUNT(*) AS total FROM destinations WHERE is_active = 1');
        const [[pkgCount]] = await pool.query('SELECT COUNT(*) AS total FROM packages WHERE is_active = 1');
        const [[tripCount]] = await pool.query('SELECT COUNT(*) AS total FROM custom_trips');
        const [[bookingStats]] = await pool.query(`
            SELECT COUNT(*) AS total_bookings, 
                   COALESCE(SUM(total_price), 0) AS total_revenue 
            FROM bookings
        `);
        const [[hotelCount]] = await pool.query('SELECT COUNT(*) AS total FROM hotels');
        const [[activityCount]] = await pool.query('SELECT COUNT(*) AS total FROM activities');

        res.json({
            success: true,
            analytics: {
                total_users: userCount.total,
                active_destinations: destCount.total,
                active_packages: pkgCount.total,
                custom_trips_built: tripCount.total,
                total_bookings: bookingStats.total_bookings,
                total_revenue: parseFloat(bookingStats.total_revenue),
                managed_hotels: hotelCount.total,
                managed_activities: activityCount.total
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 2. Get All Component Prices for Dynamic Pricing Engine UI
exports.getPricingComponents = async (req, res) => {
    try {
        const [hotels] = await pool.query(`
            SELECT hp.id, h.name_en AS title, 'hotel' AS type, hp.supplier_cost, hp.markup_percent, hp.selling_price 
            FROM hotel_prices hp 
            JOIN hotel_rooms hr ON hp.room_id = hr.id 
            JOIN hotels h ON hr.hotel_id = h.id
        `);
        const [activities] = await pool.query(`
            SELECT ap.id, a.name_en AS title, 'activity' AS type, ap.supplier_cost, ap.markup_percent, ap.adult_price AS selling_price 
            FROM activity_prices ap 
            JOIN activities a ON ap.activity_id = a.id
        `);
        const [transports] = await pool.query(`
            SELECT tp.id, t.title_en AS title, 'transport' AS type, tp.supplier_cost, tp.markup_percent, tp.selling_price 
            FROM transportation_prices tp 
            JOIN transportation t ON tp.transport_id = t.id
        `);

        return res.json({
            success: true,
            components: [...hotels, ...activities, ...transports]
        });
    } catch (err) {
        console.error('Error fetching pricing components:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// 3. Update Component Pricing with Automated Audit Logging (Rule #58 & Rule #59)
exports.updateComponentPrice = async (req, res) => {
    try {
        const {
            component_type, // 'hotel', 'activity', 'transport'
            component_id,
            new_supplier_cost,
            markup_percent = 20.00,
            reason = 'Supplier contract price revision'
        } = req.body;

        const markup = parseFloat(markup_percent);
        const supplier = parseFloat(new_supplier_cost);
        const newSellingPrice = Math.round(supplier * (1 + markup / 100));

        let oldSupplier = 0;
        let oldSelling = 0;
        let compName = '';

        if (component_type === 'hotel') {
            const [rows] = await pool.query(`
                SELECT hp.supplier_cost, hp.selling_price, h.name_en 
                FROM hotel_prices hp
                JOIN hotel_rooms hr ON hp.room_id = hr.id
                JOIN hotels h ON hr.hotel_id = h.id
                WHERE hp.id = ?
            `, [component_id]);
            if (rows.length > 0) {
                oldSupplier = rows[0].supplier_cost;
                oldSelling = rows[0].selling_price;
                compName = rows[0].name_en;
                await pool.query('UPDATE hotel_prices SET supplier_cost = ?, markup_percent = ?, selling_price = ? WHERE id = ?',
                    [supplier, markup, newSellingPrice, component_id]);
            }
        } else if (component_type === 'activity') {
            const [rows] = await pool.query(`
                SELECT ap.supplier_cost, ap.adult_price, a.name_en 
                FROM activity_prices ap
                JOIN activities a ON ap.activity_id = a.id
                WHERE ap.id = ?
            `, [component_id]);
            if (rows.length > 0) {
                oldSupplier = rows[0].supplier_cost;
                oldSelling = rows[0].adult_price;
                compName = rows[0].name_en;
                await pool.query('UPDATE activity_prices SET supplier_cost = ?, markup_percent = ?, adult_price = ? WHERE id = ?',
                    [supplier, markup, newSellingPrice, component_id]);
            }
        } else if (component_type === 'transport') {
            const [rows] = await pool.query(`
                SELECT tp.supplier_cost, tp.selling_price, t.title_en 
                FROM transportation_prices tp
                JOIN transportation t ON tp.transport_id = t.id
                WHERE tp.id = ?
            `, [component_id]);
            if (rows.length > 0) {
                oldSupplier = rows[0].supplier_cost;
                oldSelling = rows[0].selling_price;
                compName = rows[0].title_en;
                await pool.query('UPDATE transportation_prices SET supplier_cost = ?, markup_percent = ?, selling_price = ? WHERE id = ?',
                    [supplier, markup, newSellingPrice, component_id]);
            }
        }

        // Record in Price Audit Log
        await pool.query(`
            INSERT INTO price_audit_logs (
                component_type, component_id, component_name, 
                old_supplier_cost, new_supplier_cost, old_selling_price, 
                new_selling_price, changed_by_admin_id, reason
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
        `, [component_type, component_id, compName, oldSupplier, supplier, oldSelling, newSellingPrice, reason]);

        res.json({
            success: true,
            message: `Price successfully updated for ${compName}. Audit log recorded.`,
            component_type,
            new_supplier_cost: supplier,
            new_selling_price: newSellingPrice
        });
    } catch (err) {
        console.error('Error updating component price:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// 4. Get Price Audit Logs (Rule #59)
exports.getAuditLogs = async (req, res) => {
    try {
        const [logs] = await pool.query('SELECT * FROM price_audit_logs ORDER BY created_at DESC LIMIT 50');
        res.json({ success: true, count: logs.length, data: logs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 5. Financials & Accounting Ledger (For Accountant & Admin Roles)
exports.getFinancials = async (req, res) => {
    try {
        const [bookings] = await pool.query(`
            SELECT b.id, b.booking_ref, b.user_id, b.total_price, b.currency, b.status, b.created_at, b.special_notes,
                   u.name AS customer_name, u.email AS customer_email
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            ORDER BY b.created_at DESC
        `);

        let totalGrossUSD = 0;
        let stripeVolumeUSD = 0;
        let paypalVolumeUSD = 0;
        let bkashVolumeBDT = 0;
        let confirmedCount = 0;

        const transactions = bookings.map(b => {
            const notes = b.special_notes || '';
            let gateway = 'Credit Card (Stripe)';
            let trxId = 'TRX-' + b.booking_ref;

            if (notes.toLowerCase().includes('paypal')) gateway = 'PayPal Global';
            else if (notes.toLowerCase().includes('bkash')) gateway = 'bKash Merchant';
            else if (notes.toLowerCase().includes('sslcommerz')) gateway = 'SSLCommerz BD';
            else if (b.currency === 'BDT') gateway = 'bKash / Local MFS';

            const matchTrx = notes.match(/TrxID:\s*([^\s\]]+)/i);
            if (matchTrx) trxId = matchTrx[1];

            const numPrice = parseFloat(b.total_price) || 0;
            const priceInUSD = b.currency === 'BDT' ? numPrice / 120 : numPrice;

            if (b.status === 'confirmed') {
                confirmedCount++;
                totalGrossUSD += priceInUSD;
                if (gateway.includes('PayPal')) paypalVolumeUSD += priceInUSD;
                else if (gateway.includes('bKash') || gateway.includes('SSLCommerz')) bkashVolumeBDT += (b.currency === 'BDT' ? numPrice : numPrice * 120);
                else stripeVolumeUSD += priceInUSD;
            }

            return {
                id: b.id,
                booking_ref: b.booking_ref,
                customer_name: b.customer_name,
                customer_email: b.customer_email,
                date: b.created_at,
                amount: numPrice,
                amount_usd: priceInUSD,
                currency: b.currency || 'USD',
                gateway,
                trx_id: trxId,
                status: b.status
            };
        });

        res.json({
            success: true,
            summary: {
                total_transactions: bookings.length,
                confirmed_transactions: confirmedCount,
                total_gross_volume_usd: Math.round(totalGrossUSD),
                stripe_volume_usd: Math.round(stripeVolumeUSD),
                paypal_volume_usd: Math.round(paypalVolumeUSD),
                bkash_volume_bdt: Math.round(bkashVolumeBDT),
                platform_net_revenue_usd: Math.round(totalGrossUSD * 0.15)
            },
            transactions
        });
    } catch (err) {
        console.error('Error in getFinancials:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};
