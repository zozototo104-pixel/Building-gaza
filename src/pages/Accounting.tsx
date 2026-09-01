import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, MoreHorizontal, FileText, CheckCircle2, AlertCircle, Lock, Unlock, LockKeyhole } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { formatDebtSource, formatPaymentMethod, formatStatus } from '@/lib/utils';

export default function Accounting() {
  const { getToken } = useAuth();
  const [debtsSummary, setDebtsSummary] = useState<any[]>([]);
  const [expandedApartment, setExpandedApartment] = useState<number | null>(null);
  const [closings, setClosings] = useState<any[]>([]);
  const [monthToClose, setMonthToClose] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [payments, setPayments] = useState<any[]>([]);
  const [apartments, setApartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isDebtDialogOpen, setIsDebtDialogOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      
      const [resDebts, resPayments, resApt, resClosings] = await Promise.all([
        fetch('/api/debts/summary', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/payments', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/apartments', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/monthly-closings', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      
      if (resDebts.ok) setDebtsSummary(await resDebts.json());
      if (resPayments.ok) setPayments(await resPayments.json());
      if (resApt.ok) setApartments(await resApt.json());
      if (resClosings.ok) setClosings(await resClosings.json());
      
    } catch (e) {
      toast.error('حدث خطأ في تحميل البيانات المالية');
    }
    setLoading(false);
  };

  const handleCloseMonth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monthToClose) return;
    try {
      const token = await getToken();
      const res = await fetch('/api/monthly-closings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ month: monthToClose, notes: closingNotes })
      });
      if (res.ok) {
        toast.success(`تم إقفال شهر ${monthToClose} بنجاح`);
        setMonthToClose('');
        setClosingNotes('');
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'فشل إقفال الشهر');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء إقفال الشهر');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const { register: registerPayment, handleSubmit: handlePaymentSubmit, reset: resetPayment } = useForm();
  const { register: registerDebt, handleSubmit: handleDebtSubmit, reset: resetDebt } = useForm();

  const onPaymentSubmit = async (data: any) => {
    try {
      const token = await getToken();
      const payload = {
        ...data,
        amount: parseFloat(data.amount),
        apartmentId: selectedDebt ? selectedDebt.apartmentId : parseInt(data.apartmentId),
        debtId: selectedDebt ? selectedDebt.id : null,
      };

      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        toast.success('تم تسجيل الدفعة بنجاح');
        setIsPaymentDialogOpen(false);
        setSelectedDebt(null);
        resetPayment();
        fetchData();
      } else {
        toast.error('حدث خطأ أثناء التسجيل');
      }
    } catch (e) {
      toast.error('حدث خطأ أثناء التسجيل');
    }
  };

  const onDebtSubmit = async (data: any) => {
    try {
      const token = await getToken();
      const payload = {
        ...data,
        amount: parseFloat(data.amount),
        apartmentId: parseInt(data.apartmentId),
      };

      const res = await fetch('/api/debts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        toast.success('تم إضافة الدين بنجاح');
        setIsDebtDialogOpen(false);
        resetDebt();
        fetchData();
      } else {
        toast.error('حدث خطأ أثناء الإضافة');
      }
    } catch (e) {
      toast.error('حدث خطأ أثناء الإضافة');
    }
  };

  const filteredSummary = debtsSummary.filter(s => 
    s.apartmentNumber.includes(searchTerm) || s.residentName?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">المحاسبة والمالية</h1>
          <p className="text-muted-foreground mt-1">إدارة الديون، المدفوعات، والمصروفات.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDebtDialogOpen} onOpenChange={setIsDebtDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
              
                <Plus className="h-4 w-4" />
                إضافة دين
              
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]" dir="rtl">
              <DialogHeader>
                <DialogTitle>إضافة دين جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleDebtSubmit(onDebtSubmit)} className="space-y-4 mt-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">الشقة</label>
                  <select 
                    {...registerDebt('apartmentId')} 
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    required
                  >
                    <option value="">اختر الشقة</option>
                    {apartments.map(apt => (
                      <option key={apt.id} value={apt.id}>شقة {apt.number}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">المبلغ</label>
                  <Input type="number" step="0.01" {...registerDebt('amount')} required />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">البيان / ملاحظات</label>
                  <Input {...registerDebt('notes')} required />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">تاريخ الاستحقاق</label>
                  <Input type="date" {...registerDebt('dueDate')} />
                </div>
                <Button type="submit" className="w-full">حفظ الدين</Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isPaymentDialogOpen} onOpenChange={(open) => {
            setIsPaymentDialogOpen(open);
            if (!open) setSelectedDebt(null);
          }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
              
                <Plus className="h-4 w-4" />
                تسجيل دفعة
              
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]" dir="rtl">
              <DialogHeader>
                <DialogTitle>
                  {selectedDebt ? `سداد دين: ${selectedDebt.notes}` : 'تسجيل دفعة جديدة'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handlePaymentSubmit(onPaymentSubmit)} className="space-y-4 mt-4">
                {!selectedDebt && (
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">الشقة</label>
                    <select 
                      {...registerPayment('apartmentId')} 
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      required
                    >
                      <option value="">اختر الشقة</option>
                      {apartments.map(apt => (
                        <option key={apt.id} value={apt.id}>شقة {apt.number}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="grid gap-2">
                  <label className="text-sm font-medium">المبلغ</label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    {...registerPayment('amount')} 
                    defaultValue={selectedDebt ? selectedDebt.remainingAmount : ''}
                    required />
                  {selectedDebt && (
                    <span className="text-xs text-muted-foreground">
                      المتبقي: ${selectedDebt.remainingAmount}
                    </span>
                  )}
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">طريقة الدفع</label>
                  <select 
                    {...registerPayment('method')} 
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="CASH">نقدي</option>
                    <option value="BANK_TRANSFER">تحويل بنكي</option>
                    <option value="CHEQUE">شيك</option>
                    <option value="CREDIT">من الرصيد الدائن</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">المرجع (اختياري)</label>
                  <Input {...registerPayment('reference')} />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">ملاحظات</label>
                  <Input {...registerPayment('notes')} />
                </div>
                <Button type="submit" className="w-full">حفظ الدفعة</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="debts" dir="rtl" className="space-y-4">
        <TabsList>
          <TabsTrigger value="debts">الديون المستحقة</TabsTrigger>
          <TabsTrigger value="payments">سجل المدفوعات</TabsTrigger>
            <TabsTrigger value="closings">الإقفال الشهري</TabsTrigger>
        </TabsList>
        
        <TabsContent value="debts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="بحث برقم الشقة أو البيان..." 
                    className="pr-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                                    <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الشقة</TableHead>
                      <TableHead className="text-right">اسم الساكن</TableHead>
                      <TableHead className="text-right">إجمالي الدين</TableHead>
                      <TableHead className="text-right">التفاصيل</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          جاري التحميل...
                        </TableCell>
                      </TableRow>
                    ) : filteredSummary.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          لا توجد ديون مطابقة
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSummary.map((summary) => (
                        <React.Fragment key={summary.apartmentId}>
                          <TableRow className="bg-muted/30">
                            <TableCell className="font-bold text-primary">شقة {summary.apartmentNumber}</TableCell>
                            <TableCell>{summary.residentName}</TableCell>
                            <TableCell className="font-bold text-destructive">₪{summary.totalDebt}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => setExpandedApartment(expandedApartment === summary.apartmentId ? null : summary.apartmentId)}>
                                {expandedApartment === summary.apartmentId ? 'إخفاء' : 'عرض التفاصيل'}
                              </Button>
                            </TableCell>
                          </TableRow>
                          {expandedApartment === summary.apartmentId && (
                            <TableRow>
                              <TableCell colSpan={4} className="p-0">
                                <div className="p-4 bg-muted/10 border-b">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="text-right">المصدر</TableHead>
                                        <TableHead className="text-right">الوصف</TableHead>
                                        <TableHead className="text-right">الأصل</TableHead>
                                        <TableHead className="text-right">المتبقي</TableHead>
                                        <TableHead className="text-right">الحالة</TableHead>
                                        <TableHead className="text-right">إجراء</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {summary.details.map((debt: any) => (
                                        <TableRow key={debt.id}>
                                          <TableCell>
                                            <Badge variant="outline" className="text-xs bg-muted/50 font-bold border-muted-foreground/20">
                                              {formatDebtSource(debt.source)}
                                            </Badge>
                                          </TableCell>
                                          <TableCell>{debt.notes || '-'}</TableCell>
                                          <TableCell>₪{debt.originalAmount}</TableCell>
                                          <TableCell className="font-bold text-destructive">₪{debt.remainingAmount}</TableCell>
                                          <TableCell>
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                              debt.status === 'PAID' ? 'bg-green-100 text-green-800' : 
                                              debt.status === 'PARTIALLY_PAID' ? 'bg-yellow-100 text-yellow-800' : 
                                              'bg-red-100 text-red-800'
                                            }`}>
                                              {debt.status === 'PAID' ? 'مدفوع' : 
                                                debt.status === 'PARTIALLY_PAID' ? 'مدفوع جزئياً' : 
                                                'مفتوح'}
                                            </span>
                                          </TableCell>
                                          <TableCell>
                                            <Button variant="outline" size="sm" onClick={() => {
                                              setSelectedDebt(debt);
                                              setIsPaymentDialogOpen(true);
                                            }}>
                                              سداد
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">رقم الإيصال</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">الشقة</TableHead>
                      <TableHead className="text-right">المبلغ</TableHead>
                      <TableHead className="text-right">طريقة الدفع</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          جاري التحميل...
                        </TableCell>
                      </TableRow>
                    ) : payments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          لا توجد مدفوعات مسجلة
                        </TableCell>
                      </TableRow>
                    ) : (
                      payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">#{payment.id}</TableCell>
                          <TableCell>{new Date(payment.date).toLocaleDateString('ar-EG')}</TableCell>
                          <TableCell>شقة {payment.apartment?.number || '-'}</TableCell>
                          <TableCell className="font-bold text-green-600">+₪{payment.amount}</TableCell>
                          <TableCell>
                            {payment.method === 'CASH' ? 'نقدي' : 
                             payment.method === 'BANK_TRANSFER' ? 'تحويل بنكي' : 
                             payment.method === 'CHEQUE' ? 'شيك' : payment.method || 'غير محدد'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      
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

      </Tabs>
    </div>
  );
}
