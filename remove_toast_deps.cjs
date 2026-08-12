const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir(path.join(__dirname, 'src'), function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace ', toast]' with ']'
    let newContent = content.replace(/,\s*toast\s*\]/g, ']');
    // Replace '[toast, ' with '['
    newContent = newContent.replace(/\[\s*toast\s*,/g, '[');
    // Replace '[toast]' with '[]'
    newContent = newContent.replace(/\[\s*toast\s*\]/g, '[]');
    
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('Fixed:', filePath);
    }
  }
});
