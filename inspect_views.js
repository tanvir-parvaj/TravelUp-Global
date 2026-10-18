const fs = require('fs');
const html = fs.readFileSync('client/admin.html', 'utf8');
const lines = html.split('\n');

lines.forEach((l, idx) => {
    if (l.includes('id="visaModal"') || l.includes('id="hotelModal"') || l.includes('id="transportModal"')) {
        console.log(`${idx + 1}: ${l.trim()}`);
    }
});
