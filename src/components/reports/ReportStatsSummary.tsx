import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  AlertCircle, 
  CalendarCheck, 
  Droplet, 
  Home
} from 'lucide-react';

interface ReportStatsSummaryProps {
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
  totalDebts: number;
  totalSubscriptionsCollected: number;
  totalWaterBilled: number;
  totalRentCollected: number;
  totalFundBalance: number;
}

export function ReportStatsSummary({
  totalIncome,
  totalExpense,
  netCashFlow,
  totalDebts,
  totalSubscriptionsCollected,
  totalWaterBilled,
  totalRentCollected,
  totalFundBalance
}: ReportStatsSummaryProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" dir="rtl">
      {/* 1. إجمالي المقبوضات والإيرادات */}
      <Card className="border border-border/80 shadow-2xs hover:shadow-xs transition-shadow bg-card/90">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground">إجمالي المقبوضات</p>
            <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              ₪{totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-muted-foreground font-medium">مجموع الإيداعات والتحصيلات</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      {/* 2. إجمالي المصروفات */}
      <Card className="border border-border/80 shadow-2xs hover:shadow-xs transition-shadow bg-card/90">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground">إجمالي المصروفات</p>
            <p className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400">
              ₪{totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-muted-foreground font-medium">نفقات وصيانة وتشغيل</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <TrendingDown className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      {/* 3. صافي الحركة للفترة */}
      <Card className="border border-border/80 shadow-2xs hover:shadow-xs transition-shadow bg-card/90">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground">صافي حركة الصندوق</p>
            <p className={`text-xl sm:text-2xl font-bold ${netCashFlow >= 0 ? 'text-primary' : 'text-amber-600 dark:text-amber-400'}`}>
              ₪{netCashFlow.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-muted-foreground font-medium">الفارق (المقبوضات - المصروفات)</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Wallet className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      {/* 4. إجمالي الديون المستحقة */}
      <Card className="border border-border/80 shadow-2xs hover:shadow-xs transition-shadow bg-card/90">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground">الديون المستحقة القائمة</p>
            <p className="text-xl sm:text-2xl font-bold text-destructive">
              ₪{totalDebts.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-muted-foreground font-medium">مستحقات غير محصلة على الشقق</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
            <AlertCircle className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      {/* 5. الاشتراكات المحصلة */}
      <Card className="border border-border/80 shadow-2xs bg-card/70">
        <CardContent className="p-3.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold text-muted-foreground">اشتراكات محصلة</p>
            <p className="text-lg font-bold text-foreground">
              ₪{totalSubscriptionsCollected.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <CalendarCheck className="h-4 w-4" />
          </div>
        </CardContent>
      </Card>

      {/* 6. فواتير المياه */}
      <Card className="border border-border/80 shadow-2xs bg-card/70">
        <CardContent className="p-3.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold text-muted-foreground">فواتير مياه مسجلة</p>
            <p className="text-lg font-bold text-foreground">
              ₪{totalWaterBilled.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
            <Droplet className="h-4 w-4" />
          </div>
        </CardContent>
      </Card>

      {/* 7. إيرادات الإيجارات */}
      <Card className="border border-border/80 shadow-2xs bg-card/70">
        <CardContent className="p-3.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold text-muted-foreground">إيرادات إيجارات</p>
            <p className="text-lg font-bold text-foreground">
              ₪{totalRentCollected.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Home className="h-4 w-4" />
          </div>
        </CardContent>
      </Card>

      {/* 8. رصيد الصندوق الإجمالي */}
      <Card className="border border-border/80 shadow-2xs bg-card/70">
        <CardContent className="p-3.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold text-muted-foreground">الرصيد التراكمي للصندوق</p>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
              ₪{totalFundBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Wallet className="h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
