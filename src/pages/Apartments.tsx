import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Building, 
  User, 
  Edit3, 
  Trash2, 
  Droplets, 
  Layers, 
  AlertTriangle,
  Coins,
  CheckCircle2,
  RefreshCw,
  FileText,
  CreditCard,
  Key,
  Copy
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import ApartmentDebtSheetModal from '@/components/dashboard/ApartmentDebtSheetModal';

export default function Apartments() {
  const { getToken } = useAuth();
  const [apartments, setApartments] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Apartment Debt Modal state
  const [selectedDebtAptId, setSelectedDebtAptId] = useState<number | null>(null);
  const [openDebtWithAdd, setOpenDebtWithAdd] = useState(false);
  
  // Create Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  // Edit Modal
  const [editingApt, setEditingApt] = useState<any | null>(null);
  const [editNumber, setEditNumber] = useState('');
  const [editFloor, setEditFloor] = useState('');
  const [editStatus, setEditStatus] = useState('EMPTY');
  const [editWaterReading, setEditWaterReading] = useState('0');
  const [editResidentId, setEditResidentId] = useState('');
  const [editAccessCode, setEditAccessCode] = useState('123456');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Delete Confirmation Modal
  const [deletingApt, setDeletingApt] = useState<any | null>(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const [resApt, resRes] = await Promise.all([
        fetch('/api/apartments', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/residents', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (resApt.ok) {
        setApartments(await resApt.json());
      }
      if (resRes.ok) {
        setResidents(await resRes.json());
      }
    } catch (e) {
      toast.error('حدث خطأ في تحميل بيانات الشقق');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const { register: regAdd, handleSubmit: handleAddSubmit, reset: resetAdd } = useForm();

  // Create Apartment Submit
  const onAddSubmit = async (data: any) => {
    try {
      const token = await getToken();
      const res = await fetch('/api/apartments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          number: data.number,
          floor: data.floor,
          status: data.residentId ? 'OCCUPIED' : (data.status || 'EMPTY'),
          waterMeterReading: data.waterMeterReading || '0',
          accessCode: data.accessCode || '123456',
          residentId: data.residentId ? parseInt(data.residentId) : null
        })
      });
      if (res.ok) {
        toast.success('تمت إضافة الشقة بنجاح');
        setIsAddOpen(false);
        resetAdd();
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'حدث خطأ أثناء إضافة الشقة');
      }
    } catch (e) {
      toast.error('حدث خطأ أثناء الاتصال بالخادم');
    }
  };

  // Open Edit Modal
  const openEditModal = (apt: any) => {
    setEditingApt(apt);
    setEditNumber(apt.number);
    setEditFloor(apt.floor || '');
    setEditStatus(apt.status || 'EMPTY');
    setEditWaterReading(apt.waterMeterReading || '0');
    setEditAccessCode(apt.accessCode || '123456');
    
    // Find assigned resident
    const currentRes = apt.residents && apt.residents.length > 0 
      ? apt.residents[0] 
      : residents.find(r => r.apartmentId === apt.id);
    
    setEditResidentId(currentRes ? currentRes.id.toString() : '');
  };

  // Submit Edit Apartment
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApt) return;
    setSubmittingEdit(true);

    try {
      const token = await getToken();
      const res = await fetch(`/api/apartments/${editingApt.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          number: editNumber,
          floor: editFloor,
          status: editResidentId ? 'OCCUPIED' : editStatus,
          waterMeterReading: editWaterReading,
          accessCode: editAccessCode,
          residentId: editResidentId ? parseInt(editResidentId) : null
        })
      });

      if (res.ok) {
        toast.success('تم تحديث بيانات الشقة بنجاح');
        setEditingApt(null);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'فشل تحديث بيانات الشقة');
      }
    } catch (e) {
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const copyTenantCredentials = (apt: any, resident?: any) => {
    const code = apt.accessCode || resident?.accessCode || '123456';
    const text = `🏢 *بيانات دخول بوابة الساكن*\n👤 الساكن: ${resident?.name || 'الساكن'}\n🚪 رقم الشقة: ${apt.number}\n🔑 الرقم السري: ${code}\n🌐 يمكنك الدخول من صفحة تسجيل الدخول باختيار (دخول الساكن / المالك) وإدخال رقم الشقة والرقم السري أعلاه للاطلاع على كشوفات الحساب والاستحقاقات المالية.`;
    navigator.clipboard.writeText(text);
    toast.success(`تم نسخ بيانات دخول شقة ${apt.number} لإرسالها للساكن عبر واتساب أو رسالة`);
  };

  // Submit Delete Apartment
  const handleDeleteSubmit = async () => {
    if (!deletingApt) return;
    setSubmittingDelete(true);

    try {
      const token = await getToken();
      const res = await fetch(`/api/apartments/${deletingApt.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success(`تم حذف شقة ${deletingApt.number} بنجاح`);
        setDeletingApt(null);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'فشل حذف الشقة');
      }
    } catch (e) {
      toast.error('حدث خطأ أثناء محاولة الحذف');
    } finally {
      setSubmittingDelete(false);
    }
  };

  const filteredApartments = apartments.filter(a => {
    const term = searchTerm.toLowerCase();
    const matchesNumber = a.number.toLowerCase().includes(term);
    const matchesFloor = a.floor && a.floor.toLowerCase().includes(term);
    const resident = (a.residents && a.residents[0]) || residents.find(r => r.apartmentId === a.id);
    const matchesResident = resident && resident.name.toLowerCase().includes(term);
    return matchesNumber || matchesFloor || matchesResident;
  });

  const occupiedCount = apartments.filter(a => a.status === 'OCCUPIED').length;
  const emptyCount = apartments.length - occupiedCount;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Building className="h-8 w-8 text-primary" />
            إدارة الشقق السكنية
          </h1>
          <p className="text-muted-foreground mt-1">عرض، إضافة، وتعديل وحذف الشقق وربطها بالسكان وقراءات العدادات.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-1.5">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button onClick={() => setIsAddOpen(true)} className="gap-2 bg-primary font-bold">
            <Plus className="h-4 w-4" />
            إضافة شقة جديدة
          </Button>
        </div>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-card border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">إجمالي الشقق</p>
              <h3 className="text-2xl font-black mt-1 text-foreground">{apartments.length}</h3>
            </div>
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
              <Building className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">الشقق المشغولة</p>
              <h3 className="text-2xl font-black mt-1 text-green-600">{occupiedCount}</h3>
            </div>
            <div className="p-2.5 bg-green-500/10 rounded-xl text-green-600">
              <User className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">الشقق الفارغة</p>
              <h3 className="text-2xl font-black mt-1 text-amber-600">{emptyCount}</h3>
            </div>
            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-600">
              <Layers className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="shadow-xs border">
        <CardHeader className="p-4 border-b">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="ابحث برقم الشقة، الطابق، أو اسم الساكن..." 
                className="pr-9 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Badge variant="outline" className="text-xs font-semibold py-1 px-2.5">
              عدد الشقق المعروضة: {filteredApartments.length}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-right font-bold w-[120px]">رقم الشقة</TableHead>
                  <TableHead className="text-right font-bold w-[100px]">الطابق</TableHead>
                  <TableHead className="text-right font-bold">الساكن المسجل</TableHead>
                  <TableHead className="text-right font-bold w-[110px]">حالة الإشغال</TableHead>
                  <TableHead className="text-right font-bold w-[130px]">الرمز السري للدخول</TableHead>
                  <TableHead className="text-right font-bold w-[110px]">عداد المياه</TableHead>
                  <TableHead className="text-center font-bold w-[340px]">الاستحقاقات وخيارات الإدارة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      جاري تحميل بيانات الشقق...
                    </TableCell>
                  </TableRow>
                ) : filteredApartments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                        <span className="font-semibold text-base">لا توجد شقق مطابقة لمعايير البحث</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredApartments.map((apartment) => {
                    const resident = (apartment.residents && apartment.residents.length > 0)
                      ? apartment.residents[0]
                      : residents.find(r => r.apartmentId === apartment.id);
                    
                    const isOccupied = apartment.status === 'OCCUPIED' || !!resident;

                    return (
                      <TableRow key={apartment.id} className="hover:bg-muted/30 transition-colors">
                        {/* Apartment Number */}
                        <TableCell className="font-bold">
                          <div className="flex items-center gap-2">
                            <span className="text-base text-primary font-black">شقة {apartment.number}</span>
                          </div>
                        </TableCell>

                        {/* Floor */}
                        <TableCell>
                          <Badge variant="outline" className="font-medium text-xs">
                            {apartment.floor || 'غير محدد'}
                          </Badge>
                        </TableCell>

                        {/* Resident */}
                        <TableCell>
                          {resident ? (
                            <div className="flex items-center gap-2">
                              <div className="p-1 rounded-full bg-primary/10 text-primary">
                                <User className="h-3.5 w-3.5" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-foreground text-sm">{resident.name}</span>
                                {resident.phone && (
                                  <span className="text-[11px] text-muted-foreground">{resident.phone}</span>
                                )}
                              </div>
                              <Badge 
                                variant="secondary" 
                                className={`text-[10px] mr-1 ${resident.type === 'OWNER' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}
                              >
                                {resident.type === 'OWNER' ? 'مالك' : 'مستأجر'}
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">لا يوجد ساكن مسجل</span>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge 
                            variant="secondary"
                            className={`text-xs font-bold ${
                              isOccupied 
                                ? 'bg-green-100 text-green-800 border-green-200' 
                                : 'bg-amber-100 text-amber-800 border-amber-200'
                            }`}
                          >
                            {isOccupied ? 'مشغولة' : 'فارغة'}
                          </Badge>
                        </TableCell>

                        {/* Access Code for Tenant Portal */}
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="font-mono text-xs bg-muted/40 font-bold px-2 py-0.5 text-foreground flex items-center gap-1">
                              <Key className="h-3 w-3 text-amber-600" />
                              <span>{apartment.accessCode || resident?.accessCode || '123456'}</span>
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-primary cursor-pointer"
                              onClick={() => copyTenantCredentials(apartment, resident)}
                              title="نسخ بيانات الدخول لإرسالها للساكن عبر واتساب"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>

                        {/* Water Meter */}
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs text-foreground">
                            <Droplets className="h-3.5 w-3.5 text-blue-500" />
                            <span className="font-mono font-bold">{apartment.waterMeterReading || '0'}</span>
                            <span className="text-muted-foreground text-[10px]">م³</span>
                          </div>
                        </TableCell>

                        {/* Actions (Add Debt, View Debts, Edit & Delete) */}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center flex-wrap gap-1.5">
                            {/* Add Debt Item Directly */}
                            <Button 
                              variant="default" 
                              size="sm" 
                              onClick={() => {
                                setSelectedDebtAptId(apartment.id);
                                setOpenDebtWithAdd(true);
                              }}
                              className="h-8 px-2.5 gap-1 text-xs bg-primary text-primary-foreground font-bold shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
                              title="إضافة استحقاق مالي جديد لهذه الشقة"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>إضافة استحقاق</span>
                            </Button>

                            {/* View Apartment Debt Schedule */}
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setSelectedDebtAptId(apartment.id);
                                setOpenDebtWithAdd(false);
                              }}
                              className="h-8 px-2 gap-1 text-xs hover:bg-muted font-medium transition-colors cursor-pointer"
                              title="عرض جدول ديون الشقة والإجراءات"
                            >
                              <FileText className="h-3.5 w-3.5 text-primary" />
                              <span>جدول الديون</span>
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openEditModal(apartment)}
                              className="h-8 px-2 gap-1 text-xs hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                              title="تعديل بيانات الشقة"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              <span>تعديل</span>
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setDeletingApt(apartment)}
                              className="h-8 px-2 gap-1 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                              title="حذف الشقة"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* =========================================================================================
          ADD APARTMENT MODAL
          ========================================================================================= */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[450px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Plus className="h-5 w-5 text-primary" />
              <span>إضافة شقة سكنية جديدة</span>
            </DialogTitle>
            <DialogDescription>
              أدخل رقم الشقة والطابق، مع إمكانية تعيين الساكن وقراءة عداد المياه فوراً.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit(onAddSubmit)} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-foreground">رقم الشقة *</label>
                <Input 
                  {...regAdd('number')} 
                  placeholder="مثال: 101 أو A2" 
                  required 
                  className="bg-background font-semibold"
                />
              </div>

              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-foreground">الطابق</label>
                <Input 
                  {...regAdd('floor')} 
                  placeholder="مثال: الأول أو الأرضي" 
                  className="bg-background"
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-bold text-foreground">تعيين الساكن (اختياري)</label>
              <select 
                {...regAdd('residentId')} 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">-- بدون ساكن حالياً (شقة فارغة) --</option>
                {residents.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.type === 'OWNER' ? 'مالك' : 'مستأجر'}) {r.phone ? `- ${r.phone}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-foreground">حالة الشقة</label>
                <select 
                  {...regAdd('status')} 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="EMPTY">فارغة</option>
                  <option value="OCCUPIED">مشغولة</option>
                </select>
              </div>

              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-foreground">الرمز السري للدخول</label>
                <Input 
                  defaultValue="123456"
                  {...regAdd('accessCode')} 
                  placeholder="مثال: 123456"
                  className="bg-background font-mono font-bold"
                />
              </div>

              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-foreground">عداد المياه (م³)</label>
                <Input 
                  type="number" 
                  step="0.01" 
                  defaultValue="0"
                  {...regAdd('waterMeterReading')} 
                  className="bg-background font-mono"
                />
              </div>
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" className="font-bold">
                حفظ الشقة
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* =========================================================================================
          EDIT APARTMENT MODAL (تعديل الشقة)
          ========================================================================================= */}
      <Dialog open={!!editingApt} onOpenChange={(open) => { if (!open) setEditingApt(null); }}>
        <DialogContent className="sm:max-w-[450px]" dir="rtl">
          {editingApt && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <Edit3 className="h-5 w-5 text-primary" />
                  <span>تعديل بيانات شقة {editingApt.number}</span>
                </DialogTitle>
                <DialogDescription>
                  تعديل معلومات الشقة، الطابق، الساكن، وحالة الإشغال.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <label className="text-xs font-bold text-foreground">رقم الشقة *</label>
                    <Input 
                      value={editNumber}
                      onChange={(e) => setEditNumber(e.target.value)}
                      required 
                      className="bg-background font-semibold"
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <label className="text-xs font-bold text-foreground">الطابق</label>
                    <Input 
                      value={editFloor}
                      onChange={(e) => setEditFloor(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <label className="text-xs font-bold text-foreground">الساكن المسجل بالشقة</label>
                  <select 
                    value={editResidentId}
                    onChange={(e) => setEditResidentId(e.target.value)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">-- بدون ساكن (شقة فارغة) --</option>
                    {residents.map(r => (
                      <option key={r.id} value={r.id.toString()}>
                        {r.name} ({r.type === 'OWNER' ? 'مالك' : 'مستأجر'}) {r.phone ? `- ${r.phone}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="grid gap-1.5">
                    <label className="text-xs font-bold text-foreground">حالة الشقة</label>
                    <select 
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="EMPTY">فارغة</option>
                      <option value="OCCUPIED">مشغولة</option>
                    </select>
                  </div>

                  <div className="grid gap-1.5">
                    <label className="text-xs font-bold text-foreground">الرمز السري للدخول</label>
                    <Input 
                      value={editAccessCode}
                      onChange={(e) => setEditAccessCode(e.target.value)}
                      placeholder="مثال: 123456"
                      className="bg-background font-mono font-bold"
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <label className="text-xs font-bold text-foreground">عداد المياه (م³)</label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={editWaterReading}
                      onChange={(e) => setEditWaterReading(e.target.value)}
                      className="bg-background font-mono"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-4 gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingApt(null)}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={submittingEdit} className="font-bold">
                  {submittingEdit ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* =========================================================================================
          DELETE CONFIRMATION MODAL (حذف الشقة)
          ========================================================================================= */}
      <Dialog open={!!deletingApt} onOpenChange={(open) => { if (!open) setDeletingApt(null); }}>
        <DialogContent className="sm:max-w-[420px]" dir="rtl">
          {deletingApt && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center gap-3 text-destructive">
                  <div className="p-2.5 rounded-full bg-destructive/10">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg">تأكيد حذف الشقة</DialogTitle>
                    <DialogDescription className="text-xs mt-0.5">
                      هذا الإجراء سيقوم بحذف الشقة وكافة ارتباطاتها.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-3 bg-muted/40 rounded-lg border text-sm space-y-1.5">
                <p>هل أنت متأكد من رغبتك في حذف <strong className="text-foreground">شقة {deletingApt.number}</strong>؟</p>
                <p className="text-xs text-muted-foreground">
                  سيتم فك ارتباط الساكن وحذف سجلات العدادات والديون الخاصة بهذه الشقة.
                </p>
              </div>

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setDeletingApt(null)}>
                  إلغاء
                </Button>
                <Button 
                  type="button" 
                  variant="destructive" 
                  disabled={submittingDelete} 
                  onClick={handleDeleteSubmit}
                  className="font-bold"
                >
                  {submittingDelete ? 'جاري الحذف...' : 'نعم، احذف الشقة'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* =========================================================================================
          APARTMENT DEBTS SCHEDULE & ENTITLEMENTS MODAL (كشف واستحقاقات وجدول ديون الشقة)
          ========================================================================================= */}
      <ApartmentDebtSheetModal 
        open={!!selectedDebtAptId}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDebtAptId(null);
            setOpenDebtWithAdd(false);
          }
        }}
        apartmentId={selectedDebtAptId}
        apartmentSummary={null}
        initialOpenAddForm={openDebtWithAdd}
        onRefresh={() => {
          fetchData();
        }}
      />
    </div>
  );
}
