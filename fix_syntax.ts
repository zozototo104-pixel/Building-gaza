import fs from 'fs';

const fixFile = (path: string) => {
    let content = fs.readFileSync(path, 'utf-8');
    // For accounting.tsx which was messed up by } />
    content = content.replace(/} \/>/g, '</DialogTrigger>');
    // For Projects, Water, RentContracts which had <DialogTrigger asChild> originally and then replaced with <DialogTrigger render={
    // Let's just fix it properly by finding <DialogTrigger render={ and the matching } />.
    
    fs.writeFileSync(path, content);
};

fixFile('src/pages/Accounting.tsx');
fixFile('src/pages/Projects.tsx');
fixFile('src/pages/Water.tsx');
fixFile('src/pages/RentContracts.tsx');

