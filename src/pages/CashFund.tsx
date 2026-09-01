import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

// Subcomponents
import { OpeningBalanceCard } from '@/components/cashfund/OpeningBalanceCard';
import { DebtsSummaryCard } from '@/components/cashfund/DebtsSummaryCard';
import { ExpenseSettingsCard } from '@/components/cashfund/ExpenseSettingsCard';
import { MonthlyClosingCard } from '@/components/cashfund/MonthlyClosingCard';
import { BoardApprovalsCard } from '@/components/cashfund/BoardApprovalsCard';
import { ResidentsDebtsTable } from '@/components/cashfund/ResidentsDebtsTable';
import { CashFundOverview } from '@/components/cashfund/CashFundOverview';
import { NewTransactionModal } from '@/components/cashfund/NewTransactionModal';
import { SectionsDrawer } from '@/components/cashfund/SectionsDrawer';

export function CashFund() {
  const { getToken, userRecord } = useAuth();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState(false);

  // Data states
  const [cashFundRecords, setCashFundRecords] = useState<any[]>([]);
  const [debtsSummary, setDebtsSummary] = useState<any[]>([]);
  const [openingBalanceData, setOpeningBalanceData] = useState<{
    id: number | null;
    amount: number;
    date: string;
    custodian: string;
    notes: string;
  }>({
    id: null,
    amount: 33.00,
    date: '2026-08-24',
    custodian: 'المهندس أبو بسام شعت',
    notes: 'نقداً موجود لدى أمين الصندوق المهندس أبو بسام شعت'
  });
  const [financialSettings, setFinancialSettings] = useState({
    approvalThreshold: 500.0,
    requiredApprovals: 2
  });
  const [boardApprovals, setBoardApprovals] = useState<any[]>([]);
  const [closedMonths, setClosedMonths] = useState<any[]>([]);

  const fetchAllData = useCallback(async () => {
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Fetch Cash Fund Records
      const cashRes = await fetch('/api/cash-fund', { headers });
      if (cashRes.ok) {
        const data = await cashRes.json();
        setCashFundRecords(data);
      }

      // 2. Fetch Debts Summary
      const debtsRes = await fetch('/api/debts/summary', { headers });
      if (debtsRes.ok) {
        const data = await debtsRes.json();
        setDebtsSummary(data);
      }

      // 3. Fetch Opening Balance
      const obRes = await fetch('/api/cash-fund/opening-balance', { headers });
      if (obRes.ok) {
        const data = await obRes.json();
        setOpeningBalanceData(data);
      }

      // 4. Fetch Financial Settings
      const setRes = await fetch('/api/financial-settings', { headers });
      if (setRes.ok) {
        const data = await setRes.json();
        setFinancialSettings(data);
      }

      // 5. Fetch Board Expense Approvals
      const appRes = await fetch('/api/expense-approvals', { headers });
      if (appRes.ok) {
        const data = await appRes.json();
        setBoardApprovals(data);
      }

      // 6. Fetch Monthly Closings
      const closingsRes = await fetch('/api/monthly-closings', { headers });
      if (closingsRes.ok) {
        const data = await closingsRes.json();
        setClosedMonths(data);
      }
    } catch (err) {
      console.error('Error fetching cash fund data:', err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Calculate total building debt and count of indebted apartments
  const totalBuildingDebt = debtsSummary.reduce(
    (sum, item) => sum + (parseFloat(item.totalDebt) || 0),
    0
  );
  const indebtedApartmentsCount = debtsSummary.filter(
    (item) => (parseFloat(item.totalDebt) || 0) > 0
  ).length;

  const handleScrollToDebts = () => {
    const el = document.getElementById('section-residents-debts');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm font-bold text-muted-foreground">جاري تحميل بيانات الصندوق المالي...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16" dir="rtl">
      {/* Top Search Bar matching screenshot IMG_0601 */}
      <div className="relative">
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="بحث رئيسي: رقم الشقة، اسم الساكن أو الجوال"
          className="pr-10 pl-4 py-2.5 h-11 bg-card border-border rounded-xl focus:ring-2 focus:ring-primary text-sm font-medium shadow-2xs"
        />
        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-muted-foreground">
          <Search className="h-4 w-4" />
        </div>
      </div>

      {/* Row 1: Opening Balance & Debts Overview Cards (IMG_0601) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <OpeningBalanceCard
          data={openingBalanceData}
          onUpdate={fetchAllData}
          getToken={getToken}
        />
        <DebtsSummaryCard
          totalDebts={totalBuildingDebt}
          indebtedCount={indebtedApartmentsCount}
          onScrollToDebts={handleScrollToDebts}
        />
      </div>

      {/* Row 2: Expense Approval Settings & Monthly Financial Closing Cards (IMG_0602) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ExpenseSettingsCard
          settings={financialSettings}
          onUpdate={fetchAllData}
          getToken={getToken}
        />
        <MonthlyClosingCard
          closedMonths={closedMonths}
          onUpdate={fetchAllData}
          getToken={getToken}
        />
      </div>

      {/* Row 3: Board Expense Approvals Card (IMG_0603) */}
      <BoardApprovalsCard
        requests={boardApprovals}
        requiredApprovals={financialSettings.requiredApprovals}
        onUpdate={fetchAllData}
        getToken={getToken}
      />

      {/* Row 4: Residents Debts Table (IMG_0603 & IMG_0604) */}
      <ResidentsDebtsTable
        debtsSummary={debtsSummary}
        searchQuery={searchQuery}
        onRefresh={fetchAllData}
        getToken={getToken}
      />

      {/* Row 5: Unified Cash Fund Overview (Metrics, Chart & Transactions Table - IMG_0605) */}
      <CashFundOverview
        records={cashFundRecords}
        onOpenNewTransaction={() => setIsNewTxModalOpen(true)}
        onRefresh={fetchAllData}
        getToken={getToken}
        searchQuery={searchQuery}
      />

      {/* New Transaction Modal (IMG_0606) */}
      <NewTransactionModal
        isOpen={isNewTxModalOpen}
        onClose={() => setIsNewTxModalOpen(false)}
        onSuccess={fetchAllData}
        getToken={getToken}
        currentUser={userRecord}
      />

      {/* Floating Sections Navigation Drawer */}
      <SectionsDrawer />
    </div>
  );
}
