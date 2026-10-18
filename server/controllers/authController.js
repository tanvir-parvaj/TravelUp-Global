const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// Register a new user
exports.register = async (req, res) => {
    try {
        const { name, email, password, phone, organization, preferred_lang, role } = req.body;
        const codeInput = (req.body.admin_passcode || req.body.passcode || req.body.adminPasscode || req.body.admin_key || '').trim();

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
        }

        const STAFF_ROLES = ['admin', 'superadmin', 'manager', 'accountant', 'support', 'moderator'];
        let assignedRole = 'customer';
        if (STAFF_ROLES.includes(role)) {
            const validCodes = ['ADMIN2026', 'ADMIN123', 'TAHOMINA;123@', 'admin2026', 'admin123', 'Tahomina;123@'];
            if (!codeInput || !validCodes.includes(codeInput)) {
                return res.status(403).json({
                    success: false,
                    message: 'Invalid or missing Admin Security Key. Valid key required to register as staff or administrator.'
                });
            }
            assignedRole = role === 'superadmin' ? 'admin' : role;
        }

        // Check if user already exists
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const defaultAvatar = assignedRole === 'admin'
            ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80'
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';

        // Insert new user
        const [result] = await pool.query(
            'INSERT INTO users (name, email, password, phone, organization, preferred_lang, role, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [name, email, hashedPassword, phone || null, organization || null, preferred_lang || 'en', assignedRole, defaultAvatar]
        );

        const userId = result.insertId;

        // Generate JWT Token
        const token = jwt.sign(
            { id: userId, email, role: assignedRole, name },
            process.env.JWT_SECRET || 'travelup_secret',
            { expiresIn: '7d' }
        );

        return res.status(201).json({
            success: true,
            message: `${assignedRole === 'admin' ? 'Administrator' : 'Traveler'} registration successful!`,
            token,
            user: {
                id: userId,
                name,
                email,
                phone: phone || null,
                organization: organization || null,
                role: assignedRole,
                avatar_url: defaultAvatar,
                preferred_lang: preferred_lang || 'en'
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        // Fetch user by email
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const user = users[0];

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        // Generate JWT Token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            process.env.JWT_SECRET || 'travelup_secret',
            { expiresIn: '7d' }
        );

        return res.json({
            success: true,
            message: 'Login successful!',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar_url: user.avatar_url,
                preferred_lang: user.preferred_lang
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

// Get current user profile
exports.getProfile = async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT id, name, email, role, phone, preferred_lang, avatar_url, budget_range, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        return res.json({ success: true, user: users[0] });
    } catch (error) {
        console.error('Profile fetch error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

// Get all registered users (Admin view)
exports.getAllUsers = async (req, res) => {
    try {
        const [users] = await pool.query(
            `SELECT u.id, u.name, u.email, u.role, u.status, u.phone, u.organization, u.preferred_lang, u.avatar_url, u.created_at,
                    COUNT(b.id) as bookings_count
             FROM users u
             LEFT JOIN bookings b ON b.user_id = u.id
             GROUP BY u.id
             ORDER BY u.id DESC`
        );
        return res.json({ success: true, users });
    } catch (error) {
        console.error('Fetch all users error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

// Admin create user directly
exports.adminCreateUser = async (req, res) => {
    try {
        if (req.user && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden: Only Super Admin can create users directly.' });
        }
        const { name, email, password, role, status, phone, organization } = req.body;
        if (!name || !email) {
            return res.status(400).json({ success: false, message: 'Name and email are required.' });
        }
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password || 'TravelUp2026!', salt);
        const assignedRole = role || 'customer';
        const assignedStatus = status || 'active';
        const defaultAvatar = assignedRole === 'admin'
            ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80'
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';

        const [result] = await pool.query(
            'INSERT INTO users (name, email, password, role, status, phone, organization, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [name.trim(), email.trim(), hashedPassword, assignedRole, assignedStatus, phone ? phone.trim() : null, organization ? organization.trim() : null, defaultAvatar]
        );

        return res.status(201).json({
            success: true,
            message: 'User created successfully.',
            userId: result.insertId
        });
    } catch (error) {
        console.error('Admin create user error:', error);
        return res.status(500).json({ success: false, message: 'Failed to create user.' });
    }
};

// Admin update user (Role, Status, Phone, Organization, Password)
exports.adminUpdateUser = async (req, res) => {
    try {
        if (req.user && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden: Only Super Admin can edit users.' });
        }
        const { id } = req.params;
        const { name, role, status, phone, organization, password } = req.body;
        
        const updates = [];
        const params = [];
        if (name) { updates.push('name = ?'); params.push(name.trim()); }
        if (role) { updates.push('role = ?'); params.push(role); }
        if (status) { updates.push('status = ?'); params.push(status); }
        if (phone !== undefined) { updates.push('phone = ?'); params.push(phone ? phone.trim() : null); }
        if (organization !== undefined) { updates.push('organization = ?'); params.push(organization ? organization.trim() : null); }
        if (password && password.trim().length >= 6) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password.trim(), salt);
            updates.push('password = ?');
            params.push(hashedPassword);
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update.' });
        }
        params.push(id);
        await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
        return res.json({ success: true, message: 'User updated successfully.' });
    } catch (error) {
        console.error('Admin update user error:', error);
        return res.status(500).json({ success: false, message: 'Failed to update user.' });
    }
};

// Admin reset user password
exports.adminResetPassword = async (req, res) => {
    try {
        if (req.user && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden: Only Super Admin can reset user passwords.' });
        }
        const { id } = req.params;
        const { password } = req.body;
        if (!password || password.trim().length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
        }

        const [userExists] = await pool.query('SELECT id, name, email FROM users WHERE id = ?', [id]);
        if (userExists.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password.trim(), salt);
        await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
        return res.json({ 
            success: true, 
            message: `Password reset successfully for ${userExists[0].name} (${userExists[0].email}).` 
        });
    } catch (error) {
        console.error('Admin reset password error:', error);
        return res.status(500).json({ success: false, message: 'Failed to reset password.' });
    }
};

// Update user role (Super Admin only)
exports.updateUserRole = async (req, res) => {
    try {
        if (req.user && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden: Only Super Admin can change user roles.' });
        }

        const { id } = req.params;
        const { role } = req.body;
        const allowedRoles = ['customer', 'admin', 'manager', 'accountant', 'support', 'moderator'];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role specified.' });
        }

        await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
        return res.json({ success: true, message: `User role successfully updated to ${role}.` });
    } catch (error) {
        console.error('Update user role error:', error);
        return res.status(500).json({ success: false, message: 'Failed to update user role.' });
    }
};

// Delete user (Super Admin only)
exports.deleteUser = async (req, res) => {
    try {
        if (req.user && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden: Only Super Admin can delete users.' });
        }

        const { id } = req.params;
        await pool.query('DELETE FROM users WHERE id = ?', [id]);
        return res.json({ success: true, message: 'User deleted successfully.' });
    } catch (error) {
        console.error('Delete user error:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete user.' });
    }
};

// Update current user profile (Traveler/Staff self-service)
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, phone, avatar_url, preferred_lang, budget_range, new_password } = req.body;

        const updates = [];
        const params = [];

        if (name) { updates.push('name = ?'); params.push(name.trim()); }
        if (phone !== undefined) { updates.push('phone = ?'); params.push(phone ? phone.trim() : null); }
        if (avatar_url) { updates.push('avatar_url = ?'); params.push(avatar_url.trim()); }
        if (preferred_lang) { updates.push('preferred_lang = ?'); params.push(preferred_lang); }
        if (budget_range) { updates.push('budget_range = ?'); params.push(budget_range); }

        if (new_password && new_password.trim().length >= 6) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(new_password.trim(), salt);
            updates.push('password = ?');
            params.push(hashedPassword);
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields provided to update.' });
        }

        params.push(userId);
        await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

        // Fetch refreshed user
        const [refreshed] = await pool.query(
            'SELECT id, name, email, role, phone, preferred_lang, avatar_url, budget_range, created_at FROM users WHERE id = ?',
            [userId]
        );

        return res.json({
            success: true,
            message: 'Profile updated successfully!',
            user: refreshed[0]
        });
    } catch (error) {
        console.error('Profile update error:', error);
        return res.status(500).json({ success: false, message: 'Failed to update profile.' });
    }
};
