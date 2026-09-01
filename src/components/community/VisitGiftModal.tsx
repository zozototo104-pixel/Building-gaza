import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { VisitGift } from '@/types';
import { Gift, HeartHandshake } from 'lucide-react';

interface VisitGiftModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visitGift?: VisitGift | null;
  onSubmit: (data: any) => Promise<void>;
  loading?: boolean;
}

export function VisitGiftModal({
  open,
  onOpenChange,
  visitGift,
  onSubmit,
  loading
}: VisitGiftModalProps) {
  const { register, handleSubmit, reset, setValue } = useForm();

  useEffect(() => {
    if (visitGift) {
      setValue('type', visitGift.type || 'زيارة مريض');
      setValue('beneficiary', visitGift.beneficiary || '');
      setValue('amount', visitGift.amount ? visitGift.amount.toString() : '0');
      setValue('date', visitGift.date ? new Date(visitGift.date).toISOString().split('T')[0] : '');
      setValue('description', visitGift.description || '');
      setValue('attachmentUrl', visitGift.attachmentUrl || '');
      setValue('recordAsCashExpense', false);
    } else {
      reset({
        type: 'زيارة مريض',
        beneficiary: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        attachmentUrl: '',
        recordAsCashExpense: true
      });
    }
  }, [visitGift, open, setValue, reset]);

  const handleFormSubmit = async (data: any) => {
    await onSubmit({
      ...data,
      amount: parseFloat(data.amount) || 0
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]" dir="rtl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold">
              {visitGift ? 'تعديل سجل المناسبة / الزيارة' : 'تسجيل مناسبة اجتماعية أو زيارة وتكافل'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                نوع المناسبة / الزيارة <span className="text-rose-500">*</span>
              </label>
              <select
                {...register('type', { required: true })}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="عيادة مريض وسلامة">🏥 عيادة مريض وسلامة</option>
                <option value="مباركة وزواج">🌸 تهنئة ومباركة زواج</option>
                <option value="تهنئة بمولود جديد">👶 تهنئة بمولود جديد</option>
                <option value="واجب عزاء ومواساة">🕊️ واجب عزاء ومواساة</option>
                <option value="هدية وتكريم">🎁 هدية شكر وتكريم</option>
                <option value="مناسبة اجتماعية أخرى">✨ مناسبة اجتماعية أخرى</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                اسم المستفيد / الساكن <span className="text-rose-500">*</span>
              </label>
              <Input
                {...register('beneficiary', { required: true })}
                placeholder="مثال: جارنا أبو محمد (شقة 5)"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                قيمة الهدية / المبلغ (ر.س) <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register('amount', { required: true })}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                تاريخ الزيارة / المناسبة <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                {...register('date', { required: true })}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              تفاصيل الزيارة / الوفد والمهنئين / الملاحظات
            </label>
            <Textarea
              {...register('description')}
              placeholder="اكتب أسماء المشاركين في الزيارة، نوع الهدية المقدمة (ورد، درع، إعانة)..."
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">رابط مرفق / بطاقة (اختياري)</label>
            <Input
              type="text"
              {...register('attachmentUrl')}
              placeholder="https://..."
            />
          </div>

          {!visitGift && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
              <input
                type="checkbox"
                id="recordExpense"
                {...register('recordAsCashExpense')}
                className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
              />
              <label htmlFor="recordExpense" className="cursor-pointer font-medium">
                خصم قيمة الهدية آلياً كمصروف من الصندوق المالي للعمارة
              </label>
            </div>
          )}

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
              {loading ? 'جاري الحفظ...' : visitGift ? 'حفظ التعديل' : 'تسجيل الزيارة'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
