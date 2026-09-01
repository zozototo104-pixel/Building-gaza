import fs from 'fs';
let content = `import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Wallet, TrendingUp, TrendingDown, Plus, Download } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

export function CashFund() {
  const { getToken } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('INCOME');
  const [source, setSource] = useState('PAYMENT');
  const [notes, setNotes] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/cash-fund', {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      if (res.ok) {
        setRecords(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddTx = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const res = await fetch('/api/cash-fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
        body: JSON.stringify({ amount, type, source, notes })
      });
      if (res.ok) {
        toast.success('تمت الإضافة بنجاح');
        setIsDialogOpen(false);
        setAmount('');
        setNotes('');
        fetchData();
      } else {
        const d = await res.json();
        toast.error(d.error || 'خطأ');
      }
    } catch (err) {
      toast.error('حدث خطأ');
    }
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8,\\uFEFF"
      + "التاريخ,النوع,المبلغ,المصدر,البيان\\n"
      + records.map(t => {
          const tDate = new Date(t.date).toLocaleDateString('ar-EG');
          const tType = t.type === 'INCOME' ? 'إيراد' : 'مصروف';
          const tAmount = parseFloat(t.amount);
          return \`\${tDate},\${tType},\${tAmount},\${t.source},\${t.notes || ''}\`;
      }).join("\\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "cash_fund.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalIncome = records.filter(r => r.type === 'INCOME').reduce((sum, r) => sum + parseFloat(r.amount), 0);
  const totalExpense = records.filter(r => r.type === 'EXPENSE').reduce((sum, r) => sum + parseFloat(r.amount), 0);
  const currentBalance = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">الصندوق المالي</h2>
          <p className="text-muted-foreground mt-1">سجل التدفقات النقدية الواردة والصادرة</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="w-4 h-4" /> تصدير
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" /> إضافة حركة يدوية</Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader><DialogTitle>تسجيل حركة في الصندوق</DialogTitle></DialogHeader>
              <form onSubmit={handleAddTx} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label>النوع</label>
                    <select value={type} onChange={e => setType(e.target.value)} className="flex h-10 w-full rounded-md border px-3 py-2">
                      <option value="INCOME">وارد</option>
                      <option value="EXPENSE">منصرف</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <label>المصدر</label>
                    <select value={source} onChange={e => setSource(e.target.value)} className="flex h-10 w-full rounded-md border px-3 py-2">
                      {type === 'INCOME' ? (
                        <>
                          <option value="INITIAL_BALANCE">رصيد افتتاحي</option>
                          <option value="PAYMENT">تحصيل</option>
                          <option value="OTHER">أخرى</option>
                        </>
                      ) : (
                        <>
                          <option value="EXPENSE">مصروف</option>
                          <option value="PUMPING">ضخ عام</option>
                          <option value="GIFT">هدايا وزيارات</option>
                          <option value="OTHER">أخرى</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <label>المبلغ</label>
                  <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
                </div>
                <div className="grid gap-2">
                  <label>ملاحظات</label>
                  <Input value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
                <Button type="submit" className="w-full">حفظ</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الرصيد الحالي</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">الرصيد الفعلي المتوفر</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الوارد</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{totalIncome.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">تحصيلات وإيرادات</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المنصرف</CardTitle>
            <TrendingDown className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{totalExpense.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">مصروفات ومدفوعات</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>سجل الحركات المالية</CardTitle>
          <CardDescription>جميع العمليات المسجلة في الصندوق</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>التاريخ</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>المصدر</TableHead>
                <TableHead>البيان</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-4">جاري التحميل...</TableCell></TableRow>
              ) : records.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد حركات.</TableCell></TableRow>
              ) : records.map(record => (
                <TableRow key={record.id}>
                  <TableCell>{new Date(record.date).toLocaleDateString('ar-EG')}</TableCell>
                  <TableCell>
                    <Badge className={record.type === 'INCOME' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-rose-500 hover:bg-rose-600 text-white'}>
                      {record.type === 'INCOME' ? 'وارد' : 'منصرف'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold">{parseFloat(record.amount).toLocaleString()}</TableCell>
                  <TableCell>
                    {record.source === 'INITIAL_BALANCE' ? 'رصيد افتتاحي' : 
                     record.source === 'PAYMENT' ? 'تحصيل' : 
                     record.source === 'EXPENSE' ? 'مصروف' : 
                     record.source === 'PUMPING' ? 'ضخ عام' : 
                     record.source === 'GIFT' ? 'هدية/زيارة' : record.source}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{record.notes || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
`;
fs.writeFileSync('src/pages/CashFund.tsx', content);
console.log("CashFund rewritten");
