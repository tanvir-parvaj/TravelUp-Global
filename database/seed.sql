-- ==============================================================
-- TravelUp Global Seed Data (Synchronized with Design Mockup)
-- Destinations: Bali, Santorini, Tokyo, Maldives, Bangkok, Cox's Bazar, Dubai, Paris
-- ==============================================================

-- 1. Demo Admin and Traveler
INSERT INTO users (id, name, email, password, role, phone, preferred_lang, avatar_url) VALUES
(1, 'Tanvir Parvaj', 'admin@travelupglobal.com', '$2a$10$7v1b38fM9vJ.5B9gQ6I4o.r8kE1E/1pU6n2l4jK8h9u0f3w4e5r6t', 'admin', '+8801700000000', 'en', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'),
(2, 'Sarah Ahmed', 'sarah@travelupglobal.com', '$2a$10$7v1b38fM9vJ.5B9gQ6I4o.r8kE1E/1pU6n2l4jK8h9u0f3w4e5r6t', 'customer', '+8801800000000', 'bn', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. Destinations matching the Mockup
INSERT INTO destinations (id, name_en, name_bn, country, city, category, description_en, description_bn, price_bdt, price_usd, latitude, longitude, image_url, rating, weather_city) VALUES
(1, 'Bali, Indonesia', 'বালি, ইন্দোনেশিয়া', 'Indonesia', 'Bali', 'Beach',
 'Tropical paradise with ancient sea temples, terraced emerald rice fields, and world-class surfing beaches.',
 'ঐতিহাসিক মন্দির, সবুজ ধানের ধাপ এবং বিশ্বমানের সার্ফিং সৈকত সমৃদ্ধ ইন্দোনেশিয়ার সেরা ট্রপিক্যাল স্বর্গ।',
 68500.00, 599.00, -8.4095, 115.1889, 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80', 4.8, 'Denpasar'),

(2, 'Santorini, Greece', 'সান্তোরিনি, গ্রিস', 'Greece', 'Santorini', 'Beach',
 'Famous white-washed cliffside cubiform houses overlooking the sapphire Aegean Sea and world-renowned sunsets.',
 'নীল এজিয়ান সাগর এবং বিশ্বখ্যাত সূর্যাস্তের মনোরম দৃশ্য উপভোগের জন্য সাদা রঙের অনন্য স্থাপত্যের দ্বীপ।',
 103000.00, 899.00, 36.3932, 25.4615, 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80', 4.9, 'Santorini'),

(3, 'Tokyo, Japan', 'টোকিও, জাপান', 'Japan', 'Tokyo', 'City',
 'A vibrant metropolis blending ultra-modern neon-lit skyscrapers with historic temples and world-class cuisine.',
 'ঐতিহাসিক মন্দির, আধুনিক গগনচুম্বী অট্টালিকা, প্রযুক্তি এবং বিশ্বখ্যাত জাপানি সংস্কৃতির প্রাণবন্ত নগরী।',
 126000.00, 1099.00, 35.6762, 139.6503, 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80', 4.8, 'Tokyo'),

(4, 'Maldives Paradise', 'মালদ্বীপ স্বর্গ', 'Maldives', 'Male', 'Beach',
 'Luxury overwater bungalows, crystal clear turquoise lagoons, coral reefs, and untouched private atolls.',
 'স্বচ্ছ ফিরোজা জলরাশি, বিলাসবহুল ওভারওয়াটার ভিলা এবং রোমাঞ্চকর প্রবাল প্রাচীরের অপরূপ দ্বীপরাষ্ট্র।',
 149000.00, 1299.00, 3.2028, 73.2207, 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80', 4.9, 'Male'),

(5, 'Bangkok, Thailand', 'ব্যাংকক, থাইল্যান্ড', 'Thailand', 'Bangkok', 'City',
 'Golden sacred Buddhist shrines, bustling street markets, Chao Phraya river cruises, and vibrant nightlife.',
 'স্বর্ণালি বৌদ্ধ মন্দির, মুখরোচক স্ট্রিট ফুড, ভাসমান বাজার এবং নদী ভ্রমণের চমৎকার থাই অভিজ্ঞতা।',
 57000.00, 499.00, 13.7563, 100.5018, 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80', 4.7, 'Bangkok'),

(6, 'Cox''s Bazar Beach', 'কক্সবাজার সমুদ্র সৈকত', 'Bangladesh', 'Cox''s Bazar', 'Beach',
 'The world''s longest natural unbroken sandy sea beach spanning 120km along the Bay of Bengal.',
 'বঙ্গোপসাগরের কোল ঘেঁষে অবস্থিত ১২০ কিলোমিটার দীর্ঘ বিশ্বের দীর্ঘতম অবিচ্ছিন্ন প্রাকৃতিক সমুদ্র সৈকত।',
 7500.00, 65.00, 21.4272, 91.9702, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', 4.9, 'Cox''s Bazar'),

(7, 'Dubai Luxury City', 'দুবাই লাক্সারি সিটি', 'United Arab Emirates', 'Dubai', 'City',
 'Iconic Burj Khalifa, gold souks, luxury desert safaris, Palm Jumeirah, and opulent megastructures.',
 'বুর্জ খলিফা, বিলাসবহুল ডেজার্ট সাফারি, পাম জুমেইরাহ এবং আধুনিক স্থাপত্যকলার অনন্য আরবীয় নগরী।',
 114000.00, 999.00, 25.2048, 55.2708, 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80', 4.8, 'Dubai'),

(8, 'Paris & Europe Discovery', 'প্যারিস ও ইউরোপ ডিসকভারি', 'France', 'Paris', 'City',
 'The City of Light showcasing the Eiffel Tower, Louvre art museum, Seine river cruises, and romantic boulevards.',
 'আইফেল টাওয়ার, ল্যুভর জাদুঘর, স্যেন নদীর ক্রুজ এবং ইউরোপের রাজকীয় রোমান্টিক রাজপথ।',
 172000.00, 1499.00, 48.8566, 2.3522, 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80', 4.9, 'Paris')
ON DUPLICATE KEY UPDATE 
    name_en=VALUES(name_en), 
    name_bn=VALUES(name_bn), 
    price_usd=VALUES(price_usd), 
    price_bdt=VALUES(price_bdt), 
    rating=VALUES(rating),
    image_url=VALUES(image_url);

-- 3. Featured Packages matching the Mockup
INSERT INTO packages (id, destination_id, title_en, title_bn, duration_days, price_bdt, price_usd, included_services, discount_percent) VALUES
(1, 1, 'Bali Adventure', 'বালি অ্যাডভেঞ্চার প্যাকেজ', 5, 80000.00, 699.00, 'Flight + Hotel + Tour, Temple Excursions, Breakfast', 15),
(2, 7, 'Dubai Luxury', 'দুবাই লাক্সারি প্যাকেজ', 6, 114000.00, 999.00, 'Flight + Hotel + Tour, Burj Khalifa, Desert Safari', 10),
(3, 5, 'Thailand Getaway', 'থাইল্যান্ড গেটওয়ে প্যাকেজ', 5, 68000.00, 599.00, 'Flight + Hotel + Tour, Island Cruise, Coral Tour', 20),
(4, 8, 'Europe Discovery', 'ইউরোপ ডিসকভারি প্যাকেজ', 10, 172000.00, 1499.00, 'Flight + Hotel + Tour, 4 Countries, Sightseeing Pass', 10)
ON DUPLICATE KEY UPDATE title_en=VALUES(title_en);

-- 4. Travel Alerts
INSERT INTO travel_alerts (id, destination_id, title_en, title_bn, severity, message_en, message_bn, is_active) VALUES
(1, 1, 'Visa On Arrival (VoA) Active', 'অন-অ্যারাইভাল ভিসা কার্যকর', 'info',
 'Bangladeshi passport holders can obtain Visa On Arrival for 30 days at Bali Ngurah Rai Airport.',
 'বাংলাদেশি পাসপোর্টধারীদের জন্য বালি আন্তর্জাতিক বিমানবন্দরে ৩০ দিনের ভিসা অন-অ্যারাইভাল সুবিধা চালু রয়েছে।', TRUE),
(2, 6, 'Monsoon High Tide Advisory', 'বর্ষাকালীন উচ্চ জোয়ারের সতর্কতা', 'warning',
 'Tourists are advised not to venture into deep sea during evening high tide at Cox''s Bazar.',
 'কক্সবাজারে সন্ধ্যার উচ্চ জোয়ারের সময় গভীর সমুদ্রে নামা থেকে পর্যটকদের সতর্ক থাকার পরামর্শ দেওয়া হচ্ছে।', TRUE)
ON DUPLICATE KEY UPDATE title_en=VALUES(title_en);
