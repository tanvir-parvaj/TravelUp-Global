const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'travelup_global_secret_key_2026_jwt_token';

// Register User
exports.register = async (req, res) => {
    try {
        const { name, email, password, role, staff_code, phone } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
        }

        // Check if user already exists
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists' });
        }

        // Role assignment: accept selected role from signup or default to 'customer'
        const allowedRoles = ['customer', 'admin', 'manager', 'accountant', 'support', 'moderator', 'uploader'];
        let assignedRole = (role && allowedRoles.includes(role)) ? role : 'customer';

        // 🔒 STRICT SECURITY: Admin and staff roles REQUIRE an authorized reference code
        const isStaffRole = assignedRole !== 'customer';
        let validatedOrg = null;
        let matchedInviteId = null;

        if (isStaffRole) {
            const rawCode = (staff_code || '').trim().toUpperCase();
            if (!rawCode) {
                return res.status(403).json({
                    success: false,
                    message: 'অ্যাডমিনিস্ট্রেটর বা স্টাফ হিসেবে সাইনআপ করতে বিদ্যমান অ্যাডমিনের বৈধ রেফারেন্স কোড (Authorization Reference Code) আবশ্যক।'
                });
            }

            // Check Master Super Admin Code (for initial setup / platform owner / new org license)
            const masterKey = (process.env.MASTER_ADMIN_KEY || 'TRAVELUP-MASTER-ADMIN-2026').toUpperCase();
            const isMasterCode = rawCode === masterKey;

            if (!isMasterCode) {
                // Check in staff_invitations table
                const [invites] = await pool.query(
                    `SELECT * FROM staff_invitations 
                     WHERE UPPER(invite_code) = ? 
                       AND is_used = 0 
                       AND (expires_at IS NULL OR expires_at > NOW())
                     LIMIT 1`,
                    [rawCode]
                );

                if (invites.length === 0) {
                    return res.status(403).json({
                        success: false,
                        message: 'রেফারেন্স কোডটি সঠিক নয়, পূর্বে ব্যবহৃত হয়েছে অথবা এর মেয়াদ শেষ হয়ে গেছে। দয়া করে আপনার প্রতিষ্ঠানের অ্যাডমিনিস্ট্রেটরের কাছ থেকে নতুন কোড সংগ্রহ করুন।'
                    });
                }

                const invite = invites[0];
                matchedInviteId = invite.id;
                if (invite.role) assignedRole = invite.role;
                if (invite.organization) validatedOrg = invite.organization;
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';

        const [result] = await pool.query(
            `INSERT INTO users (name, email, password, role, phone, organization, preferred_lang, avatar_url) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, email.trim().toLowerCase(), hashedPassword, assignedRole, phone || null, validatedOrg, 'en', defaultAvatar]
        );

        // Mark invite code as used
        if (matchedInviteId) {
            await pool.query(
                `UPDATE staff_invitations 
                 SET is_used = 1, status = 'active', email = ?, name = ?, used_by = ? 
                 WHERE id = ?`,
                [email.trim().toLowerCase(), name, result.insertId, matchedInviteId]
            );
        }

        const token = jwt.sign(
            { id: result.insertId, email: email.trim().toLowerCase(), role: assignedRole, name, organization: validatedOrg },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: { 
                id: result.insertId, 
                name, 
                email: email.trim().toLowerCase(), 
                role: assignedRole, 
                phone, 
                organization: validatedOrg,
                avatar_url: defaultAvatar 
            }
        });
    } catch (error) {
        console.error('Registration Error:', error);
        return res.status(500).json({ success: false, message: 'Server error during registration', error: error.message });
    }
};

// Login User
exports.login = async (req, res) => {
    try {
        const { email, password, portal } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const [users] = await pool.query('SELECT * FROM users WHERE email = ? OR phone = ?', [email.trim(), email.trim()]);
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid email/phone or password' });
        }

        const user = users[0];
        let isMatch = false;

        try {
            isMatch = await bcrypt.compare(password, user.password);
        } catch (e) {
            isMatch = false;
        }

        // Resilient fallback for plain text / legacy passwords
        if (!isMatch && password === user.password) {
            isMatch = true;
            try {
                const newHash = await bcrypt.hash(password, 10);
                await pool.query('UPDATE users SET password = ? WHERE id = ?', [newHash, user.id]);
            } catch (hashErr) {}
        }

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // 🔒 Strict Portal & Role Matching Validation
        const allowedStaffRoles = ['admin', 'manager', 'accountant', 'support', 'moderator', 'uploader'];
        const isStaff = allowedStaffRoles.includes(user.role);

        if (portal === 'customer' && isStaff) {
            return res.status(403).json({
                success: false,
                message: '❌ এটি একটি অ্যাডমিনিস্ট্রেটর/স্টাফ অ্যাকাউন্ট। ট্রাভেলার হিসেবে লগইন করতে পারবেন না। অনুগ্রহ করে "Administrator" ট্যাব নির্বাচন করে লগইন করুন।'
            });
        }

        if (portal === 'staff' && !isStaff) {
            return res.status(403).json({
                success: false,
                message: '❌ এটি একটি সাধারণ ট্রাভেলার অ্যাকাউন্ট। অ্যাডমিনিস্ট্রেটর প্যানেলে প্রবেশের অনুমতি নেই। অনুগ্রহ করে "Traveler & Tourist" ট্যাব নির্বাচন করুন।'
            });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                preferred_lang: user.preferred_lang,
                avatar_url: user.avatar_url
            }
        });
    } catch (error) {
        console.error('Login Error:', error);
        return res.status(500).json({ success: false, message: 'Server error during login', error: error.message });
    }
};

// Get Current Profile
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const [users] = await pool.query('SELECT id, name, email, role, phone, preferred_lang, avatar_url, budget_range, created_at FROM users WHERE id = ?', [userId]);

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.json({ success: true, user: users[0] });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch profile', error: error.message });
    }
};

// Update Current Profile
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, phone, preferred_lang, avatar_url } = req.body;

        await pool.query(
            `UPDATE users 
             SET name = COALESCE(?, name),
                 phone = COALESCE(?, phone),
                 preferred_lang = COALESCE(?, preferred_lang),
                 avatar_url = COALESCE(?, avatar_url)
             WHERE id = ?`,
            [name || null, phone || null, preferred_lang || null, avatar_url || null, userId]
        );

        const [users] = await pool.query(
            'SELECT id, name, email, role, phone, preferred_lang, avatar_url, budget_range, created_at FROM users WHERE id = ?',
            [userId]
        );

        return res.json({ success: true, message: 'Profile updated successfully', user: users[0] });
    } catch (error) {
        console.error('Update Profile Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to update profile', error: error.message });
    }
};
