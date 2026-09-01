import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Home, CheckCircle2, Clock, AlertCircle, FileText, Phone } from 'lucide-react';

interface RentReportTabProps {
  rentContracts: any[];
}

export function RentReportTab({ rentContracts }: RentReportTabProps) {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ENDED' | 'SUSPENDED'>('ALL');

  const filteredContracts = rentContracts.filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    return true;
  });

  const totalMonthlyRent = filteredContracts
    .filter((c) => c.status === 'ACTIVE')
    .reduce((sum, c) => sum + (parseFloat(c.monthlyRent) || 0), 0);

  const totalDeposits = filteredContracts.reduce(
    (sum, c) => sum + (parseFloat(c.securityDeposit) || 0),
    0
  );

  return (
    <div className="space-y-4" dir="rtl">
      {/* Sub-filters & Quick Metrics */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/40 p-3.5 rounded-xl border border-border/70">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">حالة العقد:</span>
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'ALL' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'
            }`}
          >
            الكل ({rentContracts.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'ACTIVE' ? 'bg-emerald-600 text-white' : 'bg-card text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
            }`}
          >
            ساري ({rentContracts.filter((c) => c.status === 'ACTIVE').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ENDED')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'ENDED' ? 'bg-muted-foreground text-white' : 'bg-card text-muted-foreground hover:bg-muted'
            }`}
          >
            منتهي ({rentContracts.filter((c) => c.status === 'ENDED').length})
          </button>
        </div>

        {/* Totals */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="text-emerald-700 dark:text-emerald-400 font-bold">
            إجمالي الإيجار الشهري للعقود السارية: ₪{totalMonthlyRent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-muted-foreground">
            مجموع مبالغ التأمين: <span className="font-bold text-foreground">₪{totalDeposits.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Main Rent Contracts Table */}
      <Card className="border border-border/80 shadow-2xs overflow-hidden">
        <CardHeader className="p-4 pb-3 border-b border-border/60 bg-muted/20">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Home className="h-4 w-4 text-amber-600" />
            سجل عقود الإيجار وإيرادات الوحدات المؤجرة ({filteredContracts.length} عقد)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30 text-xs">
                  <TableHead className="w-[110px] text-right font-bold">الوحدة / الشقة</TableHead>
                  <TableHead className="w-[140px] text-right font-bold">اسم المستأجر</TableHead>
                  <TableHead className="w-[120px] text-right font-bold">رقم التواصل</TableHead>
                  <TableHead className="w-[110px] text-right font-bold">الإيجار الشهري</TableHead>
                  <TableHead className="w-[100px] text-right font-bold">مبلغ التأمين</TableHead>
                  <TableHead className="w-[100px] text-right font-bold">يوم الاستحقاق</TableHead>
                  <TableHead className="w-[170px] text-right font-bold">مدة العقد</TableHead>
                  <TableHead className="w-[100px] text-right font-bold">الحالة</TableHead>
                  <TableHead className="text-right font-bold">الشهور المسددة والملاحظات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground text-sm">
                      لا توجد عقود إيجار مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContracts.map((c) => {
                    const rent = parseFloat(c.monthlyRent) || 0;
                    const deposit = parseFloat(c.securityDeposit) || 0;
                    const start = c.startDate ? new Date(c.startDate).toLocaleDateString('ar-EG') : '-';
                    const end = c.endDate ? new Date(c.endDate).toLocaleDateString('ar-EG') : '-';
                    const paidCount = Array.isArray(c.paidMonths) ? c.paidMonths.length : 0;
                    const isActive = c.status === 'ACTIVE';

                    return (
                      <TableRow key={c.id} className="hover:bg-muted/40 transition-colors text-xs">
                        {/* Unit / Apt */}
                        <TableCell className="font-bold whitespace-nowrap">
                          {c.apartment?.number ? `شقة ${c.apartment.number}` : c.unitDescription || 'وحدة'}
                        </TableCell>

                        {/* Tenant */}
                        <TableCell className="font-semibold text-foreground whitespace-nowrap">
                          {c.tenantName || c.tenant?.name || '-'}
                        </TableCell>

                        {/* Phone */}
                        <TableCell className="text-muted-foreground whitespace-nowrap font-mono text-[11px]">
                          {c.tenantPhone || c.tenant?.phone || '-'}
                        </TableCell>

                        {/* Rent */}
                        <TableCell className="font-bold text-foreground whitespace-nowrap">
                          ₪{rent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </TableCell>

                        {/* Deposit */}
                        <TableCell className="text-muted-foreground whitespace-nowrap font-semibold">
                          ₪{deposit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </TableCell>

                        {/* Due Day */}
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          يوم {c.dueDay || 1} من كل شهر
                        </TableCell>

                        {/* Duration */}
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {start} إلى {end}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          {isActive ? (
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 text-[10px] gap-1 px-2 py-0.5 font-bold">
                              <CheckCircle2 className="h-3 w-3" />
                              ساري
                            </Badge>
                          ) : (
                            <Badge className="bg-muted text-muted-foreground text-[10px] gap-1 px-2 py-0.5 font-medium">
                              منتهي
                            </Badge>
                          )}
                        </TableCell>

                        {/* Paid Months & Notes */}
                        <TableCell className="text-muted-foreground max-w-[240px] truncate">
                          <span className="font-semibold text-foreground">
                            {paidCount > 0 ? `مسدد ${paidCount} شهر` : 'لم يسدد بعد'}
                          </span>
                          {c.notes ? ` - ${c.notes}` : ''}
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
