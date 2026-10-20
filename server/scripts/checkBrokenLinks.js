const fs = require('fs');
const path = require('path');

const clientDir = path.join(__dirname, '../../client');
const files = fs.readdirSync(clientDir).filter(f => f.endsWith('.html'));
const htmlFiles = new Set(files);

console.log('Available HTML files in client:', [...htmlFiles]);

files.forEach(file => {
    const filePath = path.join(clientDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const hrefs = content.match(/href="([^"#]+)"/g) || [];
    const localHrefs = hrefs
        .map(h => h.slice(6, -1))
        .filter(h => !h.startsWith('http') && !h.startsWith('//') && !h.startsWith('data:') && !h.startsWith('mailto:'));

    const broken = localHrefs.filter(h => {
        const clean = h.split('?')[0];
        return clean.endsWith('.html') && !htmlFiles.has(clean);
    });

    if (broken.length > 0) {
        console.log(`❌ ${file} has broken links to: ${[...new Set(broken)].join(', ')}`);
    } else {
        console.log(`✓ ${file}: All local html links valid.`);
    }
});
