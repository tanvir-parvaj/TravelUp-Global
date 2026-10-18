const { pool } = require('../config/db');

// 1. Get all blogs
exports.getAllBlogs = async (req, res) => {
    try {
        const { category } = req.query;
        let query = 'SELECT * FROM blogs WHERE 1=1';
        const params = [];

        if (category && category !== 'all') {
            query += ' AND category = ?';
            params.push(category);
        }

        query += ' ORDER BY created_at DESC';
        const [blogs] = await pool.query(query, params);
        return res.json({ success: true, count: blogs.length, data: blogs });
    } catch (err) {
        console.error('Error fetching blogs:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch blogs' });
    }
};

// 2. Get single blog by ID or slug
exports.getBlogById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM blogs WHERE id = ? OR slug = ?', [id, id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Blog post not found' });
        }
        return res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('Error fetching single blog:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch blog post' });
    }
};

// 3. Admin: Create blog post
exports.createBlog = async (req, res) => {
    try {
        const {
            title_en, title_bn, excerpt_en, content_en,
            author_name, category, image_url, read_time_min
        } = req.body;

        const slug = (title_en || 'travel-guide').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

        const [result] = await pool.query(`
            INSERT INTO blogs (title_en, title_bn, slug, excerpt_en, content_en, author_name, category, image_url, read_time_min)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            title_en, title_bn || title_en, slug, excerpt_en, content_en || excerpt_en,
            author_name || req.user.name || 'Editorial Team', category || 'Tips & Guides',
            image_url || 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80',
            parseInt(read_time_min) || 5
        ]);

        return res.status(201).json({
            success: true,
            message: 'Blog post published successfully!',
            id: result.insertId
        });
    } catch (err) {
        console.error('Error creating blog post:', err);
        return res.status(500).json({ success: false, message: 'Failed to create blog post' });
    }
};
