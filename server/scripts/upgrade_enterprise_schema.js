const mysql = require('../node_modules/mysql2/promise');
require('../node_modules/dotenv').config({ path: 'server/.env' });

async function upgradeSchema() {
    console.log('🚀 Upgrading TravelUp Global database to Full Enterprise ERP & Master Data Schema...');
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });

    try {
        // 1. Create or enhance suppliers table
        console.log('📦 Setting up suppliers table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS suppliers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                supplier_code VARCHAR(50) UNIQUE,
                name VARCHAR(150) NOT NULL,
                category ENUM('hotel', 'transport', 'activity', 'airline', 'visa_agent') NOT NULL,
                contact_person VARCHAR(100),
                email VARCHAR(120),
                phone VARCHAR(50),
                country VARCHAR(100) DEFAULT 'Bangladesh',
                city VARCHAR(100),
                rating DECIMAL(3,1) DEFAULT 4.8,
                status ENUM('active', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 2. Create or enhance visa_applications table
        console.log('🛂 Setting up visa_applications table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS visa_applications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                application_no VARCHAR(50) UNIQUE,
                traveler_name VARCHAR(150) NOT NULL,
                passport_number VARCHAR(50) NOT NULL,
                country VARCHAR(100) NOT NULL,
                destination_id INT NULL,
                visa_type VARCHAR(100) NOT NULL,
                submission_date DATE,
                estimated_completion_date DATE,
                embassy_fee DECIMAL(10,2) DEFAULT 0,
                processing_fee DECIMAL(10,2) DEFAULT 0,
                total_price DECIMAL(10,2) DEFAULT 0,
                status ENUM('pending', 'submitted', 'processing', 'approved', 'rejected') DEFAULT 'processing',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 3. Add columns to hotels if missing
        console.log('🏨 Checking hotels table columns...');
        const [hCols] = await pool.query('DESCRIBE hotels');
        const hColNames = hCols.map(c => c.Field);

        const addColIfNotExists = async (table, colDef, colName) => {
            const [cols] = await pool.query(`DESCRIBE ${table}`);
            if (!cols.some(c => c.Field === colName)) {
                await pool.query(`ALTER TABLE ${table} ADD COLUMN ${colDef}`);
                console.log(`  + Added ${colName} to ${table}`);
            }
        };

        await addColIfNotExists('hotels', 'hotel_code VARCHAR(50) NULL AFTER destination_id', 'hotel_code');
        await addColIfNotExists('hotels', 'city VARCHAR(100) NULL AFTER area_name', 'city');
        await addColIfNotExists('hotels', 'country VARCHAR(100) NULL AFTER city', 'country');
        await addColIfNotExists('hotels', 'hotel_type VARCHAR(50) DEFAULT "Resort" AFTER star_rating', 'hotel_type');
        await addColIfNotExists('hotels', 'base_price DECIMAL(10,2) DEFAULT 50.00 AFTER tier', 'base_price');
        await addColIfNotExists('hotels', 'selling_price DECIMAL(10,2) DEFAULT 75.00 AFTER base_price', 'selling_price');
        await addColIfNotExists('hotels', 'phone VARCHAR(50) NULL AFTER address', 'phone');
        await addColIfNotExists('hotels', 'email VARCHAR(100) NULL AFTER phone', 'email');
        await addColIfNotExists('hotels', 'status ENUM("active", "inactive") DEFAULT "active" AFTER is_active', 'status');

        // 4. Add columns to transportation if missing
        console.log('🚗 Checking transportation table columns...');
        await addColIfNotExists('transportation', 'service_code VARCHAR(50) NULL AFTER destination_id', 'service_code');
        await addColIfNotExists('transportation', 'city VARCHAR(100) NULL AFTER service_type', 'city');
        await addColIfNotExists('transportation', 'country VARCHAR(100) NULL AFTER city', 'country');
        await addColIfNotExists('transportation', 'base_price DECIMAL(10,2) DEFAULT 25.00 AFTER capacity_passengers', 'base_price');
        await addColIfNotExists('transportation', 'selling_price DECIMAL(10,2) DEFAULT 35.00 AFTER base_price', 'selling_price');
        await addColIfNotExists('transportation', 'status ENUM("active", "inactive") DEFAULT "active" AFTER is_active', 'status');

        // 5. Add columns to bookings if missing
        console.log('📋 Checking bookings table columns...');
        await addColIfNotExists('bookings', 'travel_type ENUM("domestic", "international") DEFAULT "domestic" AFTER destination_id', 'travel_type');
        await addColIfNotExists('bookings', 'passport_number VARCHAR(50) NULL AFTER travelers_count', 'passport_number');
        await addColIfNotExists('bookings', 'nid_number VARCHAR(50) NULL AFTER passport_number', 'nid_number');
        await addColIfNotExists('bookings', 'voucher_code VARCHAR(50) NULL AFTER status', 'voucher_code');
        await addColIfNotExists('bookings', 'payment_status ENUM("unpaid", "paid", "refunded") DEFAULT "paid" AFTER status', 'payment_status');

        // 6. Seed Realistic Suppliers
        console.log('🌱 Seeding Suppliers...');
        const [supplierCount] = await pool.query('SELECT COUNT(*) as c FROM suppliers');
        if (supplierCount[0].c === 0) {
            await pool.query(`
                INSERT INTO suppliers (supplier_code, name, category, contact_person, email, phone, country, city, rating, status) VALUES
                ('SUP-HTL-01', 'Sayeman Hospitality Group', 'hotel', 'Kamal Hossain', 'kamal@sayemanresort.com', '+880 1711-223344', 'Bangladesh', 'Cox\\'s Bazar', 4.9, 'active'),
                ('SUP-HTL-02', 'Peninsula & Marriott Asia', 'hotel', 'Somchai Prasert', 'b2b@peninsulabangkok.com', '+66 2 861 2888', 'Thailand', 'Bangkok', 4.9, 'active'),
                ('SUP-TRN-01', 'Bengal Chander Gari Operators', 'transport', 'Ratan Chakma', 'ratan@sajek4x4.com', '+880 1819-998877', 'Bangladesh', 'Rangamati', 4.8, 'active'),
                ('SUP-TRN-02', 'Siam Royal Limousine Fleet', 'transport', 'Apinya Wong', 'limo@siamtransit.co.th', '+66 8 1234 5678', 'Thailand', 'Bangkok', 4.9, 'active'),
                ('SUP-VSA-01', 'Global Visa Processing Hub', 'visa_agent', 'Tariq Al-Mansoor', 'visas@travelupglobal.com', '+880 1912-345678', 'Bangladesh', 'Dhaka', 4.9, 'active')
            `);
        }

        // 7. Seed Realistic Visa Applications
        console.log('🌱 Seeding Visa Applications...');
        const [visaCount] = await pool.query('SELECT COUNT(*) as c FROM visa_applications');
        if (visaCount[0].c === 0) {
            await pool.query(`
                INSERT INTO visa_applications (application_no, traveler_name, passport_number, country, destination_id, visa_type, submission_date, estimated_completion_date, embassy_fee, processing_fee, total_price, status, notes) VALUES
                ('VSA-2026-001', 'Rahim Ahmed', 'A02948192', 'Thailand', 7, 'Tourist E-Visa (Single Entry)', '2026-10-01', '2026-10-06', 4500, 1500, 6000, 'approved', 'Issued valid for 90 days stay up to 60 days'),
                ('VSA-2026-002', 'Farhana Yasmin', 'B19284756', 'United Arab Emirates', 8, 'Dubai 30-Days Tourist E-Visa', '2026-10-04', '2026-10-08', 8500, 2000, 10500, 'processing', 'Under review at GDRFA Dubai Immigration'),
                ('VSA-2026-003', 'Tanvir Mahmud', 'A99281726', 'Singapore', 9, 'Singapore E-Visa Level 1', '2026-10-05', '2026-10-09', 3800, 1500, 5300, 'processing', 'ICA Singapore processing biometrics'),
                ('VSA-2026-004', 'Nusrat Jahan', 'C88371920', 'Malaysia', 10, 'eNTRI Tourist Pass', '2026-09-28', '2026-10-02', 3200, 1200, 4400, 'approved', 'eNTRI generated with QR verification code'),
                ('VSA-2026-005', 'Saifur Rahman', 'A77261543', 'Japan', NULL, 'Tourist Sticker Visa (Single Entry)', '2026-10-02', '2026-10-12', 4000, 2500, 6500, 'submitted', 'Documents submitted to Embassy of Japan Dhaka'),
                ('VSA-2026-006', 'Mehedi Hasan', 'B55462718', 'United Arab Emirates', 8, 'Dubai 60-Days Leisure Visa', '2026-10-06', '2026-10-11', 14500, 2500, 17000, 'pending', 'Awaiting traveler flight ticket copy and photo')
            `);
        }

        // 8. Seed Realistic Hotels across Domestic and International Destinations
        console.log('🌱 Seeding Hotels across Destinations...');
        const [destRows] = await pool.query('SELECT id, name_en, country, travel_type FROM destinations');
        const destMap = {};
        destRows.forEach(d => { destMap[d.name_en] = d.id; });

        // Let's seed hotels for domestic destinations: Cox's Bazar, Saint Martin, Sajek, Sylhet, Bandarban
        const hotelsToSeed = [
            {
                code: 'HTL-CXB-01',
                name_en: 'Sayeman Beach Resort',
                name_bn: 'সায়েম্যান বিচ রিসোর্ট',
                dest_id: destMap["Cox's Bazar"] || 1,
                star: 5,
                type: 'Luxury Beach Resort',
                area: 'Marine Drive, Kolatoli',
                city: "Cox's Bazar",
                country: 'Bangladesh',
                address: 'Marine Drive Road, Kolatoli Beach, Cox\'s Bazar',
                cover: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
                tier: 'luxury',
                base_price: 85,
                selling_price: 115,
                phone: '+880 1755-699965',
                email: 'info@sayemanresort.com'
            },
            {
                code: 'HTL-CXB-02',
                name_en: 'Long Beach Hotel',
                name_bn: 'লং বিচ হোটেল',
                dest_id: destMap["Cox's Bazar"] || 1,
                star: 4,
                type: 'City Hotel',
                area: 'Kalatoli',
                city: "Cox's Bazar",
                country: 'Bangladesh',
                address: '14 Kalatoli Road, Hotel Motel Zone, Cox\'s Bazar',
                cover: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
                tier: 'standard',
                base_price: 45,
                selling_price: 65,
                phone: '+880 1730-334455',
                email: 'reservation@longbeachhotelbd.com'
            },
            {
                code: 'HTL-STM-01',
                name_en: 'Blue Marine Coral Resort',
                name_bn: 'ব্লু মেরিন কোরাল রিসোর্ট',
                dest_id: destMap["Saint Martin"] || 2,
                star: 3,
                type: 'Island Eco Resort',
                area: 'West Beach',
                city: 'Saint Martin Island',
                country: 'Bangladesh',
                address: 'West Coast Beach, Saint Martin, Cox\'s Bazar',
                cover: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
                tier: 'standard',
                base_price: 35,
                selling_price: 50,
                phone: '+880 1819-332211',
                email: 'stay@bluemarineresort.com'
            },
            {
                code: 'HTL-SJK-01',
                name_en: 'Sajek Megh Kabbo Eco Cottage',
                name_bn: 'সাজেক মেঘ কাব্য ইকো কটেজ',
                dest_id: destMap["Sajek Valley"] || 3,
                star: 3,
                type: 'Cloud View Wooden Cottage',
                area: 'Ruilui Para',
                city: 'Sajek, Rangamati',
                country: 'Bangladesh',
                address: 'Ruilui Para Helipad Road, Sajek Valley',
                cover: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80',
                tier: 'budget',
                base_price: 30,
                selling_price: 45,
                phone: '+880 1712-445566',
                email: 'meghkabbo@sajekcottage.com'
            },
            {
                code: 'HTL-SYL-01',
                name_en: 'Grand Sultan Tea Resort & Golf',
                name_bn: 'গ্র্যান্ড সুলতান টি রিসোর্ট',
                dest_id: destMap["Sylhet"] || 4,
                star: 5,
                type: 'Luxury Eco Resort',
                area: 'Radhanagar, Sreemangal',
                city: 'Sylhet',
                country: 'Bangladesh',
                address: 'Radhanagar, Sreemangal, Moulvibazar, Sylhet',
                cover: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
                tier: 'luxury',
                base_price: 90,
                selling_price: 130,
                phone: '+880 1730-793555',
                email: 'reservation@grandsultanresort.com'
            },
            {
                code: 'HTL-BKK-01',
                name_en: 'The Berkeley Hotel Pratunam',
                name_bn: 'দ্য বার্কলে হোটেল প্রাতুনাম',
                dest_id: destMap["Bangkok, Thailand"] || 7,
                star: 5,
                type: 'Premium City Center Hotel',
                area: 'Pratunam Shopping Hub',
                city: 'Bangkok',
                country: 'Thailand',
                address: '559 Ratchaprarop Rd, Makkasan, Ratchathewi, Bangkok 10400',
                cover: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80',
                tier: 'luxury',
                base_price: 70,
                selling_price: 95,
                phone: '+66 2 309 9999',
                email: 'info@berkeleyhotel.co.th'
            },
            {
                code: 'HTL-DXB-01',
                name_en: 'Atlantis, The Palm Dubai',
                name_bn: 'আটলান্টিস দ্য পাম দুবাই',
                dest_id: destMap["Dubai, UAE"] || 8,
                star: 5,
                type: 'Iconic Palm Island Resort',
                area: 'Palm Jumeirah',
                city: 'Dubai',
                country: 'United Arab Emirates',
                address: 'Crescent Rd - The Palm Jumeirah - Dubai',
                cover: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
                tier: 'luxury',
                base_price: 280,
                selling_price: 360,
                phone: '+971 4 426 2000',
                email: 'reservations@atlantisthepalm.com'
            },
            {
                code: 'HTL-SIN-01',
                name_en: 'Marina Bay Sands Singapore',
                name_bn: 'মেরিনা বে স্যান্ডস সিঙ্গাপুর',
                dest_id: destMap["Singapore"] || 9,
                star: 5,
                type: 'World Famous Landmark Resort',
                area: 'Marina Bay',
                city: 'Singapore',
                country: 'Singapore',
                address: '10 Bayfront Ave, Singapore 018956',
                cover: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80',
                tier: 'luxury',
                base_price: 350,
                selling_price: 450,
                phone: '+65 6688 8868',
                email: 'inquiries@marinabaysands.com'
            }
        ];

        for (const h of hotelsToSeed) {
            const [exist] = await pool.query('SELECT id FROM hotels WHERE hotel_code = ? OR name_en = ?', [h.code, h.name_en]);
            if (exist.length === 0) {
                const [ins] = await pool.query(`
                    INSERT INTO hotels (
                        destination_id, hotel_code, name_en, name_bn, star_rating, hotel_type,
                        area_name, city, country, address, cover_image, tier, base_price, selling_price,
                        phone, email, is_active, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'active')
                `, [
                    h.dest_id, h.code, h.name_en, h.name_bn, h.star, h.type,
                    h.area, h.city, h.country, h.address, h.cover, h.tier, h.base_price, h.selling_price,
                    h.phone, h.email
                ]);

                // Also seed standard and deluxe room for each hotel
                const hotelId = ins.insertId;
                await pool.query(`
                    INSERT INTO hotel_rooms (hotel_id, room_name_en, room_type, capacity_adults, capacity_children)
                    VALUES 
                    (?, 'Deluxe King Sea/City View Room', 'Deluxe', 2, 1),
                    (?, 'Executive Premier Suite', 'Suite', 2, 2)
                `, [hotelId, hotelId]);
            }
        }

        // 9. Seed Transportation Fleet
        console.log('🌱 Seeding Transportation Fleet...');
        const transportToSeed = [
            {
                code: 'TRN-CXB-01',
                title_en: "Cox's Bazar Airport to Hotel VIP AC Sedan",
                title_bn: 'কক্সবাজার এয়ারপোর্ট থেকে হোটেল এসি সেডান',
                dest_id: destMap["Cox's Bazar"] || 1,
                v_type: 'private_car',
                s_type: 'airport_transfer',
                city: "Cox's Bazar",
                country: 'Bangladesh',
                passengers: 4,
                base_price: 15,
                selling_price: 22,
                image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=400&q=80'
            },
            {
                code: 'TRN-CXB-02',
                title_en: 'Toyota HiAce GL 11-Seater Microbus Day Rental',
                title_bn: 'টয়োটা হাইস ১১-সিটার মাইক্রোবাস ডে রেন্টাল',
                dest_id: destMap["Cox's Bazar"] || 1,
                v_type: 'microbus',
                s_type: 'daily_rental',
                city: "Cox's Bazar",
                country: 'Bangladesh',
                passengers: 11,
                base_price: 55,
                selling_price: 75,
                image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=400&q=80'
            },
            {
                code: 'TRN-SJK-01',
                title_en: 'Khagrachari to Sajek 4x4 Chander Gari Mountain Jeep',
                title_bn: 'খাগড়াছড়ি থেকে সাজেক ৪x৪ চান্দের গাড়ি',
                dest_id: destMap["Sajek Valley"] || 3,
                v_type: 'jeep_4x4',
                s_type: 'point_to_point',
                city: 'Sajek, Rangamati',
                country: 'Bangladesh',
                passengers: 12,
                base_price: 70,
                selling_price: 95,
                image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=400&q=80'
            },
            {
                code: 'TRN-STM-01',
                title_en: 'Teknaf to Saint Martin Fast Sea Cruiser Ferry',
                title_bn: 'টেকনাফ থেকে সেন্ট মার্টিন ক্রুজার শিপ টিকিট',
                dest_id: destMap["Saint Martin"] || 2,
                v_type: 'speedboat_ferry',
                s_type: 'point_to_point',
                city: 'Teknaf / Saint Martin',
                country: 'Bangladesh',
                passengers: 50,
                base_price: 18,
                selling_price: 25,
                image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80'
            },
            {
                code: 'TRN-BKK-01',
                title_en: 'Suvarnabhumi Airport (BKK) to City Hotel VIP Van',
                title_bn: 'ব্যাংকক এয়ারপোর্ট থেকে হোটেল ভিআইপি ভ্যান',
                dest_id: destMap["Bangkok, Thailand"] || 7,
                v_type: 'luxury_van',
                s_type: 'airport_transfer',
                city: 'Bangkok',
                country: 'Thailand',
                passengers: 8,
                base_price: 35,
                selling_price: 48,
                image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80'
            },
            {
                code: 'TRN-DXB-01',
                title_en: 'Dubai International (DXB) Luxury GMC Yukon Chauffeur',
                title_bn: 'দুবাই এয়ারপোর্ট জিএমসি ইউকন বিলাসবহুল ট্রান্সফার',
                dest_id: destMap["Dubai, UAE"] || 8,
                v_type: 'luxury_suv',
                s_type: 'airport_transfer',
                city: 'Dubai',
                country: 'United Arab Emirates',
                passengers: 6,
                base_price: 65,
                selling_price: 90,
                image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=400&q=80'
            }
        ];

        for (const t of transportToSeed) {
            const [exist] = await pool.query('SELECT id FROM transportation WHERE service_code = ? OR title_en = ?', [t.code, t.title_en]);
            if (exist.length === 0) {
                await pool.query(`
                    INSERT INTO transportation (
                        destination_id, service_code, title_en, title_bn, vehicle_type, service_type,
                        city, country, capacity_passengers, base_price, selling_price, image_url, is_active, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'active')
                `, [
                    t.dest_id, t.code, t.title_en, t.title_bn, t.v_type, t.s_type,
                    t.city, t.country, t.passengers, t.base_price, t.selling_price, t.image
                ]);
            }
        }

        console.log('✅ Enterprise schema upgrade & realistic seeding completed successfully!');
    } catch (err) {
        console.error('❌ Schema upgrade error:', err);
    } finally {
        await pool.end();
    }
}

upgradeSchema();
