import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AppUser {
  id: number;
  authId: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'accountant' | 'viewer' | 'tenant';
  apartmentId?: number;
  apartmentNumber?: string;
  residentId?: number | null;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  userRecord: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  tenantSignIn: (apartmentNumber: string, accessCode: string) => Promise<any>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRecord: null,
  loading: true,
  signIn: async () => {},
  tenantSignIn: async () => {},
  signOut: async () => {},
  getToken: async () => null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRecord, setUserRecord] = useState<AppUser | null>(null);
  const [tenantToken, setTenantToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check for stored Tenant session first
    const savedTenantSession = localStorage.getItem('tenant_session_data');
    if (savedTenantSession) {
      try {
        const parsed = JSON.parse(savedTenantSession);
        if (parsed?.token && parsed?.user) {
          setTenantToken(parsed.token);
          setUserRecord(parsed.user);
          setUser({
            id: parsed.user.authId,
            email: parsed.user.email,
            user_metadata: { full_name: parsed.user.name },
            app_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString()
          } as any);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error parsing saved tenant session:', err);
        localStorage.removeItem('tenant_session_data');
      }
    }

    // 2. Initial fetch of Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setLoading(true);
        fetchUserRecord(session.access_token);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // If a tenant is logged in, don't overwrite with null supabase session
      const currentSavedTenant = localStorage.getItem('tenant_session_data');
      if (currentSavedTenant) return;

      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setLoading(true);
        fetchUserRecord(session.access_token);
      } else {
        setUserRecord(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRecord = async (token: string) => {
    try {
      const res = await fetch('/api/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserRecord(data.user);
      } else {
        const errorData = await res.json().catch(() => null);
        if (res.status === 403 && errorData?.error === 'Account is disabled') {
          setUserRecord({ isActive: false } as any);
        } else {
          setUserRecord(null);
          if (res.status === 401) {
            await supabase.auth.signOut();
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch user record', error);
      setUserRecord(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    localStorage.removeItem('tenant_session_data');
    setTenantToken(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      throw error;
    }
  };

  const tenantSignIn = async (apartmentNumber: string, accessCode: string) => {
    // Clear any Supabase active session
    await supabase.auth.signOut().catch(() => {});
    
    const res = await fetch('/api/setup/tenant-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apartmentNumber, accessCode })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'فشل تسجيل الدخول. يرجى التأكد من البيانات.');
    }

    if (data.success && data.token && data.user) {
      setTenantToken(data.token);
      setUserRecord(data.user);
      setUser({
        id: data.user.authId,
        email: data.user.email,
        user_metadata: { full_name: data.user.name },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      } as any);

      localStorage.setItem('tenant_session_data', JSON.stringify({
        token: data.token,
        user: data.user,
        resident: data.resident
      }));

      return data;
    } else {
      throw new Error('بيانات الدخول غير مكتملة');
    }
  };

  const signOut = async () => {
    localStorage.removeItem('tenant_session_data');
    setTenantToken(null);
    setUser(null);
    setUserRecord(null);
    setSession(null);
    await supabase.auth.signOut().catch(() => {});
  };

  const getToken = async () => {
    // If tenant is logged in, return tenant token
    if (tenantToken) {
      return tenantToken;
    }
    const savedTenant = localStorage.getItem('tenant_session_data');
    if (savedTenant) {
      try {
        const parsed = JSON.parse(savedTenant);
        if (parsed?.token) return parsed.token;
      } catch (e) {}
    }

    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  };

  return (
    <AuthContext.Provider value={{ user, userRecord, loading, signIn, tenantSignIn, signOut, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
