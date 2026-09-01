import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Project } from '@/types';

interface ProjectFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
  onSubmit: (data: any) => Promise<void>;
  loading?: boolean;
}

export function ProjectFormModal({
  open,
  onOpenChange,
  project,
  onSubmit,
  loading
}: ProjectFormModalProps) {
  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: {
      name: '',
      description: '',
      budget: '',
      startDate: new Date().toISOString().split('T')[0],
      status: 'PLANNED',
      notes: '',
      attachmentUrl: ''
    }
  });

  useEffect(() => {
    if (project) {
      setValue('name', project.name || '');
      setValue('description', project.description || '');
      setValue('budget', project.budget ? project.budget.toString() : '');
      setValue('startDate', project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '');
      setValue('status', project.status || 'PLANNED');
      setValue('notes', project.notes || '');
      setValue('attachmentUrl', project.attachmentUrl || '');
    } else {
      reset({
        name: '',
        description: '',
        budget: '',
        startDate: new Date().toISOString().split('T')[0],
        status: 'PLANNED',
        notes: '',
        attachmentUrl: ''
      });
    }
  }, [project, open, setValue, reset]);

  const handleFormSubmit = async (data: any) => {
    await onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {project ? 'تعديل بيانات المشروع' : 'إضافة مشروع صيانة وتطوير جديد'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              اسم المشروع <span className="text-rose-500">*</span>
            </label>
            <Input
              {...register('name', { required: true })}
              placeholder="مثال: صيانة وترميم المصعد، تركيب مظلات المواقف..."
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">وصف وأهداف المشروع</label>
            <Textarea
              {...register('description')}
              placeholder="تفاصيل خطة العمل، النطاق، والمواصفات..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                الميزانية التقديرية (ر.س) <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register('budget', { required: true })}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">تاريخ البدء</label>
              <Input
                type="date"
                {...register('startDate')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">حالة المشروع</label>
              <select
                {...register('status')}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="PLANNED">مخطط (قيد الدراسة)</option>
                <option value="IN_PROGRESS">قيد التنفيذ والعمل</option>
                <option value="COMPLETED">مكتمل ومنجز</option>
                <option value="CANCELLED">ملغى</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">رابط مرفق / عقد (اختياري)</label>
              <Input
                type="text"
                {...register('attachmentUrl')}
                placeholder="https://... أو اسم الملف"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">ملاحظات إضافية والمشرف المسؤول</label>
            <Input
              {...register('notes')}
              placeholder="اسم المقاول أو جهة التنفيذ، أرقام التواصل..."
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
              className="bg-primary text-primary-foreground"
            >
              {loading ? 'جاري الحفظ...' : project ? 'حفظ التعديلات' : 'إنشاء المشروع'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
