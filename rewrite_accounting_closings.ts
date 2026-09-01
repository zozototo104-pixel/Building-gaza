import fs from 'fs';
let content = fs.readFileSync('src/pages/Accounting.tsx', 'utf-8');

// Ensure required icons are imported
if (!content.includes('Lock')) {
  content = content.replace(/import \{ ([^}]+) \} from 'lucide-react';/, "import { $1, Lock, Unlock, LockKeyhole } from 'lucide-react';");
}

// Add state for closings
content = content.replace(/const \[expandedApartment, setExpandedApartment\] = useState<number \| null>\(null\);/, 
  "const [expandedApartment, setExpandedApartment] = useState<number | null>(null);\n  const [closings, setClosings] = useState<any[]>([]);\n  const [monthToClose, setMonthToClose] = useState('');\n  const [closingNotes, setClosingNotes] = useState('');");

// Update fetchData
content = content.replace(/fetch\('\/api\/payments', \{ headers \}\)/, 
  "fetch('/api/payments', { headers }), fetch('/api/monthly-closings', { headers })");
content = content.replace(/if \(pRes\.ok\) setPayments\(await pRes\.json\(\)\);/, 
  "if (pRes.ok) setPayments(await pRes.json());\n      const closingsRes = await fetch('/api/monthly-closings', { headers });\n      if (closingsRes.ok) setClosings(await closingsRes.json());");

// Add closing handler
const handleClosingCode = `
  const handleCloseMonth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monthToClose) return;
    try {
      const token = await getToken();
      const res = await fetch('/api/monthly-closings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
        body: JSON.stringify({ month: monthToClose, notes: closingNotes })
      });
      if (res.ok) {
        toast.success('تم إقفال الشهر بنجاح');
        setMonthToClose('');
        setClosingNotes('');
        const closingsRes = await fetch('/api/monthly-closings', { headers: { Authorization: \`Bearer \${token}\` } });
        if (closingsRes.ok) setClosings(await closingsRes.json());
      } else {
        toast.error(await res.text());
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء الإقفال');
    }
  };
`;

content = content.replace(/const handlePayment = async \(e: React.FormEvent\) => \{/, handleClosingCode + '\n  const handlePayment = async (e: React.FormEvent) => {');

// Add TabsTrigger
content = content.replace(/<TabsTrigger value="payments">سجل المدفوعات<\/TabsTrigger>/, 
  '<TabsTrigger value="payments">سجل المدفوعات</TabsTrigger>\n            <TabsTrigger value="closings">الإقفال الشهري</TabsTrigger>');

// Add TabsContent for closings at the end before closing </Tabs>
const closingsTabCode = `
        <TabsContent value="closings" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>الإقفال الشهري</CardTitle>
                <CardDescription>إقفال الحسابات لمنع التعديل وإصدار التقارير</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="gap-2" variant="destructive">
                    <LockKeyhole className="w-4 h-4" /> إقفال شهر جديد
                  </Button>
                </DialogTrigger>
                <DialogContent dir="rtl">
                  <DialogHeader>
                    <DialogTitle>إقفال شهر جديد</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCloseMonth} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">الشهر (YYYY-MM)</label>
                      <Input type="month" value={monthToClose} onChange={e => setMonthToClose(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">ملاحظات (اختياري)</label>
                      <Input value={closingNotes} onChange={e => setClosingNotes(e.target.value)} />
                    </div>
                    <Button type="submit" variant="destructive" className="w-full">تأكيد الإقفال</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الشهر</TableHead>
                      <TableHead className="text-right">تاريخ الإقفال</TableHead>
                      <TableHead className="text-right">بواسطة</TableHead>
                      <TableHead className="text-right">ملاحظات</TableHead>
                      <TableHead className="text-right">حالة الشهر</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {closings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد أشهر مقفلة</TableCell>
                      </TableRow>
                    ) : (
                      closings.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-bold">{c.month}</TableCell>
                          <TableCell>{new Date(c.closedAt).toLocaleDateString('ar-EG')}</TableCell>
                          <TableCell>{c.closedBy?.name || '-'}</TableCell>
                          <TableCell>{c.notes || '-'}</TableCell>
                          <TableCell><Badge variant="destructive"><Lock className="w-3 h-3 mr-1" /> مقفل</Badge></TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
`;
content = content.replace(/<\/Tabs>\s*<\/div>\s*\);\s*\}\s*$/, closingsTabCode + '\n      </Tabs>\n    </div>\n  );\n}\n');

fs.writeFileSync('src/pages/Accounting.tsx', content);
