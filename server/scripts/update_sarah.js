const { pool } = require('../config/db');

async function updateSarah() {
    try {
        await pool.query("UPDATE users SET status = 'inactive' WHERE email = 'user@travelupglobal.com'");
        console.log('✅ Set Sarah Ahmed to inactive.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

updateSarah();
