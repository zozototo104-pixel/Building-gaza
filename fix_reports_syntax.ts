import fs from 'fs';
let content = fs.readFileSync('src/pages/Reports.tsx', 'utf-8');

// fix the token issue
content = content.replace(/\\`Bearer \\\${token}\\`/g, '`Bearer ${token}`');

// fix style block issue
content = content.replace(/\\.print\\\\:hidden/g, '.print\\\\:hidden');
content = content.replace(/\\.print\\\\:block/g, '.print\\\\:block');

fs.writeFileSync('src/pages/Reports.tsx', content);
