const fs = require('fs');
const path = require('path');

const gaSnippet = `
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-ZXDRG5V07H"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-ZXDRG5V07H');
</script>
`;

function walkAndReplace(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!fullPath.includes('node_modules') && !fullPath.includes('.git') && !fullPath.includes('ai-marketing')) {
        walkAndReplace(fullPath);
      }
    } else if (fullPath.endsWith('.html') && fullPath !== path.join(__dirname, 'index.html')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (!content.includes('G-ZXDRG5V07H')) {
        content = content.replace(/<head>/i, `<head>\n  ${gaSnippet}`);
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

walkAndReplace(__dirname);
console.log('Done!');
