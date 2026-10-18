const jwt = require('jsonwebtoken');

// Master list of internal administrative & operational staff roles
const STAFF_ROLES = ['admin', 'superadmin', 'manager', 'accountant', 'support', 'moderator'];

// 1. Verify JWT token middleware
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ success: false, message: 'Access denied. No authentication token provided.' });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'travelup_secret');
        // Normalize role alias
        if (decoded.role === 'superadmin') decoded.role = 'admin';
        req.user = decoded; // { id, email, role, name }
        next();
    } catch (error) {
        return res.status(403).json({ success: false, message: 'Invalid or expired authentication session.' });
    }
}

// 2. High-order role validator generator
function requireRoles(...allowedRoles) {
    return (req, res, next) => {
        const userRole = req.user ? (req.user.role === 'superadmin' ? 'admin' : req.user.role) : null;
        if (!userRole || (!allowedRoles.includes(userRole) && userRole !== 'admin')) {
            return res.status(403).json({ 
                success: false, 
                message: `Forbidden: Access restricted. Required role(s): [${allowedRoles.join(', ')}]. Current role: '${userRole || 'unauthenticated'}'.` 
            });
        }
        next();
    };
}

// 3. Pre-configured enterprise RBAC guards
const requireStaff = requireRoles('admin', 'manager', 'accountant', 'support', 'moderator');
const requireSuperAdmin = (req, res, next) => {
    const userRole = req.user ? (req.user.role === 'superadmin' ? 'admin' : req.user.role) : null;
    if (userRole !== 'admin') {
        return res.status(403).json({ success: false, message: 'Forbidden: Super Admin privilege required.' });
    }
    next();
};
const requireManagerOrAdmin = requireRoles('admin', 'manager');
const requireFinance = requireRoles('admin', 'accountant');
const requireSupportOrAdmin = requireRoles('admin', 'manager', 'support');
const requireContentStaff = requireRoles('admin', 'manager', 'moderator');
const requireBookingsStaff = requireRoles('admin', 'manager', 'accountant', 'support');

// Backwards-compatible alias for requireStaff
const requireAdmin = requireStaff;

module.exports = { 
    verifyToken, 
    requireRoles,
    requireStaff, 
    requireSuperAdmin, 
    requireManagerOrAdmin,
    requireFinance,
    requireSupportOrAdmin,
    requireContentStaff,
    requireBookingsStaff,
    requireAdmin, 
    STAFF_ROLES 
};
