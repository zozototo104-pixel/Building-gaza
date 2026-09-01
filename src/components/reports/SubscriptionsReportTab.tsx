import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CalendarCheck, CheckCircle2, Clock, AlertCircle, Filter } from 'lucide-react';

interface SubscriptionsReportTabProps {
  subscriptions: any[];
}

export function SubscriptionsReportTab({ subscriptions }: SubscriptionsReportTabProps) {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PARTIAL' | 'UNPAID'>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');

  // Extract unique months for filtering
  const months = Array.from(new Set(subscriptions.map((s) => s.month).filter(Boolean))).sort().reverse();

  const filteredSubs = subscriptions.filter((s) => {
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    if (selectedMonth !== 'ALL' && s.month !== selectedMonth) return false;
    return true;
  });

  const totalDue = filteredSubs.reduce((sum, s) => sum + (parseFloat(s.dueAmount) || 0), 0);
  const totalPaid = filteredSubs.reduce((sum, s) => sum + (parseFloat(s.paidAmount) || 0), 0);
  const totalUnpaid = Math.max(0, totalDue - totalPaid);
  const collectionRate = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0;

  return (
    <div className="space-y-4" dir="rtl">
      {/* Sub-filters & Quick Metrics */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/40 p-3.5 rounded-xl border border-border/70">
        <div className="flex flex-wrap items-center gap-2">
          {/* Month selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">الشهر:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-8 px-2.5 text-xs bg-card border border-border rounded-lg font-medium outline-none"
            >
              <option value="ALL">كافة الشهور</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

          {/* Status buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === 'ALL' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              الكل ({subscriptions.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PAID')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === 'PAID' ? 'bg-emerald-600 text-white' : 'bg-card text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
              }`}
            >
              مسدد ({subscriptions.filter((s) => s.status === 'PAID').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('UNPAID')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === 'UNPAID' ? 'bg-rose-600 text-white' : 'bg-card text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
              }`}
            >
              غير مسدد ({subscriptions.filter((s) => s.status === 'UNPAID').length})
            </button>
          </div>
        </div>

        {/* Totals */}
        <div className="flex items-center gap-3 text-xs font-medium">
          <div className="text-muted-foreground">
            المستحق: <span className="font-bold text-foreground">₪{totalDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="text-emerald-600 dark:text-emerald-400 font-bold">
            المحصل: ₪{totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({collectionRate}%)
          </div>
          <div className="text-destructive font-bold bg-destructive/10 px-2 py-0.5 rounded border border-destructive/20">
            غير محصل: ₪{totalUnpaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Main Subscriptions Table */}
      <Card className="border border-border/80 shadow-2xs overflow-hidden">
        <CardHeader className="p-4 pb-3 border-b border-border/60 bg-muted/20">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-blue-600" />
            سجل تحصيل الاشتراكات الشهرية للخدمات ({filteredSubs.length} سجل)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30 text-xs">
                  <TableHead className="w-[90px] text-right font-bold">الشهر</TableHead>
                  <TableHead className="w-[90px] text-right font-bold">الشقة</TableHead>
                  <TableHead className="w-[130px] text-right font-bold">الساكن</TableHead>
                  <TableHead className="w-[100px] text-right font-bold">المستحق</TableHead>
                  <TableHead className="w-[100px] text-right font-bold">المدفوع</TableHead>
                  <TableHead className="w-[100px] text-right font-bold">المتبقي</TableHead>
                  <TableHead className="w-[110px] text-right font-bold">الحالة</TableHead>
                  <TableHead className="w-[120px] text-right font-bold">رقم الإيصال</TableHead>
                  <TableHead className="w-[120px] text-right font-bold">المستلم</TableHead>
                  <TableHead className="text-right font-bold">تاريخ الدفع / الملاحظات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12 text-muted-foreground text-sm">
                      لا توجد سجلات اشتراكات مسجلة للشهر أو الفلاتر المحددة
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubs.map((sub) => {
                    const due = parseFloat(sub.dueAmount) || 0;
                    const paid = parseFloat(sub.paidAmount) || 0;
                    const rem = Math.max(0, due - paid);
                    const isPaid = sub.status === 'PAID' || (due > 0 && paid >= due);
                    const isPartial = sub.status === 'PARTIAL' || (paid > 0 && paid < due);

                    return (
                      <TableRow key={sub.id} className="hover:bg-muted/40 transition-colors text-xs">
                        {/* Month */}
                        <TableCell className="font-bold whitespace-nowrap text-primary">
                          {sub.month}
                        </TableCell>

                        {/* Apartment */}
                        <TableCell className="font-semibold whitespace-nowrap">
                          شقة {sub.apartment?.number || '-'}
                        </TableCell>

                        {/* Resident */}
                        <TableCell className="font-medium whitespace-nowrap text-muted-foreground">
                          {sub.apartment?.residents?.[0]?.name || '-'}
                        </TableCell>

                        {/* Due */}
                        <TableCell className="font-semibold whitespace-nowrap">
                          ₪{due.toFixed(2)}
                        </TableCell>

                        {/* Paid */}
                        <TableCell className="font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          ₪{paid.toFixed(2)}
                        </TableCell>

                        {/* Remaining */}
                        <TableCell className={`font-bold whitespace-nowrap ${rem > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                          ₪{rem.toFixed(2)}
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
                              جزئي
                            </Badge>
                          ) : (
                            <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 text-[10px] gap-1 px-2 py-0.5 font-bold">
                              <AlertCircle className="h-3 w-3" />
                              غير مسدد
                            </Badge>
                          )}
                        </TableCell>

                        {/* Receipt */}
                        <TableCell className="text-muted-foreground font-mono text-[11px] whitespace-nowrap">
                          {sub.receiptNumber || '-'}
                        </TableCell>

                        {/* Collector */}
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {sub.collectedBy || 'أمين الصندوق'}
                        </TableCell>

                        {/* Date & Notes */}
                        <TableCell className="text-muted-foreground max-w-[200px] truncate" title={sub.notes || ''}>
                          {sub.date ? new Date(sub.date).toLocaleDateString('ar-EG') : ''}
                          {sub.notes ? ` - ${sub.notes}` : ''}
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
