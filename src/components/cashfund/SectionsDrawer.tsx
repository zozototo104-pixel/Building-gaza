import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Menu,
  Landmark,
  AlertTriangle,
  SlidersHorizontal,
  Lock,
  Users,
  Building2,
  Wallet,
  TrendingUp,
  TableProperties,
  ChevronLeft
} from 'lucide-react';

export function SectionsDrawer() {
  const [open, setOpen] = useState(false);

  const sections = [
    {
      id: 'section-opening-balance',
      title: 'الرصيد الافتتاحي المرحّل',
      icon: Landmark,
      color: 'text-primary'
    },
    {
      id: 'section-debts-summary',
      title: 'مجموع ديون البناية المستحقة',
      icon: AlertTriangle,
      color: 'text-rose-500'
    },
    {
      id: 'section-expense-settings',
      title: 'إعدادات اعتماد المصروف',
      icon: SlidersHorizontal,
      color: 'text-indigo-500'
    },
    {
      id: 'section-monthly-closing',
      title: 'الإقفال المالي الشهري',
      icon: Lock,
      color: 'text-amber-500'
    },
    {
      id: 'section-board-approvals',
      title: 'طلبات موافقة المجلس',
      icon: Users,
      color: 'text-blue-500'
    },
    {
      id: 'section-residents-debts',
      title: 'ديون السكان لدى مجلس الإدارة',
      icon: Building2,
      color: 'text-rose-600'
    },
    {
      id: 'section-cash-fund',
      title: 'الصندوق المالي الموحد (المؤشرات)',
      icon: Wallet,
      color: 'text-emerald-600'
    },
    {
      id: 'section-transactions-chart',
      title: 'تطور المعاملات والسيولة',
      icon: TrendingUp,
      color: 'text-cyan-500'
    },
    {
      id: 'section-transactions-table',
      title: 'سجل حركات ومعاملات الصندوق',
      icon: TableProperties,
      color: 'text-primary'
    }
  ];

  const scrollTo = (id: string) => {
    setOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 left-6 z-40">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-4 rounded-full shadow-lg gap-2 cursor-pointer flex items-center border border-emerald-500/30"
            >
              <Menu className="h-4 w-4" />
              <span>الأقسام</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[75vh] rounded-t-3xl border-t p-5" dir="rtl">
            <SheetHeader className="pb-3 border-b">
              <SheetTitle className="text-base font-black flex items-center gap-2">
                <Menu className="h-5 w-5 text-primary" />
                الانتقال السريع لأقسام الصندوق المالي
              </SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 py-4 overflow-y-auto max-h-[55vh]">
              {sections.map((sec) => {
                const Icon = sec.icon;
                return (
                  <button
                    key={sec.id}
                    onClick={() => scrollTo(sec.id)}
                    className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/60 transition-all text-right cursor-pointer bg-card group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Icon className={`h-4 w-4 ${sec.color}`} />
                      </div>
                      <span className="text-xs font-bold text-foreground">{sec.title}</span>
                    </div>
                    <ChevronLeft className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </button>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
