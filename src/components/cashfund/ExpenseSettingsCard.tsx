import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SlidersHorizontal, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface ExpenseSettingsProps {
  settings: {
    approvalThreshold: number;
    requiredApprovals: number;
  };
  onUpdate: () => void;
  getToken: () => Promise<string | null>;
}

export function ExpenseSettingsCard({ settings, onUpdate, getToken }: ExpenseSettingsProps) {
  const [threshold, setThreshold] = useState(settings.approvalThreshold?.toString() || '500.00');
  const [approvals, setApprovals] = useState(settings.requiredApprovals?.toString() || '2');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/financial-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          approvalThreshold: parseFloat(threshold) || 500,
          requiredApprovals: parseInt(approvals) || 2
        })
      });

      if (!res.ok) {
        throw new Error('فشل حفظ إعدادات الاعتماد');
      }

      toast.success('تم حفظ قاعدة اعتماد المصروفات بنجاح');
      onUpdate();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  const parsedThreshold = parseFloat(threshold) || 500;
  const parsedApprovals = parseInt(approvals) || 2;

  return (
    <Card id="section-expense-settings" className="overflow-hidden border border-border shadow-xs bg-card">
      <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">إعدادات اعتماد المصروف</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                المصروف فوق الحد يتحول لطلب مجلس قبل خصمه من الصندوق.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">حد طلب موافقة المجلس (شيكل)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="font-mono text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">عدد الموافقات المطلوبة</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={approvals}
                onChange={(e) => setApprovals(e.target.value)}
                className="font-mono text-sm"
                required
              />
            </div>
          </div>

          <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-800/50 rounded-xl p-2.5 flex items-center gap-2 text-xs font-semibold text-indigo-900 dark:text-indigo-200">
            <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>المصروف فوق {parsedThreshold.toFixed(2)} شيكل يحتاج {parsedApprovals} موافقات.</span>
          </div>

          <div className="pt-1 flex justify-end">
            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs font-bold h-9 px-4 rounded-xl cursor-pointer shadow-xs"
            >
              <Check className="h-4 w-4" />
              {loading ? 'جاري الحفظ...' : 'حفظ قاعدة الاعتماد'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
