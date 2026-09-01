const fs = require('fs');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace DialogTrigger
  const dialogRegex = /<DialogTrigger asChild>([\s\S]*?)<Button([^>]*)>([\s\S]*?)<\/Button>([\s\S]*?)<\/DialogTrigger>/g;
  content = content.replace(dialogRegex, (match, before, buttonProps, children, after) => {
    return `<DialogTrigger render={<Button${buttonProps} />}>${before}${children}${after}</DialogTrigger>`;
  });

  // Replace SheetTrigger
  const sheetRegex = /<SheetTrigger asChild>([\s\S]*?)<Button([^>]*)>([\s\S]*?)<\/Button>([\s\S]*?)<\/SheetTrigger>/g;
  content = content.replace(sheetRegex, (match, before, buttonProps, children, after) => {
    return `<SheetTrigger render={<Button${buttonProps} />}>${before}${children}${after}</SheetTrigger>`;
  });

  fs.writeFileSync(filePath, content);
}

const files = [
  'src/components/layout/DashboardLayout.tsx',
  'src/pages/Services.tsx',
  'src/pages/Residents.tsx',
  'src/pages/Apartments.tsx',
  'src/pages/Accounting.tsx',
  'src/pages/Water.tsx'
];

files.forEach(patchFile);
console.log("Patched asChild instances.");
