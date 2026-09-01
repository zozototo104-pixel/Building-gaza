import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Megaphone } from 'lucide-react';
import { Announcement } from '@/types';

interface AnnouncementPrintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcement: Announcement | null;
  buildingName?: string;
}

export function AnnouncementPrintModal({
  open,
  onOpenChange,
  announcement,
  buildingName = 'العمارة السكنية'
}: AnnouncementPrintModalProps) {
  if (!announcement) return null;

  const getAudienceLabel = (aud: string) => {
    switch (aud) {
      case 'OWNERS':
        return 'السادة / ملاك الشقق المحترمون';
      case 'TENANTS':
        return 'السادة / مستأجري الشقق المحترمون';
      default:
        return 'السادة / قاطني وسكان العمارة الكرام';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader className="print:hidden">
          <DialogTitle className="text-base font-bold">
            معاينة طباعة التعميم الرسمي للإلصاق
          </DialogTitle>
        </DialogHeader>

        {/* Printable Poster */}
        <div className="bg-white p-8 border-2 border-slate-800 rounded-xl text-slate-900 space-y-6 print:border-2 print:border-black print:p-8 my-2">
          {/* Header */}
          <div className="text-center border-b-2 border-slate-900 pb-4">
            <h1 className="text-2xl font-black text-slate-900 tracking-wide">{buildingName}</h1>
            <p className="text-xs text-slate-600 mt-0.5">إدارة اتحاد الملاك وشؤون السكان</p>
            <div className="inline-block bg-slate-900 text-white font-bold px-6 py-1.5 rounded-md text-sm mt-3 tracking-widest">
              إعـــــلان وتـعـمـيـم هــــام
            </div>
            <div className="flex justify-between items-center text-xs text-slate-600 mt-4 px-2">
              <span>المرجع: تعميم رقم ({announcement.id})</span>
              <span>
                التاريخ: {announcement.date ? new Date(announcement.date).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('ar-EG')}
              </span>
            </div>
          </div>

          {/* Salutation */}
          <div className="font-bold text-slate-800 text-sm border-r-4 border-slate-900 pr-3">
            إلى: {getAudienceLabel(announcement.audience)}
          </div>

          {/* Title */}
          <div className="text-center bg-slate-100 p-3 rounded-lg border border-slate-300">
            <h2 className="text-lg font-bold text-slate-900">{announcement.title}</h2>
          </div>

          {/* Main Content Body */}
          <div className="text-sm leading-loose text-slate-800 whitespace-pre-line p-2 text-justify">
            {announcement.content}
          </div>

          {/* Footer Note */}
          <div className="bg-slate-50 p-3 rounded-lg border border-dashed border-slate-400 text-center text-xs text-slate-700">
            شاكرين ومقدرين حسن تعاونكم وحرصكم الدائم على نظافة وسلامة ومصلحة العمارة.
          </div>

          {/* Official Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t-2 border-slate-300 text-center text-xs">
            <div>
              <span className="block font-semibold text-slate-800 mb-8">لجنة المتابعة والتنسيق</span>
              <span className="border-t border-slate-400 pt-1 px-8 text-slate-500">التوقيع</span>
            </div>
            <div>
              <span className="block font-bold text-slate-900 mb-8">إدارة البناية / اتحاد الملاك</span>
              <span className="border-t border-slate-400 pt-1 px-8 text-slate-500">الختم والاعتماد</span>
            </div>
          </div>
        </div>

        <DialogFooter className="print:hidden gap-2 sm:gap-0 pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handlePrint} className="gap-1.5 bg-primary text-primary-foreground">
            <Printer className="w-4 h-4" />
            طباعة التعميم (PDF)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
