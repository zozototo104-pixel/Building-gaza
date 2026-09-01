import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Receipt, AlertCircle, CalendarCheck, Droplet, Home, TrendingDown } from 'lucide-react';

// Subcomponents
import { ReportStatsSummary } from '@/components/reports/ReportStatsSummary';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { CashFlowReportTab } from '@/components/reports/CashFlowReportTab';
import { DebtsReportTab } from '@/components/reports/DebtsReportTab';
import { SubscriptionsReportTab } from '@/components/reports/SubscriptionsReportTab';
import { WaterReportTab } from '@/components/reports/WaterReportTab';
import { RentReportTab } from '@/components/reports/RentReportTab';
import { ExpensesBreakdownTab } from '@/components/reports/ExpensesBreakdownTab';
import { PrintableReportView } from '@/components/reports/PrintableReportView';
import { formatTransactionSource, formatDebtSource, formatPaymentMethod } from '@/lib/utils';

export default function Reports() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('cashflow');

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedApartment, setSelectedApartment] = useState('ALL');
  const [activeRangePreset, setActiveRangePreset] = useState('ALL');

  // Raw Database Data
  const [apartments, setApartments] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [cashFund, setCashFund] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [waterReadings, setWaterReadings] = useState<any[]>([]);
  const [rentContracts, setRentContracts] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  // Fetch Comprehensive Report Data
  const fetchAllReportData = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };

      const res = await fetch('/api/reports/comprehensive', { headers });
      if (res.ok) {
        const data = await res.json();
        setApartments(data.apartments || []);
        setDebts(data.debts || []);
        setPayments(data.payments || []);
        setCashFund(data.cashFund || []);
        setSubscriptions(data.subscriptions || []);
        setWaterReadings(data.waterReadings || []);
        setRentContracts(data.rentContracts || []);
        setExpenses(data.expenses || []);
      } else {
        // Fallback to individual fetches
        const [resDebts, resCash, resApts, resSubs, resWater, resRent] = await Promise.all([
          fetch('/api/debts', { headers }),
          fetch('/api/cash-fund', { headers }),
          fetch('/api/apartments', { headers }),
          fetch('/api/subscriptions', { headers }),
          fetch('/api/water', { headers }),
          fetch('/api/rent-contracts', { headers }),
        ]);
        if (resDebts.ok) setDebts(await resDebts.json());
        if (resCash.ok) setCashFund(await resCash.json());
        if (resApts.ok) setApartments(await resApts.json());
        if (resSubs.ok) setSubscriptions(await resSubs.json());
        if (resWater.ok) setWaterReadings(await resWater.json());
        if (resRent.ok) setRentContracts(await resRent.json());
      }
    } catch (e) {
      console.error('Error fetching report data:', e);
      toast.error('حدث خطأ أثناء تحميل بيانات التقارير المالية');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchAllReportData();
  }, [fetchAllReportData]);

  // Helper date checker
  const isDateInRange = (dateStr?: string | Date | null) => {
    if (!dateStr) return true;
    const time = new Date(dateStr).getTime();
    if (isNaN(time)) return true;

    if (startDate) {
      const start = new Date(startDate).getTime();
      if (time < start) return false;
    }
    if (endDate) {
      const end = new Date(endDate).getTime() + 86400000; // End of the day
      if (time > end) return false;
    }
    return true;
  };

  // Helper search checker
  const matchesSearch = (item: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();

    const aptNum = String(item.apartment?.number || item.apartmentNumber || item.number || '');
    const resName = String(
      item.resident?.name ||
      item.tenantName ||
      item.payee ||
      item.beneficiary ||
      (item.apartment?.residents && item.apartment.residents[0]?.name) ||
      ''
    ).toLowerCase();
    const notes = String(item.notes || item.description || '').toLowerCase();
    const source = String(item.source || item.category || '').toLowerCase();
    const receipt = String(item.receiptNumber || item.reference || '').toLowerCase();
    const collector = String(item.collectedBy || item.payee || '').toLowerCase();

    return (
      aptNum.includes(q) ||
      resName.includes(q) ||
      notes.includes(q) ||
      source.includes(q) ||
      receipt.includes(q) ||
      collector.includes(q)
    );
  };

  // Helper apartment filter
  const matchesApartment = (item: any) => {
    if (selectedApartment === 'ALL') return true;
    const targetId = parseInt(selectedApartment);
    return (
      item.apartmentId === targetId ||
      item.apartment?.id === targetId ||
      item.id === targetId
    );
  };

  // Filtered Datasets
  const filteredCashFund = useMemo(() => {
    return cashFund.filter((c) => isDateInRange(c.date || c.createdAt) && matchesSearch(c) && matchesApartment(c));
  }, [cashFund, startDate, endDate, searchQuery, selectedApartment]);

  const filteredDebts = useMemo(() => {
    return debts.filter((d) => isDateInRange(d.createdAt || d.dueDate) && matchesSearch(d) && matchesApartment(d));
  }, [debts, startDate, endDate, searchQuery, selectedApartment]);

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((s) => isDateInRange(s.date || s.createdAt) && matchesSearch(s) && matchesApartment(s));
  }, [subscriptions, startDate, endDate, searchQuery, selectedApartment]);

  const filteredWater = useMemo(() => {
    return waterReadings.filter((w) => isDateInRange(w.fillDate || w.date || w.createdAt) && matchesSearch(w) && matchesApartment(w));
  }, [waterReadings, startDate, endDate, searchQuery, selectedApartment]);

  const filteredRent = useMemo(() => {
    return rentContracts.filter((r) => isDateInRange(r.startDate || r.createdAt) && matchesSearch(r) && matchesApartment(r));
  }, [rentContracts, startDate, endDate, searchQuery, selectedApartment]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => isDateInRange(e.date || e.createdAt) && matchesSearch(e));
  }, [expenses, startDate, endDate, searchQuery]);

  // Overall Financial Calculations
  const totalIncome = filteredCashFund
    .filter((c) => c.type === 'INCOME')
    .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);

  const totalExpense = filteredCashFund
    .filter((c) => c.type === 'EXPENSE')
    .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);

  const netCashFlow = totalIncome - totalExpense;

  const totalDebts = filteredDebts.reduce(
    (sum, d) => sum + (parseFloat(d.remainingAmount) || 0),
    0
  );

  const totalSubscriptionsCollected = filteredSubscriptions.reduce(
    (sum, s) => sum + (parseFloat(s.paidAmount) || 0),
    0
  );

  const totalWaterBilled = filteredWater.reduce(
    (sum, w) => sum + (parseFloat(w.amount) || 0),
    0
  );

  const totalRentCollected = filteredRent
    .filter((r) => r.status === 'ACTIVE')
    .reduce((sum, r) => sum + (parseFloat(r.monthlyRent) || 0), 0);

  // Cumulative Total Fund Balance (all-time)
  const totalFundBalance = cashFund.reduce((sum, c) => {
    const amt = parseFloat(c.amount) || 0;
    return c.type === 'INCOME' ? sum + amt : sum - amt;
  }, 0);

  // Reset Filters handler
  const handleResetFilters = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setSelectedApartment('ALL');
    setActiveRangePreset('ALL');
  };

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  // CSV Export with UTF-8 BOM for Arabic support in Excel
  const handleExportCSV = () => {
    let csvHeader = '';
    let rowsData: string[] = [];

    if (activeTab === 'cashflow') {
      csvHeader = 'التاريخ,نوع الحركة,المبلغ,المصدر,الشقة,طريقة الدفع,البيان\n';
      filteredCashFund.forEach((c) => {
        const d = c.date ? new Date(c.date).toLocaleDateString('ar-EG') : '';
        const typeStr = c.type === 'INCOME' ? 'إيداع' : 'صرف';
        const amt = parseFloat(c.amount || 0).toFixed(2);
        const source = formatTransactionSource(c.source);
        const apt = c.apartment?.number ? `شقة ${c.apartment.number}` : '';
        const method = formatPaymentMethod(c.paymentMethod);
        const notes = (c.notes || '').replace(/,/g, ' - ');
        rowsData.push(`"${d}","${typeStr}","${amt}","${source}","${apt}","${method}","${notes}"`);
      });
    } else if (activeTab === 'debts') {
      csvHeader = 'الشقة,الساكن,المصدر,المبلغ الأصلي,المبلغ المتبقي,تاريخ الاستحقاق,الحالة,البيان\n';
      filteredDebts.forEach((d) => {
        const apt = d.apartment?.number ? `شقة ${d.apartment.number}` : '';
        const res = d.resident?.name || (d.apartment?.residents && d.apartment.residents[0]?.name) || '';
        const source = formatDebtSource(d.source);
        const orig = parseFloat(d.originalAmount || d.amount || 0).toFixed(2);
        const rem = parseFloat(d.remainingAmount || 0).toFixed(2);
        const due = d.dueDate ? new Date(d.dueDate).toLocaleDateString('ar-EG') : '';
        const status = d.status === 'PAID' ? 'مسدد' : d.status === 'PARTIALLY_PAID' ? 'جزئي' : 'مفتوح';
        const notes = (d.notes || '').replace(/,/g, ' - ');
        rowsData.push(`"${apt}","${res}","${source}","${orig}","${rem}","${due}","${status}","${notes}"`);
      });
    } else if (activeTab === 'subscriptions') {
      csvHeader = 'الشهر,الشقة,المستحق,المدفوع,المتبقي,الحالة,رقم الإيصال,المستلم,الملاحظات\n';
      filteredSubscriptions.forEach((s) => {
        const month = s.month || '';
        const apt = s.apartment?.number ? `شقة ${s.apartment.number}` : '';
        const due = parseFloat(s.dueAmount || 0).toFixed(2);
        const paid = parseFloat(s.paidAmount || 0).toFixed(2);
        const rem = Math.max(0, parseFloat(s.dueAmount || 0) - parseFloat(s.paidAmount || 0)).toFixed(2);
        const status = s.status === 'PAID' ? 'مسدد' : s.status === 'PARTIAL' ? 'جزئي' : 'غير مسدد';
        const rec = s.receiptNumber || '';
        const col = s.collectedBy || 'أمين الصندوق';
        const notes = (s.notes || '').replace(/,/g, ' - ');
        rowsData.push(`"${month}","${apt}","${due}","${paid}","${rem}","${status}","${rec}","${col}","${notes}"`);
      });
    } else if (activeTab === 'water') {
      csvHeader = 'التاريخ,اليوم,الشقة,الكمية باللتر,القراءة السابقة,القراءة الحالية,التكلفة,حالة السداد,طريقة الدفع,الملاحظات\n';
      filteredWater.forEach((w) => {
        const d = w.fillDate ? new Date(w.fillDate).toLocaleDateString('ar-EG') : '';
        const day = w.dayName || '';
        const apt = w.apartment?.number ? `شقة ${w.apartment.number}` : '';
        const liters = w.litersQuantity || '1000';
        const prev = w.previousReading || '0';
        const curr = w.newReading || '0';
        const amt = parseFloat(w.amount || 0).toFixed(2);
        const isPaid = w.isPaid ? 'مسدد' : 'دين قائم';
        const method = w.paymentMethod || 'نقدي';
        const notes = (w.notes || '').replace(/,/g, ' - ');
        rowsData.push(`"${d}","${day}","${apt}","${liters}","${prev}","${curr}","${amt}","${isPaid}","${method}","${notes}"`);
      });
    } else if (activeTab === 'rent') {
      csvHeader = 'الوحدة,اسم المستأجر,الهاتف,الإيجار الشهري,مبلغ التأمين,الحالة,الملاحظات\n';
      filteredRent.forEach((r) => {
        const unit = r.apartment?.number ? `شقة ${r.apartment.number}` : r.unitDescription || '';
        const name = r.tenantName || r.tenant?.name || '';
        const phone = r.tenantPhone || r.tenant?.phone || '';
        const rent = parseFloat(r.monthlyRent || 0).toFixed(2);
        const dep = parseFloat(r.securityDeposit || 0).toFixed(2);
        const status = r.status === 'ACTIVE' ? 'ساري' : 'منتهي';
        const notes = (r.notes || '').replace(/,/g, ' - ');
        rowsData.push(`"${unit}","${name}","${phone}","${rent}","${dep}","${status}","${notes}"`);
      });
    } else {
      csvHeader = 'التاريخ,البند,المبلغ,المستلم,طريقة الصرف,البيان\n';
      filteredExpenses.forEach((e) => {
        const d = e.date ? new Date(e.date).toLocaleDateString('ar-EG') : '';
        const cat = e.category || 'مصروف عام';
        const amt = parseFloat(e.amount || 0).toFixed(2);
        const payee = e.payee || e.beneficiary || '';
        const method = e.method || e.paymentMethod || 'نقدي';
        const notes = (e.description || e.notes || '').replace(/,/g, ' - ');
        rowsData.push(`"${d}","${cat}","${amt}","${payee}","${method}","${notes}"`);
      });
    }

    // Prepend UTF-8 BOM (\uFEFF)
    const csvString = '\uFEFF' + csvHeader + rowsData.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `building_report_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('تم تصدير ملف التقرير بتنسيق Excel بنجاح');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm font-bold text-muted-foreground">جاري تحميل منظومة التقارير المالية...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16" dir="rtl">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 print:hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">مركز التقارير والمحاسبة</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            كشوفات الحسابات الشاملة، سجلات التحصيل، الديون، والمصروفات
          </p>
        </div>
      </div>

      {/* KPI Stats Summary Cards */}
      <div className="print:hidden">
        <ReportStatsSummary
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          netCashFlow={netCashFlow}
          totalDebts={totalDebts}
          totalSubscriptionsCollected={totalSubscriptionsCollected}
          totalWaterBilled={totalWaterBilled}
          totalRentCollected={totalRentCollected}
          totalFundBalance={totalFundBalance}
        />
      </div>

      {/* Filter and Action Bar */}
      <ReportFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        selectedApartment={selectedApartment}
        setSelectedApartment={setSelectedApartment}
        apartments={apartments}
        activeRangePreset={activeRangePreset}
        setActiveRangePreset={setActiveRangePreset}
        onResetFilters={handleResetFilters}
        onPrint={handlePrint}
        onExportCSV={handleExportCSV}
      />

      {/* Main Tabbed Reports Section */}
      <div className="print:hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl" className="space-y-4">
          <TabsList className="grid grid-cols-3 md:grid-cols-6 h-auto p-1.5 bg-muted/60 rounded-xl border border-border/60">
            {/* 1. Cashflow */}
            <TabsTrigger
              value="cashflow"
              className="gap-1.5 py-2 text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-2xs rounded-lg transition-all"
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>الصندوق والمقبوضات</span>
            </TabsTrigger>

            {/* 2. Debts */}
            <TabsTrigger
              value="debts"
              className="gap-1.5 py-2 text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-2xs rounded-lg transition-all"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              <span>الذمم والديون</span>
            </TabsTrigger>

            {/* 3. Subscriptions */}
            <TabsTrigger
              value="subscriptions"
              className="gap-1.5 py-2 text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-2xs rounded-lg transition-all"
            >
              <CalendarCheck className="h-3.5 w-3.5" />
              <span>الاشتراكات الشهرية</span>
            </TabsTrigger>

            {/* 4. Water */}
            <TabsTrigger
              value="water"
              className="gap-1.5 py-2 text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-2xs rounded-lg transition-all"
            >
              <Droplet className="h-3.5 w-3.5" />
              <span>فواتير المياه</span>
            </TabsTrigger>

            {/* 5. Rent */}
            <TabsTrigger
              value="rent"
              className="gap-1.5 py-2 text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-2xs rounded-lg transition-all"
            >
              <Home className="h-3.5 w-3.5" />
              <span>عقود الإيجارات</span>
            </TabsTrigger>

            {/* 6. Expenses */}
            <TabsTrigger
              value="expenses"
              className="gap-1.5 py-2 text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-2xs rounded-lg transition-all"
            >
              <TrendingDown className="h-3.5 w-3.5" />
              <span>بنود المصروفات</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Cashflow */}
          <TabsContent value="cashflow" className="focus-visible:outline-none">
            <CashFlowReportTab records={filteredCashFund} />
          </TabsContent>

          {/* Tab 2: Debts */}
          <TabsContent value="debts" className="focus-visible:outline-none">
            <DebtsReportTab debts={filteredDebts} />
          </TabsContent>

          {/* Tab 3: Subscriptions */}
          <TabsContent value="subscriptions" className="focus-visible:outline-none">
            <SubscriptionsReportTab subscriptions={filteredSubscriptions} />
          </TabsContent>

          {/* Tab 4: Water */}
          <TabsContent value="water" className="focus-visible:outline-none">
            <WaterReportTab waterReadings={filteredWater} />
          </TabsContent>

          {/* Tab 5: Rent */}
          <TabsContent value="rent" className="focus-visible:outline-none">
            <RentReportTab rentContracts={filteredRent} />
          </TabsContent>

          {/* Tab 6: Expenses */}
          <TabsContent value="expenses" className="focus-visible:outline-none">
            <ExpensesBreakdownTab expenses={filteredExpenses} cashFundExpenses={filteredCashFund} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Printable Report Output (Active when window.print() is called) */}
      <PrintableReportView
        startDate={startDate}
        endDate={endDate}
        activeTab={activeTab}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        netCashFlow={netCashFlow}
        totalDebts={totalDebts}
        totalSubscriptionsCollected={totalSubscriptionsCollected}
        totalWaterBilled={totalWaterBilled}
        totalFundBalance={totalFundBalance}
        filteredCashFund={filteredCashFund}
        filteredDebts={filteredDebts}
        filteredSubscriptions={filteredSubscriptions}
        filteredWater={filteredWater}
        filteredRent={filteredRent}
      />

      {/* Print Styles */}
      <style>{`
        @media print {
          @page { 
            margin: 8mm; 
            size: A4;
          }
          body { 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact;
            background: white !important;
            color: black !important;
          }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
        }
      `}</style>
    </div>
  );
}
