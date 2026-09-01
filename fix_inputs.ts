import fs from 'fs';
let content = fs.readFileSync('src/pages/Accounting.tsx', 'utf-8');

// Fix the input tag
content = content.replace('required \n                    </Button>\n              </DialogTrigger>', 'required />');
fs.writeFileSync('src/pages/Accounting.tsx', content);
