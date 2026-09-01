import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ProjectMetrics, Apartment } from '@/types';
import { PlusCircle, MinusCircle } from 'lucide-react';

interface ProjectTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectMetrics | null;
  type: 'INCOME' | 'EXPENSE';
  apartments: Apartment[];
  onSubmit: (data: any) => Promise<void>;
  loading?: boolean;
}

export function ProjectTransactionModal({
  open,
  onOpenChange,
  project,
  type,
  apartments,
  onSubmit,
  loading
}: ProjectTransactionModalProps) {
  const { register, handleSubmit, reset, setValue } = useForm();

  useEffect(() => {
    if (open) {
      reset({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        apartmentId: apartments.length > 0 ? apartments[0].id.toString() : '',
        paymentMethod: 'تحويل بنكي',
        payee: '',
        item: '',
        notes: ''
      });
    }
  }, [open, apartments, reset]);

  if (!project) return null;

  const isIncome = type === 'INCOME';

  const handleFormSubmit = async (data: any) => {
    await onSubmit({
      ...data,
      type,
      amount: parseFloat(data.amount)
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" dir="rtl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              {isIncome ? <PlusCircle className="w-5 h-5" /> : <MinusCircle className="w-5 h-5" />}
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                {isIncome ? 'تسجيل مساهمة شقة في المشروع' : 'تسجيل مصروف / فاتورة للمشروع'}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                المشروع: <span className="font-semibold text-slate-800">{project.name}</span>
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                المبلغ (ر.س) <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                {...register('amount', { required: true })}
                placeholder="0.00"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                التاريخ <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                {...register('date', { required: true })}
                required
              />
            </div>
          </div>

          {isIncome ? (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">الشقة المساهمة</label>
              <select
                {...register('apartmentId')}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">-- اختر الشقة (أو مساهمة عامة) --</option>
                {apartments.map((apt) => (
                  <option key={apt.id} value={apt.id}>
                    شقة رقم {apt.unitNumber} {apt.residents?.[0]?.name ? `(${apt.residents[0].name})` : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  بند المصروف / المادة المشتراة <span className="text-rose-500">*</span>
                </label>
                <Input
                  {...register('item', { required: !isIncome })}
                  placeholder="مثال: شراء قطع غيار، أجور فنيين، دهان..."
                  required={!isIncome}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">المستلم / المقاول / المورد</label>
                <Input
                  {...register('payee')}
                  placeholder="اسم الشركة أو الفني المستلم للمبلغ..."
                />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">طريقة الدفع / التحويل</label>
            <select
              {...register('paymentMethod')}
              className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="تحويل بنكي">تحويل بنكي / إيداع</option>
              <option value="نقدي">نقدي (كاش)</option>
              <option value="شيك">شيك مصرفي</option>
              <option value="شبكة / مدى">بطاقة مدى / POS</option>
              <option value="سند قبض">سند قبض ورقي</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">ملاحظات / رقم السند أو الحوالة</label>
            <Textarea
              {...register('notes')}
              placeholder="أي تفاصيل أو أرقام مراجع..."
              rows={2}
            />
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
              className={isIncome ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'}
            >
              {loading ? 'جاري التسجيل...' : isIncome ? 'حفظ المساهمة وإيداعها' : 'حفظ المصروف وسحبه'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
