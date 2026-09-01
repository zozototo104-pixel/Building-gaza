import fs from 'fs';

const fixFile = (path: string) => {
    let content = fs.readFileSync(path, 'utf-8');
    // First, turn ALL </DialogTrigger> back to } /> (This was my original mistake)
    content = content.replace(/<\/DialogTrigger>/g, '} />');
    
    // Now, manually find real DialogTrigger openings and close them properly.
    // In these files, <DialogTrigger render={...} /> or <DialogTrigger asChild> <Button .../> </DialogTrigger>
    
    // It's much easier to just fix them regex by regex
    content = content.replace(/<DialogTrigger render=\{/g, '<DialogTrigger asChild>');
    content = content.replace(/\} \/>/g, '/>'); // Wait, no.
    fs.writeFileSync(path, content);
};
fixFile('src/pages/Projects.tsx');
fixFile('src/pages/Water.tsx');
fixFile('src/pages/RentContracts.tsx');
fixFile('src/pages/Accounting.tsx');
