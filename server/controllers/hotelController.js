const { pool } = require('../config/db');

// 1. Get all hotels with search, filters, and live counts
exports.getAllHotels = async (req, res) => {
    try {
        const { search, destination_id, tier, star, status } = req.query;

        let query = `
            SELECT h.*, 
                   COALESCE(h.name_en, h.hotel_code, 'Hotel') AS name,
                   COALESCE(h.cover_image, '') AS image_url,
                   d.name_en AS destination_name, 
                   d.name_en AS dest_name_en, 
                   d.travel_type, 
                   d.country AS destination_country,
                   (SELECT COUNT(*) FROM hotel_rooms hr WHERE hr.hotel_id = h.id) AS room_count,
                   (SELECT COUNT(*) FROM hotel_rooms hr WHERE hr.hotel_id = h.id) AS rooms_count
            FROM hotels h
            LEFT JOIN destinations d ON h.destination_id = d.id
            WHERE 1=1
        `;
        const params = [];

        if (destination_id && destination_id !== 'all') {
            query += ' AND h.destination_id = ?';
            params.push(destination_id);
        }

        if (tier && tier !== 'all') {
            query += ' AND h.tier = ?';
            params.push(tier);
        }

        if (star && star !== 'all') {
            query += ' AND h.star_rating = ?';
            params.push(parseInt(star));
        }

        if (status && status !== 'all') {
            query += ' AND h.status = ?';
            params.push(status);
        }

        if (search) {
            query += ' AND (h.name_en LIKE ? OR h.hotel_code LIKE ? OR h.city LIKE ? OR h.area_name LIKE ? OR d.name_en LIKE ?)';
            const term = `%${search}%`;
            params.push(term, term, term, term, term);
        }

        query += ' ORDER BY h.id DESC';

        const [hotels] = await pool.query(query, params);

        // Compute counts
        const [[counts]] = await pool.query(`
            SELECT 
                COUNT(*) as total_all,
                SUM(CASE WHEN d.travel_type = 'domestic' THEN 1 ELSE 0 END) as total_domestic,
                SUM(CASE WHEN d.travel_type = 'international' THEN 1 ELSE 0 END) as total_international,
                SUM(CASE WHEN h.status = 'active' THEN 1 ELSE 0 END) as total_active,
                SUM(CASE WHEN h.status = 'inactive' THEN 1 ELSE 0 END) as total_inactive
            FROM hotels h
            LEFT JOIN destinations d ON h.destination_id = d.id
        `);

        return res.json({
            success: true,
            hotels,
            counts: {
                all: counts.total_all || 0,
                domestic: counts.total_domestic || 0,
                international: counts.total_international || 0,
                active: counts.total_active || 0,
                inactive: counts.total_inactive || 0
            }
        });
    } catch (error) {
        console.error('Error fetching hotels:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch hotels.' });
    }
};

// 2. Get hotel by ID with rooms
exports.getHotelById = async (req, res) => {
    try {
        const { id } = req.params;
        const [hotels] = await pool.query(`
            SELECT h.*, 
                   COALESCE(h.name_en, h.hotel_code, 'Hotel') AS name,
                   COALESCE(h.cover_image, '') AS image_url,
                   d.name_en AS destination_name, 
                   d.name_en AS dest_name_en,
                   d.travel_type, 
                   d.country AS destination_country
            FROM hotels h
            LEFT JOIN destinations d ON h.destination_id = d.id
            WHERE h.id = ?
        `, [id]);

        if (hotels.length === 0) {
            return res.status(404).json({ success: false, message: 'Hotel not found.' });
        }

        const hotel = hotels[0];
        const [rooms] = await pool.query('SELECT * FROM hotel_rooms WHERE hotel_id = ?', [id]);
        hotel.rooms = rooms;

        return res.json({ success: true, hotel });
    } catch (error) {
        console.error('Error fetching hotel details:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch hotel details.' });
    }
};

