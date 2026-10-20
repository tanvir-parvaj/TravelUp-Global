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
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists' });
        }

        // Role verification (Admin/Staff requires valid security code)
        let assignedRole = 'customer';
        if (role === 'admin' || role === 'staff') {
            const validCodes = ['ADMIN2026', 'ADMIN123', 'STAFF2026'];
            if (!staff_code || !validCodes.includes(staff_code.trim())) {
                return res.status(403).json({ success: false, message: 'Invalid Staff/Admin Registration Code' });
            }
            assignedRole = 'admin';
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.query(
            `INSERT INTO users (name, email, password, role, phone, preferred_lang) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name, email, hashedPassword, assignedRole, phone || null, 'en']
        );

        const token = jwt.sign(
            { id: result.insertId, email, role: assignedRole, name },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: { id: result.insertId, name, email, role: assignedRole, phone }
        });
    } catch (error) {
        console.error('Registration Error:', error);
        return res.status(500).json({ success: false, message: 'Server error during registration', error: error.message });
    }
};

// Login User
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
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
