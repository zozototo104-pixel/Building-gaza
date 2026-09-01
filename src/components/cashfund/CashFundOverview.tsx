import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  Calendar,
  DollarSign,
  Download,
  Filter,
  Search,
  Receipt,
  FileSpreadsheet
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { toast } from 'sonner';
import { formatTransactionSource, formatPaymentMethod } from '@/lib/utils';

interface CashFundOverviewProps {
  records: any[];
  onOpenNewTransaction: () => void;
  onRefresh: () => void;
  getToken: () => Promise<string | null>;
  searchQuery: string;
}

export function CashFundOverview({
  records,
  onOpenNewTransaction,
  onRefresh,
  getToken,
  searchQuery
}: CashFundOverviewProps) {
  const [syncing, setSyncing] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Financial Calculations
  const totalIncome = records
    .filter((r) => r.type === 'INCOME')
    .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

  const totalExpense = records
    .filter((r) => r.type === 'EXPENSE')
    .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

  const currentBalance = totalIncome - totalExpense;

  // Filter records
  const filteredRecords = records.filter((r) => {
    if (typeFilter !== 'ALL' && r.type !== typeFilter) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const notes = String(r.notes || '').toLowerCase();
    const source = String(r.source || '').toLowerCase();
    const method = String(r.paymentMethod || '').toLowerCase();
    const amount = String(r.amount || '').toLowerCase();
    const apt = r.apartment?.number ? String(r.apartment.number).toLowerCase() : '';

    return notes.includes(q) || source.includes(q) || method.includes(q) || amount.includes(q) || apt.includes(q);
  });

  const handleSync = async () => {
    setSyncing(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/cash-fund/sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('فشلت المزامنة');
      toast.success('تمت مزامنة ومطابقة حركات الصندوق بنجاح');
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء المزامنة');
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذه المعاملة؟')) return;

    setDeletingId(id);
    try {
      const token = await getToken();
      const res = await fetch(`/api/cash-fund/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'فشل حذف المعاملة');
      }

      toast.success('تم حذف المعاملة بنجاح');
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء الحذف');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      'التاريخ,النوع,المبلغ (شيكل),البند والمصدر,طريقة الدفع,ملاحظات\n' +
      filteredRecords
        .map((t) => {
          const tDate = new Date(t.date).toLocaleDateString('ar-EG');
          const tType = t.type === 'INCOME' ? 'إيراد' : 'مصروف';
          const tAmount = parseFloat(t.amount);
          const tSource = formatTransactionSource(t.source);
          const tPayee = formatPaymentMethod(t.paymentMethod);
          const tNotes = (t.notes || '').replace(/,/g, ' - ');
          return `${tDate},${tType},${tAmount},${tSource},${tPayee},${tNotes}`;
        })
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cash_fund_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Build chart dataset grouped by day / month
  const chartMap = new Map<string, { date: string; income: number; expense: number; balance: number }>();
  // Sort oldest first for running balance
  const sortedForChart = [...records].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let runningBal = 0;
  sortedForChart.forEach((r) => {
    const d = new Date(r.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const amt = parseFloat(r.amount) || 0;

    if (!chartMap.has(key)) {
      chartMap.set(key, { date: key, income: 0, expense: 0, balance: 0 });
    }
    const item = chartMap.get(key)!;
    if (r.type === 'INCOME') {
      item.income += amt;
      runningBal += amt;
    } else {
      item.expense += amt;
      runningBal -= amt;
    }
    item.balance = runningBal;
  });

  const chartData = Array.from(chartMap.values()).slice(-15); // last 15 days/points

  const getSourceBadge = (source: string, type: string) => {
    switch (source) {
      case 'INITIAL_BALANCE':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[11px]">رصيد افتتاحي</Badge>;
      case 'PAYMENT':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]">تحصيل إيراد</Badge>;
      case 'PUMPING':
        return <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200 text-[11px]">ضخ مياه عام</Badge>;
      case 'EXPENSE':
        return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-[11px]">مصروف تشغيلي</Badge>;
      case 'VISIT_GIFT':
      case 'GIFT':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[11px]">زيارات وهدايا</Badge>;
      default:
        return <Badge variant="outline" className="text-[11px]">{formatTransactionSource(source) || (type === 'INCOME' ? 'إيراد' : 'مصروف')}</Badge>;
    }
  };

  return (
    <div id="section-cash-fund" className="space-y-6">
      {/* Header Section matching screenshot IMG_0605 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            الصندوق المالي الموحد
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            كل دخل أو مصروف تشغيلي ينعكس تلقائيًا في رصيد البناية.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
            className="gap-1.5 text-xs font-bold h-9 px-3.5 rounded-xl cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
            مزامنة الصندوق
          </Button>

          <Button
            size="sm"
            onClick={onOpenNewTransaction}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs font-bold h-9 px-4 rounded-xl cursor-pointer shadow-xs"
          >
            <Plus className="h-4 w-4" />
            معاملة مالية يدوية
          </Button>
        </div>
      </div>

      {/* 3 Big Metric Cards matching screenshot IMG_0605 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Income */}
        <Card className="border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/15 shadow-xs overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">إجمالي الإيرادات</span>
              <div className="h-8 w-8 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
              شيكل {totalIncome.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-emerald-700/70 dark:text-emerald-300/70 mt-1 block font-medium">
              التحصيلات والاشتراكات والإيداعات
            </span>
          </CardContent>
        </Card>

        {/* Total Expense */}
        <Card className="border border-rose-200/80 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/15 shadow-xs overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-800 dark:text-rose-300">إجمالي المصروفات</span>
              <div className="h-8 w-8 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <TrendingDown className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 font-mono tracking-tight">
              شيكل {totalExpense.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-rose-700/70 dark:text-rose-300/70 mt-1 block font-medium">
              الصيانة والكهرباء والضخ والمصاريف
            </span>
          </CardContent>
        </Card>

        {/* Current Balance */}
        <Card className="border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/15 shadow-xs overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-800 dark:text-blue-300">رصيد البناية الحالي</span>
              <div className="h-8 w-8 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 font-mono tracking-tight">
              شيكل {currentBalance.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-blue-700/70 dark:text-blue-300/70 mt-1 block font-medium">
              الصافي الفعلي المتوفر في العهدة والصندوق
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Evolution Section matching screenshot IMG_0605 */}
      <Card id="section-transactions-chart" className="border border-border shadow-xs bg-card">
        <CardHeader className="pb-2 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-foreground">تطور المعاملات والسيولة</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                حركة التدفقات النقدية الداخلة والخارجة ورصيد الصندوق التراكمي
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                إيرادات
              </Badge>
              <Badge variant="outline" className="text-xs gap-1">
                <span className="h-2 w-2 rounded-full bg-rose-500 inline-block" />
                مصروفات
              </Badge>
              <Badge variant="outline" className="text-xs gap-1">
                <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
                الرصيد
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 pb-2">
          <div className="h-64 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                لا توجد بيانات كافية لرسم منحنى المعاملات.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-popover border border-border p-2.5 rounded-xl shadow-lg text-xs space-y-1" dir="rtl">
                            <span className="font-bold text-foreground block">{label}</span>
                            <div className="text-emerald-600 font-bold">
                              وارد: {payload.find(p => p.dataKey === 'income')?.value || 0} شيكل
                            </div>
                            <div className="text-rose-600 font-bold">
                              منصرف: {payload.find(p => p.dataKey === 'expense')?.value || 0} شيكل
                            </div>
                            <div className="text-blue-600 font-bold border-t pt-1">
                              الرصيد: {payload.find(p => p.dataKey === 'balance')?.value || 0} شيكل
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} name="إيرادات" />
                  <Area type="monotone" dataKey="expense" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} name="مصروفات" />
                  <Area type="monotone" dataKey="balance" stroke="#3b82f6" fillOpacity={1} fill="url(#colorBalance)" strokeWidth={2} name="الرصيد" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Transactions Ledger Table */}
      <Card id="section-transactions-table" className="border border-border shadow-xs bg-card">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-foreground">سجل حركات ومعاملات الصندوق</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                عرض {filteredRecords.length} من أصل {records.length} معاملة مسجلة
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              {/* Type Filter Buttons */}
              <div className="bg-muted p-0.5 rounded-lg flex items-center text-xs">
                <button
                  type="button"
                  onClick={() => setTypeFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    typeFilter === 'ALL' ? 'bg-background text-foreground shadow-2xs' : 'text-muted-foreground'
                  }`}
                >
                  الكل
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('INCOME')}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    typeFilter === 'INCOME' ? 'bg-background text-emerald-600 shadow-2xs' : 'text-muted-foreground'
                  }`}
                >
                  وارد
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('EXPENSE')}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    typeFilter === 'EXPENSE' ? 'bg-background text-rose-600 shadow-2xs' : 'text-muted-foreground'
                  }`}
                >
                  منصرف
                </button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="gap-1.5 text-xs font-bold h-8 px-3 rounded-lg"
              >
                <Download className="h-3.5 w-3.5" />
                تصدير Excel
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-right font-bold text-xs">التاريخ</TableHead>
                  <TableHead className="text-right font-bold text-xs">النوع</TableHead>
                  <TableHead className="text-right font-bold text-xs">المصدر / البند</TableHead>
                  <TableHead className="text-right font-bold text-xs">المبلغ</TableHead>
                  <TableHead className="text-right font-bold text-xs">القائم بالمعاملة / المستلم</TableHead>
                  <TableHead className="text-right font-bold text-xs">البيان والملاحظات</TableHead>
                  <TableHead className="text-center font-bold text-xs w-[80px]">إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground text-xs">
                      لا توجد معاملات مطابقة للعرض.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((t) => {
                    const isIncome = t.type === 'INCOME';
                    const amountNum = parseFloat(t.amount) || 0;
                    return (
                      <TableRow key={t.id} className="hover:bg-muted/40 transition-colors">
                        {/* Date */}
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap font-mono">
                          {new Date(t.date).toLocaleDateString('ar-EG', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </TableCell>

                        {/* Type */}
                        <TableCell className="text-xs whitespace-nowrap">
                          {isIncome ? (
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                              <ArrowUpRight className="h-3.5 w-3.5" />
                              وارد
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400">
                              <ArrowDownLeft className="h-3.5 w-3.5" />
                              منصرف
                            </span>
                          )}
                        </TableCell>

                        {/* Source Badge */}
                        <TableCell className="text-xs whitespace-nowrap">
                          {getSourceBadge(t.source, t.type)}
                          {t.apartment && (
                            <Badge variant="secondary" className="mr-1 text-[10px]">
                              شقة {t.apartment.number}
                            </Badge>
                          )}
                        </TableCell>

                        {/* Amount */}
                        <TableCell className="text-xs font-mono font-black whitespace-nowrap">
                          <span className={isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                            {isIncome ? '+' : '-'}{amountNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} شيكل
                          </span>
                        </TableCell>

                        {/* Payee / Custodian */}
                        <TableCell className="text-xs text-foreground font-medium whitespace-nowrap">
                          {t.paymentMethod || '-'}
                        </TableCell>

                        {/* Notes */}
                        <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                          {t.notes || '-'}
                        </TableCell>

                        {/* Action */}
                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={deletingId === t.id}
                            onClick={() => handleDelete(t.id)}
                            className="h-7 w-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                            title="حذف المعاملة"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
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
