import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, PlusCircle, MinusCircle, Printer, Calendar, FileText, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { ProjectMetrics, Apartment } from '@/types';

interface ProjectDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectMetrics | null;
  cashFundTransactions: any[];
  apartments: Apartment[];
  onAddTransaction: (project: ProjectMetrics, type: 'INCOME' | 'EXPENSE') => void;
  onPrint: (project: ProjectMetrics) => void;
}

export function ProjectDetailsModal({
  open,
  onOpenChange,
  project,
  cashFundTransactions,
  apartments,
  onAddTransaction,
  onPrint
}: ProjectDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'contributions' | 'expenses'>('contributions');

  if (!project) return null;

  // Filter transactions for this project
  const projectTxs = cashFundTransactions.filter(tx => tx.projectId === project.id);
  const contributions = projectTxs.filter(tx => tx.type === 'INCOME');
  const expenses = projectTxs.filter(tx => tx.type === 'EXPENSE');

  const getApartmentLabel = (aptId: number | null) => {
    if (!aptId) return 'مساهمة عامة / أخرى';
    const apt = apartments.find(a => a.id === aptId);
    if (!apt) return `شقة ${aptId}`;
    return `شقة رقم ${apt.unitNumber} ${apt.residents?.[0]?.name ? `(${apt.residents[0].name})` : ''}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] flex flex-col p-0 overflow-hidden" dir="rtl">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 text-white rounded-xl shadow-sm">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900">
                  {project.name}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs font-normal">
                    {project.status === 'IN_PROGRESS' ? 'قيد التنفيذ' :
                     project.status === 'COMPLETED' ? 'مكتمل' :
                     project.status === 'CANCELLED' ? 'ملغى' : 'مخطط'}
                  </Badge>
                  <span>•</span>
                  <span>تاريخ البدء: {project.startDate ? new Date(project.startDate).toLocaleDateString('ar-EG') : 'غير محدد'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs text-slate-700 bg-white shadow-sm"
                onClick={() => onPrint(project)}
              >
                <Printer className="w-3.5 h-3.5" />
                طباعة كشف المشروع
              </Button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-slate-500 text-xs block mb-1">الميزانية</span>
              <span className="text-base font-bold text-slate-900">{project.budgetNum.toLocaleString()} ر.س</span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-emerald-200 shadow-2xs">
              <span className="text-emerald-600 text-xs block mb-1">المحصّل من الشقق</span>
              <span className="text-base font-bold text-emerald-700">{project.collected.toLocaleString()} ر.س</span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-rose-200 shadow-2xs">
              <span className="text-rose-600 text-xs block mb-1">المصروف الفعلي</span>
              <span className="text-base font-bold text-rose-700">{project.spent.toLocaleString()} ر.س</span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-slate-500 text-xs block mb-1">الرصيد المتاح للصرف</span>
              <span className={`text-base font-bold ${project.remainingToSpend > 0 ? 'text-blue-700' : project.deficit > 0 ? 'text-rose-700' : 'text-slate-700'}`}>
                {project.deficit > 0 ? `عجز: ${project.deficit.toLocaleString()} ر.س` : `${project.remainingToSpend.toLocaleString()} ر.س`}
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {project.description && (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-700 leading-relaxed">
              <span className="font-semibold text-slate-900 ml-1">وصف المشروع:</span>
              {project.description}
            </div>
          )}

          <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
            <div className="flex items-center justify-between gap-2 border-b pb-2">
              <TabsList className="bg-slate-100/80 p-1">
                <TabsTrigger value="contributions" className="gap-1.5 text-xs font-semibold">
                  <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                  مساهمات الشقق ({contributions.length})
                </TabsTrigger>
                <TabsTrigger value="expenses" className="gap-1.5 text-xs font-semibold">
                  <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                  مصروفات وفواتير المشروع ({expenses.length})
                </TabsTrigger>
              </TabsList>

              <Button
                size="sm"
                className={activeTab === 'contributions' ? 'bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5' : 'bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1.5'}
                onClick={() => onAddTransaction(project, activeTab === 'contributions' ? 'INCOME' : 'EXPENSE')}
              >
                {activeTab === 'contributions' ? (
                  <>
                    <PlusCircle className="w-3.5 h-3.5" />
                    إضافة مساهمة
                  </>
                ) : (
                  <>
                    <MinusCircle className="w-3.5 h-3.5" />
                    إضافة مصروف
                  </>
                )}
              </Button>
            </div>

            {/* Contributions Tab */}
            <TabsContent value="contributions" className="mt-3">
              {contributions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs border border-dashed rounded-lg">
                  لم يتم تسجيل أي مساهمات للشقق في هذا المشروع حتى الآن.
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="text-right text-xs">الشقة / المساهم</TableHead>
                        <TableHead className="text-right text-xs">المبلغ</TableHead>
                        <TableHead className="text-right text-xs">التاريخ</TableHead>
                        <TableHead className="text-right text-xs">طريقة الدفع</TableHead>
                        <TableHead className="text-right text-xs">ملاحظات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contributions.map((item, idx) => (
                        <TableRow key={item.id || idx}>
                          <TableCell className="font-semibold text-xs text-slate-800">
                            {getApartmentLabel(item.apartmentId)}
                          </TableCell>
                          <TableCell className="font-bold text-xs text-emerald-600">
                            {parseFloat(item.amount).toLocaleString()} ر.س
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">
                            {item.date ? new Date(item.date).toLocaleDateString('ar-EG') : '-'}
                          </TableCell>
                          <TableCell className="text-xs">
                            <Badge variant="outline" className="text-2xs font-normal">
                              {item.paymentMethod || 'نقدي'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-slate-500 max-w-[200px] truncate">
                            {item.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Expenses Tab */}
            <TabsContent value="expenses" className="mt-3">
              {expenses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs border border-dashed rounded-lg">
                  لم يتم تسجيل أي مصروفات أو فواتير لهذا المشروع حتى الآن.
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="text-right text-xs">بند الصرف</TableHead>
                        <TableHead className="text-right text-xs">المبلغ</TableHead>
                        <TableHead className="text-right text-xs">التاريخ</TableHead>
                        <TableHead className="text-right text-xs">المستلم / الطريقة</TableHead>
                        <TableHead className="text-right text-xs">ملاحظات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((item, idx) => (
                        <TableRow key={item.id || idx}>
                          <TableCell className="font-semibold text-xs text-slate-800">
                            {item.notes?.replace(`[مشروع: ${project.name}]`, '').trim() || 'مصروف أعمال'}
                          </TableCell>
                          <TableCell className="font-bold text-xs text-rose-600">
                            {parseFloat(item.amount).toLocaleString()} ر.س
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">
                            {item.date ? new Date(item.date).toLocaleDateString('ar-EG') : '-'}
                          </TableCell>
                          <TableCell className="text-xs">
                            <Badge variant="outline" className="text-2xs font-normal">
                              {item.paymentMethod || 'نقدي'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-slate-500 max-w-[200px] truncate">
                            {item.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
