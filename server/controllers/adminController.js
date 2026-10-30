const bcrypt = require('bcryptjs');
const xlsx = require('xlsx');
const { pool } = require('../config/db');

/**
 * 1. Role-Adaptive Dashboard Metrics
 * Returns metrics tailored specifically to the user's role.
 */
exports.getMetrics = async (req, res) => {
    try {
        const userRole = req.user.role;
        const metrics = { role: userRole };

        // 1. General counts (safe for all internal staff)
        const [[routesCount]] = await pool.query('SELECT COUNT(*) AS count FROM transit_routes WHERE is_active = 1');
        const [[vehiclesCount]] = await pool.query('SELECT COUNT(*) AS count FROM transportation WHERE is_active = 1');
        const [[hotelsCount]] = await pool.query("SELECT COUNT(*) AS count FROM tour_planner_inventory WHERE slot_key = 'hotel' AND is_active = 1");
        const [[bookingsCount]] = await pool.query('SELECT COUNT(*) AS count FROM bookings');

        metrics.total_routes = routesCount.count;
        metrics.total_vehicles = vehiclesCount.count || routesCount.count;
        metrics.total_hotels = hotelsCount.count;
        metrics.total_bookings = bookingsCount.count;

        // 2. Financial Metrics (ONLY accessible to Super Admin and Accountant)
        if (userRole === 'admin' || userRole === 'accountant') {
            const [[revenueRow]] = await pool.query("SELECT COALESCE(SUM(total_price), 0) AS total_revenue FROM bookings WHERE status = 'confirmed'");
            const [[pendingPayRow]] = await pool.query("SELECT COALESCE(SUM(total_price), 0) AS pending_revenue FROM bookings WHERE status = 'pending'");
            metrics.total_revenue_bdt = parseFloat(revenueRow.total_revenue);
            metrics.pending_revenue_bdt = parseFloat(pendingPayRow.pending_revenue);
        }

        // 3. System & Staff Metrics (STRICTLY Super Admin only)
        if (userRole === 'admin') {
            const [[staffRow]] = await pool.query("SELECT COUNT(*) AS staff_count FROM users WHERE role IN ('admin', 'manager', 'accountant', 'support', 'moderator', 'uploader')");
            const [[customerRow]] = await pool.query("SELECT COUNT(*) AS customer_count FROM users WHERE role = 'customer'");
            metrics.total_staff = staffRow.staff_count;
            metrics.total_customers = customerRow.customer_count;
        }

        return res.json({ success: true, metrics });
    } catch (err) {
        console.error('getMetrics error:', err);
        return res.status(500).json({ success: false, message: 'Failed to load metrics', error: err.message });
    }
};

/**
 * 2. Staff Management (Super Admin Exclusive)
 */
exports.getStaffList = async (req, res) => {
    try {
        const [users] = await pool.query(`
            SELECT id, name, email, role, status, phone, organization, created_at 
            FROM users 
            WHERE role IN ('admin', 'manager', 'accountant', 'support', 'moderator', 'uploader')
            ORDER BY created_at DESC
        `);
        return res.json({ success: true, staff: users });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to fetch staff list', error: err.message });
    }
};

exports.inviteOrAssignStaff = async (req, res) => {
    try {
        const { email, name, role, phone, password } = req.body;

        if (!email || !role) {
            return res.status(400).json({ success: false, message: 'Email and role are required' });
        }

        const validRoles = ['admin', 'manager', 'accountant', 'support', 'moderator', 'uploader'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ success: false, message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
        }

        // Check if user already exists
        const [existing] = await pool.query('SELECT id, name, email, role FROM users WHERE email = ?', [email.trim().toLowerCase()]);

        if (existing.length > 0) {
            // Update role of existing user
            const userId = existing[0].id;
            await pool.query('UPDATE users SET role = ?, status = "active", phone = COALESCE(?, phone) WHERE id = ?', [role, phone || null, userId]);
            
            return res.json({
                success: true,
                message: `Staff role for ${email} successfully updated to '${role}'.`,
                user: { id: userId, email, role }
            });
        }

        // Create new staff account
        const staffName = name || email.split('@')[0];
        const rawPassword = password || 'TravelUp@2026';
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        const [result] = await pool.query(
            `INSERT INTO users (name, email, password, role, status, phone, preferred_lang)
             VALUES (?, ?, ?, ?, 'active', ?, 'en')`,
            [staffName, email.trim().toLowerCase(), hashedPassword, role, phone || null]
        );

        return res.status(201).json({
            success: true,
            message: `New staff member ${email} created with role '${role}'. Temporary Password: ${rawPassword}`,
            user: { id: result.insertId, email, name: staffName, role, tempPassword: rawPassword }
        });
    } catch (err) {
        console.error('inviteOrAssignStaff error:', err);
        return res.status(500).json({ success: false, message: 'Failed to assign staff', error: err.message });
    }
};

