const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            // Skip node_modules
            if (!file.includes('node_modules')) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.endsWith('.js')) results.push(file);
        }
    });
    return results;
}

const files = walk('d:/testing/uniback/main');
let updatedCount = 0;
let totalOccurrences = 0;

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    const matches = (content.match(/http:\/\/localhost:5000/g) || []).length;
    if (matches > 0) {
        totalOccurrences += matches;
        content = content.replace(/http:\/\/localhost:5000/g, 'https://uniback-api.onrender.com');
        fs.writeFileSync(f, content, 'utf8');
        console.log(`✅ Updated ${matches} occurrence(s) in: ${path.relative('d:/testing/uniback/main', f)}`);
        updatedCount++;
    }
});

console.log(`\n🎉 Done! Replaced ${totalOccurrences} occurrences across ${updatedCount} file(s).`);
