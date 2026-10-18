const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { testConnection } = require('./config/db');

// Import Route Handlers
const authRoutes = require('./routes/authRoutes');
const destinationRoutes = require('./routes/destinationRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const alertRoutes = require('./routes/alertRoutes');
const aiRoutes = require('./routes/aiRoutes');
const componentRoutes = require('./routes/componentRoutes');
const pricingRoutes = require('./routes/pricingRoutes');
const customTripRoutes = require('./routes/customTripRoutes');
const packageRoutes = require('./routes/packageRoutes');
const adminRoutes = require('./routes/adminRoutes');
const leadRoutes = require('./routes/leadRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const blogRoutes = require('./routes/blogRoutes');
const hotelRoutes = require('./routes/hotelRoutes');
const transportRoutes = require('./routes/transportRoutes');
const visaRoutes = require('./routes/visaRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const flightRoutes = require('./routes/flightRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const couponRoutes = require('./routes/couponRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware with full cross-origin and file:// protocol support
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Client Static Files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '../client')));

// Mount API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/components', componentRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/custom-trips', customTripRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/wishlists', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/transportation', transportRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/visas', visaRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/coupons', couponRoutes);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'UP',
        service: 'TravelUp Global API',
        timestamp: new Date().toISOString(),
        database: 'Connected to Hostinger MySQL'
    });
});

// Fallback to client/index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Start Server
app.listen(PORT, async () => {
    console.log(`\n=================================================`);
    console.log(`🚀 TravelUp Global Server running on port ${PORT}`);
    console.log(`🔗 Local URL: http://localhost:${PORT}`);
    console.log(`=================================================`);
    await testConnection();
});
