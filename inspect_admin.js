const fs = require('fs');
const html = fs.readFileSync('client/admin.html', 'utf8');

const navMatches = [...html.matchAll(/id="(nav[a-zA-Z0-9_-]+)"[^>]*>([\s\S]*?)<\/a>/g)];
console.log('=== FOUND NAV ITEMS ===');
navMatches.forEach(m => {
  const text = m[2].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
  console.log(`${m[1]} -> ${text}`);
});

const viewMatches = [...html.matchAll(/id="(view[a-zA-Z0-9_-]+)"/g)];
console.log('=== FOUND VIEW CONTAINERS ===');
viewMatches.forEach(m => console.log(m[1]));
