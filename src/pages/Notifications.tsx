import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

export function Notifications() {
  const { getToken } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const token = await getToken();
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: number) => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
        toast.success('تم تحديد الإشعار كمقروء');
      }
    } catch (e) {
      toast.error('حدث خطأ');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-3 rounded-lg">
          <Bell className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">الإشعارات</h2>
          <p className="text-muted-foreground mt-1">
            متابعة التنبيهات والأحداث الهامة
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>كل الإشعارات</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
              <Bell className="w-12 h-12 mb-4 text-muted" />
              لا توجد إشعارات حالياً
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map(n => (
                <div key={n.id} className={`flex justify-between items-start p-4 border rounded-lg ${!n.isRead ? 'bg-primary/5' : ''}`}>
                  <div className="flex gap-3 items-start">
                    <div className="mt-1">
                      {n.isRead ? <CheckCircle2 className="w-5 h-5 text-muted-foreground" /> : <Bell className="w-5 h-5 text-primary" />}
                    </div>
                    <div>
                      <h4 className={`font-bold ${!n.isRead ? 'text-primary' : ''}`}>{n.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                      <span className="text-xs text-muted-foreground block mt-2">{new Date(n.createdAt).toLocaleString('ar-EG')}</span>
                    </div>
                  </div>
                  {!n.isRead && (
                    <Button variant="ghost" size="sm" onClick={() => markAsRead(n.id)}>
                      تحديد كمقروء
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
