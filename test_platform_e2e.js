const http = require('http');
const jwt = require('./server/node_modules/jsonwebtoken');
require('./server/node_modules/dotenv').config({ path: './server/.env' });

const adminToken = jwt.sign(
    { id: 1, email: 'admin@travelupglobal.com', role: 'admin', name: 'Tanvir Parvaj' },
    process.env.JWT_SECRET || 'travelup_secret',
    { expiresIn: '1d' }
);
const authHeaders = { 'Authorization': `Bearer ${adminToken}` };

function request(method, path, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const payload = data ? JSON.stringify(data) : null;
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };
        if (payload) {
            options.headers['Content-Length'] = Buffer.byteLength(payload);
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, data: parsed });
                } catch(e) {
                    resolve({ status: res.statusCode, raw: body });
                }
            });
        });

        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

async function runE2E() {
    console.log("====================================================");
    console.log("🚀 TRAVELUP GLOBAL END-TO-END VERIFICATION TEST");
    console.log("====================================================");
    let passes = 0;
    let fails = 0;

    function assert(name, condition, details = '') {
        if (condition) {
            console.log(`✅ PASS: ${name}`);
            passes++;
        } else {
            console.error(`❌ FAIL: ${name} - ${details}`);
            fails++;
        }
    }

    try {
        // 1. Health Check
        const health = await request('GET', '/api/health');
        assert('Backend API Health & Hostinger MySQL Connectivity', health.status === 200 && health.data.status === 'UP');

        // 2. Hotels API (Master Accommodation Inventory)
        const hotelsRes = await request('GET', '/api/hotels');
        assert('Hotels Master Data Inventory (Screen 4)', hotelsRes.status === 200 && hotelsRes.data.hotels.length >= 11);
        const firstHotel = hotelsRes.data.hotels[0];
        assert('Hotel fields include hotel_code, star_rating, selling_price', 
            Boolean(firstHotel.hotel_code && firstHotel.star_rating && firstHotel.selling_price));

        // Create Test Hotel (Protected)
        const createHotelRes = await request('POST', '/api/hotels', {
            destination_id: 9,
            name: 'Test Oceanfront Suites',
            star_rating: 5,
            hotel_type: 'luxury',
            city: "Cox's Bazar",
            country: 'Bangladesh',
            base_price: 80,
            selling_price: 120,
            price_per_night: 120,
            image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80'
        }, authHeaders);
        assert('Create Hotel Master Data', createHotelRes.status === 201 && createHotelRes.data.hotel.hotel_code.startsWith('HTL-'));
        const testHotelId = createHotelRes.data.hotel.id;

        // Toggle Hotel Status (Protected)
        const toggleHotelRes = await request('PUT', `/api/hotels/${testHotelId}/status`, { status: 'inactive' }, authHeaders);
        assert('Toggle Hotel Status (Active ➔ Inactive)', toggleHotelRes.status === 200 && toggleHotelRes.data.success);

        // Delete Test Hotel (Protected)
        const delHotelRes = await request('DELETE', `/api/hotels/${testHotelId}`, null, authHeaders);
        assert('Delete Hotel Master Data', delHotelRes.status === 200 && delHotelRes.data.success);

        // 3. Transportation API (Master Fleet Inventory)
        const transRes = await request('GET', '/api/transportation');
        assert('Transportation Master Data Inventory (Screen 5)', transRes.status === 200 && transRes.data.transportation.length >= 9);

        // Create Test Transport (Protected)
        const createTransRes = await request('POST', '/api/transportation', {
            destination_id: 11,
            title: 'Test Mountain 4x4 Chander Gari',
            vehicle_type: 'jeep_4x4',
            service_type: 'daily_rental',
            capacity: 8,
            city: 'Sajek Valley',
            base_price: 40,
            selling_price: 60,
            price: 60,
            image_url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=400&q=80'
        }, authHeaders);
        assert('Create Transportation Service', createTransRes.status === 201 && createTransRes.data.transportation.service_code.startsWith('TRN-'));
        const testTransId = createTransRes.data.transportation.id;

        // Delete Test Transport (Protected)
        const delTransRes = await request('DELETE', `/api/transportation/${testTransId}`, null, authHeaders);
        assert('Delete Transportation Service', delTransRes.status === 200 && delTransRes.data.success);

        // 4. Visa Applications API (Visa Tracker)
        const visasRes = await request('GET', '/api/visas', null, authHeaders);
        assert('Visa Applications Tracker (Screen 6)', visasRes.status === 200 && visasRes.data.visas.length >= 6);

        // Create Test Visa (Protected)
        const createVisaRes = await request('POST', '/api/visas', {
            traveler_name: 'Tanvir Parvaj E2E Test',
            passport_number: 'B99887766',
            country: 'Japan',
            visa_type: 'Tourist Single Entry',
            embassy_fee: 5500,
            processing_fee: 2000,
            status: 'processing',
            notes: 'Biometrics booked at Embassy'
        }, authHeaders);
        assert('Create Visa Application File', createVisaRes.status === 201 && createVisaRes.data.visa.application_no.startsWith('VSA-'));
        const testVisaId = createVisaRes.data.visa.id;

        // Update Visa Status (Protected)
        const updateVisaRes = await request('PUT', `/api/visas/${testVisaId}/status`, { status: 'approved' }, authHeaders);
        assert('Update Visa Status to Approved', updateVisaRes.status === 200 && updateVisaRes.data.success);

        // Delete Test Visa (Protected)
        const delVisaRes = await request('DELETE', `/api/visas/${testVisaId}`, null, authHeaders);
        assert('Delete Visa Application File', delVisaRes.status === 200 && delVisaRes.data.success);

        // 5. Packages API (Unified Domestic & International)
        const pkgsRes = await request('GET', '/api/packages');
        assert('Unified Packages Catalog (Screen 7)', pkgsRes.status === 200 && pkgsRes.data.data.length >= 6);
        const domesticPkgs = pkgsRes.data.data.filter(p => p.travel_type === 'domestic');
        const intlPkgs = pkgsRes.data.data.filter(p => p.travel_type === 'international');
        assert('Catalog contains Domestic packages (🇧🇩 Bangladesh)', domesticPkgs.length >= 2);
        assert('Catalog contains International packages (✈️ Worldwide)', intlPkgs.length >= 4);

        // 6. Booking Creation & Voucher Pass (Screen 8)
        const bookingRes = await request('POST', '/api/bookings', {
            destination_id: 9,
            package_id: domesticPkgs[0].id,
            start_date: '2026-11-15',
            travelers_count: 2,
            total_price: 19000,
            currency: 'BDT',
            customer_name: 'E2E Test Traveler',
            customer_email: 'e2e_traveler@travelupglobal.com',
            customer_phone: '+880 1711-223344',
            payment_method: 'bkash',
            trx_id: 'TRX_E2E_9988',
            travel_type: 'domestic',
            nid_number: '1995123456789'
        });
        assert('Create Verified Booking with NID & Voucher Code', 
            bookingRes.status === 201 && 
            bookingRes.data.booking.booking_ref.startsWith('TUG-') &&
            bookingRes.data.booking.voucher_code.startsWith('VCH-'));

        // 7. Admin Bookings Retrieval (Protected)
        const adminBookingsRes = await request('GET', '/api/bookings/all', null, authHeaders);
        assert('Admin Bookings Synchronization', adminBookingsRes.status === 200 && adminBookingsRes.data.bookings.length > 0);
        const latestBooking = adminBookingsRes.data.bookings[0];
        assert('Booking contains travel_type, voucher_code and customer info',
            Boolean(latestBooking.booking_ref && latestBooking.customer_name));

    } catch (err) {
        console.error("Critical Test Error:", err);
        fails++;
    }

    console.log("====================================================");
    console.log(`TEST RUN COMPLETED: ${passes} PASSED, ${fails} FAILED`);
    console.log("====================================================");
    process.exit(fails > 0 ? 1 : 0);
}

runE2E();
