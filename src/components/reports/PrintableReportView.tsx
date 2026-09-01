import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDebtSource, formatTransactionSource, formatPaymentMethod } from '@/lib/utils';

interface PrintableReportViewProps {
  startDate: string;
  endDate: string;
  activeTab: string;
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
  totalDebts: number;
  totalSubscriptionsCollected: number;
  totalWaterBilled: number;
  totalFundBalance: number;
  filteredCashFund: any[];
  filteredDebts: any[];
  filteredSubscriptions: any[];
  filteredWater: any[];
  filteredRent: any[];
}

export function PrintableReportView({
  startDate,
  endDate,
  activeTab,
  totalIncome,
  totalExpense,
  netCashFlow,
  totalDebts,
  totalSubscriptionsCollected,
  totalWaterBilled,
  totalFundBalance,
  filteredCashFund,
  filteredDebts,
  filteredSubscriptions,
  filteredWater,
  filteredRent
}: PrintableReportViewProps) {
  const printDate = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="hidden print:block text-black p-6 space-y-6" dir="rtl">
      {/* Official Header */}
      <div className="border-b-2 border-black pb-4 text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">نظام إدارة البناية السكنية</h1>
        <h2 className="text-lg font-semibold text-gray-800">
          التقرير المالي والإداري الشامل — الصندوق والديون والتحصيلات
        </h2>
        <div className="flex justify-between items-center text-xs text-gray-600 pt-2">
          <span>
            الفترة المحددة: {startDate ? new Date(startDate).toLocaleDateString('ar-EG') : 'البداية'} إلى {endDate ? new Date(endDate).toLocaleDateString('ar-EG') : 'تاريخه'}
          </span>
          <span>تاريخ الطباعة: {printDate}</span>
          <span>صفحة 1 من 1</span>
        </div>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-4 gap-3 border border-gray-400 p-3 rounded bg-gray-50 text-xs">
        <div className="border-l border-gray-300 pl-2">
          <p className="font-medium text-gray-600">إجمالي المقبوضات:</p>
          <p className="text-base font-bold text-gray-900">₪{totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="border-l border-gray-300 pl-2">
          <p className="font-medium text-gray-600">إجمالي المصروفات:</p>
          <p className="text-base font-bold text-gray-900">₪{totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="border-l border-gray-300 pl-2">
          <p className="font-medium text-gray-600">صافي الحركة للفترة:</p>
          <p className="text-base font-bold text-gray-900">₪{netCashFlow.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div>
          <p className="font-medium text-gray-600">الديون المستحقة القائمة:</p>
          <p className="text-base font-bold text-gray-900">₪{totalDebts.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-3 gap-3 border border-gray-300 p-2 rounded text-xs">
        <div>
          <span className="text-gray-600">اشتراكات محصلة: </span>
          <span className="font-bold">₪{totalSubscriptionsCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div>
          <span className="text-gray-600">فواتير مياه مسجلة: </span>
          <span className="font-bold">₪{totalWaterBilled.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div>
          <span className="text-gray-600">الرصيد التراكمي للصندوق: </span>
          <span className="font-bold">₪{totalFundBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Detailed Table for Active Tab */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold border-b border-gray-300 pb-1">
          {activeTab === 'cashflow' && 'جدول تفاصيل حركة الصندوق والمقبوضات'}
          {activeTab === 'debts' && 'جدول تفاصيل الذمم والديون المستحقة على الشقق'}
          {activeTab === 'subscriptions' && 'جدول تفاصيل الاشتراكات الشهرية'}
          {activeTab === 'water' && 'جدول تفاصيل عمليات تعبئة واستهلاك المياه'}
          {activeTab === 'rent' && 'جدول تفاصيل عقود الإيجار والوحدات'}
          {activeTab === 'expenses' && 'جدول تفاصيل بنود المصروفات والصرف'}
        </h3>

        {/* Cashflow Table */}
        {activeTab === 'cashflow' && (
          <Table className="border border-gray-300 text-xs">
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead className="text-right text-black font-bold">التاريخ</TableHead>
                <TableHead className="text-right text-black font-bold">النوع</TableHead>
                <TableHead className="text-right text-black font-bold">المبلغ</TableHead>
                <TableHead className="text-right text-black font-bold">المصدر</TableHead>
                <TableHead className="text-right text-black font-bold">الشقة</TableHead>
                <TableHead className="text-right text-black font-bold">طريقة الدفع</TableHead>
                <TableHead className="text-right text-black font-bold">البيان</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCashFund.slice(0, 40).map((r) => (
                <TableRow key={r.id} className="border-b border-gray-200">
                  <TableCell>{r.date ? new Date(r.date).toLocaleDateString('ar-EG') : '-'}</TableCell>
                  <TableCell className="font-bold">{r.type === 'INCOME' ? 'إيداع' : 'صرف'}</TableCell>
                  <TableCell className="font-bold">₪{parseFloat(r.amount || 0).toFixed(2)}</TableCell>
                  <TableCell>{formatTransactionSource(r.source)}</TableCell>
                  <TableCell>{r.apartment?.number ? `شقة ${r.apartment.number}` : '-'}</TableCell>
                  <TableCell>{formatPaymentMethod(r.paymentMethod)}</TableCell>
                  <TableCell>{r.notes || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Debts Table */}
        {activeTab === 'debts' && (
          <Table className="border border-gray-300 text-xs">
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead className="text-right text-black font-bold">الشقة</TableHead>
                <TableHead className="text-right text-black font-bold">الساكن</TableHead>
                <TableHead className="text-right text-black font-bold">المصدر</TableHead>
                <TableHead className="text-right text-black font-bold">الأصل</TableHead>
                <TableHead className="text-right text-black font-bold">المتبقي</TableHead>
                <TableHead className="text-right text-black font-bold">الحالة</TableHead>
                <TableHead className="text-right text-black font-bold">البيان</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDebts.slice(0, 40).map((d) => (
                <TableRow key={d.id} className="border-b border-gray-200">
                  <TableCell className="font-bold">شقة {d.apartment?.number || '-'}</TableCell>
                  <TableCell>{d.resident?.name || '-'}</TableCell>
                  <TableCell>{formatDebtSource(d.source)}</TableCell>
                  <TableCell>₪{parseFloat(d.originalAmount || d.amount || 0).toFixed(2)}</TableCell>
                  <TableCell className="font-bold">₪{parseFloat(d.remainingAmount || 0).toFixed(2)}</TableCell>
                  <TableCell>{d.status === 'PAID' ? 'مسدد' : d.status === 'PARTIALLY_PAID' ? 'جزئي' : 'مفتوح'}</TableCell>
                  <TableCell>{d.notes || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Subscriptions Table */}
        {activeTab === 'subscriptions' && (
          <Table className="border border-gray-300 text-xs">
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead className="text-right text-black font-bold">الشهر</TableHead>
                <TableHead className="text-right text-black font-bold">الشقة</TableHead>
                <TableHead className="text-right text-black font-bold">المستحق</TableHead>
                <TableHead className="text-right text-black font-bold">المدفوع</TableHead>
                <TableHead className="text-right text-black font-bold">الحالة</TableHead>
                <TableHead className="text-right text-black font-bold">المستلم</TableHead>
                <TableHead className="text-right text-black font-bold">الملاحظات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.slice(0, 40).map((s) => (
                <TableRow key={s.id} className="border-b border-gray-200">
                  <TableCell className="font-bold">{s.month}</TableCell>
                  <TableCell>شقة {s.apartment?.number || '-'}</TableCell>
                  <TableCell>₪{parseFloat(s.dueAmount || 0).toFixed(2)}</TableCell>
                  <TableCell className="font-bold">₪{parseFloat(s.paidAmount || 0).toFixed(2)}</TableCell>
                  <TableCell>{s.status === 'PAID' ? 'مسدد' : s.status === 'PARTIAL' ? 'جزئي' : 'غير مسدد'}</TableCell>
                  <TableCell>{s.collectedBy || '-'}</TableCell>
                  <TableCell>{s.notes || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Water Table */}
        {activeTab === 'water' && (
          <Table className="border border-gray-300 text-xs">
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead className="text-right text-black font-bold">التاريخ</TableHead>
                <TableHead className="text-right text-black font-bold">الشقة</TableHead>
                <TableHead className="text-right text-black font-bold">الكمية</TableHead>
                <TableHead className="text-right text-black font-bold">القراءة الحالية</TableHead>
                <TableHead className="text-right text-black font-bold">التكلفة</TableHead>
                <TableHead className="text-right text-black font-bold">حالة السداد</TableHead>
                <TableHead className="text-right text-black font-bold">الملاحظات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWater.slice(0, 40).map((w) => (
                <TableRow key={w.id} className="border-b border-gray-200">
                  <TableCell>{w.fillDate ? new Date(w.fillDate).toLocaleDateString('ar-EG') : '-'}</TableCell>
                  <TableCell className="font-bold">شقة {w.apartment?.number || '-'}</TableCell>
                  <TableCell>{w.litersQuantity || 1000} لتر</TableCell>
                  <TableCell>{w.newReading || '-'}</TableCell>
                  <TableCell className="font-bold">₪{parseFloat(w.amount || 0).toFixed(2)}</TableCell>
                  <TableCell>{w.isPaid ? 'مسدد' : 'دين قائم'}</TableCell>
                  <TableCell>{w.notes || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Rent Table */}
        {activeTab === 'rent' && (
          <Table className="border border-gray-300 text-xs">
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead className="text-right text-black font-bold">الوحدة</TableHead>
                <TableHead className="text-right text-black font-bold">المستأجر</TableHead>
                <TableHead className="text-right text-black font-bold">الهاتف</TableHead>
                <TableHead className="text-right text-black font-bold">الإيجار الشهري</TableHead>
                <TableHead className="text-right text-black font-bold">التأمين</TableHead>
                <TableHead className="text-right text-black font-bold">الحالة</TableHead>
                <TableHead className="text-right text-black font-bold">الملاحظات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRent.slice(0, 40).map((r) => (
                <TableRow key={r.id} className="border-b border-gray-200">
                  <TableCell className="font-bold">{r.apartment?.number ? `شقة ${r.apartment.number}` : r.unitDescription}</TableCell>
                  <TableCell>{r.tenantName || r.tenant?.name || '-'}</TableCell>
                  <TableCell>{r.tenantPhone || r.tenant?.phone || '-'}</TableCell>
                  <TableCell className="font-bold">₪{parseFloat(r.monthlyRent || 0).toFixed(2)}</TableCell>
                  <TableCell>₪{parseFloat(r.securityDeposit || 0).toFixed(2)}</TableCell>
                  <TableCell>{r.status === 'ACTIVE' ? 'ساري' : 'منتهي'}</TableCell>
                  <TableCell>{r.notes || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Official Signatures Box */}
      <div className="pt-8 border-t-2 border-black grid grid-cols-3 gap-8 text-center text-xs">
        <div className="space-y-6">
          <p className="font-bold">أمين الصندوق المالي</p>
          <div className="h-10 border-b border-dashed border-gray-400"></div>
          <p className="text-[11px] text-gray-600">الاسم والتوقيع</p>
        </div>
        <div className="space-y-6">
          <p className="font-bold">مدقق الحسابات الداخلي</p>
          <div className="h-10 border-b border-dashed border-gray-400"></div>
          <p className="text-[11px] text-gray-600">الاسم والتوقيع</p>
        </div>
        <div className="space-y-6">
          <p className="font-bold">رئيس لجنة العمارة / المجلس</p>
          <div className="h-10 border-b border-dashed border-gray-400"></div>
          <p className="text-[11px] text-gray-600">الاسم والتوقيع والختم</p>
        </div>
      </div>
    </div>
  );
}
