import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../lib/auth';
import { toast } from 'sonner';

type Role = 'admin' | 'manager' | 'accountant' | 'viewer' | 'tenant';

interface User {
  id: number;
  authId: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

const roleLabels: Record<Role, string> = {
  admin: 'مدير نظام',
  manager: 'مدير عمليات',
  accountant: 'محاسب',
  viewer: 'مشاهد',
  tenant: 'ساكن'
};

const roleColors: Record<Role, string> = {
  admin: 'bg-red-100 text-red-800',
  manager: 'bg-blue-100 text-blue-800',
  accountant: 'bg-purple-100 text-purple-800',
  viewer: 'bg-gray-100 text-gray-800',
  tenant: 'bg-green-100 text-green-800'
};

export default function UsersManagement() {
  const { userRecord, getToken } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'viewer' as Role });
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const token = await getToken();
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      console.error(err);
      toast.error('فشل في جلب المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRecord?.role === 'admin') {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [userRecord]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'حدث خطأ غير معروف');
      
      toast.success('تم إنشاء المستخدم وإرسال دعوة بنجاح');
      setIsFormOpen(false);
      setFormData({ name: '', email: '', role: 'viewer' });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleUserStatus = async (user: User) => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !user.isActive })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'حدث خطأ');
      
      toast.success('تم تحديث حالة المستخدم');
      setUsers(users.map(u => u.id === user.id ? { ...u, isActive: !user.isActive } : u));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const changeUserRole = async (user: User, newRole: Role) => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'حدث خطأ');
      
      toast.success('تم تغيير دور المستخدم');
      setUsers(users.map(u => u.id === user.id ? { ...u, role: newRole } : u));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const resetPassword = async (user: User) => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'حدث خطأ');
      
      toast.success(`تم إرسال رابط إعادة التعيين إلى ${user.email} بنجاح`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (userRecord?.role !== 'admin') {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          ليس لديك صلاحية للوصول إلى إدارة المستخدمين. (هذه الميزة متاحة للمديرين فقط)
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">إدارة المستخدمين</h2>
        <Button onClick={() => setIsFormOpen(!isFormOpen)}>
          {isFormOpen ? 'إلغاء' : '+ إضافة مستخدم'}
        </Button>
      </div>

      {isFormOpen && (
        <Card className="border-primary shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">إضافة مستخدم جديد</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <label className="block text-sm font-medium mb-1">الدور</label>
                  <select
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as Role })}
                  >
                    {Object.entries(roleLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>إلغاء</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'جاري الحفظ...' : 'حفظ وإرسال دعوة'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center p-8">جاري التحميل...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.map(u => (
            <Card key={u.id} className={!u.isActive ? 'opacity-60' : ''}>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{u.name}</h3>
                    <p className="text-sm text-muted-foreground">{u.email}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${roleColors[u.role]}`}>
                    {roleLabels[u.role]}
                  </span>
                </div>
                
                <div className="space-y-3 pt-3 border-t">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">الحالة:</span>
                    <span className={u.isActive ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                      {u.isActive ? 'فعال' : 'معطل'}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 pt-2">
                    <select
                      className="text-xs border rounded px-2 py-1 bg-muted/30"
                      value={u.role}
                      onChange={(e) => changeUserRole(u, e.target.value as Role)}
                    >
                      {Object.entries(roleLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs h-7"
                      onClick={() => toggleUserStatus(u)}
                    >
                      {u.isActive ? 'تعطيل' : 'تفعيل'}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs h-7"
                      onClick={() => resetPassword(u)}
                    >
                      إعادة كلمة المرور
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {users.length === 0 && (
            <div className="col-span-full p-8 text-center text-muted-foreground border rounded-lg bg-muted/20">
              لا يوجد مستخدمون حالياً
            </div>
          )}
        </div>
      )}
    </div>
  );
}
