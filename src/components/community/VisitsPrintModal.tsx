import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, HeartHandshake } from 'lucide-react';
import { VisitGift } from '@/types';

interface VisitsPrintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visits: VisitGift[];
  buildingName?: string;
}

export function VisitsPrintModal({
  open,
  onOpenChange,
  visits,
  buildingName = 'العمارة السكنية'
}: VisitsPrintModalProps) {
  const totalAmount = visits.reduce((sum, v) => sum + (parseFloat(v.amount as string) || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader className="print:hidden">
          <DialogTitle className="text-base font-bold">
            معاينة طباعة سجل التكافل والزيارات الاجتماعية
          </DialogTitle>
        </DialogHeader>

        {/* Printable Document */}
        <div className="bg-white p-6 border rounded-lg text-slate-900 space-y-6 print:border-none print:p-0 my-2">
          {/* Header */}
          <div className="text-center border-b-2 border-slate-900 pb-4">
            <h1 className="text-2xl font-bold text-slate-900">{buildingName}</h1>
            <h2 className="text-base font-semibold text-slate-700 mt-1">
              سجل أنشطة التكافل الاجتماعي، الزيارات، والهدايا
            </h2>
            <div className="text-xs text-slate-500 mt-2">
              تاريخ استخراج التقرير: {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          {/* Quick Stat Bar */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border text-center text-xs">
            <div>
              <span className="text-slate-600 block">إجمالي عدد الزيارات والمناسبات</span>
              <span className="text-base font-bold text-slate-900">{visits.length} مناسبة</span>
            </div>
            <div>
              <span className="text-slate-600 block">إجمالي المبالغ والهدايا المصروفة</span>
              <span className="text-base font-bold text-emerald-700">{totalAmount.toLocaleString()} ر.س</span>
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-right text-xs border border-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300">
                <th className="p-2 border-l border-slate-300">#</th>
                <th className="p-2 border-l border-slate-300">نوع المناسبة</th>
                <th className="p-2 border-l border-slate-300">المستفيد / الساكن</th>
                <th className="p-2 border-l border-slate-300">المبلغ</th>
                <th className="p-2 border-l border-slate-300">التاريخ</th>
                <th className="p-2">التفاصيل والملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {visits.map((item, idx) => (
                <tr key={item.id || idx} className="border-b border-slate-200">
                  <td className="p-2 border-l border-slate-200">{idx + 1}</td>
                  <td className="p-2 border-l border-slate-200 font-semibold">{item.type}</td>
                  <td className="p-2 border-l border-slate-200">{item.beneficiary}</td>
                  <td className="p-2 border-l border-slate-200 font-bold text-slate-900">
                    {parseFloat(item.amount as string || '0').toLocaleString()} ر.س
                  </td>
                  <td className="p-2 border-l border-slate-200">
                    {item.date ? new Date(item.date).toLocaleDateString('ar-EG') : '-'}
                  </td>
                  <td className="p-2 text-slate-600">{item.description || '-'}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-bold">
                <td colSpan={3} className="p-2 border-l border-slate-300 text-center">المجموع الإجمالي:</td>
                <td className="p-2 border-l border-slate-300 text-emerald-800">{totalAmount.toLocaleString()} ر.س</td>
                <td colSpan={2} className="p-2"></td>
              </tr>
            </tbody>
          </table>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-300 text-center text-xs">
            <div>
              <span className="block font-semibold text-slate-800 mb-8">مسؤول العلاقات والتكافل</span>
              <span className="border-t border-slate-400 pt-1 px-8 text-slate-500">التوقيع</span>
            </div>
            <div>
              <span className="block font-semibold text-slate-800 mb-8">مدير اتحاد الملاك</span>
              <span className="border-t border-slate-400 pt-1 px-8 text-slate-500">الاعتماد والختم</span>
            </div>
          </div>
        </div>

        <DialogFooter className="print:hidden gap-2 sm:gap-0 pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handlePrint} className="gap-1.5 bg-primary text-primary-foreground">
            <Printer className="w-4 h-4" />
            طباعة السجل (PDF)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
