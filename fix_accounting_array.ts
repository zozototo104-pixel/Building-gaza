import fs from 'fs';
const lines = fs.readFileSync('src/pages/Accounting.tsx', 'utf-8').split('\n');
const newLines = [];
for (let i = 0; i < lines.length; i++) {
    let l = lines[i];
    if (l.includes('<DialogTrigger render={<Button variant="outline" className="gap-2" />} />}>')) {
        newLines.push('              <DialogTrigger asChild>');
        newLines.push('                <Button variant="outline" className="gap-2">');
        continue;
    }
    if (l.includes('<DialogTrigger render={<Button className="gap-2" />} />}>')) {
        newLines.push('              <DialogTrigger asChild>');
        newLines.push('                <Button className="gap-2">');
        continue;
    }
    if (l.includes('/>') && l.trim() === '/>' && (lines[i-1].includes('إضافة دين') || lines[i-1].includes('تسجيل دفعة'))) {
        newLines.push('                </Button>');
        newLines.push('              </DialogTrigger>');
        continue;
    }
    newLines.push(l);
}
fs.writeFileSync('src/pages/Accounting.tsx', newLines.join('\n'));
