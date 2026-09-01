import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Building, 
  Users, 
  Wallet, 
  AlertCircle, 
  Droplets, 
  CreditCard, 
  RefreshCw, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
  Receipt,
  Calendar,
  Layers,
  Coins
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DebtsMatrixTable, { ApartmentDebtSummary } from '@/components/dashboard/DebtsMatrixTable';
import FinancialFlowChart from '@/components/dashboard/FinancialFlowChart';
import { Link } from 'react-router';
import { DeveloperWordCard } from '@/components/DeveloperWordCard';

interface GroupedApartmentPayments {
  key: string;
  apartmentId: number | null;
  apartmentNumber: string;
  residentName: string;
  totalAmount: number;
  payments: any[];
}

export default function Dashboard() {
  const { getToken } = useAuth();
  const [data, setData] = useState<any>(null);
  const [debtsSummary, setDebtsSummary] = useState<ApartmentDebtSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // State to track expanded apartment cards in recent payments
  const [expandedApts, setExpandedApts] = useState<Record<string, boolean>>({});

  const toggleApartmentExpand = (key: string) => {
    setExpandedApts(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const [dashRes, debtsRes] = await Promise.all([
        fetch('/api/dashboard', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/debts/summary', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (dashRes.ok) {
        setData(await dashRes.json());
      }
      if (debtsRes.ok) {
        setDebtsSummary(await debtsRes.json());
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Group recent payments by apartment so multiple payments for the same apartment collapse into one clickable card
  const groupedPayments: GroupedApartmentPayments[] = useMemo(() => {
    if (!data?.recentPayments || data.recentPayments.length === 0) return [];
    const map = new Map<string, GroupedApartmentPayments>();

    data.recentPayments.forEach((payment: any) => {
      const aptNumber = payment.apartment?.number || 'عام / غير محدد';
      const key = payment.apartmentId ? `apt-${payment.apartmentId}` : `apt-num-${aptNumber}`;
      const residentName = payment.resident?.name || payment.apartment?.residents?.[0]?.name || '';
      const amount = parseFloat(payment.amount) || 0;

      if (!map.has(key)) {
        map.set(key, {
          key,
          apartmentId: payment.apartmentId || null,
          apartmentNumber: aptNumber,
          residentName,
          totalAmount: 0,
          payments: []
        });
      }

      const group = map.get(key)!;
      group.totalAmount += amount;
      group.payments.push(payment);
      if (!group.residentName && residentName) {
        group.residentName = residentName;
      }
    });

    return Array.from(map.values());
  }, [data?.recentPayments]);

  // Initialize all groups as expanded by default for instant visibility
  useEffect(() => {
    if (groupedPayments.length > 0) {
      setExpandedApts(prev => {
        const next = { ...prev };
        groupedPayments.forEach(g => {
          if (next[g.key] === undefined) {
            next[g.key] = true;
          }
        });
        return next;
      });
    }
  }, [groupedPayments]);

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case 'CREDIT':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px] py-0">رصيد دائن</Badge>;
      case 'CASH':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-[10px] py-0">نقدي</Badge>;
      case 'BANK_TRANSFER':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 text-[10px] py-0">تحويل بنكي</Badge>;
      case 'E_WALLET':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 text-[10px] py-0">محفظة إلكترونية</Badge>;
      case 'CHEQUE':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-[10px] py-0">شيك</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] py-0">{method || 'نقدي'}</Badge>;
    }
  };

  return (
    <div className="space-y-8" dir="rtl">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">لوحة التحكم والمتابعة</h1>
          <p className="text-muted-foreground mt-1">
            إدارة العقارات والديون الموحدة والمقبوضات اليومية وجلسات الضخ لصندوق البناية.
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchDashboardData} 
          disabled={loading}
          className="gap-2 self-start md:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث البيانات
        </Button>
      </div>

      {/* Developer Word to Residents Card */}
      <DeveloperWordCard compact={true} />

      {/* Main Stats Row - 5 Cards including General Pumping Count */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">عدد الشقق</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Building className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold">{data?.metrics?.apartments || debtsSummary.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">شقة مسجلة بالنظام</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">عدد السكان</CardTitle>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold">{data?.metrics?.residents || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">مالكون ومستأجرون</p>
          </CardContent>
        </Card>

        {/* جلسات الضخ العام - عدد المرات والاستهلاك */}
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">جلسات الضخ العام</CardTitle>
            <div className="p-2 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-lg">
              <Droplets className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-foreground">
                {data?.metrics?.pumpingCount || 0}
              </span>
              <span className="text-xs text-muted-foreground">جلسة / مرة</span>
            </div>
            <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
              <span>الاستهلاك: {Number(data?.metrics?.pumpingConsumption || 0).toLocaleString()} م³</span>
              <span className="font-semibold text-foreground">₪{Number(data?.metrics?.pumpingCost || 0).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-destructive/20 bg-destructive/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">إجمالي الديون المستحقة</CardTitle>
            <div className="p-2 bg-destructive/10 text-destructive rounded-lg">
              <AlertCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-destructive">
              ₪{Number(data?.metrics?.totalDebts || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-destructive/80 mt-1">مبالغ موحدة غير محصلة</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">رصيد الصندوق المالي</CardTitle>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Wallet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              ₪{Number(data?.metrics?.fundBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">صافي النقد المتوفر</p>
          </CardContent>
        </Card>
      </div>

      {/* MODERN FINANCIAL FLOW CHART: مقبوضات + مصروفات + المتبقي بالصندوق */}
      <FinancialFlowChart 
        data={data?.financialFlow}
        currentBalance={data?.metrics?.fundBalance || 0}
        totalIncome={data?.metrics?.totalIncome || 0}
        totalExpense={data?.metrics?.totalExpense || 0}
      />

      {/* CORE FEATURE: UNIFIED DEBTS MATRIX TABLE (جدول الديون الموحدة في لوحة التحكم) */}
      <div className="space-y-4">
        <DebtsMatrixTable 
          data={debtsSummary} 
          loading={loading} 
          onRefresh={fetchDashboardData} 
        />
      </div>

      {/* Bottom Grid: Recent Pumping Sessions & Recent Payments */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Pumping Sessions */}
        <Card className="shadow-xs">
          <CardHeader className="border-b pb-3 bg-muted/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-cyan-100 rounded-lg text-cyan-800">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">آخر جلسات الضخ العام</CardTitle>
                  <CardDescription className="text-xs">سجل أحدث عمليات ضخ المياه بالبناية</CardDescription>
                </div>
              </div>
              <Link to="/water">
                <Button variant="ghost" size="sm" className="text-xs text-cyan-700 hover:text-cyan-800">
                  إدارة المياه والضخ ←
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {data?.recentPumping?.length > 0 ? (
              <div className="space-y-3">
                {data.recentPumping.map((session: any) => (
                  <div key={session.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className="bg-cyan-100 p-2 rounded-full text-cyan-700">
                        <Droplets className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold leading-none">
                          جلسة ضخ: {session.consumption} م³
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(session.date).toLocaleDateString('ar-EG')} • قراءة سابقة {session.previousReading} إلى {session.currentReading}
                        </p>
                      </div>
                    </div>
                    <div className="font-extrabold text-sm text-cyan-900 bg-cyan-50 px-2.5 py-1 rounded-md border border-cyan-200">
                      ₪{parseFloat(session.totalCost).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm">
                لا توجد جلسات ضخ مسجلة حديثاً
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments Section */}
        <Card className="shadow-xs">
          <CardHeader className="border-b pb-3 bg-muted/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg text-green-700">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">سندات القبض والمدفوعات الأخيرة</CardTitle>
                  <CardDescription className="text-xs">آخر 5 عمليات تحصيل تم قيدها في الصندوق</CardDescription>
                </div>
              </div>
              <Link to="/accounting">
                <Button variant="ghost" size="sm" className="text-xs text-green-700 hover:text-green-800">
                  سجل الحسابات ←
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {groupedPayments.length > 0 ? (
                <div className="space-y-3">
                  {groupedPayments.map((group) => {
                    const isExpanded = expandedApts[group.key] ?? true;
                    return (
                      <div 
                        key={group.key} 
                        className="rounded-xl border bg-card overflow-hidden transition-all duration-200 shadow-2xs hover:border-primary/30"
                      >
                        {/* Group Header (Clickable to expand/collapse inner operations) */}
                        <div 
                          onClick={() => toggleApartmentExpand(group.key)}
                          className="flex items-center justify-between p-3.5 bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors select-none"
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-700 shrink-0">
                              <CreditCard className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-extrabold text-foreground">
                                  شقة {group.apartmentNumber}
                                </span>
                                {group.residentName && (
                                  <span className="text-xs font-semibold text-muted-foreground">
                                    - {group.residentName}
                                  </span>
                                )}
                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0 font-bold mr-1">
                                  {group.payments.length} {group.payments.length === 1 ? 'سند' : 'سندات'}
                                </Badge>
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                <span>اضغط لعرض تفاصيل العمليات</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <div className="font-extrabold text-sm text-green-700 bg-green-50 px-3 py-1 rounded-lg border border-green-200 font-mono">
                              +₪{group.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="p-1 rounded-full text-muted-foreground hover:text-foreground">
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Collapsible Inner Operations for this Apartment */}
                        {isExpanded && (
                          <div className="divide-y border-t bg-muted/10">
                            {group.payments.map((payment: any, idx: number) => (
                              <div 
                                key={payment.id || idx} 
                                className="flex items-center justify-between px-4 py-2.5 hover:bg-background/80 transition-colors text-xs"
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className="font-mono text-[11px] text-muted-foreground w-4 text-center">
                                    #{idx + 1}
                                  </span>
                                  <div>
                                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                                      <span>{payment.notes || 'سداد استحقاق مالي'}</span>
                                      {getPaymentMethodBadge(payment.method)}
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(payment.date).toLocaleDateString('ar-EG')}
                                      </span>
                                      {payment.reference && (
                                        <span>• المرجع: {payment.reference}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="font-mono font-bold text-xs text-green-700 bg-green-50/80 px-2 py-0.5 rounded border border-green-200/60">
                                  +₪{parseFloat(payment.amount).toFixed(2)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm flex flex-col items-center justify-center gap-2">
                  <CreditCard className="h-8 w-8 text-muted-foreground/50" />
                  <span>لا توجد سندات قبض مسجلة حديثاً</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
