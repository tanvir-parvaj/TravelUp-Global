const fs = require('fs');

const content = fs.readFileSync('client/trip-planner.html', 'utf8');

function extractMatches(regex) {
    const list = [];
    let m;
    while ((m = regex.exec(content)) !== null) {
        list.push(m[1]);
    }
    return [...new Set(list)];
}

const modals = extractMatches(/id=["']([^"']*(?:modal|wrap|popup|view|banner|drawer)[^"']*)["']/gi);
const functions = extractMatches(/function\s+([a-zA-Z0-9_]+)\s*\(/g);
const slots = extractMatches(/id=["']slot-([^"']+)["']/g);
const categories = extractMatches(/class=["']content-label["'][^>]*>([\s\S]*?)<\/div>/gi);
const scripts = extractMatches(/<script[^>]*src=["']([^"']+)["']/gi);

console.log('=== TOUR PLANNER CODE AUDIT ===');
console.log('Total file length:', content.length, 'characters, lines:', content.split('\n').length);
console.log('External Scripts:', scripts);
console.log('Categories Count:', categories.length, categories.map(c => c.trim()));
console.log('Slots Count:', slots.length, slots);
console.log('Modals/Views Count:', modals.length, modals);
console.log('Functions Count:', functions.length, functions);
