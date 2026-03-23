const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.js')) results.push(file);
        }
    });
    return results;
}

const files = walk('d:/testing/uniback/main');
let updatedCount = 0;

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    if (content.includes('https://uniback-api.onrender.com')) {
        content = content.replace(/https:\/\/uniback-api.onrender.com/g, 'http://localhost:5000');
        fs.writeFileSync(f, content, 'utf8');
        console.log('✅ Reverted: ' + path.basename(f));
        updatedCount++;
    }
});

console.log(`\n🎉 Process Complete! Successfully reverted ${updatedCount} files back to localhost.`);
