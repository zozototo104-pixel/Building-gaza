import React from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface VoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  loading?: boolean;
}

export function VoteModal({
  open,
  onOpenChange,
  onSubmit,
  loading
}: VoteModalProps) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      question: '',
      options: 'موافق تماماً, موافق بتحفظ, غير موافق',
      audience: 'ALL',
      startDate: new Date().toISOString().split('T')[0],
      endDate: ''
    }
  });

  const handleFormSubmit = async (data: any) => {
    await onSubmit(data);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            إنشاء تصويت / استفتاء سكني جديد
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              موضوع أو سؤال التصويت <span className="text-rose-500">*</span>
            </label>
            <Textarea
              {...register('question', { required: true })}
              placeholder="مثال: هل توافق على تركيب كاميرات مراقبة إضافية في مدخل ومواقف العمارة؟"
              rows={3}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              خيارات الإجابة (مفصولة بفاصلة) <span className="text-rose-500">*</span>
            </label>
            <Input
              {...register('options', { required: true })}
              placeholder="موافق, غير موافق, ممتنع"
              required
            />
            <p className="text-2xs text-muted-foreground">
              افصل بين كل خيار والآخر بفاصلة (مثال: نعم, لا, أقتراح آخر)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">الفئة المصوّتة</label>
              <select
                {...register('audience')}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ALL">كافة السكان (ملاك ومستأجرين)</option>
                <option value="OWNERS">الملاك فقط (للقرارات المصيرية)</option>
                <option value="TENANTS">المستأجرين فقط</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">تاريخ انتهاء التصويت</label>
              <Input
                type="date"
                {...register('endDate')}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary text-primary-foreground"
            >
              {loading ? 'جاري الإنشاء...' : 'بدء التصويت ونشره'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
