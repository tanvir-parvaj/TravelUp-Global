const { pool } = require('../config/db');

// 1. Smart Budget Planner
exports.calculateBudget = async (req, res) => {
    try {
        const { budget_bdt, days, travelers } = req.body;

        const totalBudget = parseFloat(budget_bdt);
        const tripDays = parseInt(days) || 3;
        const people = parseInt(travelers) || 1;

        if (!totalBudget || totalBudget <= 0) {
            return res.status(400).json({ success: false, message: 'Valid budget amount is required.' });
        }

        // Budget breakdown percentages
        const stayTotal = Math.round(totalBudget * 0.35);
        const foodTotal = Math.round(totalBudget * 0.25);
        const transportTotal = Math.round(totalBudget * 0.25);
        const bufferTotal = Math.round(totalBudget * 0.15);

        const perDayPerPerson = Math.round(totalBudget / (tripDays * people));

        // Find destinations that fit within this budget
        const [destinations] = await pool.query(
            'SELECT * FROM destinations WHERE price_bdt <= ? ORDER BY price_bdt DESC LIMIT 4',
            [totalBudget]
        );

        return res.json({
            success: true,
            summary: {
                total_budget: totalBudget,
                days: tripDays,
                travelers: people,
                per_day_per_person: perDayPerPerson,
                breakdown: {
                    accommodation: { amount: stayTotal, label_en: 'Hotel & Stay', label_bn: 'হোটেল ও থাকার খরচ' },
                    food: { amount: foodTotal, label_en: 'Dining & Food', label_bn: 'খাবার ও রেস্টুরেন্ট' },
                    activities: { amount: transportTotal, label_en: 'Local Transport & Sightseeing', label_bn: 'যাতায়াত ও দর্শনীয় স্থান' },
                    emergency: { amount: bufferTotal, label_en: 'Emergency & Shopping Fund', label_bn: 'জরুরি তহবিল ও শপিং' }
                }
            },
            recommended_destinations: destinations
        });
    } catch (error) {
        console.error('Budget calculation error:', error);
        return res.status(500).json({ success: false, message: 'Failed to calculate budget.' });
    }
};

// 2. Travel Quiz Recommendation
exports.quizRecommendation = async (req, res) => {
    try {
        const { vibe, climate, company, pace } = req.body;
        // vibe: 'beach', 'mountain', 'city', 'nature'

        let category = 'Beach';
        if (vibe === 'mountain') category = 'Mountain';
        else if (vibe === 'city') category = 'City';
        else if (vibe === 'adventure' || vibe === 'nature') category = 'Adventure';

        const [recommendations] = await pool.query(
            'SELECT * FROM destinations WHERE category = ? ORDER BY rating DESC LIMIT 3',
            [category]
        );

        return res.json({
            success: true,
            vibeCategory: category,
            recommendations
        });
    } catch (error) {
        console.error('Quiz recommendation error:', error);
        return res.status(500).json({ success: false, message: 'Failed to process quiz recommendations.' });
    }
};

// 3. AI Travel Assistant (Simulated Intelligent Itinerary Planner)
exports.askAssistant = async (req, res) => {
    try {
        const { prompt, destination_name } = req.body;

        if (!prompt) {
            return res.status(400).json({ success: false, message: 'Prompt message is required.' });
        }

        // Generate intelligent contextual response
        let reply_en = `Here is a personalized 3-day itinerary for ${destination_name || 'your upcoming trip'}:\n` +
            `• Day 1: Arrival, hotel check-in, explore local culinary hotspots, and enjoy a scenic sunset stroll.\n` +
            `• Day 2: Morning nature/sightseeing adventure, afternoon photography tour, followed by authentic cultural dining.\n` +
            `• Day 3: Souvenir shopping at local bazaar, relaxation session, and comfortable return journey.`;

        let reply_bn = `${destination_name || 'আপনার ভ্রমণের'} জন্য ৩ দিনের প্রস্তাবিত ভ্রমণ পরিকল্পনা:\n` +
            `• ১ম দিন: পৌঁছানো, হোটেলে চেক-ইন, স্থানীয় খাবারের স্বাদ গ্রহণ এবং মনোরম সূর্যাস্ত উপভোগ।\n` +
            `• ২য় দিন: সকালে মূল দর্শনীয় স্থান ও প্রাকৃতিক সৌন্দর্য অন্বেষণ, বিকেলে ফটোগ্রাফি ও বিশেষ ডিনার।\n` +
            `• ৩য় দিন: স্থানীয় বাজার থেকে স্যুভেনির কেনাকাটা, বিশ্রাম এবং আনন্দময় প্রত্যাবর্তন।`;

        return res.json({
            success: true,
            reply_en,
            reply_bn
        });
    } catch (error) {
        console.error('AI Assistant error:', error);
        return res.status(500).json({ success: false, message: 'AI Assistant could not respond.' });
    }
};
