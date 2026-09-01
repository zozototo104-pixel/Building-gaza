const fs = require('fs');

const layoutCode = `
import React from 'react';
import { Outlet, Link, useLocation } from 'react-router';
import { useAuth } from '@/lib/auth';
import { 
  Building, 
  Home, 
  Users, 
  Droplets, 
  Zap, 
  FileText, 
  Wallet, 
  Settings, 
  LogOut,
  Menu,
  Briefcase,
  Megaphone,
  Bell,
  Calculator,
  DoorOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const navigationGroups = [
  {
    title: 'لوحة التحكم',
    items: [
      { name: 'الرئيسية', href: '/', icon: Home },
    ]
  },
  {
    title: 'إدارة السكان',
    items: [
      { name: 'الشقق', href: '/apartments', icon: Building },
      { name: 'السكان', href: '/residents', icon: Users },
      { name: 'بوابة الساكن', href: '/tenant', icon: DoorOpen },
    ]
  },
  {
    title: 'الخدمات',
    items: [
      { name: 'المياه', href: '/water', icon: Droplets },
      { name: 'الخدمات والاشتراكات', href: '/services', icon: Zap },
    ]
  },
  {
    title: 'المالية',
    items: [
      { name: 'المحاسبة والديون', href: '/accounting', icon: Wallet },
      { name: 'الصندوق المالي', href: '/cash-fund', icon: Briefcase },
      { name: 'حاسبة المصاريف', href: '/calculator', icon: Calculator },
    ]
  },
  {
    title: 'المجتمع',
    items: [
      { name: 'المشاريع', href: '/projects', icon: Building },
      { name: 'الإعلانات والزيارات', href: '/community', icon: Megaphone },
    ]
  },
  {
    title: 'النظام',
    items: [
      { name: 'الإشعارات', href: '/notifications', icon: Bell },
      { name: 'التقارير', href: '/reports', icon: FileText },
      { name: 'الإعدادات', href: '/settings', icon: Settings },
    ]
  }
];

export function DashboardLayout() {
  const { appUser, signOut } = useAuth();
  const location = useLocation();

  const NavLinks = () => (
    <div className="space-y-4">
      {navigationGroups.map((group, idx) => (
        <div key={idx}>
          <h4 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {group.title}
          </h4>
          <div className="space-y-1">
            {group.items.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={\`flex items-center gap-3 px-3 py-2 rounded-md transition-colors \${
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }\`}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row rtl" dir="rtl">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-card sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <Building className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">منصة العقارات</span>
        </div>
        <Sheet>
          <SheetTrigger render={<Button variant="ghost" size="icon" />}>
            <Menu className="h-6 w-6" />
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0 overflow-y-auto">
            <div className="flex flex-col min-h-full">
              <div className="p-4 border-b">
                <div className="flex items-center gap-2">
                  <Building className="h-6 w-6 text-primary" />
                  <span className="font-bold text-lg">منصة العقارات</span>
                </div>
              </div>
              <nav className="flex-1 p-4">
                <NavLinks />
              </nav>
              <div className="p-4 border-t mt-auto">
                <div className="mb-4">
                  <p className="font-medium text-sm">{appUser?.name}</p>
                  <p className="text-xs text-muted-foreground">{appUser?.email}</p>
                </div>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={signOut}>
                  <LogOut className="h-4 w-4" />
                  تسجيل الخروج
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0 right-0 border-l bg-card z-10">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Building className="h-6 w-6 text-primary" />
            </div>
            <span className="font-bold text-xl tracking-tight">منصة العقارات</span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-4">
          <NavLinks />
        </nav>
        <div className="p-4 border-t bg-muted/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {appUser?.name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="font-medium text-sm truncate">{appUser?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{appUser?.role}</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:pr-64 pb-16 md:pb-0 min-h-screen">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
`;

fs.writeFileSync('src/components/layout/DashboardLayout.tsx', layoutCode);
console.log("Dashboard Layout updated.");