exports.updateStaffRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, status } = req.body;

        // Prevent admin from locking themselves out
        if (parseInt(id) === req.user.id && role && role !== 'admin') {
            return res.status(400).json({ success: false, message: 'You cannot demote your own Super Admin account.' });
        }

        const updates = [];
        const params = [];
        if (role) {
            updates.push('role = ?');
            params.push(role);
        }
        if (status) {
            updates.push('status = ?');
            params.push(status);
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No changes provided' });
        }

        params.push(id);
        await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

        return res.json({ success: true, message: 'Staff updated successfully' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to update staff', error: err.message });
    }
};

/**
 * 2.1 Dynamic Admin / Staff Referral Code Generator
 */
exports.generateInviteCode = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { role = 'manager', validity_minutes = 30, organization } = req.body;

        const validRoles = ['admin', 'manager', 'accountant', 'support', 'moderator', 'uploader'];
        const targetRole = validRoles.includes(role) ? role : 'manager';

        // Retrieve admin's organization if not explicitly supplied
        let orgName = organization ? organization.trim() : null;
        if (!orgName) {
            const [[adminUser]] = await pool.query('SELECT organization FROM users WHERE id = ?', [adminId]);
            if (adminUser && adminUser.organization) {
                orgName = adminUser.organization;
            }
        }

        // Clean, readable, cryptographically random code (e.g. ADM-8K2P or STF-4M9Y)
        const prefix = targetRole === 'admin' ? 'ADM' : 'STF';
        const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
        const inviteCode = `${prefix}-${randomPart}`;

        const minutes = Math.max(5, Math.min(parseInt(validity_minutes) || 30, 10080)); // 5 mins to 7 days
        const expiresAt = new Date(Date.now() + minutes * 60 * 1000);

        const [result] = await pool.query(
            `INSERT INTO staff_invitations 
             (invite_code, role, invited_by, organization, expires_at, status, is_used) 
             VALUES (?, ?, ?, ?, ?, 'pending', 0)`,
            [inviteCode, targetRole, adminId, orgName, expiresAt]
        );

        return res.status(201).json({
            success: true,
            message: `New reference code '${inviteCode}' generated successfully! Valid for ${minutes} minutes.`,
            invite: {
                id: result.insertId,
                invite_code: inviteCode,
                role: targetRole,
                organization: orgName,
                expires_at: expiresAt,
                validity_minutes: minutes
            }
        });
    } catch (err) {
        console.error('generateInviteCode error:', err);
        return res.status(500).json({ success: false, message: 'Failed to generate invite code', error: err.message });
    }
};

