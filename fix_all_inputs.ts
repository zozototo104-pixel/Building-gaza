import fs from 'fs';
let content = fs.readFileSync('src/pages/Accounting.tsx', 'utf-8');
content = content.replace(/onChange=\{\(e\) => setSearchTerm\(e\.target\.value\)\}\n\s*<\/Button>\n\s*<\/DialogTrigger>/g, 'onChange={(e) => setSearchTerm(e.target.value)} />');
fs.writeFileSync('src/pages/Accounting.tsx', content);
