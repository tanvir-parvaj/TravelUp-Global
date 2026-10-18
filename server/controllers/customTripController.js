const { pool } = require('../config/db');

// 1. Save or Update Custom Trip
exports.saveCustomTrip = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : (req.body.user_id || 1);
        const {
            destination_id = 1,
            trip_title,
            start_date,
            end_date,
            duration_days = 7,
            adults_count = 2,
            children_count = 0,
            travel_style = 'relaxation',
            hotel_tier = 'standard',
            food_pref = 'mix',
            transport_pref = 'private_car',
            target_budget = 2000,
            calculated_total = 1720,
            selected_components = []
        } = req.body;

        // Fetch destination name
        const [dests] = await pool.query('SELECT name_en FROM destinations WHERE id = ?', [destination_id]);
        const destName = dests.length > 0 ? dests[0].name_en : 'Custom Destination';
        const title = trip_title || `Trip to ${destName}`;

        const [tripResult] = await pool.query(`
            INSERT INTO custom_trips (
                user_id, destination_id, trip_title, start_date, end_date, 
                duration_days, adults_count, children_count, travel_style, 
                hotel_tier, food_pref, transport_pref, target_budget, calculated_total, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'saved')
        `, [
            userId, destination_id, title,
            start_date || '2026-11-01', end_date || '2026-11-08',
            duration_days, adults_count, children_count, travel_style,
            hotel_tier, food_pref, transport_pref, target_budget, calculated_total
        ]);

        const customTripId = tripResult.insertId;

        // Generate day-wise itinerary framework in trip_days
        for (let d = 1; d <= parseInt(duration_days); d++) {
            const dayTitle = d === 1 ? 'Arrival & Hotel Check-in' : d === parseInt(duration_days) ? 'Souvenir Shopping & Departure' : `Day ${d} — Island Exploration & Activities`;
            await pool.query(`
                INSERT INTO trip_days (custom_trip_id, day_number, day_title_en)
                VALUES (?, ?, ?)
            `, [customTripId, d, dayTitle]);
        }

        res.json({
            success: true,
            custom_trip_id: customTripId,
            message: 'Custom trip saved successfully to your account with day-wise itinerary generated.'
        });
    } catch (err) {
        console.error('Error saving custom trip:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// 2. Get Custom Trips for Logged-in User
exports.getUserCustomTrips = async (req, res) => {
    try {
        const userId = req.user.id;
        const [trips] = await pool.query(`
            SELECT ct.*, d.name_en AS dest_name_en, d.name_bn AS dest_name_bn, d.image_url, d.country, d.city
            FROM custom_trips ct
            JOIN destinations d ON ct.destination_id = d.id
            WHERE ct.user_id = ?
            ORDER BY ct.created_at DESC
        `, [userId]);

        return res.json({ success: true, count: trips.length, data: trips });
    } catch (err) {
        console.error('Error fetching user custom trips:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// 3. Get Custom Trip by ID
exports.getCustomTrip = async (req, res) => {
    try {
        const tripId = req.params.id;
        const [tripRows] = await pool.query(`
            SELECT ct.*, d.name_en AS destination_name, d.image_url AS destination_image, d.currency_code
            FROM custom_trips ct
            JOIN destinations d ON ct.destination_id = d.id
            WHERE ct.id = ?
        `, [tripId]);

        if (tripRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Custom trip not found' });
        }

        const [days] = await pool.query('SELECT * FROM trip_days WHERE custom_trip_id = ? ORDER BY day_number ASC', [tripId]);
        res.json({
            success: true,
            trip: tripRows[0],
            days
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 4. Delete Custom Trip
exports.deleteCustomTrip = async (req, res) => {
    try {
        const userId = req.user.id;
        const tripId = req.params.id;

        await pool.query('DELETE FROM trip_days WHERE custom_trip_id = ?', [tripId]);
        await pool.query('DELETE FROM custom_trips WHERE id = ? AND user_id = ?', [tripId, userId]);

        return res.json({ success: true, message: 'Custom trip deleted successfully' });
    } catch (err) {
        console.error('Error deleting custom trip:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// 5. AI Budget Protection Optimizer (Rules #18, #19, #45)
exports.optimizeTrip = async (req, res) => {
    try {
        const { destination_id = 1, current_total = 1850, target_budget = 1400, duration_days = 7, travelers = 2 } = req.body;

        const overBudget = current_total - target_budget;
        if (overBudget <= 0) {
            return res.json({
                success: true,
                is_over_budget: false,
                message: 'Your current selections are already comfortably within your budget!'
            });
        }

        // Query lower tier hotels for the destination
        const [cheaperHotels] = await pool.query(`
            SELECT h.name_en, h.tier, hp.selling_price
            FROM hotels h
            JOIN hotel_rooms hr ON h.id = hr.hotel_id
            JOIN hotel_prices hp ON hr.id = hp.room_id
            WHERE h.destination_id = ? AND h.tier IN ('budget', 'standard')
            ORDER BY hp.selling_price ASC LIMIT 2
        `, [destination_id]);

        // Query affordable transport
        const [cheaperTrans] = await pool.query(`
            SELECT t.title_en, tp.selling_price, tp.pricing_unit
            FROM transportation t
            JOIN transportation_prices tp ON t.id = tp.transport_id
            WHERE t.destination_id = ? AND t.vehicle_type IN ('scooter', 'public')
            LIMIT 1
        `, [destination_id]);

        const recommendations = [];
        let totalSavings = 0;

        if (cheaperHotels.length > 0) {
            const h = cheaperHotels[0];
            const hotelSavings = (180 - parseFloat(h.selling_price)) * (duration_days - 1);
            if (hotelSavings > 0) {
                totalSavings += hotelSavings;
                recommendations.push({
                    type: 'Hotel',
                    title: `Switch to ${h.name_en} (${h.tier.toUpperCase()})`,
                    current_rate: '$180 / night',
                    suggested_rate: `$${h.selling_price} / night`,
                    savings: Math.round(hotelSavings),
                    reason: 'Highly rated boutique hotel with verified traveler reviews and central location.'
                });
            }
        }

        if (cheaperTrans.length > 0) {
            const tr = cheaperTrans[0];
            const transSavings = (50 - parseFloat(tr.selling_price)) * duration_days;
            if (transSavings > 0) {
                totalSavings += transSavings;
                recommendations.push({
                    type: 'Transportation',
                    title: `Switch to ${tr.title_en}`,
                    current_rate: '$50 / day',
                    suggested_rate: `$${tr.selling_price} / day`,
                    savings: Math.round(transSavings),
                    reason: 'Fast, flexible local transport allowing you to explore at your own pace.'
                });
            }
        }

        const newEstimatedTotal = Math.max(target_budget, current_total - totalSavings);

        res.json({
            success: true,
            is_over_budget: true,
            over_budget_amount: overBudget,
            potential_savings: totalSavings,
            new_estimated_total: newEstimatedTotal,
            recommendations,
            ai_summary: `By adjusting hotel to ${cheaperHotels[0]?.name_en || 'Standard tier'} and optimizing transport, you save $${totalSavings}, bringing your trip down from $${current_total} to $${newEstimatedTotal}!`
        });
    } catch (err) {
        console.error('Error optimizing trip:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};
