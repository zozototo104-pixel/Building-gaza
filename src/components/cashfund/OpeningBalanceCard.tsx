import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Landmark, Pencil, CheckCircle2, Calendar, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

interface OpeningBalanceProps {
  data: {
    id: number | null;
    amount: number;
    date: string;
    custodian: string;
    notes: string;
  };
  onUpdate: () => void;
  getToken: () => Promise<string | null>;
}

export function OpeningBalanceCard({ data, onUpdate, getToken }: OpeningBalanceProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(data.amount?.toString() || '33.00');
  const [date, setDate] = useState(data.date || '2026-08-24');
  const [custodian, setCustodian] = useState(data.custodian || 'المهندس أبو بسام شعت');
  const [notes, setNotes] = useState(data.notes || 'نقداً موجود لدى أمين الصندوق المهندس أبو بسام شعت');
  const [loading, setLoading] = useState(false);

  const handleOpen = () => {
    setAmount(data.amount?.toString() || '33.00');
    setDate(data.date || '2026-08-24');
    setCustodian(data.custodian || 'المهندس أبو بسام شعت');
    setNotes(data.notes || 'نقداً موجود لدى أمين الصندوق المهندس أبو بسام شعت');
    setOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/cash-fund/opening-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(amount) || 0,
          date,
          custodian,
          notes
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'فشل حفظ الرصيد الافتتاحي');
      }

      toast.success('تم تحديث الرصيد الافتتاحي المرحّل بنجاح');
      setOpen(false);
      onUpdate();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = data.date ? new Date(data.date).toLocaleDateString('ar-EG', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }) : '24-08-2026';

  return (
    <>
      <Card id="section-opening-balance" className="overflow-hidden border border-border shadow-xs bg-card">
        <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">الرصيد الافتتاحي المرحّل</h3>
                <p className="text-xs text-muted-foreground mt-0.5">الرصيد النقدي الأساسي المتوفر عند بدء الصندوق</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1 text-xs font-semibold px-2.5 py-0.5">
              <CheckCircle2 className="h-3 w-3" />
              رصيد متوفر
            </Badge>
          </div>

          <div className="my-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-foreground">
                {Number(data.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-sm font-bold text-muted-foreground">شيكل</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
              بتاريخ {formattedDate} · {data.notes || `نقداً موجود لدى أمين الصندوق ${data.custodian || 'المهندس أبو بسام شعت'}`}
            </p>
          </div>

          <div className="pt-2 border-t border-border/60 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpen}
              className="gap-1.5 text-xs font-bold text-primary hover:text-primary hover:bg-primary/5 border-primary/20 h-8 px-3 rounded-lg"
            >
              <Pencil className="h-3.5 w-3.5" />
              تعديل الرصيد الافتتاحي
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Landmark className="h-5 w-5 text-primary" />
              تعديل الرصيد الافتتاحي المرحّل
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">المبلغ (شيكل)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="33.00"
                required
                className="font-mono text-base"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">تاريخ الرصيد الافتتاحي</Label>
              <div className="relative">
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">أمين الصندوق / القائم بالعهدة</Label>
              <Input
                type="text"
                value={custodian}
                onChange={(e) => setCustodian(e.target.value)}
                placeholder="المهندس أبو بسام شعت"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">البيان والملاحظات</Label>
              <Input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="نقداً موجود لدى أمين الصندوق المهندس أبو بسام شعت"
              />
            </div>

            <DialogFooter className="gap-2 pt-3 sm:space-x-0">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={loading} className="gap-1.5 font-bold">
                {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
