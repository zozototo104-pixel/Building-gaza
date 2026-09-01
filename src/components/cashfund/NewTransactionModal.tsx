import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, ArrowDownLeft, ArrowUpRight, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  getToken: () => Promise<string | null>;
  currentUser?: any;
}

export function NewTransactionModal({
  isOpen,
  onClose,
  onSuccess,
  getToken,
  currentUser
}: NewTransactionModalProps) {
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [item, setItem] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [payee, setPayee] = useState(currentUser?.name || 'Mohammed Alhendi');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح أكبر من الصفر');
      return;
    }

    if (!item.trim()) {
      toast.error('يرجى تحديد بند المعاملة');
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/cash-fund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type,
          item: item.trim(),
          amount: numAmount,
          date,
          payee: payee.trim() || undefined,
          notes: notes.trim() || undefined,
          category: item.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'فشل حفظ المعاملة');
      }

      if (data.requiresApproval) {
        toast.info(data.message || 'تم تحويل المصروف إلى طلب اعتماد مجلس الإدارة لتجاوزه الحد المسموح.');
      } else {
        toast.success(type === 'INCOME' ? 'تم قيد الإيراد في الصندوق بنجاح' : 'تم قيد المصروف في الصندوق بنجاح');
      }

      setItem('');
      setAmount('');
      setNotes('');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء حفظ المعاملة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-lg font-black flex items-center gap-2 text-foreground">
            <PlusCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            معاملة مالية جديدة
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Type Selector (مصروفات / إيرادات) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">نوع المعاملة</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('EXPENSE')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  type === 'EXPENSE'
                    ? 'bg-rose-500/10 text-rose-600 border-rose-500/30 ring-2 ring-rose-500/20'
                    : 'bg-background hover:bg-muted text-muted-foreground border-border'
                }`}
              >
                <ArrowDownLeft className="h-4 w-4" />
                مصروفات
              </button>
              <button
                type="button"
                onClick={() => setType('INCOME')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  type === 'INCOME'
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 ring-2 ring-emerald-500/20'
                    : 'bg-background hover:bg-muted text-muted-foreground border-border'
                }`}
              >
                <ArrowUpRight className="h-4 w-4" />
                إيرادات
              </button>
            </div>
          </div>

          {/* البند */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">البند</Label>
            <Input
              type="text"
              value={item}
              onChange={(e) => setItem(e.target.value)}
              placeholder="مثال: صيانة مصعد، كهرباء خدمات، وقود، إيراد اشتراك..."
              required
              className="text-sm font-semibold"
            />
          </div>

          {/* المبلغ والتاريخ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">المبلغ (شيكل)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                className="font-mono text-base font-bold text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">التاريخ</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="text-xs font-mono"
              />
            </div>
          </div>

          {/* القائم بالمعاملة / المستلم */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">القائم بالمعاملة / المستلم</Label>
            <Input
              type="text"
              value={payee}
              onChange={(e) => setPayee(e.target.value)}
              placeholder="اسم القائم بالمعاملة أو المستلم"
              className="text-sm"
            />
          </div>

          {/* ملاحظات */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">ملاحظات</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أدخل أي ملاحظات إضافية حول المعاملة..."
              rows={2}
              className="text-xs resize-none"
            />
          </div>

          <DialogFooter className="pt-3 border-t gap-2 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto font-bold text-xs"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 px-5"
            >
              <Check className="h-4 w-4" />
              {loading ? 'جاري الحفظ...' : 'حفظ المعاملة'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
