import fs from 'fs';
let content = fs.readFileSync('src/pages/Accounting.tsx', 'utf-8');

content = content.replace('onChange={(e) => setSearchTerm(e.target.value)}\n                      </Button>\n                </DialogTrigger>', 'onChange={(e) => setSearchTerm(e.target.value)}\n                    />');
fs.writeFileSync('src/pages/Accounting.tsx', content);
