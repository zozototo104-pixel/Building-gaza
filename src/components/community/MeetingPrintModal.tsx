import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Users } from 'lucide-react';
import { Meeting } from '@/types';

interface MeetingPrintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting: Meeting | null;
  buildingName?: string;
}

export function MeetingPrintModal({
  open,
  onOpenChange,
  meeting,
  buildingName = 'العمارة السكنية'
}: MeetingPrintModalProps) {
  if (!meeting) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[850px] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader className="print:hidden">
          <DialogTitle className="text-base font-bold">
            معاينة طباعة محضر اجتماع الجمعية العمومية / مجلس الإدارة
          </DialogTitle>
        </DialogHeader>

        {/* Printable Formal Minutes Document */}
        <div className="bg-white p-8 border-2 border-slate-800 rounded-xl text-slate-900 space-y-6 print:border-none print:p-0 my-2">
          {/* Header */}
          <div className="text-center border-b-2 border-slate-900 pb-4">
            <h1 className="text-2xl font-black text-slate-900 tracking-wide">{buildingName}</h1>
            <p className="text-xs text-slate-600 mt-0.5">مجلس إدارة اتحاد الملاك - سجل المحاضر والقرارات</p>
            <div className="inline-block bg-slate-900 text-white font-bold px-6 py-1.5 rounded-md text-sm mt-3 tracking-wider">
              مـحـضـر اجـتـمـاع رسـمـي
            </div>
            <div className="flex justify-between items-center text-xs text-slate-600 mt-4 px-2">
              <span>رقم المحضر: ({meeting.id})</span>
              <span>
                التاريخ: {meeting.date ? new Date(meeting.date).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
              </span>
              <span>المكان: {meeting.location || 'مجلس العمارة'}</span>
            </div>
          </div>

          {/* Title */}
          <div className="bg-slate-100 p-3 rounded-lg border border-slate-300 text-center">
            <h2 className="text-base font-bold text-slate-900">{meeting.title}</h2>
          </div>

          {/* Attendees Section */}
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-slate-800 border-r-4 border-slate-900 pr-2">
              أولاً: الحضور والنصاب القانوني
            </h3>
            <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
              {meeting.attendees || 'تم اكتمال النصاب القانوني بحضور أغلبية الملاك المسجلين.'}
            </div>
          </div>

          {/* Agenda Section */}
          {meeting.agenda && (
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-slate-800 border-r-4 border-blue-600 pr-2">
                ثانياً: جدول الأعمال والمناقشات
              </h3>
              <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {meeting.agenda}
              </div>
            </div>
          )}

          {/* Decisions Section */}
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-slate-800 border-r-4 border-emerald-600 pr-2">
              ثالثاً: القرارات والتوصيات المعتمدة
            </h3>
            <div className="bg-emerald-50/40 p-3.5 rounded border border-emerald-200 text-xs text-slate-800 leading-relaxed whitespace-pre-line font-medium">
              {meeting.decisions}
            </div>
          </div>

          {/* Notes Section */}
          {meeting.notes && (
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-slate-800 border-r-4 border-amber-600 pr-2">
                رابعاً: التكليفات والملاحظات
              </h3>
              <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {meeting.notes}
              </div>
            </div>
          )}

          {/* Official Signatures Grid */}
          <div className="grid grid-cols-3 gap-6 pt-10 border-t-2 border-slate-300 text-center text-xs">
            <div>
              <span className="block font-semibold text-slate-800 mb-10">أمين السر ومحرر المحضر</span>
              <span className="border-t border-slate-400 pt-1 px-6 text-slate-500">التوقيع</span>
            </div>
            <div>
              <span className="block font-semibold text-slate-800 mb-10">ممثل الملاك الحاضرين</span>
              <span className="border-t border-slate-400 pt-1 px-6 text-slate-500">التوقيع</span>
            </div>
            <div>
              <span className="block font-bold text-slate-900 mb-10">مدير اتحاد الملاك / رئيس الجلسة</span>
              <span className="border-t border-slate-400 pt-1 px-6 text-slate-500">الاعتماد والختم</span>
            </div>
          </div>
        </div>

        <DialogFooter className="print:hidden gap-2 sm:gap-0 pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handlePrint} className="gap-1.5 bg-primary text-primary-foreground">
            <Printer className="w-4 h-4" />
            طباعة المحضر (PDF)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
