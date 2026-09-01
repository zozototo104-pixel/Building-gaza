import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, User, Phone, CheckCircle, Receipt, CreditCard, DollarSign, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { formatDebtSource } from '@/lib/utils';

interface ApartmentDebtModalProps {
  apartmentSummary: any;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  getToken: () => Promise<string | null>;
}

export function ApartmentDebtModal({
  apartmentSummary,
  isOpen,
  onClose,
  onPaymentSuccess,
  getToken
}: ApartmentDebtModalProps) {
  const [payAmount, setPayAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPayForm, setShowPayForm] = useState(false);

  if (!apartmentSummary) return null;

  const totalDebt = apartmentSummary.totalDebt || 0;
  const creditBalance = apartmentSummary.creditBalance || 0;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(payAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('يرجى إدخال مبلغ دفع صحيح');
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          apartmentId: apartmentSummary.apartmentId,
          residentId: apartmentSummary.residentId,
          amount: numAmount,
          method: paymentMethod,
          notes: notes || `تحصيل مستحقات شقة ${apartmentSummary.apartmentNumber}`,
          date: new Date().toISOString()
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'فشل تسجيل الدفعة');
      }

      toast.success(`تم تحصيل ${numAmount.toFixed(2)} شيكل وتحديث الصندوق المالي والديون بنجاح`);
      setShowPayForm(false);
      setPayAmount('');
      setNotes('');
      onPaymentSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء السداد');
    } finally {
      setLoading(false);
    }
  };

  const getSourceLabel = (src: string) => {
    return formatDebtSource(src);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg font-black">
              <Building2 className="h-5 w-5 text-primary" />
              تفاصيل ديون واستحقاقات شقة {apartmentSummary.apartmentNumber}
            </DialogTitle>
            <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 font-mono text-sm font-bold">
              المتبقي: {totalDebt.toFixed(2)} شيكل
            </Badge>
          </div>
        </DialogHeader>

        {/* Apartment & Resident Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-muted/40 rounded-xl border text-xs">
          <div>
            <span className="text-muted-foreground block">الساكن المسجل:</span>
            <span className="font-bold text-foreground flex items-center gap-1 mt-0.5">
              <User className="h-3.5 w-3.5 text-primary" />
              {apartmentSummary.residentName || 'غير مسجل'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block">رقم الهاتف:</span>
            <span className="font-bold text-foreground font-mono flex items-center gap-1 mt-0.5">
              <Phone className="h-3.5 w-3.5 text-primary" />
              {apartmentSummary.residentPhone || 'غير متوفر'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block">الرصيد الدائن الإضافي:</span>
            <span className="font-bold text-emerald-600 font-mono mt-0.5 block">
              {creditBalance.toFixed(2)} شيكل
            </span>
          </div>
        </div>

        {/* Breakdown of Debts */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-foreground">قائمة البنود المستحقة ({apartmentSummary.details?.length || 0})</h4>
            {!showPayForm && totalDebt > 0 && (
              <Button
                size="sm"
                onClick={() => {
                  setPayAmount(totalDebt.toString());
                  setShowPayForm(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 gap-1.5 rounded-lg"
              >
                <CreditCard className="h-3.5 w-3.5" />
                تحصيل / سداد دفعة
              </Button>
            )}
          </div>

          <div className="border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-right text-xs">نوع الاستحقاق</TableHead>
                  <TableHead className="text-right text-xs">المبلغ الأصلي</TableHead>
                  <TableHead className="text-right text-xs">المدفوع</TableHead>
                  <TableHead className="text-right text-xs">المتبقي</TableHead>
                  <TableHead className="text-right text-xs">تاريخ الاستحقاق</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!apartmentSummary.details || apartmentSummary.details.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground text-xs">
                      لا توجد ديون مسجلة على هذه الشقة.
                    </TableCell>
                  </TableRow>
                ) : (
                  apartmentSummary.details.map((item: any, idx: number) => {
                    const orig = parseFloat(item.originalAmount || item.amount || 0);
                    const rem = parseFloat(item.remainingAmount || 0);
                    const paid = Math.max(0, orig - rem);
                    return (
                      <TableRow key={item.id || idx}>
                        <TableCell className="font-bold text-xs">
                          <Badge variant="outline" className="text-xs bg-background">
                            {getSourceLabel(item.source)}
                          </Badge>
                          {item.notes && <span className="block text-[11px] text-muted-foreground mt-0.5">{item.notes}</span>}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-semibold">{orig.toFixed(2)}</TableCell>
                        <TableCell className="font-mono text-xs text-emerald-600 font-semibold">{paid.toFixed(2)}</TableCell>
                        <TableCell className="font-mono text-xs font-black text-rose-600">{rem.toFixed(2)} شيكل</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {item.dueDate ? new Date(item.dueDate).toLocaleDateString('ar-EG') : 'غير محدد'}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Payment Form inside Dialog if triggered */}
        {showPayForm && (
          <form onSubmit={handlePay} className="mt-4 p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-3">
            <h5 className="font-black text-sm text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
              <DollarSign className="h-4 w-4" />
              تسجيل تحصيل فوري وتحديث الصندوق
            </h5>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-foreground">المبلغ المحصل (شيكل)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="500.00"
                  required
                  className="font-mono text-sm bg-background"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-foreground">طريقة الدفع</Label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs"
                >
                  <option value="CASH">نقداً (كاش)</option>
                  <option value="BANK_TRANSFER">تحويل بنكي</option>
                  <option value="CHECK">شيك</option>
                  <option value="OTHER">أخرى</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-foreground">ملاحظات التحصيل</Label>
              <Input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="سداد دفعة من المستحقات"
                className="text-xs bg-background"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPayForm(false)}
                className="text-xs font-bold"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5"
              >
                {loading ? 'جاري التحصيل...' : 'تأكيد السداد وإيداع بالصندوق'}
              </Button>
            </div>
          </form>
        )}

        <DialogFooter className="pt-2 border-t">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto font-bold text-xs">
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
