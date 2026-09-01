import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Droplet, CheckCircle2, AlertCircle, Filter } from 'lucide-react';

interface WaterReportTabProps {
  waterReadings: any[];
}

export function WaterReportTab({ waterReadings }: WaterReportTabProps) {
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');

  const filteredReadings = waterReadings.filter((w) => {
    if (paymentFilter === 'PAID' && !w.isPaid) return false;
    if (paymentFilter === 'UNPAID' && w.isPaid) return false;
    return true;
  });

  const totalLiters = filteredReadings.reduce((sum, w) => sum + (parseFloat(w.litersQuantity) || 0), 0);
  const totalCost = filteredReadings.reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0);
  const paidCost = filteredReadings.filter((w) => w.isPaid).reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0);
  const unpaidCost = totalCost - paidCost;

  return (
    <div className="space-y-4" dir="rtl">
      {/* Sub-filters & Quick Metrics */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/40 p-3.5 rounded-xl border border-border/70">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" />
            حالة السداد:
          </span>
          <button
            type="button"
            onClick={() => setPaymentFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              paymentFilter === 'ALL' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'
            }`}
          >
            الكل ({waterReadings.length})
          </button>
          <button
            type="button"
            onClick={() => setPaymentFilter('PAID')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              paymentFilter === 'PAID' ? 'bg-emerald-600 text-white' : 'bg-card text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
            }`}
          >
            مسدد ({waterReadings.filter((w) => w.isPaid).length})
          </button>
          <button
            type="button"
            onClick={() => setPaymentFilter('UNPAID')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              paymentFilter === 'UNPAID' ? 'bg-rose-600 text-white' : 'bg-card text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
            }`}
          >
            غير مسدد ({waterReadings.filter((w) => !w.isPaid).length})
          </button>
        </div>

        {/* Totals */}
        <div className="flex items-center gap-3 text-xs font-medium">
          <div className="text-cyan-700 dark:text-cyan-400">
            إجمالي التعبئة: <span className="font-bold">{totalLiters.toLocaleString()} لتر</span>
          </div>
          <div className="text-muted-foreground">
            إجمالي الفواتير: <span className="font-bold text-foreground">₪{totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="text-emerald-600 dark:text-emerald-400 font-bold">
            محصل: ₪{paidCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-destructive font-bold bg-destructive/10 px-2 py-0.5 rounded border border-destructive/20">
            مستحق: ₪{unpaidCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Main Water Table */}
      <Card className="border border-border/80 shadow-2xs overflow-hidden">
        <CardHeader className="p-4 pb-3 border-b border-border/60 bg-muted/20">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Droplet className="h-4 w-4 text-cyan-600" />
            سجل عمليات تعبئة المياه واستهلاك الشقق ({filteredReadings.length} عملية)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30 text-xs">
                  <TableHead className="w-[100px] text-right font-bold">التاريخ</TableHead>
                  <TableHead className="w-[80px] text-right font-bold">اليوم</TableHead>
                  <TableHead className="w-[90px] text-right font-bold">الشقة</TableHead>
                  <TableHead className="w-[110px] text-right font-bold">كمية التعبئة</TableHead>
                  <TableHead className="w-[100px] text-right font-bold">القراءة السابقة</TableHead>
                  <TableHead className="w-[100px] text-right font-bold">القراءة الحالية</TableHead>
                  <TableHead className="w-[100px] text-right font-bold">تكلفة الفاتورة</TableHead>
                  <TableHead className="w-[100px] text-right font-bold">حالة السداد</TableHead>
                  <TableHead className="w-[110px] text-right font-bold">طريقة الدفع</TableHead>
                  <TableHead className="text-right font-bold">الملاحظات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReadings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12 text-muted-foreground text-sm">
                      لا توجد عمليات تعبئة مياه مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReadings.map((w) => {
                    const amount = parseFloat(w.amount) || 0;
                    const liters = parseFloat(w.litersQuantity) || 1000;
                    const d = new Date(w.fillDate || w.date || w.createdAt);

                    return (
                      <TableRow key={w.id} className="hover:bg-muted/40 transition-colors text-xs">
                        {/* Date */}
                        <TableCell className="font-medium whitespace-nowrap text-muted-foreground">
                          {d.toLocaleDateString('ar-EG')}
                        </TableCell>

                        {/* Day */}
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {w.dayName || '-'}
                        </TableCell>

                        {/* Apartment */}
                        <TableCell className="font-bold whitespace-nowrap">
                          شقة {w.apartment?.number || '-'}
                        </TableCell>

                        {/* Liters */}
                        <TableCell className="font-bold text-cyan-700 dark:text-cyan-400 whitespace-nowrap">
                          {liters.toLocaleString()} لتر
                        </TableCell>

                        {/* Prev Reading */}
                        <TableCell className="font-mono text-muted-foreground whitespace-nowrap">
                          {w.previousReading || '0'}
                        </TableCell>

                        {/* New Reading */}
                        <TableCell className="font-mono text-foreground font-semibold whitespace-nowrap">
                          {w.newReading || '0'}
                        </TableCell>

                        {/* Amount */}
                        <TableCell className="font-bold text-foreground whitespace-nowrap">
                          ₪{amount.toFixed(2)}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          {w.isPaid ? (
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 text-[10px] gap-1 px-2 py-0.5 font-bold">
                              <CheckCircle2 className="h-3 w-3" />
                              مسدد
                            </Badge>
                          ) : (
                            <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 text-[10px] gap-1 px-2 py-0.5 font-bold">
                              <AlertCircle className="h-3 w-3" />
                              دين قائم
                            </Badge>
                          )}
                        </TableCell>

                        {/* Payment Method */}
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          <span className="bg-muted px-2 py-0.5 rounded text-[11px]">
                            {w.paymentMethod === 'CASH'
                              ? 'نقدي'
                              : w.paymentMethod === 'CREDIT'
                              ? 'رصيد دائن'
                              : w.paymentMethod || 'غير مسدد'}
                          </span>
                        </TableCell>

                        {/* Notes */}
                        <TableCell className="text-muted-foreground max-w-[200px] truncate" title={w.notes || ''}>
                          {w.notes || '-'}
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
