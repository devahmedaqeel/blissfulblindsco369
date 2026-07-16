const fs = require('fs');
const path = require('path');

const targetDir = __dirname;
const excludeDirs = ['.git', '.next', 'node_modules', 'old-static-html'];

const rootFooter = `    <!-- Bottom Copyright -->
    <div class="container footer-bottom">
      <div class="footer-bottom-row">
        <p>&copy; 2026 Blissful Blinds. All Rights Reserved. Made to Measure Window Blinds.</p>
        <div class="footer-bottom-links">
          <a href="privacy-policy/index.html">Privacy Policy</a>
          <a href="terms-conditions/index.html">Terms & Conditions</a>
        </div>
      </div>
      <div class="footer-legal-disclosure">
        <p>Blissful Blinds is a trading style of Blissful Blinds Ltd, registered in England and Wales. Company Number: 17329706. Registered Office: 75 Ringwood, Bretton, Peterborough, PE3 9SR.</p>
      </div>
    </div>`;

const subfolderFooter = `    <!-- Bottom Copyright -->
    <div class="container footer-bottom">
      <div class="footer-bottom-row">
        <p>&copy; 2026 Blissful Blinds. All Rights Reserved. Made to Measure Window Blinds.</p>
        <div class="footer-bottom-links">
          <a href="../privacy-policy/index.html">Privacy Policy</a>
          <a href="../terms-conditions/index.html">Terms & Conditions</a>
        </div>
      </div>
      <div class="footer-legal-disclosure">
        <p>Blissful Blinds is a trading style of Blissful Blinds Ltd, registered in England and Wales. Company Number: 17329706. Registered Office: 75 Ringwood, Bretton, Peterborough, PE3 9SR.</p>
      </div>
    </div>`;

const privacyFooter = `    <!-- Bottom Copyright -->
    <div class="container footer-bottom">
      <div class="footer-bottom-row">
        <p>&copy; 2026 Blissful Blinds. All Rights Reserved. Made to Measure Window Blinds.</p>
        <div class="footer-bottom-links">
          <a href="index.html">Privacy Policy</a>
          <a href="../terms-conditions/index.html">Terms & Conditions</a>
        </div>
      </div>
      <div class="footer-legal-disclosure">
        <p>Blissful Blinds is a trading style of Blissful Blinds Ltd, registered in England and Wales. Company Number: 17329706. Registered Office: 75 Ringwood, Bretton, Peterborough, PE3 9SR.</p>
      </div>
    </div>`;

const termsFooter = `    <!-- Bottom Copyright -->
    <div class="container footer-bottom">
      <div class="footer-bottom-row">
        <p>&copy; 2026 Blissful Blinds. All Rights Reserved. Made to Measure Window Blinds.</p>
        <div class="footer-bottom-links">
          <a href="../privacy-policy/index.html">Privacy Policy</a>
          <a href="index.html">Terms & Conditions</a>
        </div>
      </div>
      <div class="footer-legal-disclosure">
        <p>Blissful Blinds is a trading style of Blissful Blinds Ltd, registered in England and Wales. Company Number: 17329706. Registered Office: 75 Ringwood, Bretton, Peterborough, PE3 9SR.</p>
      </div>
    </div>`;

const footerRegex = /<!-- Bottom Copyright -->\s*<div class="container footer-bottom">.*?<\/div>\s*<\/footer>/gs;

function walkDir(currentDir) {
  const files = fs.readdirSync(currentDir);
  for (const file of files) {
    const filePath = path.join(currentDir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (!excludeDirs.includes(file)) {
        walkDir(filePath);
      }
    } else {
      const relPath = path.relative(targetDir, filePath).replace(/\\/g, '/');
      
      // Update files that are HTML, JS, TS, or Markdown
      if (file.endsWith('.html') || file.endsWith('.js') || file.endsWith('.md') || file.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let hasChanges = false;
        
        // 1. Replace display phone numbers
        if (content.includes('07341 645339')) {
          content = content.replace(/07341 645339/g, '01733 853037');
          hasChanges = true;
        }
        
        // 2. Replace tel: protocol links
        if (content.includes('tel:+447341645339')) {
          content = content.replace(/tel:\+447341645339/g, 'tel:+441733853037');
          hasChanges = true;
        }
        if (content.includes('tel:07341645339')) {
          content = content.replace(/tel:07341645339/g, 'tel:01733853037');
          hasChanges = true;
        }

        // 3. Replace PHONE_TEL JS/TS declarations (keep whatsapp as mobile)
        const phoneTelRegex = /PHONE_TEL\s*=\s*['"]\+447341645339['"]/g;
        if (phoneTelRegex.test(content)) {
          phoneTelRegex.lastIndex = 0;
          content = content.replace(phoneTelRegex, "PHONE_TEL = '+441733853037'");
          hasChanges = true;
        }

        // 4. Restructure HTML footer design
        if (file.endsWith('.html') && footerRegex.test(content)) {
          let selectedFooter;
          if (relPath === 'index.html') {
            selectedFooter = rootFooter;
          } else if (relPath === 'privacy-policy/index.html') {
            selectedFooter = privacyFooter;
          } else if (relPath === 'terms-conditions/index.html') {
            selectedFooter = termsFooter;
          } else {
            selectedFooter = subfolderFooter;
          }
          
          const newFooterBlock = selectedFooter + '\n  </footer>';
          footerRegex.lastIndex = 0; // reset regex index
          content = content.replace(footerRegex, newFooterBlock);
          hasChanges = true;
        }

        if (hasChanges) {
          fs.writeFileSync(filePath, content, 'utf8');
          console.log(`Updated: ${relPath}`);
        }
      }
    }
  }
}

walkDir(targetDir);
console.log('Design and phone updates completed successfully!');
