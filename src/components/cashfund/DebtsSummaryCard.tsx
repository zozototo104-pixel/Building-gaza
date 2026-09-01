import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Building2, ChevronLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DebtsSummaryProps {
  totalDebts: number;
  indebtedCount: number;
  onScrollToDebts?: () => void;
}

export function DebtsSummaryCard({ totalDebts, indebtedCount, onScrollToDebts }: DebtsSummaryProps) {
  return (
    <Card id="section-debts-summary" className="overflow-hidden border border-rose-200 dark:border-rose-950/60 shadow-xs bg-rose-50/40 dark:bg-rose-950/10">
      <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-rose-950 dark:text-rose-100">مجموع ديون البناية المستحقة من السكان</h3>
              <p className="text-xs text-rose-700/80 dark:text-rose-300/80 mt-0.5">
                يشمل الاشتراكات وتعبئات المياه والإيجارات والاستحقاقات السابقة غير المسددة
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 text-xs font-semibold px-2.5 py-0.5">
            مستحقات معلقة
          </Badge>
        </div>

        <div className="my-1 flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-rose-600 dark:text-rose-400 font-mono">
              {Number(totalDebts || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-sm font-bold text-rose-700/70 dark:text-rose-400/70">شيكل</span>
          </div>

          <div className="bg-white/80 dark:bg-zinc-900/80 border border-rose-200/80 dark:border-rose-900/50 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-2xs">
            <Building2 className="h-4 w-4 text-rose-500 shrink-0" />
            <div className="text-left">
              <span className="text-[11px] text-muted-foreground block font-medium">الشقق التي عليها دين</span>
              <span className="text-sm font-black text-rose-600 dark:text-rose-400 font-mono leading-none">{indebtedCount}</span>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-rose-200/60 dark:border-rose-900/40 flex justify-end">
          <button
            type="button"
            onClick={onScrollToDebts}
            className="text-xs font-bold text-rose-700 dark:text-rose-300 hover:text-rose-900 dark:hover:text-rose-100 flex items-center gap-1 cursor-pointer transition-colors"
          >
            عرض جدول ديون السكان المفصل
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
