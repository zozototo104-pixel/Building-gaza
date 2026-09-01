import fs from 'fs';
let content = fs.readFileSync('src/pages/RentContracts.tsx', 'utf-8');

// We need to fetch debts for the expanded contract. 
// We will replace the entire file with a more complete version that matches the requirements.

const completeFile = `import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

export function RentContracts() {
  const { getToken } = useAuth();
  const [contracts, setContracts] = useState<any[]>([]);
  const [apartments, setApartments] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedContract, setExpandedContract] = useState<number | null>(null);
  const [contractDebts, setContractDebts] = useState<any[]>([]);
  const { register, handleSubmit, reset } = useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const [resC, resA, resR] = await Promise.all([
        fetch('/api/rent-contracts', { headers: { Authorization: \`Bearer \${token}\` } }),
        fetch('/api/apartments', { headers: { Authorization: \`Bearer \${token}\` } }),
        fetch('/api/residents', { headers: { Authorization: \`Bearer \${token}\` } })
      ]);
      if (resC.ok) setContracts(await resC.json());
      if (resA.ok) setApartments(await resA.json());
      if (resR.ok) setResidents(await resR.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSync = async () => {
    try {
      const token = await getToken();
      const res = await fetch('/api/rent-contracts/sync', {
        method: 'POST',
        headers: { Authorization: \`Bearer \${token}\` }
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(\`تم توليد \${data.generated} شهر إيجار جديد\`);
        if (expandedContract) loadDebts(expandedContract);
      }
    } catch (e) {
      toast.error('حدث خطأ');
    }
  };

  const loadDebts = async (contractId: number) => {
    try {
      const token = await getToken();
      const res = await fetch('/api/debts', { headers: { Authorization: \`Bearer \${token}\` } });
      if (res.ok) {
        const allDebts = await res.json();
        const filtered = allDebts.filter((d: any) => d.source === 'RENT' && d.sourceId === contractId);
        setContractDebts(filtered);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleExpand = (contractId: number) => {
    if (expandedContract === contractId) {
      setExpandedContract(null);
    } else {
      setExpandedContract(contractId);
      loadDebts(contractId);
    }
  };

  const handlePay = async (debtId: number, amount: number) => {
    try {
      const token = await getToken();
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
        body: JSON.stringify({ debtId, amount, method: 'CASH', date: new Date().toISOString() })
      });
      if (res.ok) {
        toast.success('تم تسديد الإيجار بنجاح');
        loadDebts(expandedContract!);
      } else {
        const data = await res.json();
        toast.error(data.error || 'حدث خطأ');
      }
    } catch (e) {
      toast.error('حدث خطأ');
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const token = await getToken();
      const res = await fetch('/api/rent-contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
        body: JSON.stringify({
          ...data,
          apartmentId: parseInt(data.apartmentId),
          tenantId: parseInt(data.residentId),
          monthlyRent: parseFloat(data.amount),
          dueDay: parseInt(data.dueDay) || 1,
          securityDeposit: parseFloat(data.securityDeposit) || 0
        })
      });
      if (res.ok) {
        toast.success('تم تسجيل العقد بنجاح');
        setIsDialogOpen(false);
        reset();
        fetchData();
        handleSync();
      } else {
        toast.error('حدث خطأ أثناء التسجيل');
      }
    } catch (e) {
      toast.error('حدث خطأ');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">إدارة عقود الإيجار</h2>
          <p className="text-muted-foreground mt-1">متابعة عقود الإيجار للمستأجرين وتواريخ الاستحقاق</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSync} className="gap-2">
            <RefreshCw className="w-4 h-4" /> تحديث الأشهر
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" /> إنشاء عقد</Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader><DialogTitle>إنشاء عقد إيجار جديد</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-2">
                  <label>الشقة</label>
                  <select {...register('apartmentId')} required className="flex h-10 w-full rounded-md border px-3 py-2">
                    <option value="">اختر الشقة</option>
                    {apartments.map(a => <option key={a.id} value={a.id}>شقة {a.number}</option>)}
                  </select>
                </div>
                <div className="grid gap-2">
                  <label>المستأجر</label>
                  <select {...register('residentId')} required className="flex h-10 w-full rounded-md border px-3 py-2">
                    <option value="">اختر المستأجر</option>
                    {residents.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2"><label>تاريخ البداية</label><Input type="date" {...register('startDate')} required /></div>
                  <div className="grid gap-2"><label>تاريخ النهاية</label><Input type="date" {...register('endDate')} required /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2"><label>الإيجار الشهري</label><Input type="number" step="0.01" {...register('amount')} required /></div>
                  <div className="grid gap-2"><label>يوم الاستحقاق</label><Input type="number" {...register('dueDay')} defaultValue={1} /></div>
                </div>
                <div className="grid gap-2"><label>مبلغ التأمين</label><Input type="number" step="0.01" {...register('securityDeposit')} defaultValue={0} /></div>
                <Button type="submit" className="w-full">حفظ العقد</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الشقة</TableHead>
                <TableHead>المستأجر</TableHead>
                <TableHead>المدة</TableHead>
                <TableHead>الإيجار الشهري</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">جاري التحميل...</TableCell></TableRow>
              ) : contracts.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">لا توجد عقود مسجلة</TableCell></TableRow>
              ) : contracts.map(c => (
                <React.Fragment key={c.id}>
                  <TableRow className={expandedContract === c.id ? "bg-muted/50" : ""}>
                    <TableCell>شقة {c.apartment?.number}</TableCell>
                    <TableCell>
                      {c.tenant?.name}
                      {c.tenant?.phone && (
                        <Button variant="link" size="sm" className="h-auto p-0 ml-2" onClick={() => {
                          const msg = encodeURIComponent(\`مرحباً \${c.tenant.name}، تذكير بخصوص الإيجار\`);
                          window.open(\`https://wa.me/\${c.tenant.phone}?text=\${msg}\`, '_blank');
                        }}>واتساب</Button>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(c.startDate).toLocaleDateString('ar-EG')} - {new Date(c.endDate).toLocaleDateString('ar-EG')}
                    </TableCell>
                    <TableCell className="font-bold">{c.monthlyRent} ر.س</TableCell>
                    <TableCell>
                      <Badge variant={c.status === 'ACTIVE' ? 'default' : 'secondary'}>{c.status === 'ACTIVE' ? 'ساري' : 'منتهي'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => toggleExpand(c.id)}>
                        {expandedContract === c.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedContract === c.id && (
                    <TableRow>
                      <TableCell colSpan={6} className="p-0 bg-muted/20">
                        <div className="p-4">
                          <h4 className="font-bold mb-4">الأشهر المستحقة</h4>
                          {contractDebts.length === 0 ? <p className="text-sm text-muted-foreground">لا توجد أشهر مسجلة.</p> : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>الشهر</TableHead>
                                  <TableHead>المستحق</TableHead>
                                  <TableHead>المدفوع</TableHead>
                                  <TableHead>المتبقي</TableHead>
                                  <TableHead>الحالة</TableHead>
                                  <TableHead>إجراء</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {contractDebts.map(d => (
                                  <TableRow key={d.id}>
                                    <TableCell>{d.notes}</TableCell>
                                    <TableCell>{d.originalAmount}</TableCell>
                                    <TableCell>{parseFloat(d.originalAmount) - parseFloat(d.remainingAmount)}</TableCell>
                                    <TableCell className="font-bold">{d.remainingAmount}</TableCell>
                                    <TableCell>
                                      <Badge variant={d.status === 'PAID' ? 'default' : d.status === 'PARTIALLY_PAID' ? 'secondary' : 'destructive'}>
                                        {d.status === 'PAID' ? 'مسدد' : d.status === 'PARTIALLY_PAID' ? 'جزئي' : 'غير مسدد'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      {d.status !== 'PAID' && (
                                        <Button size="sm" onClick={() => handlePay(d.id, parseFloat(d.remainingAmount))}>تسديد</Button>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
`;

fs.writeFileSync('src/pages/RentContracts.tsx', completeFile);
console.log("RentContracts UI fixed");
