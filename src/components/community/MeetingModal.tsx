import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Meeting } from '@/types';

interface MeetingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting?: Meeting | null;
  onSubmit: (data: any) => Promise<void>;
  loading?: boolean;
}

export function MeetingModal({
  open,
  onOpenChange,
  meeting,
  onSubmit,
  loading
}: MeetingModalProps) {
  const { register, handleSubmit, reset, setValue } = useForm();

  useEffect(() => {
    if (meeting) {
      setValue('title', meeting.title || '');
      setValue('date', meeting.date ? new Date(meeting.date).toISOString().split('T')[0] : '');
      setValue('location', meeting.location || 'قاعة الاجتماعات / مدخل العمارة');
      setValue('attendees', meeting.attendees || '');
      setValue('agenda', meeting.agenda || '');
      setValue('decisions', meeting.decisions || '');
      setValue('notes', meeting.notes || '');
      setValue('attachmentUrl', meeting.attachmentUrl || '');
    } else {
      reset({
        title: '',
        date: new Date().toISOString().split('T')[0],
        location: 'مجلس العمارة / مدخل البناية',
        attendees: '',
        agenda: '',
        decisions: '',
        notes: '',
        attachmentUrl: ''
      });
    }
  }, [meeting, open, setValue, reset]);

  const handleFormSubmit = async (data: any) => {
    await onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {meeting ? 'تعديل محضر الاجتماع' : 'تدوين وتوثيق محضر اجتماع اتحاد الملاك'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                عنوان الاجتماع <span className="text-rose-500">*</span>
              </label>
              <Input
                {...register('title', { required: true })}
                placeholder="مثال: الاجتماع الدوري السنوي لعام 2026"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                تاريخ وتوقيت الاجتماع <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                {...register('date', { required: true })}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">مكان الانعقاد</label>
            <Input
              {...register('location')}
              placeholder="مجلس العمارة، مدخل البناية، اجتماع عن بعد (Zoom)..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              قائمة الحضور والنصاب القانوني
            </label>
            <Textarea
              {...register('attendees')}
              placeholder="أسماء الملاك الحاضرين وأرقام شققهم (مثال: شقة 1، شقة 2، شقة 5...)"
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              جدول الأعمال والمواضيع المطروحة
            </label>
            <Textarea
              {...register('agenda')}
              placeholder="1. استعراض التقرير المالي السنوي&#10;2. مناقشة أعمال صيانة المصعد&#10;3. تحديد رسوم الصيانة الجديدة..."
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              القرارات والتوصيات الصادرة <span className="text-rose-500">*</span>
            </label>
            <Textarea
              {...register('decisions', { required: true })}
              placeholder="اكتب بالتفصيل كافة القرارات المتفق عليها ونسب التصويت..."
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">ملاحظات إضافية وتكليفات</label>
              <Input
                {...register('notes')}
                placeholder="التكليفات والمسؤوليات الموكلة للأعضاء..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">رابط مرفق / ملف موقع</label>
              <Input
                type="text"
                {...register('attachmentUrl')}
                placeholder="https://..."
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
              {loading ? 'جاري الحفظ...' : meeting ? 'حفظ التعديل' : 'حفظ المحضر والاعتماد'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