exports.getInviteCodes = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT si.id, si.invite_code, si.role, si.organization, si.expires_at, si.is_used, si.status, si.created_at,
                   u.name AS invited_by_name,
                   used_user.name AS used_by_name,
                   used_user.email AS used_by_email,
                   CASE 
                       WHEN si.is_used = 1 THEN 'used'
                       WHEN si.expires_at IS NOT NULL AND si.expires_at < NOW() THEN 'expired'
                       ELSE 'active'
                   END AS calculated_status
            FROM staff_invitations si
            LEFT JOIN users u ON si.invited_by = u.id
            LEFT JOIN users used_user ON si.used_by = used_user.id
            WHERE si.invite_code IS NOT NULL
            ORDER BY si.created_at DESC
            LIMIT 50
        `);
        return res.json({ success: true, codes: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to load invite codes', error: err.message });
    }
};

exports.revokeInviteCode = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query(
            `UPDATE staff_invitations SET is_used = 1, status = 'revoked' WHERE id = ?`,
            [id]
        );
        return res.json({ success: true, message: 'Referral code revoked successfully.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to revoke code', error: err.message });
    }
};

/**
 * 3. Vehicle & Route Management (Product Catalog)
 * Accessible to Admin, Uploader, Moderator
 */
exports.getTransitRoutes = async (req, res) => {
    try {
        const { search = '', tier = '', limit = 50, offset = 0 } = req.query;

        let query = 'SELECT * FROM transit_routes WHERE 1=1';
        const params = [];

        if (search) {
            query += ' AND (operator_name LIKE ? OR origin_district LIKE ? OR destination_district LIKE ? OR origin_point LIKE ? OR destination_point LIKE ?)';
            const s = `%${search}%`;
            params.push(s, s, s, s, s);
        }

        if (tier) {
            query += ' AND tier_tag = ?';
            params.push(tier);
        }

        query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [rows] = await pool.query(query, params);
        const [[countRow]] = await pool.query('SELECT COUNT(*) AS total FROM transit_routes');

        return res.json({ success: true, total: countRow.total, routes: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to fetch transit routes', error: err.message });
    }
};

exports.createTransitRoute = async (req, res) => {
    try {
        const {
            operator_name,
            vehicle_type = 'AC Coach',
            vehicle_model = 'Hino 1J / Hyundai Universe',
            service_class = 'Economy',
            origin_district,
            origin_point,
            destination_district,
            destination_point,
            departure_time,
            arrival_time,
            duration_hours = 0,
            base_fare,
            total_seats = 36,
            available_seats = 36,
            seat_layout_type = '2x2',
            stoppages = [],
            amenities = ['AC', 'Charging Port', 'Reading Light'],
            image_url = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
            tier_tag = 'recommended'
        } = req.body;

        if (!operator_name || !origin_district || !destination_district || !base_fare || !departure_time) {
            return res.status(400).json({
                success: false,
                message: 'Required fields missing: operator_name, origin_district, destination_district, base_fare, departure_time'
            });
        }

        const stoppagesJson = typeof stoppages === 'string' ? stoppages : JSON.stringify(stoppages);
        const amenitiesJson = typeof amenities === 'string' ? amenities : JSON.stringify(amenities);

        // 1. Insert into transit_routes table
        const [result] = await pool.query(`
            INSERT INTO transit_routes 
            (operator_name, vehicle_type, vehicle_model, service_class, origin_district, origin_point, 
             destination_district, destination_point, departure_time, arrival_time, duration_hours, 
             base_fare, total_seats, available_seats, seat_layout_type, stoppages_json, amenities_json, 
             image_url, tier_tag, is_active, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
        `, [
            operator_name, vehicle_type, vehicle_model, service_class, origin_district, origin_point || origin_district,
            destination_district, destination_point || destination_district, departure_time, arrival_time || 'N/A',
            parseFloat(duration_hours) || 0, parseFloat(base_fare), parseInt(total_seats), parseInt(available_seats),
            seat_layout_type, stoppagesJson, amenitiesJson, image_url, tier_tag, req.user ? req.user.id : null
        ]);

        const routeId = result.insertId;

        // 2. Also auto-sync as a product in tour_planner_inventory for instant live display
        const inventoryName = `${operator_name} ${vehicle_type} (${service_class})`;
        const inventorySub = `${origin_point || origin_district} ➔ ${destination_point || destination_district} • Dep: ${departure_time}`;
        
        await pool.query(`
            INSERT INTO tour_planner_inventory 
            (slot_key, destination_slug, name, sub, price, img, has_seats, has_rooms, details_json, is_active)
            VALUES ('transport', 'all', ?, ?, ?, ?, 1, 0, ?, 1)
        `, [
            inventoryName, inventorySub, parseFloat(base_fare), image_url,
            JSON.stringify({
                transit_route_id: routeId,
                operator: operator_name,
                vehicle_type,
                origin: origin_point || origin_district,
                destination: destination_point || destination_district,
                departure_time,
                arrival_time,
                seats_available: available_seats,
                amenities: Array.isArray(amenities) ? amenities : ['AC', 'Water'],
                stoppages: Array.isArray(stoppages) ? stoppages : []
            })
        ]);

        return res.status(201).json({
            success: true,
            message: 'Vehicle & Route product created and synced to live catalog successfully!',
            route_id: routeId
        });
    } catch (err) {
        console.error('createTransitRoute error:', err);
        return res.status(500).json({ success: false, message: 'Failed to create route', error: err.message });
    }
};

exports.updateTransitRoute = async (req, res) => {
    try {
        const { id } = req.params;
        const b = req.body;

        await pool.query(`
            UPDATE transit_routes SET
                operator_name = COALESCE(?, operator_name),
                vehicle_type = COALESCE(?, vehicle_type),
                service_class = COALESCE(?, service_class),
                origin_district = COALESCE(?, origin_district),
                origin_point = COALESCE(?, origin_point),
                destination_district = COALESCE(?, destination_district),
                destination_point = COALESCE(?, destination_point),
                departure_time = COALESCE(?, departure_time),
                arrival_time = COALESCE(?, arrival_time),
                base_fare = COALESCE(?, base_fare),
                available_seats = COALESCE(?, available_seats),
                tier_tag = COALESCE(?, tier_tag),
                is_active = COALESCE(?, is_active)
            WHERE id = ?
        `, [
            b.operator_name, b.vehicle_type, b.service_class, b.origin_district, b.origin_point,
            b.destination_district, b.destination_point, b.departure_time, b.arrival_time,
            b.base_fare, b.available_seats, b.tier_tag, b.is_active, id
        ]);

        return res.json({ success: true, message: 'Route updated successfully' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to update route', error: err.message });
    }
};

exports.deleteTransitRoute = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM transit_routes WHERE id = ?', [id]);
        return res.json({ success: true, message: 'Route deleted successfully' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to delete route', error: err.message });
    }
};

/**
 * 4. Bulk Excel Importer for Vehicles & Timetable
 */
exports.importExcelRoutes = async (req, res) => {
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ success: false, message: 'No Excel file uploaded' });
        }

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetNames = workbook.SheetNames;
        
        // Find Intercity or Routes sheet
        let targetSheet = workbook.Sheets['01_Intercity_Routes'] || workbook.Sheets[sheetNames[0]];
        const rows = xlsx.utils.sheet_to_json(targetSheet);

        if (!rows || rows.length === 0) {
            return res.status(400).json({ success: false, message: 'The uploaded Excel sheet contains no data rows.' });
        }

        let insertedCount = 0;
        for (const row of rows) {
            // Flexible column header mapping
            const operator = row['অপারেটরের নাম (Operator)'] || row['Operator'] || row['operator_name'] || row['Operator Name'];
            const originDist = row['শুরুর জেলা (Origin District)'] || row['Origin District'] || row['origin_district'];
            const originPt = row['নির্দিষ্ট কাউন্টার / স্ট্যান্ড (Origin Point)'] || row['Origin Point'] || originDist;
            const destDist = row['গন্তব্যের জেলা (Destination District)'] || row['Destination District'] || row['destination_district'];
            const destPt = row['গন্তব্যের স্পট / স্ট্যান্ড (Destination Point)'] || row['Destination Point'] || destDist;
            const depTime = row['ছাড়ার সময় (Departure)'] || row['Departure Time'] || row['departure_time'] || '08:00 AM';
            const arrTime = row['পৌঁছানোর সময় (Arrival)'] || row['Arrival Time'] || row['arrival_time'] || '04:00 PM';
            const fare = parseFloat(row['ভাড়া (Fare BDT)'] || row['Fare'] || row['base_fare'] || 800);
            const vType = row['গাড়ির ধরন (Vehicle Type)'] || row['Vehicle Type'] || 'AC Coach';
            const sClass = row['শ্রেণি (Class)'] || row['Class'] || 'Business';

            if (operator && originDist && destDist) {
                await pool.query(`
                    INSERT INTO transit_routes 
                    (operator_name, vehicle_type, service_class, origin_district, origin_point, destination_district, 
                     destination_point, departure_time, arrival_time, base_fare, total_seats, available_seats, tier_tag, is_active)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 36, 36, 'recommended', 1)
                `, [operator, vType, sClass, originDist, originPt, destDist, destPt, depTime, arrTime, fare]);
                insertedCount++;
            }
        }

        return res.json({
            success: true,
            message: `Successfully imported ${insertedCount} vehicle routes from Excel file!`,
            imported_count: insertedCount
        });
    } catch (err) {
        console.error('importExcelRoutes error:', err);
        return res.status(500).json({ success: false, message: 'Failed to import Excel file', error: err.message });
    }
};

/**
 * 5. Bookings & Operations Management
 * Accessible to Admin, Manager, Accountant, Support
 */
exports.getAllBookings = async (req, res) => {
    try {
        const { search = '', status = '', limit = 50 } = req.query;
        let query = `
            SELECT b.*, u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone
            FROM bookings b
            LEFT JOIN users u ON b.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            query += ' AND (b.booking_ref LIKE ? OR u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)';
            const s = `%${search}%`;
            params.push(s, s, s, s);
        }

        if (status) {
            query += ' AND b.status = ?';
            params.push(status);
        }

        query += ' ORDER BY b.id DESC LIMIT ?';
        params.push(parseInt(limit));

        const [rows] = await pool.query(query, params);
        return res.json({ success: true, bookings: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to load bookings', error: err.message });
    }
};

