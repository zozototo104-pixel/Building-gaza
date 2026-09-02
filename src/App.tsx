
import { Projects } from './pages/Projects';
import { Community } from './pages/Community';
import { CashFund } from './pages/CashFund';
import { ExpenseCalculator } from './pages/ExpenseCalculator';
import { Notifications } from './pages/Notifications';
import { TenantPortal } from './pages/TenantPortal';
import { RentContracts } from './pages/RentContracts';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router';
import { AuthProvider, useAuth } from './lib/auth';
import { supabase } from './lib/supabase';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { 
  Building, 
  DoorOpen, 
  ShieldCheck, 
  KeyRound, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  ArrowLeft,
  Sparkles,
  Info
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Apartments from './pages/Apartments';
import Residents from './pages/Residents';
import Services from './pages/Services';
import Water from './pages/Water';
import Accounting from './pages/Accounting';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Setup from './pages/Setup';

const Login = () => {
  const { signIn, tenantSignIn, user, userRecord, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Mode: 'ADMIN' or 'TENANT'
  const [loginMode, setLoginMode] = useState<'TENANT' | 'ADMIN'>('TENANT');

  // Admin form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Tenant form
  const [apartmentNumber, setApartmentNumber] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  useEffect(() => {
    if (user && !authLoading) {
      if (userRecord?.role === 'tenant') {
        navigate('/tenant', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, userRecord, authLoading, navigate]);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/setup/status');
        const data = await res.json();
        if (data.setupRequired) {
          navigate('/setup', { replace: true });
        } else {
          setCheckingSetup(false);
        }
      } catch (err) {
        console.error(err);
        setCheckingSetup(false);
      }
    };
    checkStatus();
  }, [navigate]);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      toast.success('تم تسجيل دخول الإدارة بنجاح');
      navigate('/', { replace: true });
    } catch (err: any) {
      toast.error('فشل تسجيل الدخول: البريد الإلكتروني أو كلمة المرور غير صحيحة.');
    } finally {
      setLoading(false);
    }
  };

  const handleTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apartmentNumber.trim()) {
      toast.error('يرجى إدخال رقم الشقة');
      return;
    }
    if (!accessCode.trim()) {
      toast.error('يرجى إدخال الرقم السري');
      return;
    }

    setLoading(true);
    try {
      await tenantSignIn(apartmentNumber.trim(), accessCode.trim());
      toast.success(`مرحباً بك! تم تسجيل الدخول لشقة ${apartmentNumber}`);
      navigate('/tenant', { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'فشل الدخول. يرجى التأكد من رقم الشقة والرقم السري.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <Building className="h-10 w-10 text-primary animate-pulse" />
          <p className="text-sm font-bold text-muted-foreground">جاري فحص النظام...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-muted/50 to-background p-4" dir="rtl">
      <div className="w-full max-w-md bg-card rounded-3xl shadow-xl border overflow-hidden">
        {/* Brand Header */}
        <div className="bg-primary/10 p-6 text-center border-b relative">
          <div className="mx-auto w-14 h-14 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-md mb-3">
            <Building className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-black text-foreground">نظام إدارة العمارة السكنية</h1>
          <p className="text-xs text-muted-foreground mt-1">المنصة الشاملة لإدارة الشقق، الخدمات، واستحقاقات السكان</p>
        </div>

        {/* Tab Selector: Tenant vs Admin */}
        <div className="p-2 m-4 bg-muted/60 rounded-2xl flex items-center gap-1 border">
          <button
            type="button"
            onClick={() => setLoginMode('TENANT')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              loginMode === 'TENANT'
                ? 'bg-background text-primary shadow-xs font-black'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <DoorOpen className="h-4 w-4" />
            دخول الساكن / المالك
          </button>
          <button
            type="button"
            onClick={() => setLoginMode('ADMIN')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              loginMode === 'ADMIN'
                ? 'bg-background text-primary shadow-xs font-black'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            دخول الإدارة والمشرفين
          </button>
        </div>

        <div className="p-6 pt-2">
          {loginMode === 'TENANT' ? (
            /* TENANT LOGIN FORM */
            <form onSubmit={handleTenantSubmit} className="space-y-4">
              <div className="bg-primary/5 p-3.5 rounded-2xl border border-primary/15 flex items-start gap-2.5 text-xs text-primary/90 leading-relaxed">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  أدخل <strong>رقم الشقة</strong> و<strong>الرقم السري</strong> المسلّم لك من إدارة المبنى للاطلاع المباشر على استحقاقاتك، كشوفات الحساب، وطباعتها.
                </span>
              </div>

              <div>
                <label className="block text-xs font-black text-foreground mb-1.5">
                  رقم الشقة السكنية
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={apartmentNumber}
                    onChange={(e) => setApartmentNumber(e.target.value)}
                    placeholder="مثال: 101 أو 12 أو 3"
                    className="w-full pr-10 pl-4 py-2.5 bg-background border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold text-foreground"
                    required
                    autoFocus
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-muted-foreground">
                    <DoorOpen className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-black text-foreground">
                    الرقم السري للشقة
                  </label>
                  <span className="text-[11px] text-muted-foreground font-medium">الافتراضي: 123456</span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    placeholder="أدخل الرقم السري للشقة"
                    className="w-full pr-10 pl-10 py-2.5 bg-background border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold text-foreground"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-muted-foreground">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground hover:text-foreground focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-md text-sm font-black text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-all cursor-pointer"
              >
                <DoorOpen className="h-4 w-4" />
                {loading ? 'جاري الدخول للبوابة...' : 'دخول إلى بوابة الساكن'}
              </button>
            </form>
          ) : (
            /* ADMIN LOGIN FORM */
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-foreground mb-1.5">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@building.com"
                    className="w-full pr-10 pl-4 py-2.5 bg-background border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium text-foreground text-left"
                    required
                    dir="ltr"
                    autoFocus
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-muted-foreground">
                    <User className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-foreground mb-1.5">
                  كلمة المرور
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pr-10 pl-10 py-2.5 bg-background border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium text-foreground text-left"
                    required
                    dir="ltr"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-muted-foreground">
                    <Lock className="h-4 w-4" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground hover:text-foreground focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-md text-sm font-black text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-all cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4" />
                {loading ? 'جاري تسجيل الدخول...' : 'تسجيل دخول الإدارة'}
              </button>
            </form>
          )}

          {/* Footer Assistance */}
          <div className="mt-6 pt-4 border-t text-center text-xs text-muted-foreground">
            {loginMode === 'TENANT' ? (
              <p>
                تواجه مشكلة في الدخول؟ يرجى التواصل مع إدارة العمارة لتزويدك بالرمز السري الخاص بشقتك.
              </p>
            ) : (
              <p>
                بوابة الإدارة مخصصة فقط لمشؤولي ومحاسبي العمارة المصرح لهم.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <Building className="h-10 w-10 text-primary animate-pulse" />
          <p className="text-sm font-bold text-muted-foreground">جاري تحميل النظام...</p>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// Route wrapper for root "/"
const RootRoute = () => {
  const { userRecord } = useAuth();
  if (userRecord?.role === 'tenant') {
    return <Navigate to="/tenant" replace />;
  }
  return <Dashboard />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<RootRoute />} />
            <Route path="apartments" element={<Apartments />} />
            <Route path="residents" element={<Residents />} />
            <Route path="services" element={<Services />} />
            <Route path="water" element={<Water />} />
            <Route path="accounting" element={<Accounting />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="projects" element={<Projects />} />
            <Route path="community" element={<Community />} />
            <Route path="cash-fund" element={<CashFund />} />
            <Route path="calculator" element={<ExpenseCalculator />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="tenant" element={<TenantPortal />} />
            <Route path="rent-contracts" element={<RentContracts />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" dir="rtl" />
    </AuthProvider>
  );
}
