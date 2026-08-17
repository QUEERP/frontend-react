const fs = require('fs');
const path = require('path');

function walkSync(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.tsx') || dirFile.endsWith('.ts')) {
        filelist.push(dirFile);
      }
    }
  }
  return filelist;
}

const files = walkSync('c:/Users/DELL/Downloads/new-queerp/frontend/src');
let count = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('download-pdf') && content.includes('businessId=')) {
    // We just want to replace businessId= with x-business-id= immediately following download-pdf? or token=
    // This regex ensures we only modify businessId= when it is in the query params of download-pdf
    const newContent = content.replace(/(download-pdf\?[^`'\"]*)businessId=/g, '$1x-business-id=');
    if (newContent !== content) {
      fs.writeFileSync(file, newContent);
      console.log('Fixed ' + path.basename(file));
      count++;
    }
  }
});
console.log('Fixed ' + count + ' files total.');