// 3. Create new hotel
exports.createHotel = async (req, res) => {
    try {
        const {
            destination_id, hotel_code, name_en, name, name_bn, star_rating, hotel_type,
            area_name, city, country, address, cover_image, image_url, tier, base_price, selling_price, price_per_night,
            phone, email, status, rooms
        } = req.body;

        const hotelName = name_en || name;
        if (!hotelName || !destination_id) {
            return res.status(400).json({ success: false, message: 'Hotel Name and Destination are required.' });
        }

        const generatedCode = hotel_code || ('HTL-' + Math.floor(1000 + Math.random() * 9000));
        const finalImage = cover_image || image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
        const finalSellingPrice = selling_price || price_per_night || 75;

        const [result] = await pool.query(`
            INSERT INTO hotels (
                destination_id, hotel_code, name_en, name_bn, star_rating, hotel_type,
                area_name, city, country, address, cover_image, tier, base_price, selling_price,
                phone, email, is_active, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
        `, [
            destination_id, generatedCode, hotelName, name_bn || hotelName, star_rating || 4, hotel_type || 'Resort',
            area_name || null, city || null, country || 'Bangladesh', address || null,
            finalImage,
            tier || 'standard', base_price || 50, finalSellingPrice,
            phone || null, email || null, status || 'active'
        ]);

        const hotelId = result.insertId;

        // If rooms provided, insert them
        if (rooms && Array.isArray(rooms) && rooms.length > 0) {
            for (const r of rooms) {
                if (r.room_name_en) {
                    await pool.query(`
                        INSERT INTO hotel_rooms (hotel_id, room_name_en, room_type, capacity_adults, capacity_children)
                        VALUES (?, ?, ?, ?, ?)
                    `, [hotelId, r.room_name_en, r.room_type || 'Standard', r.capacity_adults || 2, r.capacity_children || 1]);
                }
            }
        } else {
            // Default deluxe room
            await pool.query(`
                INSERT INTO hotel_rooms (hotel_id, room_name_en, room_type, capacity_adults, capacity_children)
                VALUES (?, 'Deluxe Room', 'Deluxe', 2, 1)
            `, [hotelId]);
        }

        return res.status(201).json({
            success: true,
            message: `Hotel "${hotelName}" created successfully!`,
            id: hotelId,
            hotel_code: generatedCode,
            hotel: {
                id: hotelId,
                hotel_code: generatedCode,
                name_en: hotelName,
                name: hotelName,
                destination_id,
                star_rating: star_rating || 4,
                selling_price: finalSellingPrice,
                tier: tier || 'standard',
                status: status || 'active'
            }
        });
    } catch (error) {
        console.error('Error creating hotel:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to create hotel.' });
    }
};

// 4. Update hotel
exports.updateHotel = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            destination_id, hotel_code, name_en, name, name_bn, star_rating, hotel_type,
            area_name, city, country, address, cover_image, image_url, tier, base_price, selling_price, price_per_night,
            phone, email, status
        } = req.body;

        const finalName = name_en || name;
        const finalImage = cover_image || image_url;
        const finalSellingPrice = selling_price || price_per_night;

        await pool.query(`
            UPDATE hotels SET
                destination_id = COALESCE(?, destination_id),
                hotel_code = COALESCE(?, hotel_code),
                name_en = COALESCE(?, name_en),
                name_bn = COALESCE(?, name_bn),
                star_rating = COALESCE(?, star_rating),
                hotel_type = COALESCE(?, hotel_type),
                area_name = COALESCE(?, area_name),
                city = COALESCE(?, city),
                country = COALESCE(?, country),
                address = COALESCE(?, address),
                cover_image = COALESCE(?, cover_image),
                tier = COALESCE(?, tier),
                base_price = COALESCE(?, base_price),
                selling_price = COALESCE(?, selling_price),
                phone = COALESCE(?, phone),
                email = COALESCE(?, email),
                status = COALESCE(?, status)
            WHERE id = ?
        `, [
            destination_id, hotel_code, finalName, name_bn, star_rating, hotel_type,
            area_name, city, country, address, finalImage, tier, base_price, finalSellingPrice,
            phone, email, status, id
        ]);

        return res.json({ success: true, message: `Hotel #${id} updated successfully.` });
    } catch (error) {
        console.error('Error updating hotel:', error);
        return res.status(500).json({ success: false, message: 'Failed to update hotel.' });
    }
};

// 5. Toggle hotel status
exports.toggleHotelStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const [hotels] = await pool.query('SELECT status FROM hotels WHERE id = ?', [id]);
        if (hotels.length === 0) return res.status(404).json({ success: false, message: 'Hotel not found.' });

        const currentStatus = hotels[0].status || 'active';
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

        await pool.query('UPDATE hotels SET status = ?, is_active = ? WHERE id = ?', [newStatus, newStatus === 'active' ? 1 : 0, id]);
        return res.json({ success: true, message: `Hotel status changed to ${newStatus}.`, newStatus });
    } catch (error) {
        console.error('Error toggling hotel status:', error);
        return res.status(500).json({ success: false, message: 'Failed to toggle status.' });
    }
};

// 6. Delete hotel
exports.deleteHotel = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM hotel_rooms WHERE hotel_id = ?', [id]);
        await pool.query('DELETE FROM hotels WHERE id = ?', [id]);
        return res.json({ success: true, message: `Hotel #${id} deleted successfully.` });
    } catch (error) {
        console.error('Error deleting hotel:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete hotel.' });
    }
};

// 7. Add room to hotel
exports.addHotelRoom = async (req, res) => {
    try {
        const { hotel_id, room_name_en, room_type, capacity_adults, capacity_children } = req.body;
        if (!hotel_id || !room_name_en) {
            return res.status(400).json({ success: false, message: 'Hotel ID and Room Name are required.' });
        }
        const [result] = await pool.query(`
            INSERT INTO hotel_rooms (hotel_id, room_name_en, room_type, capacity_adults, capacity_children)
            VALUES (?, ?, ?, ?, ?)
        `, [hotel_id, room_name_en, room_type || 'Standard', capacity_adults || 2, capacity_children || 1]);

        return res.status(201).json({ success: true, message: 'Room added successfully!', id: result.insertId });
    } catch (error) {
        console.error('Error adding hotel room:', error);
        return res.status(500).json({ success: false, message: 'Failed to add room.' });
    }
};
