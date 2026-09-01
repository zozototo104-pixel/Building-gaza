import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';
import { ProjectMetrics, Apartment } from '@/types';

interface ProjectPrintViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectMetrics | null;
  cashFundTransactions: any[];
  apartments: Apartment[];
  buildingName?: string;
}

export function ProjectPrintView({
  open,
  onOpenChange,
  project,
  cashFundTransactions,
  apartments,
  buildingName = 'العمارة السكنية'
}: ProjectPrintViewProps) {
  if (!project) return null;

  const projectTxs = cashFundTransactions.filter(tx => tx.projectId === project.id);
  const contributions = projectTxs.filter(tx => tx.type === 'INCOME');
  const expenses = projectTxs.filter(tx => tx.type === 'EXPENSE');

  const getApartmentLabel = (aptId: number | null) => {
    if (!aptId) return 'مساهمة عامة';
    const apt = apartments.find(a => a.id === aptId);
    if (!apt) return `شقة ${aptId}`;
    return `شقة رقم ${apt.unitNumber} ${apt.residents?.[0]?.name ? `(${apt.residents[0].name})` : ''}`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[850px] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader className="print:hidden">
          <DialogTitle className="flex justify-between items-center text-lg">
            <span>معاينة طباعة كشف حساب المشروع</span>
          </DialogTitle>
        </DialogHeader>

        {/* Printable Sheet */}
        <div id="printable-project-sheet" className="bg-white p-6 border rounded-lg text-slate-900 space-y-6 print:border-none print:p-0">
          {/* Header */}
          <div className="text-center border-b-2 border-slate-800 pb-4">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{buildingName}</h1>
            <h2 className="text-lg font-semibold text-slate-700 mt-1">
              تقرير كشف حساب مشروع: {project.name}
            </h2>
            <div className="flex justify-center items-center gap-4 text-xs text-slate-500 mt-2">
              <span>تاريخ التقرير: {new Date().toLocaleDateString('ar-EG')}</span>
              <span>•</span>
              <span>الحالة: {project.status === 'COMPLETED' ? 'مكتمل' : project.status === 'IN_PROGRESS' ? 'قيد التنفيذ' : 'مخطط'}</span>
              <span>•</span>
              <span>تاريخ البدء: {project.startDate ? new Date(project.startDate).toLocaleDateString('ar-EG') : 'غير محدد'}</span>
            </div>
          </div>

          {/* Financial Overview Grid */}
          <div className="grid grid-cols-4 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-300 text-center">
            <div>
              <span className="text-xs text-slate-600 block">الميزانية المقدرة</span>
              <span className="text-base font-bold text-slate-900">{project.budgetNum.toLocaleString()} ر.س</span>
            </div>
            <div>
              <span className="text-xs text-slate-600 block">إجمالي المحصل</span>
              <span className="text-base font-bold text-emerald-700">{project.collected.toLocaleString()} ر.س</span>
            </div>
            <div>
              <span className="text-xs text-slate-600 block">إجمالي المصروف</span>
              <span className="text-base font-bold text-rose-700">{project.spent.toLocaleString()} ر.س</span>
            </div>
            <div>
              <span className="text-xs text-slate-600 block">الرصيد المتبقي</span>
              <span className={`text-base font-bold ${project.deficit > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
                {project.deficit > 0 ? `عجز: ${project.deficit.toLocaleString()} ر.س` : `${project.remainingToSpend.toLocaleString()} ر.س`}
              </span>
            </div>
          </div>

          {/* Contributions Table */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-800 border-r-4 border-emerald-600 pr-2">
              أولاً: كشف مساهمات الشقق ({contributions.length} مساهمة)
            </h3>
            {contributions.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">لا توجد مساهمات مسجلة.</p>
            ) : (
              <table className="w-full text-right text-xs border border-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300">
                    <th className="p-2 border-l border-slate-300">#</th>
                    <th className="p-2 border-l border-slate-300">الشقة / المساهم</th>
                    <th className="p-2 border-l border-slate-300">المبلغ</th>
                    <th className="p-2 border-l border-slate-300">التاريخ</th>
                    <th className="p-2 border-l border-slate-300">طريقة الدفع</th>
                    <th className="p-2">ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {contributions.map((c, idx) => (
                    <tr key={idx} className="border-b border-slate-200">
                      <td className="p-2 border-l border-slate-200">{idx + 1}</td>
                      <td className="p-2 border-l border-slate-200 font-semibold">{getApartmentLabel(c.apartmentId)}</td>
                      <td className="p-2 border-l border-slate-200 font-bold text-emerald-700">{parseFloat(c.amount).toLocaleString()} ر.س</td>
                      <td className="p-2 border-l border-slate-200">{c.date ? new Date(c.date).toLocaleDateString('ar-EG') : '-'}</td>
                      <td className="p-2 border-l border-slate-200">{c.paymentMethod || 'نقدي'}</td>
                      <td className="p-2 text-slate-600">{c.notes || '-'}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={2} className="p-2 border-l border-slate-300 text-center">إجمالي المحصل:</td>
                    <td className="p-2 border-l border-slate-300 text-emerald-800">{project.collected.toLocaleString()} ر.س</td>
                    <td colSpan={3} className="p-2"></td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {/* Expenses Table */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-800 border-r-4 border-rose-600 pr-2">
              ثانياً: كشف المصروفات والفواتير المنفذة ({expenses.length} عملية صرف)
            </h3>
            {expenses.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">لا توجد مصروفات مسجلة.</p>
            ) : (
              <table className="w-full text-right text-xs border border-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300">
                    <th className="p-2 border-l border-slate-300">#</th>
                    <th className="p-2 border-l border-slate-300">بيان المصروف</th>
                    <th className="p-2 border-l border-slate-300">المبلغ</th>
                    <th className="p-2 border-l border-slate-300">التاريخ</th>
                    <th className="p-2 border-l border-slate-300">المستلم / الطريقة</th>
                    <th className="p-2">ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e, idx) => (
                    <tr key={idx} className="border-b border-slate-200">
                      <td className="p-2 border-l border-slate-200">{idx + 1}</td>
                      <td className="p-2 border-l border-slate-200 font-semibold">{e.notes?.replace(`[مشروع: ${project.name}]`, '').trim() || 'مصروف أعمال'}</td>
                      <td className="p-2 border-l border-slate-200 font-bold text-rose-700">{parseFloat(e.amount).toLocaleString()} ر.س</td>
                      <td className="p-2 border-l border-slate-200">{e.date ? new Date(e.date).toLocaleDateString('ar-EG') : '-'}</td>
                      <td className="p-2 border-l border-slate-200">{e.paymentMethod || 'نقدي'}</td>
                      <td className="p-2 text-slate-600">{e.notes || '-'}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={2} className="p-2 border-l border-slate-300 text-center">إجمالي المصروف:</td>
                    <td className="p-2 border-l border-slate-300 text-rose-800">{project.spent.toLocaleString()} ر.س</td>
                    <td colSpan={3} className="p-2"></td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-8 pt-8 border-t border-slate-300 text-center text-xs">
            <div>
              <span className="block font-semibold text-slate-800 mb-8">المشرف على المشروع</span>
              <span className="border-t border-slate-400 pt-1 px-6 text-slate-500">التوقيع</span>
            </div>
            <div>
              <span className="block font-semibold text-slate-800 mb-8">أمين الصندوق</span>
              <span className="border-t border-slate-400 pt-1 px-6 text-slate-500">التوقيع</span>
            </div>
            <div>
              <span className="block font-semibold text-slate-800 mb-8">مدير اتحاد الملاك</span>
              <span className="border-t border-slate-400 pt-1 px-6 text-slate-500">التوقيع والختم</span>
            </div>
          </div>
        </div>

        <DialogFooter className="print:hidden gap-2 sm:gap-0 pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
          <Button onClick={handlePrint} className="gap-1.5 bg-primary text-primary-foreground">
            <Printer className="w-4 h-4" />
            طباعة الكشف (PDF)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
