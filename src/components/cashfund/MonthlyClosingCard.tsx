import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Unlock, Calendar, AlertCircle, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface MonthlyClosingProps {
  closedMonths: Array<{ id: number; month: string; closedAt: string; notes?: string }>;
  onUpdate: () => void;
  getToken: () => Promise<string | null>;
}

export function MonthlyClosingCard({ closedMonths, onUpdate, getToken }: MonthlyClosingProps) {
  const currentMonthStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCloseMonth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMonth) {
      toast.error('يرجى تحديد الشهر المراد إقفاله');
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/monthly-closings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          month: selectedMonth,
          notes: notes || undefined
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'فشل إقفال الشهر');
      }

      toast.success(`تم إقفال الشهر (${selectedMonth}) مالياً ومنع التعديل عليه بنجاح`);
      setNotes('');
      onUpdate();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء إقفال الشهر');
    } finally {
      setLoading(false);
    }
  };

  const handleReopenMonth = async (id: number, monthName: string) => {
    if (!confirm(`هل أنت متأكد من فتح الشهر المقفل (${monthName}) للسماح بالتعديل؟`)) {
      return;
    }

    try {
      const token = await getToken();
      const res = await fetch(`/api/monthly-closings/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('فشل فتح الشهر');
      toast.success(`تم فتح الشهر (${monthName}) بنجاح`);
      onUpdate();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ');
    }
  };

  const arabicMonths: { [key: string]: string } = {
    '01': 'كانون الثاني (يناير)',
    '02': 'شباط (فبراير)',
    '03': 'آذار (مارس)',
    '04': 'نيسان (أبريل)',
    '05': 'أيار (مايو)',
    '06': 'حزيران (يونيو)',
    '07': 'تموز (يوليو)',
    '08': 'آب (أغسطس)',
    '09': 'أيلول (سبتمبر)',
    '10': 'تشرين الأول (أكتوبر)',
    '11': 'تشرين الثاني (نوفمبر)',
    '12': 'كانون الأول (ديسمبر)'
  };

  const formatMonthName = (m: string) => {
    if (!m) return '';
    const [year, month] = m.split('-');
    return `${arabicMonths[month] || month} ${year}`;
  };

  return (
    <Card id="section-monthly-closing" className="overflow-hidden border border-border shadow-xs bg-card">
      <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">الإقفال المالي الشهري</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                اعتماد شهر يمنع تعديل قيوده لاحقاً حتى فتحه لاحقاً بسبب موثق.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleCloseMonth} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">الشهر المراد إقفاله</Label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="font-mono text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">ملاحظة الاعتماد (اختيارية)</Label>
              <Input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="إقفال ومطابقة الحسابات لشهر آب 2026"
                className="text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white gap-1.5 text-xs font-bold h-9 px-4 rounded-xl cursor-pointer shadow-xs"
            >
              <Lock className="h-4 w-4" />
              {loading ? 'جاري الإقفال...' : 'اعتماد وإقفال'}
            </Button>
          </div>
        </form>

        <div className="pt-3 border-t border-border/60">
          <span className="text-xs font-bold text-muted-foreground block mb-2">الأشهر المقفلة مسبقاً:</span>
          {closedMonths.length === 0 ? (
            <div className="border border-dashed border-border rounded-xl p-3 text-center text-xs text-muted-foreground">
              لا توجد أشهر مقفلة بعد.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {closedMonths.map((cm) => (
                <div
                  key={cm.id}
                  className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-lg px-2.5 py-1.5 flex items-center gap-2 text-xs"
                >
                  <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="font-bold text-amber-900 dark:text-amber-200">{formatMonthName(cm.month)}</span>
                  <button
                    type="button"
                    onClick={() => handleReopenMonth(cm.id, cm.month)}
                    title="فتح الشهر المقفل"
                    className="text-amber-700 hover:text-amber-900 dark:text-amber-400 p-0.5 rounded hover:bg-amber-200/50 cursor-pointer"
                  >
                    <Unlock className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
