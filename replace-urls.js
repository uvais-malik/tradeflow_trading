const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./apps/web/src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(/['"]http:\/\/localhost:3000['"]/g, "(import.meta.env.VITE_API_URL || 'http://localhost:3000')");
  newContent = newContent.replace(/http:\/\/localhost:3000\//g, "${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/");
  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    console.log('Updated ' + file);
  }
});
