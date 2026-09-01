import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, ChevronLeft, Building2, User, Phone, CheckCircle2, Search } from 'lucide-react';
import { ApartmentDebtModal } from './ApartmentDebtModal';

interface ResidentsDebtsTableProps {
  debtsSummary: any[];
  searchQuery: string;
  onRefresh: () => void;
  getToken: () => Promise<string | null>;
}

export function ResidentsDebtsTable({
  debtsSummary,
  searchQuery,
  onRefresh,
  getToken
}: ResidentsDebtsTableProps) {
  const [selectedApartment, setSelectedApartment] = useState<any | null>(null);

  // Filter only apartments that have debts > 0 and match search
  const filteredDebts = debtsSummary.filter((item) => {
    const hasDebt = (item.totalDebt || 0) > 0;
    if (!hasDebt) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const aptNum = String(item.apartmentNumber || '').toLowerCase();
    const resName = String(item.residentName || '').toLowerCase();
    const resPhone = String(item.residentPhone || '').toLowerCase();

    return aptNum.includes(q) || resName.includes(q) || resPhone.includes(q);
  });

  const totalFilteredDebt = filteredDebts.reduce((sum, item) => sum + (item.totalDebt || 0), 0);

  return (
    <>
      <Card id="section-residents-debts" className="overflow-hidden border border-border shadow-xs bg-card">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-foreground">ديون السكان لدى مجلس الإدارة</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  كل شقة تظهر مرة واحدة! اضغط الصف أو زر التفاصيل لعرض جميع بنود الدين وإدارتها.
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-900 font-mono text-xs font-black py-1 px-3">
                إجمالي الديون: {totalFilteredDebt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} شيكل
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-right font-bold text-xs">الشقة</TableHead>
                  <TableHead className="text-right font-bold text-xs">الساكن</TableHead>
                  <TableHead className="text-right font-bold text-xs">عدد الاستحقاقات</TableHead>
                  <TableHead className="text-right font-bold text-xs">إجمالي المتبقي</TableHead>
                  <TableHead className="text-center font-bold text-xs w-[120px]">تفاصيل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDebts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                        <span className="text-sm font-bold text-foreground">
                          {searchQuery ? 'لا توجد نتائج مطابقة لفلتر البحث' : 'رائع! لا توجد ديون مستحقة على أي شقة حالياً.'}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDebts.map((item) => (
                    <TableRow
                      key={item.apartmentId}
                      onClick={() => setSelectedApartment(item)}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      {/* Apartment Column */}
                      <TableCell className="font-bold text-xs">
                        <div className="flex items-center gap-2">
                          <span className="h-7 w-7 rounded-lg bg-primary/10 text-primary font-black flex items-center justify-center font-mono text-xs">
                            {item.apartmentNumber}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {item.floor ? `طابق ${item.floor}` : ''}
                          </span>
                        </div>
                      </TableCell>

                      {/* Resident Column */}
                      <TableCell className="text-xs">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">{item.residentName || 'غير مسجل'}</span>
                          {item.residentPhone && (
                            <span className="text-[11px] text-muted-foreground font-mono mt-0.5 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {item.residentPhone}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Items Count Badge */}
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[11px] font-semibold">
                          {item.itemsCount || item.details?.length || 1} بند
                        </Badge>
                      </TableCell>

                      {/* Remaining Debt */}
                      <TableCell className="text-xs font-mono font-black text-rose-600 dark:text-rose-400">
                        {Number(item.totalDebt || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} شيكل
                      </TableCell>

                      {/* Details Action */}
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedApartment(item)}
                          className="h-8 px-3 text-xs font-bold text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-900/80 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                        >
                          فتح التفاصيل
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ApartmentDebtModal
        apartmentSummary={selectedApartment}
        isOpen={Boolean(selectedApartment)}
        onClose={() => setSelectedApartment(null)}
        onPaymentSuccess={onRefresh}
        getToken={getToken}
      />
    </>
  );
}
