const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { testConnection } = require('./config/db');

// Import Clean Modular Route Handlers
const authRoutes = require('./routes/authRoutes');
const destinationRoutes = require('./routes/destinationRoutes');
const packageRoutes = require('./routes/packageRoutes');
const tripBuilderRoutes = require('./routes/tripBuilderRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const quotationRoutes = require('./routes/quotationRoutes');
const alertRoutes = require('./routes/alertRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Client Static Files (HTML, CSS, JS, Images)
app.use(express.static(path.join(__dirname, '../client')));

// Mount Clean API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/trip-builder', tripBuilderRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/alerts', alertRoutes);

// Health Check API
app.get('/api/health', (req, res) => {
    res.json({
        status: 'UP',
        service: 'TravelUp Global Modern API (v2.0)',
        academic_project: 'DIU CSE Markup & Scripting Languages Lab',
        database: 'Connected to Hostinger MySQL (u822738324_travelupglobal)',
        timestamp: new Date().toISOString()
    });
});

// Fallback to client/index.html for any SPA / direct page routes
app.get('*', (req, res) => {
    const filePath = path.join(__dirname, '../client', req.path);
    if (req.path.endsWith('.html') || req.path.includes('.')) {
        res.sendFile(filePath, err => {
            if (err) res.sendFile(path.join(__dirname, '../client/index.html'));
        });
    } else {
        res.sendFile(path.join(__dirname, '../client/index.html'));
    }
});

// Start Server
app.listen(PORT, async () => {
    console.log(`\n============================================================`);
    console.log(`🚀 TravelUp Global Engine running on port ${PORT}`);
    console.log(`🔗 Local URL: http://localhost:${PORT}`);
    console.log(`📡 Clean Architecture v2.0 | Hostinger MySQL Sync`);
    console.log(`============================================================\n`);
    await testConnection();
});
