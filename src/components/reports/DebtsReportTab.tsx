import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Clock, Filter, AlertTriangle } from 'lucide-react';
import { formatDebtSource } from '@/lib/utils';

interface DebtsReportTabProps {
  debts: any[];
}

export function DebtsReportTab({ debts }: DebtsReportTabProps) {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'PARTIALLY_PAID' | 'PAID'>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');

  const filteredDebts = debts.filter((d) => {
    if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
    if (sourceFilter !== 'ALL' && d.source !== sourceFilter) return false;
    return true;
  });

  const totalOriginal = filteredDebts.reduce((sum, d) => sum + (parseFloat(d.originalAmount || d.amount) || 0), 0);
  const totalRemaining = filteredDebts.reduce((sum, d) => sum + (parseFloat(d.remainingAmount) || 0), 0);
  const totalSettled = totalOriginal - totalRemaining;

  return (
    <div className="space-y-4" dir="rtl">
      {/* Sub-filters & Quick Metrics */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/40 p-3.5 rounded-xl border border-border/70">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" />
            حالة الاستحقاق:
          </span>
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'ALL' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'
            }`}
          >
            الكل ({debts.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('OPEN')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'OPEN' ? 'bg-rose-600 text-white' : 'bg-card text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
            }`}
          >
            مفتوح / غير مسدد ({debts.filter((d) => d.status === 'OPEN').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('PARTIALLY_PAID')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'PARTIALLY_PAID' ? 'bg-amber-600 text-white' : 'bg-card text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30'
            }`}
          >
            مسدد جزئياً ({debts.filter((d) => d.status === 'PARTIALLY_PAID').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('PAID')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'PAID' ? 'bg-emerald-600 text-white' : 'bg-card text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
            }`}
          >
            مسدد بالكامل ({debts.filter((d) => d.status === 'PAID').length})
          </button>
        </div>

        {/* Totals */}
        <div className="flex items-center gap-3 text-xs font-medium">
          <div className="text-muted-foreground">
            إجمالي الأصل: <span className="font-bold text-foreground">₪{totalOriginal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="text-emerald-600 dark:text-emerald-400">
            تم تحصيله: <span className="font-bold">₪{totalSettled.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="text-destructive font-bold bg-destructive/10 px-2.5 py-1 rounded-lg border border-destructive/20">
            المتبقي (دين قائم): ₪{totalRemaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Main Debts Table */}
      <Card className="border border-border/80 shadow-2xs overflow-hidden">
        <CardHeader className="p-4 pb-3 border-b border-border/60 bg-muted/20">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            سجل الاستحقاقات والذمم المالية على الشقق ({filteredDebts.length} استحقاق)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30 text-xs">
                  <TableHead className="w-[100px] text-right font-bold">الشقة</TableHead>
                  <TableHead className="w-[140px] text-right font-bold">الساكن / المالك</TableHead>
                  <TableHead className="w-[110px] text-right font-bold">المصدر</TableHead>
                  <TableHead className="w-[110px] text-right font-bold">المبلغ الأصلي</TableHead>
                  <TableHead className="w-[110px] text-right font-bold">المبلغ المتبقي</TableHead>
                  <TableHead className="w-[120px] text-right font-bold">تاريخ الاستحقاق</TableHead>
                  <TableHead className="w-[110px] text-right font-bold">الحالة</TableHead>
                  <TableHead className="text-right font-bold">البيان والملاحظات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDebts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-sm">
                      لا توجد استحقاقات أو ديون مسجلة مطابقة للشروط
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDebts.map((d) => {
                    const rem = parseFloat(d.remainingAmount) || 0;
                    const orig = parseFloat(d.originalAmount || d.amount) || 0;
                    const isPaid = d.status === 'PAID' || rem <= 0;
                    const isPartial = d.status === 'PARTIALLY_PAID' && rem > 0;
                    const isOverdue = !isPaid && d.dueDate && new Date(d.dueDate) < new Date();

                    return (
                      <TableRow key={d.id} className="hover:bg-muted/40 transition-colors text-xs">
                        {/* Apartment */}
                        <TableCell className="font-bold text-foreground whitespace-nowrap">
                          شقة {d.apartment?.number || '-'}
                        </TableCell>

                        {/* Resident */}
                        <TableCell className="font-medium text-foreground whitespace-nowrap">
                          {d.resident?.name || (d.apartment?.residents?.[0]?.name) || '-'}
                        </TableCell>

                        {/* Source */}
                        <TableCell>
                          <span className="bg-muted px-2 py-0.5 rounded text-[11px] font-semibold text-muted-foreground whitespace-nowrap">
                            {formatDebtSource(d.source)}
                          </span>
                        </TableCell>

                        {/* Original */}
                        <TableCell className="font-semibold text-muted-foreground whitespace-nowrap">
                          ₪{orig.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </TableCell>

                        {/* Remaining */}
                        <TableCell className={`font-bold whitespace-nowrap text-sm ${isPaid ? 'text-emerald-600' : 'text-destructive'}`}>
                          ₪{rem.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </TableCell>

                        {/* Due Date */}
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {d.dueDate ? (
                            <div className="flex items-center gap-1">
                              <span>{new Date(d.dueDate).toLocaleDateString('ar-EG')}</span>
                              {isOverdue && (
                                <AlertTriangle className="h-3 w-3 text-destructive shrink-0" title="متأخر عن موعد الاستحقاق" />
                              )}
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          {isPaid ? (
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 text-[10px] gap-1 px-2 py-0.5 font-bold">
                              <CheckCircle2 className="h-3 w-3" />
                              مسدد
                            </Badge>
                          ) : isPartial ? (
                            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 text-[10px] gap-1 px-2 py-0.5 font-bold">
                              <Clock className="h-3 w-3" />
                              مسدد جزئياً
                            </Badge>
                          ) : (
                            <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 text-[10px] gap-1 px-2 py-0.5 font-bold">
                              <AlertCircle className="h-3 w-3" />
                              غير مسدد
                            </Badge>
                          )}
                        </TableCell>

                        {/* Notes */}
                        <TableCell className="text-muted-foreground max-w-[280px] truncate" title={d.notes || ''}>
                          {d.notes || '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
