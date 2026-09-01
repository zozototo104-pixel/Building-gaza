import fs from 'fs';
let content = fs.readFileSync('src/pages/Community.tsx', 'utf-8');
content = content.replace(/<DialogTrigger render=\{\s*(<Button[^>]*>.*?<\/Button>)\s*\}\s*\/>/g, '<DialogTrigger asChild>$1</DialogTrigger>');
fs.writeFileSync('src/pages/Community.tsx', content);
