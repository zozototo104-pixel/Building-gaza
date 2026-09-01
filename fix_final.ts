import fs from 'fs';

let p = fs.readFileSync('src/pages/Projects.tsx', 'utf-8');
p = p.replace('<DialogTrigger asChild>', '<DialogTrigger asChild>');
p = p.replace('</Button>\n            />', '</Button>\n            </DialogTrigger>');
p = p.replace('setBudget(e.target.value)/>', 'setBudget(e.target.value)} />');
fs.writeFileSync('src/pages/Projects.tsx', p);

let a = fs.readFileSync('src/pages/Accounting.tsx', 'utf-8');
a = a.replace(/<DialogTrigger asChild><Button variant="outline" className="gap-2" \/>/g, '<DialogTrigger render={<Button variant="outline" className="gap-2" />} />');
a = a.replace(/<DialogTrigger asChild><Button className="gap-2" \/>/g, '<DialogTrigger render={<Button className="gap-2" />} />');
a = a.replace(/registerDebt\('dueDate'\)\/>/g, "registerDebt('dueDate')} />");
a = a.replace(/registerPayment\('reference'\)\/>/g, "registerPayment('reference')} />");
a = a.replace(/registerPayment\('notes'\)\/>/g, "registerPayment('notes')} />");
fs.writeFileSync('src/pages/Accounting.tsx', a);

let w = fs.readFileSync('src/pages/Water.tsx', 'utf-8');
w = w.replace(/<DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" \/> تسجيل قراءة<\/Button>\/>/g, '<DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> تسجيل قراءة</Button></DialogTrigger>');
w = w.replace(/<DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" \/> تسجيل ضخ<\/Button>\/>/g, '<DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> تسجيل ضخ</Button></DialogTrigger>');
w = w.replace(/setSearchTerm\(e\.target\.value\)\/>/g, 'setSearchTerm(e.target.value)} />');
w = w.replace(/regPump\('time'\)\/>/g, "regPump('time')} />");
w = w.replace(/regPump\('electricityPrice'\)} defaultValue={0\/>/g, "regPump('electricityPrice')} defaultValue={0} />");
w = w.replace(/regPump\('notes'\)\/>/g, "regPump('notes')} />");
fs.writeFileSync('src/pages/Water.tsx', w);

let r = fs.readFileSync('src/pages/RentContracts.tsx', 'utf-8');
r = r.replace(/<DialogTrigger asChild>/g, '<DialogTrigger asChild>');
r = r.replace(/<\/Button>\n          \/>/g, '</Button>\n          </DialogTrigger>');
fs.writeFileSync('src/pages/RentContracts.tsx', r);

