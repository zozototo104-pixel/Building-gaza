
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
    title: 'الرئيسية والمتابعة التنفيذية',
    items: [
      { name: 'لوحة المؤشرات العامة', href: '/', icon: Home },
      { name: 'حركة الصندوق والمصروفات', href: '/cash-fund', icon: Briefcase },
    ]
  },
  {
    title: 'إدارة العقارات والسكان',
    items: [
      { name: 'الشقق السكنية', href: '/apartments', icon: Building },
      { name: 'بيانات السكان والمُلاك', href: '/residents', icon: Users },
      { name: 'عقود الإيجار والتحصيل', href: '/rent-contracts', icon: FileText },
      { name: 'بوابة الساكن الإلكترونية', href: '/tenant', icon: DoorOpen },
    ]
  },
  {
    title: 'المالية والمحاسبة العامة',
    items: [
      { name: 'مصفوفة الديون والمطالبات', href: '/accounting', icon: Wallet },
      { name: 'حاسبة النفقات والتكاليف', href: '/calculator', icon: Calculator },
    ]
  },
  {
    title: 'الخدمات والتشغيل الميداني',
    items: [
      { name: 'تعبئة المياه والضخ العام', href: '/water', icon: Droplets },
      { name: 'الاشتراكات والخدمات الدورية', href: '/services', icon: Zap },
      { name: 'المشاريع وأعمال الصيانة', href: '/projects', icon: Building },
    ]
  },
  {
    title: 'المجتمع والإشعارات والتقارير',
    items: [
      { name: 'الإعلانات والتعميمات', href: '/community', icon: Megaphone },
      { name: 'التنبيهات والمتابعة', href: '/notifications', icon: Bell },
      { name: 'مركز التقارير المعتمدة', href: '/reports', icon: FileText },
      { name: 'إعدادات النظام', href: '/settings', icon: Settings },
    ]
  }
];

export function DashboardLayout() {
  const { userRecord, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [buildingName, setBuildingName] = React.useState<string>(() => {
    return localStorage.getItem('buildingName') || '';
  });

  // Fetch building name from API on mount & listen to changes
  React.useEffect(() => {
    const fetchBuilding = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/building', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          if (data.name) {
            setBuildingName(data.name);
            localStorage.setItem('buildingName', data.name);
          }
        }
      } catch (e) {
        // use fallback from localStorage
      }
    };
    fetchBuilding();

    const handleBuildingChange = (e: any) => {
      const updated = e?.detail?.name || localStorage.getItem('buildingName') || '';
      setBuildingName(updated);
    };

    window.addEventListener('building-name-changed', handleBuildingChange);
    window.addEventListener('storage', handleBuildingChange);
    return () => {
      window.removeEventListener('building-name-changed', handleBuildingChange);
      window.removeEventListener('storage', handleBuildingChange);
    };
  }, []);

  // Auto-close mobile sheet on route change
  React.useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const NavLinks = ({ onItemClick }: { onItemClick?: () => void }) => {
    let filteredGroups = navigationGroups;
    if (userRecord?.role === 'tenant') {
      filteredGroups = [
        {
          title: 'الساكن',
          items: [
            { name: 'بوابة الساكن', href: '/tenant', icon: DoorOpen },
            { name: 'الإعلانات والزيارات', href: '/community', icon: Megaphone }
          ]
        }
      ];
    }
    
    return (
    <div className="space-y-4">
      {filteredGroups.map((group, idx) => (
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
                  onClick={() => {
                    if (onItemClick) onItemClick();
                  }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    isActive 
                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs' 
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
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
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row rtl" dir="rtl">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-3.5 border-b bg-card sticky top-0 z-20">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="bg-primary/10 p-1.5 rounded-lg shrink-0">
            <Building className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm sm:text-base leading-tight truncate">
              نظام إدارة العمارة السكنية
            </span>
            {buildingName && (
              <span className="text-xs font-bold text-primary truncate">
                ({buildingName})
              </span>
            )}
          </div>
        </div>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" />}>
            <Menu className="h-6 w-6" />
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0 overflow-y-auto">
            <div className="flex flex-col min-h-full">
              <div className="p-4 border-b">
                <div className="flex items-center gap-2.5">
                  <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                    <Building className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-base leading-tight">نظام إدارة العمارة السكنية</span>
                    {buildingName && (
                      <span className="text-xs font-bold text-primary truncate mt-0.5">
                        ({buildingName})
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <nav className="flex-1 p-4">
                <NavLinks onItemClick={() => setMobileOpen(false)} />
              </nav>
              <div className="p-4 border-t mt-auto">
                <div className="mb-4">
                  <p className="font-medium text-sm">{userRecord?.name}</p>
                  <p className="text-xs text-muted-foreground">{userRecord?.email}</p>
                </div>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => { setMobileOpen(false); signOut(); }}>
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
        <div className="p-5 border-b">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-xl shrink-0">
              <Building className="h-6 w-6 text-primary" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-base tracking-tight leading-snug">نظام إدارة العمارة السكنية</span>
              {buildingName ? (
                <span className="text-xs font-bold text-primary truncate mt-0.5">
                  ({buildingName})
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground">لوحة التحكم والإدارة</span>
              )}
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-4">
          <NavLinks />
        </nav>
        <div className="p-4 border-t bg-muted/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {userRecord?.name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="font-medium text-sm truncate">{userRecord?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{userRecord?.role}</p>
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
        {/* Desktop Top Header Bar */}
        <div className="hidden md:flex items-center justify-between px-8 py-3.5 bg-card/60 backdrop-blur-md border-b sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
              {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <span className="text-xs text-muted-foreground">|</span>
            <div className="flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-bold text-foreground">
                نظام إدارة العمارة السكنية {buildingName ? `(${buildingName})` : ''}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {userRecord?.role !== 'tenant' && (
              <Link to="/tenant">
                <Button variant="outline" size="sm" className="h-8 gap-2 text-xs font-bold border-primary/30 hover:bg-primary/5 text-primary">
                  <DoorOpen className="h-3.5 w-3.5" />
                  معاينة بوابة الساكن
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
