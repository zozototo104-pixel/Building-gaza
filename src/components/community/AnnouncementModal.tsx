import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Announcement } from '@/types';

interface AnnouncementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcement?: Announcement | null;
  onSubmit: (data: any) => Promise<void>;
  loading?: boolean;
}

export function AnnouncementModal({
  open,
  onOpenChange,
  announcement,
  onSubmit,
  loading
}: AnnouncementModalProps) {
  const { register, handleSubmit, reset, setValue } = useForm();

  useEffect(() => {
    if (announcement) {
      setValue('title', announcement.title || '');
      setValue('content', announcement.content || '');
      setValue('audience', announcement.audience || 'ALL');
      setValue('status', announcement.status || 'PUBLISHED');
      setValue('date', announcement.date ? new Date(announcement.date).toISOString().split('T')[0] : '');
      setValue('attachmentUrl', announcement.attachmentUrl || '');
    } else {
      reset({
        title: '',
        content: '',
        audience: 'ALL',
        status: 'PUBLISHED',
        date: new Date().toISOString().split('T')[0],
        attachmentUrl: ''
      });
    }
  }, [announcement, open, setValue, reset]);

  const handleFormSubmit = async (data: any) => {
    await onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {announcement ? 'تعديل الإعلان التعميمي' : 'نشر إعلان / تعميم رسمي جديد'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              عنوان التعميم / الإعلان <span className="text-rose-500">*</span>
            </label>
            <Input
              {...register('title', { required: true })}
              placeholder="مثال: تنبيه بخصوص موعد تعبئة خزان المياه، أعمال صيانة المصعد..."
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              نص الإعلان والتعليمات <span className="text-rose-500">*</span>
            </label>
            <Textarea
              {...register('content', { required: true })}
              placeholder="اكتب تفاصيل الإعلان والتوجيهات بوضوح للسكان..."
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">الفئة المستهدفة</label>
              <select
                {...register('audience')}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ALL">كافة السكان (ملاك ومستأجرين)</option>
                <option value="OWNERS">الملاك فقط</option>
                <option value="TENANTS">المستأجرين فقط</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">تاريخ النشر</label>
              <Input
                type="date"
                {...register('date')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">حالة النشر</label>
              <select
                {...register('status')}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="PUBLISHED">منشور فوري</option>
                <option value="DRAFT">مسودة (غير ظاهر)</option>
                <option value="ARCHIVED">مؤرشف</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">رابط مرفق / صورة (اختياري)</label>
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
              {loading ? 'جاري الحفظ...' : announcement ? 'حفظ التعديلات' : 'نشر الإعلان'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
