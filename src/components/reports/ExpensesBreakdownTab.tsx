import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, PieChart, Wrench, Zap, Sparkles, Gift, Layers } from 'lucide-react';
import { formatTransactionSource, formatPaymentMethod } from '@/lib/utils';

interface ExpensesBreakdownTabProps {
  expenses: any[];
  cashFundExpenses: any[];
}

export function ExpensesBreakdownTab({ expenses, cashFundExpenses }: ExpensesBreakdownTabProps) {
  // Merge or analyze expenses
  const allExp = expenses.length > 0 ? expenses : cashFundExpenses.filter((c) => c.type === 'EXPENSE');

  // Group by category
  const categoryMap: Record<string, number> = {};
  allExp.forEach((e) => {
    const rawCat = e.category || e.source || 'مصروفات تشغيلية';
    const cat = formatTransactionSource(rawCat);
    const amt = parseFloat(e.amount) || 0;
    categoryMap[cat] = (categoryMap[cat] || 0) + amt;
  });

  const totalExpense = Object.values(categoryMap).reduce((sum, val) => sum + val, 0);

  const categoryEntries = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-4" dir="rtl">
      {/* Category Breakdown Cards / Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {categoryEntries.map(([catName, catTotal]) => {
          const pct = totalExpense > 0 ? Math.round((catTotal / totalExpense) * 100) : 0;
          return (
            <Card key={catName} className="border border-border/80 shadow-2xs bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  {catName}
                </span>
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  ₪{catTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-rose-500 h-2 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-1.5 text-[11px] text-muted-foreground">
                <span>نسبة من إجمالي المصروفات</span>
                <span className="font-semibold">{pct}%</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Expenses Table */}
      <Card className="border border-border/80 shadow-2xs overflow-hidden">
        <CardHeader className="p-4 pb-3 border-b border-border/60 bg-muted/20">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-rose-600" />
            تفاصيل بنود المصروفات وسندات الصرف ({allExp.length} بند)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30 text-xs">
                  <TableHead className="w-[100px] text-right font-bold">التاريخ</TableHead>
                  <TableHead className="w-[120px] text-right font-bold">البند / التصنيف</TableHead>
                  <TableHead className="w-[110px] text-right font-bold">المبلغ</TableHead>
                  <TableHead className="w-[130px] text-right font-bold">الجهة المستلمة</TableHead>
                  <TableHead className="w-[110px] text-right font-bold">طريقة الصرف</TableHead>
                  <TableHead className="text-right font-bold">البيان والتفاصيل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allExp.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                      لا توجد مصروفات مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  allExp.map((e, idx) => {
                    const amt = parseFloat(e.amount) || 0;
                    const d = new Date(e.date || e.createdAt);

                    return (
                      <TableRow key={e.id || idx} className="hover:bg-muted/40 transition-colors text-xs">
                        {/* Date */}
                        <TableCell className="font-medium whitespace-nowrap text-muted-foreground">
                          {d.toLocaleDateString('ar-EG')}
                        </TableCell>

                        {/* Category */}
                        <TableCell>
                          <span className="bg-muted px-2 py-0.5 rounded text-[11px] font-semibold text-foreground whitespace-nowrap">
                            {formatTransactionSource(e.category || e.source || 'مصروف تشغيلي')}
                          </span>
                        </TableCell>

                        {/* Amount */}
                        <TableCell className="font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                          ₪{amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </TableCell>

                        {/* Payee */}
                        <TableCell className="font-medium whitespace-nowrap text-foreground">
                          {e.payee || e.beneficiary || 'غير محدد'}
                        </TableCell>

                        {/* Method */}
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          <span className="bg-muted px-2 py-0.5 rounded text-[11px]">
                            {formatPaymentMethod(e.method || e.paymentMethod)}
                          </span>
                        </TableCell>

                        {/* Notes */}
                        <TableCell className="text-muted-foreground max-w-[320px] truncate" title={e.notes || e.description || ''}>
                          {e.description || e.notes || '-'}
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
