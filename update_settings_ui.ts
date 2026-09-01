import fs from 'fs';
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf-8');

const newTabsList = `        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="gap-2"><SettingsIcon className="w-4 h-4" /> إعدادات عامة</TabsTrigger>
          <TabsTrigger value="users" className="gap-2"><Users className="w-4 h-4" /> المستخدمين والصلاحيات</TabsTrigger>
          <TabsTrigger value="backup" className="gap-2"><HardDrive className="w-4 h-4" /> النسخ الاحتياطي</TabsTrigger>
          <TabsTrigger value="closing" className="gap-2"><Lock className="w-4 h-4" /> الإقفال الشهري</TabsTrigger>
        </TabsList>`;

content = content.replace(/<TabsList className="grid w-full grid-cols-3">[\s\S]*?<\/TabsList>/, newTabsList);

const closingTab = `
        <TabsContent value="closing" className="space-y-4">
          <MonthlyClosingManagement />
        </TabsContent>
`;

content = content.replace(/<\/Tabs>/, closingTab + '\n      </Tabs>');

// Add import Lock
if(!content.includes('Lock,')) {
    content = content.replace('HardDrive,', 'HardDrive, Lock,');
}

// Now we need to add the MonthlyClosingManagement component to Settings.tsx
const componentStr = `
function MonthlyClosingManagement() {
  const [closings, setClosings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState('');
  const [notes, setNotes] = useState('');

  const fetchClosings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/monthly-closings', { headers: { Authorization: \`Bearer \${token}\` } });
      if (res.ok) {
        setClosings(await res.json());
      }
    } catch (e) {
      toast.error('حدث خطأ');
    }
    setLoading(false);
  };

  useEffect(() => { fetchClosings(); }, []);

  const handleClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!month) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/monthly-closings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
        body: JSON.stringify({ month, notes })
      });
      if (res.ok) {
        toast.success('تم إقفال الشهر بنجاح');
        fetchClosings();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || 'حدث خطأ');
      }
    } catch (e) {
      toast.error('حدث خطأ');
    }
  };

  const handleReopen = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(\`/api/monthly-closings/\${id}\`, {
        method: 'DELETE',
        headers: { Authorization: \`Bearer \${token}\` }
      });
      if (res.ok) {
        toast.success('تم فتح الشهر بنجاح');
        fetchClosings();
      }
    } catch (e) {
      toast.error('حدث خطأ');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>إدارة الإقفال الشهري</CardTitle>
        <CardDescription>إغلاق الأشهر المالية لمنع التعديل عليها</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleClose} className="flex gap-4 mb-8">
          <div className="flex-1">
            <label className="text-sm font-medium">الشهر (YYYY-MM)</label>
            <input type="month" value={month} onChange={e => setMonth(e.target.value)} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium">ملاحظات</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div className="flex items-end">
            <Button type="submit" variant="destructive" className="gap-2"><Lock className="w-4 h-4"/> إقفال الشهر</Button>
          </div>
        </form>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الشهر</TableHead>
              <TableHead>تاريخ الإقفال</TableHead>
              <TableHead>ملاحظات</TableHead>
              <TableHead>إجراء</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={4}>جاري التحميل...</TableCell></TableRow> : 
             closings.length === 0 ? <TableRow><TableCell colSpan={4}>لا يوجد أشهر مقفلة</TableCell></TableRow> :
             closings.map(c => (
               <TableRow key={c.id}>
                 <TableCell className="font-bold">{c.month}</TableCell>
                 <TableCell>{new Date(c.closedAt).toLocaleDateString('ar-EG')}</TableCell>
                 <TableCell>{c.notes || '-'}</TableCell>
                 <TableCell>
                   <Button variant="outline" size="sm" onClick={() => handleReopen(c.id)}>فتح الشهر</Button>
                 </TableCell>
               </TableRow>
             ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
`;

content = content.replace('export default function Settings() {', componentStr + '\nexport default function Settings() {');

fs.writeFileSync('src/pages/Settings.tsx', content);
console.log("Monthly closing UI added to Settings");
