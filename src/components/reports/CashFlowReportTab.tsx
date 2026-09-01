import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowDownLeft, ArrowUpRight, Filter, Receipt } from 'lucide-react';
import { formatTransactionSource, formatPaymentMethod } from '@/lib/utils';

interface CashFlowReportTabProps {
  records: any[];
}

export function CashFlowReportTab({ records }: CashFlowReportTabProps) {
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');

  const filtered = records.filter((r) => {
    if (typeFilter !== 'ALL' && r.type !== typeFilter) return false;
    if (sourceFilter !== 'ALL' && r.source !== sourceFilter) return false;
    return true;
  });

  const totalIncome = filtered
    .filter((r) => r.type === 'INCOME')
    .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

  const totalExpense = filtered
    .filter((r) => r.type === 'EXPENSE')
    .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

  const netBalance = totalIncome - totalExpense;

  return (
    <div className="space-y-4" dir="rtl">
      {/* Sub-filters & Quick Metrics */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/40 p-3.5 rounded-xl border border-border/70">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" />
            نوع الحركة:
          </span>
          <button
            type="button"
            onClick={() => setTypeFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              typeFilter === 'ALL' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'
            }`}
          >
            الكل ({records.length})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('INCOME')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              typeFilter === 'INCOME' ? 'bg-emerald-600 text-white' : 'bg-card text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
            }`}
          >
            إيداع / مقبوضات ({records.filter((r) => r.type === 'INCOME').length})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('EXPENSE')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              typeFilter === 'EXPENSE' ? 'bg-rose-600 text-white' : 'bg-card text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
            }`}
          >
            صرف / مدفوعات ({records.filter((r) => r.type === 'EXPENSE').length})
          </button>
        </div>

        {/* Tab local summary totals */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="text-emerald-600 dark:text-emerald-400">
            مقبوضات: <span className="font-bold">₪{totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="text-rose-600 dark:text-rose-400">
            مصروفات: <span className="font-bold">₪{totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="font-bold text-foreground bg-card px-2.5 py-1 rounded-lg border border-border">
            الصافي: <span className={netBalance >= 0 ? 'text-primary' : 'text-rose-600'}>₪{netBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Main Transactions Table */}
      <Card className="border border-border/80 shadow-2xs overflow-hidden">
        <CardHeader className="p-4 pb-3 border-b border-border/60 bg-muted/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              سجل حركة الصندوق والمقبوضات النقدية ({filtered.length} حركة)
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30 text-xs">
                  <TableHead className="w-[100px] text-right font-bold">التاريخ</TableHead>
                  <TableHead className="w-[110px] text-right font-bold">نوع الحركة</TableHead>
                  <TableHead className="w-[120px] text-right font-bold">المبلغ (شيكل)</TableHead>
                  <TableHead className="w-[130px] text-right font-bold">المصدر / البند</TableHead>
                  <TableHead className="w-[110px] text-right font-bold">الشقة / الوحدة</TableHead>
                  <TableHead className="w-[120px] text-right font-bold">طريقة الدفع</TableHead>
                  <TableHead className="text-right font-bold">البيان والتفاصيل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                      لا توجد حركات مسجلة تطابق محددات البحث والفترة المحددة
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((tx) => {
                    const isIncome = tx.type === 'INCOME';
                    const d = new Date(tx.date || tx.createdAt);
                    const formattedDate = d.toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    });

                    return (
                      <TableRow key={tx.id} className="hover:bg-muted/40 transition-colors text-xs">
                        {/* Date */}
                        <TableCell className="font-medium whitespace-nowrap text-muted-foreground">
                          {formattedDate}
                        </TableCell>

                        {/* Type badge */}
                        <TableCell>
                          {isIncome ? (
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 border-emerald-200 text-[11px] gap-1 px-2 py-0.5 font-bold">
                              <ArrowDownLeft className="h-3 w-3" />
                              إيداع / مقبوض
                            </Badge>
                          ) : (
                            <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-rose-100 border-rose-200 text-[11px] gap-1 px-2 py-0.5 font-bold">
                              <ArrowUpRight className="h-3 w-3" />
                              صرف / نفقة
                            </Badge>
                          )}
                        </TableCell>

                        {/* Amount */}
                        <TableCell className={`font-bold text-sm whitespace-nowrap ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {isIncome ? '+' : '-'} ₪{parseFloat(tx.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </TableCell>

                        {/* Source */}
                        <TableCell className="font-medium text-foreground">
                          <span className="bg-muted px-2 py-0.5 rounded text-[11px] font-semibold text-muted-foreground whitespace-nowrap">
                            {formatTransactionSource(tx.source)}
                          </span>
                        </TableCell>

                        {/* Apartment */}
                        <TableCell className="whitespace-nowrap font-semibold">
                          {tx.apartment?.number ? `شقة ${tx.apartment.number}` : '-'}
                        </TableCell>

                        {/* Payment Method */}
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          <span className="bg-muted px-2 py-0.5 rounded text-[11px] font-medium">
                            {formatPaymentMethod(tx.paymentMethod)}
                          </span>
                        </TableCell>

                        {/* Notes & Description */}
                        <TableCell className="text-muted-foreground max-w-[320px] truncate" title={tx.notes || ''}>
                          {tx.notes || '-'}
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