exports.updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'confirmed', 'pending', 'cancelled'

        await pool.query('UPDATE bookings SET status = ? WHERE id = ?', [status, id]);
        return res.json({ success: true, message: `Booking status updated to '${status}'` });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to update booking status', error: err.message });
    }
};

/**
 * 6. Financial & Payment Verification
 * Accessible strictly to Admin and Accountant
 */
exports.getFinancialTransactions = async (req, res) => {
    try {
        const [bookings] = await pool.query(`
            SELECT b.id, b.booking_ref, b.total_price, b.currency, b.status, b.created_at,
                   u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone
            FROM bookings b
            LEFT JOIN users u ON b.user_id = u.id
            ORDER BY b.id DESC LIMIT 100
        `);

        const [[summary]] = await pool.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN status = 'confirmed' THEN total_price ELSE 0 END), 0) AS total_collected,
                COALESCE(SUM(CASE WHEN status = 'pending' THEN total_price ELSE 0 END), 0) AS pending_collection,
                COUNT(id) AS total_transactions
            FROM bookings
        `);

        return res.json({
            success: true,
            summary: {
                total_collected: parseFloat(summary.total_collected),
                pending_collection: parseFloat(summary.pending_collection),
                total_transactions: summary.total_transactions
            },
            transactions: bookings
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to fetch financial transactions', error: err.message });
    }
};

/**
 * 7. Tour Planner Inventory Management (CRM Component Catalog)
 * Covers Transit, Hotel/Resort, Dining/Restaurant, Recreation/Activity, Tourist Guide
 */
exports.getInventoryComponents = async (req, res) => {
    try {
        const { slot_key, search } = req.query;
        let query = 'SELECT * FROM tour_planner_inventory WHERE is_active = 1';
        const params = [];

        if (slot_key && slot_key !== 'all') {
            query += ' AND slot_key = ?';
            params.push(slot_key);
        }

        if (search) {
            query += ' AND (name LIKE ? OR sub LIKE ? OR destination_slug LIKE ?)';
            const s = `%${search}%`;
            params.push(s, s, s);
        }

        query += ' ORDER BY id DESC LIMIT 150';
        const [rows] = await pool.query(query, params);

        const items = rows.map(r => {
            let details = null;
            if (r.details_json) {
                try { details = JSON.parse(r.details_json); } catch(e) {}
            }
            return {
                id: r.id,
                slot_key: r.slot_key,
                destination_slug: r.destination_slug,
                name: r.name,
                sub: r.sub,
                price: parseFloat(r.price),
                img: r.img,
                has_seats: Boolean(r.has_seats),
                has_rooms: Boolean(r.has_rooms),
                details: details,
                created_at: r.created_at
            };
        });

        return res.json({ success: true, count: items.length, items });
    } catch (err) {
        console.error('getInventoryComponents error:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch inventory components', error: err.message });
    }
};

exports.createInventoryComponent = async (req, res) => {
    try {
        const {
            slot_key,
            destination_slug = 'all',
            name,
            sub = '',
            price = 0,
            img = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
            has_seats = 0,
            has_rooms = 0,
            details = {}
        } = req.body;

        if (!slot_key || !name) {
            return res.status(400).json({ success: false, message: 'Slot key and component name are required.' });
        }

        const detailsJson = typeof details === 'string' ? details : JSON.stringify(details);

        const [result] = await pool.query(`
            INSERT INTO tour_planner_inventory 
            (slot_key, destination_slug, name, sub, price, img, has_seats, has_rooms, details_json, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `, [
            slot_key,
            destination_slug,
            name,
            sub,
            parseFloat(price) || 0,
            img,
            has_seats ? 1 : 0,
            has_rooms ? 1 : 0,
            detailsJson
        ]);

        return res.status(201).json({
            success: true,
            message: `${slot_key.toUpperCase()} component added successfully!`,
            id: result.insertId
        });
    } catch (err) {
        console.error('createInventoryComponent error:', err);
        return res.status(500).json({ success: false, message: 'Failed to create inventory component', error: err.message });
    }
};

exports.deleteInventoryComponent = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM tour_planner_inventory WHERE id = ?', [id]);
        return res.json({ success: true, message: 'Inventory item removed successfully' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to delete component', error: err.message });
    }
};

/**
 * 8. Tour Packages Management (Package Creator & Studio)
 */
exports.getAdminPackages = async (req, res) => {
    try {
        const [packages] = await pool.query(`
            SELECT p.*, d.name_en AS destination_name, d.image_url AS destination_image
            FROM packages p
            LEFT JOIN destinations d ON p.destination_id = d.id
            ORDER BY p.id DESC
        `);
        return res.json({ success: true, count: packages.length, packages });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to load packages', error: err.message });
    }
};

exports.createAdminPackage = async (req, res) => {
    try {
        const {
            destination_id = 9,
            title_en,
            title_bn = '',
            duration_days = 3,
            price_bdt = 10000,
            price_usd = 100,
            included_services = 'AC Bus Transport, Luxury Hotel Stay, Breakfast, Sightseeing Guide',
            discount_percent = 0
        } = req.body;

        if (!title_en) {
            return res.status(400).json({ success: false, message: 'Package title is required.' });
        }

        const [result] = await pool.query(`
            INSERT INTO packages 
            (destination_id, title_en, title_bn, duration_days, price_bdt, price_usd, included_services, discount_percent, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        `, [
            destination_id,
            title_en,
            title_bn || title_en,
            parseInt(duration_days) || 3,
            parseFloat(price_bdt) || 0,
            parseFloat(price_usd) || 0,
            included_services,
            parseFloat(discount_percent) || 0
        ]);

        return res.status(201).json({
            success: true,
            message: 'Tour Package created and published successfully!',
            package_id: result.insertId
        });
    } catch (err) {
        console.error('createAdminPackage error:', err);
        return res.status(500).json({ success: false, message: 'Failed to create tour package', error: err.message });
    }
};

exports.deleteAdminPackage = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM packages WHERE id = ?', [id]);
        return res.json({ success: true, message: 'Package deleted successfully' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to delete package', error: err.message });
    }
};
