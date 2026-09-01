const fs = require('fs');
let content = fs.readFileSync('src/pages/Community.tsx', 'utf8');
content = content.replace(/fetch\('\/api\/announcements'.*?\)\.then/g, "fetch('/api/announcements', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then");
content = content.replace(/fetch\('\/api\/visits-gifts'.*?\)\.then/g, "fetch('/api/visits-gifts', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then");
fs.writeFileSync('src/pages/Community.tsx', content);
