const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');

const keywords = [
  'Setup your Fine-grained GitHub PAT',
  'Cloud Procedure',
  'Push to Cloud',
  'PULL LATEST FROM CLOUD',
  'GITHUB TOKEN VALUE'
];

keywords.forEach(keyword => {
  const index = content.indexOf(keyword);
  if (index !== -1) {
    // Find line number
    const lineNum = content.substring(0, index).split('\n').length;
    console.log(`FOUND: "${keyword}" at line ${lineNum}`);
  } else {
    console.log(`NOT FOUND: "${keyword}"`);
  }
});
