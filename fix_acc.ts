import fs from 'fs';
let content = fs.readFileSync('src/pages/Accounting.tsx', 'utf-8');

content = content.replace(/              \/>/g, '                </Button>\n              </DialogTrigger>');

fs.writeFileSync('src/pages/Accounting.tsx', content);
