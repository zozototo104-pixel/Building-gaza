import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

export default function Setup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/setup/status');
        const data = await res.json();
        
        if (data && data.setupRequired === false) {
          navigate('/login', { replace: true });
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Setup status check error, opening setup page anyway:', err);
        // If API fails or backend is unreachable, still open setup page for user
        setLoading(false);
      }
    };
    checkStatus();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('كلمات المرور غير متطابقة');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('تم إعداد المدير الرئيسي بنجاح! جاري التوجيه...');
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 1500);
      } else {
        toast.error(data.error || 'حدث خطأ أثناء إعداد النظام');
      }
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">جاري التحقق...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40" dir="rtl">
      <div className="w-full max-w-md p-8 space-y-8 bg-background rounded-2xl shadow-lg border">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">إعداد النظام</h2>
          <p className="text-muted-foreground mt-2">إنشاء حساب المدير الرئيسي الأول</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">الاسم الكامل</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              required
              dir="ltr"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-left"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">كلمة المرور</label>
            <input
              type="password"
              required
              dir="ltr"
              minLength={6}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-left"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">تأكيد كلمة المرور</label>
            <input
              type="password"
              required
              dir="ltr"
              minLength={6}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-left"
              value={formData.confirmPassword}
              onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
          </div>
          
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            {submitting ? 'جاري الإنشاء...' : 'إنشاء المدير الرئيسي'}
          </button>
        </form>
      </div>
    </div>
  );
}
