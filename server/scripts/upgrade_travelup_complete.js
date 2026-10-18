const { pool } = require('../config/db');

async function upgrade() {
    console.log("====================================================");
    console.log("🚀 TRAVELUP GLOBAL COMPLETE ERP DATABASE UPGRADE");
    console.log("====================================================");

    try {
        // 1. Create flights table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS flights (
                id INT AUTO_INCREMENT PRIMARY KEY,
                flight_code VARCHAR(50) NOT NULL UNIQUE,
                airline_name VARCHAR(100) NOT NULL,
                airline_code VARCHAR(10) NOT NULL,
                flight_type ENUM('domestic', 'international') DEFAULT 'international',
                origin_city VARCHAR(100) NOT NULL,
                destination_city VARCHAR(100) NOT NULL,
                departure_time VARCHAR(50) NOT NULL,
                arrival_time VARCHAR(50) NOT NULL,
                duration VARCHAR(50) NOT NULL,
                cabin_class ENUM('Economy', 'Premium Economy', 'Business', 'First') DEFAULT 'Economy',
                base_price DECIMAL(10, 2) NOT NULL DEFAULT 100.00,
                selling_price DECIMAL(10, 2) NOT NULL DEFAULT 150.00,
                currency VARCHAR(10) DEFAULT 'USD',
                baggage_allowance VARCHAR(100) DEFAULT '20 kg check-in, 7 kg cabin',
                status ENUM('active', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("✅ Table 'flights' verified/created.");

        // 2. Create coupons table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS coupons (
                id INT AUTO_INCREMENT PRIMARY KEY,
                code VARCHAR(50) NOT NULL UNIQUE,
                title VARCHAR(150) NOT NULL,
                discount_type ENUM('percentage', 'fixed') DEFAULT 'percentage',
                discount_value DECIMAL(10, 2) NOT NULL,
                min_booking_amount DECIMAL(10, 2) DEFAULT 0.00,
                max_discount_amount DECIMAL(10, 2) DEFAULT 500.00,
                travel_type ENUM('all', 'domestic', 'international') DEFAULT 'all',
                valid_until DATE,
                usage_limit INT DEFAULT 1000,
                used_count INT DEFAULT 0,
                status ENUM('active', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("✅ Table 'coupons' verified/created.");

        // 3. Seed Flights if empty
        const [flightRows] = await pool.query('SELECT COUNT(*) as cnt FROM flights');
        if (flightRows[0].cnt === 0) {
            console.log("✈️ Seeding flights master inventory...");
            const sampleFlights = [
                // Domestic Flights (Bangladesh)
                {
                    flight_code: 'BG-433',
                    airline_name: 'Biman Bangladesh Airlines',
                    airline_code: 'BG',
                    flight_type: 'domestic',
                    origin_city: 'Dhaka (DAC)',
                    destination_city: "Cox's Bazar (CXB)",
                    departure_time: '08:30 AM',
                    arrival_time: '09:35 AM',
                    duration: '1h 05m',
                    cabin_class: 'Economy',
                    base_price: 45.00,
                    selling_price: 65.00,
                    currency: 'USD',
                    baggage_allowance: '20 kg Check-in + 7 kg Cabin'
                },
                {
                    flight_code: 'BS-141',
                    airline_name: 'US-Bangla Airlines',
                    airline_code: 'BS',
                    flight_type: 'domestic',
                    origin_city: 'Dhaka (DAC)',
                    destination_city: 'Sylhet (ZYL)',
                    departure_time: '11:15 AM',
                    arrival_time: '12:05 PM',
                    duration: '50m',
                    cabin_class: 'Economy',
                    base_price: 40.00,
                    selling_price: 55.00,
                    currency: 'USD',
                    baggage_allowance: '20 kg Check-in + 7 kg Cabin'
                },
                {
                    flight_code: '2A-701',
                    airline_name: 'Air Astra',
                    airline_code: '2A',
                    flight_type: 'domestic',
                    origin_city: 'Dhaka (DAC)',
                    destination_city: 'Chattogram (CGP)',
                    departure_time: '03:00 PM',
                    arrival_time: '03:50 PM',
                    duration: '50m',
                    cabin_class: 'Economy',
                    base_price: 38.00,
                    selling_price: 50.00,
                    currency: 'USD',
                    baggage_allowance: '20 kg Check-in + 7 kg Cabin'
                },
                // International Flights
                {
                    flight_code: 'TG-322',
                    airline_name: 'Thai Airways',
                    airline_code: 'TG',
                    flight_type: 'international',
                    origin_city: 'Dhaka (DAC)',
                    destination_city: 'Bangkok (BKK)',
                    departure_time: '01:40 PM',
                    arrival_time: '05:15 PM',
                    duration: '2h 35m',
                    cabin_class: 'Economy',
                    base_price: 240.00,
                    selling_price: 320.00,
                    currency: 'USD',
                    baggage_allowance: '30 kg Check-in + 7 kg Cabin'
                },
                {
                    flight_code: 'EK-583',
                    airline_name: 'Emirates',
                    airline_code: 'EK',
                    flight_type: 'international',
                    origin_city: 'Dhaka (DAC)',
                    destination_city: 'Dubai (DXB)',
                    departure_time: '10:15 AM',
                    arrival_time: '02:00 PM',
                    duration: '4h 45m',
                    cabin_class: 'Economy',
                    base_price: 380.00,
                    selling_price: 490.00,
                    currency: 'USD',
                    baggage_allowance: '30 kg Check-in + 7 kg Cabin'
                },
                {
                    flight_code: 'SQ-447',
                    airline_name: 'Singapore Airlines',
                    airline_code: 'SQ',
                    flight_type: 'international',
                    origin_city: 'Dhaka (DAC)',
                    destination_city: 'Singapore (SIN)',
                    departure_time: '11:55 PM',
                    arrival_time: '06:05 AM (+1)',
                    duration: '4h 10m',
                    cabin_class: 'Business',
                    base_price: 650.00,
                    selling_price: 880.00,
                    currency: 'USD',
                    baggage_allowance: '40 kg Check-in + 10 kg Cabin'
                },
                {
                    flight_code: 'JL-036',
                    airline_name: 'Japan Airlines',
                    airline_code: 'JL',
                    flight_type: 'international',
                    origin_city: 'Singapore (SIN)',
                    destination_city: 'Tokyo Haneda (HND)',
                    departure_time: '09:50 PM',
                    arrival_time: '05:45 AM (+1)',
                    duration: '6h 55m',
                    cabin_class: 'Economy',
                    base_price: 520.00,
                    selling_price: 690.00,
                    currency: 'USD',
                    baggage_allowance: '2x 23 kg Check-in + 10 kg Cabin'
                }
            ];

            for (const f of sampleFlights) {
                await pool.query(`
                    INSERT INTO flights (
                        flight_code, airline_name, airline_code, flight_type,
                        origin_city, destination_city, departure_time, arrival_time,
                        duration, cabin_class, base_price, selling_price, currency, baggage_allowance, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
                `, [
                    f.flight_code, f.airline_name, f.airline_code, f.flight_type,
                    f.origin_city, f.destination_city, f.departure_time, f.arrival_time,
                    f.duration, f.cabin_class, f.base_price, f.selling_price, f.currency, f.baggage_allowance
                ]);
            }
            console.log(`✅ Seeded ${sampleFlights.length} Master Flight services!`);
        }

        // 4. Seed Coupons if empty
        const [couponRows] = await pool.query('SELECT COUNT(*) as cnt FROM coupons');
        if (couponRows[0].cnt === 0) {
            console.log("🏷️ Seeding promo coupons...");
            const sampleCoupons = [
                {
                    code: 'WELCOME2026',
                    title: 'New Traveler Global Welcome Offer',
                    discount_type: 'percentage',
                    discount_value: 10.00,
                    min_booking_amount: 50.00,
                    max_discount_amount: 100.00,
                    travel_type: 'all',
                    valid_until: '2026-12-31'
                },
                {
                    code: 'COXBAZAR15',
                    title: 'Domestic Special: Cox\'s Bazar Getaway',
                    discount_type: 'percentage',
                    discount_value: 15.00,
                    min_booking_amount: 80.00,
                    max_discount_amount: 50.00,
                    travel_type: 'domestic',
                    valid_until: '2026-11-30'
                },
                {
                    code: 'FLYGLOBAL50',
                    title: 'International Flights & Holiday Flat USD 50 Off',
                    discount_type: 'fixed',
                    discount_value: 50.00,
                    min_booking_amount: 400.00,
                    max_discount_amount: 50.00,
                    travel_type: 'international',
                    valid_until: '2026-12-31'
                }
            ];

            for (const c of sampleCoupons) {
                await pool.query(`
                    INSERT INTO coupons (
                        code, title, discount_type, discount_value, min_booking_amount,
                        max_discount_amount, travel_type, valid_until, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
                `, [
                    c.code, c.title, c.discount_type, c.discount_value,
                    c.min_booking_amount, c.max_discount_amount, c.travel_type, c.valid_until
                ]);
            }
            console.log(`✅ Seeded ${sampleCoupons.length} promotional coupons!`);
        }

        console.log("====================================================");
        console.log("🎉 DATABASE UPGRADE COMPLETED SUCCESSFULLY");
        console.log("====================================================");
        process.exit(0);
    } catch (err) {
        console.error("❌ Database Upgrade Error:", err);
        process.exit(1);
    }
}

upgrade();
