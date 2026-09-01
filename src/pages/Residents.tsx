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
  User, 
  Edit3, 
  Trash2, 
  Building, 
  Coins, 
  Phone, 
  Calendar, 
  Users, 
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Wallet,
  ArrowDownLeft,
  FileText,
  CreditCard,
  Eye,
  Download,
  Paperclip
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ResidentDetailsModal } from '@/components/ResidentDetailsModal';

export default function Residents() {
  const { getToken } = useAuth();
  const [residents, setResidents] = useState<any[]>([]);
  const [apartments, setApartments] = useState<any[]>([]);
  const [credits, setCredits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Details & Statement Documents Modal for a Resident
  const [selectedDetailsResident, setSelectedDetailsResident] = useState<any | null>(null);

  // Create Resident Modal
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Add Debt / Entitlement Modal for a Resident
  const [debtResident, setDebtResident] = useState<any | null>(null);
  const [debtAmount, setDebtAmount] = useState('');
  const [debtSource, setDebtSource] = useState('PREVIOUS');
  const [debtNotes, setDebtNotes] = useState('');
  const [debtDueDate, setDebtDueDate] = useState('');
  const [submittingDebt, setSubmittingDebt] = useState(false);

  // Edit Resident Modal
  const [editingResident, setEditingResident] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editType, setEditType] = useState('TENANT');
  const [editApartmentId, setEditApartmentId] = useState('');
  const [editFamilyMembers, setEditFamilyMembers] = useState('1');
  const [editStartDate, setEditStartDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Delete Confirmation Modal
  const [deletingResident, setDeletingResident] = useState<any | null>(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  // Add Credit Modal for a Resident
  const [creditResident, setCreditResident] = useState<any | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditSource, setCreditSource] = useState('MANAGEMENT_REIMBURSEMENT');
  const [creditNotes, setCreditNotes] = useState('');
  const [creditDate, setCreditDate] = useState(new Date().toISOString().split('T')[0]);
  const [creditAddToCash, setCreditAddToCash] = useState(false);
  const [submittingCredit, setSubmittingCredit] = useState(false);

  // History/Credits View Modal
  const [viewingCreditsRes, setViewingCreditsRes] = useState<any | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const [resResidents, resApartments, resCredits] = await Promise.all([
        fetch('/api/residents', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/apartments', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/credits', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (resResidents.ok) setResidents(await resResidents.json());
      if (resApartments.ok) setApartments(await resApartments.json());
      if (resCredits.ok) setCredits(await resCredits.json());
    } catch (e) {
      toast.error('حدث خطأ أثناء تحميل بيانات السكان');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const { register: regAdd, handleSubmit: handleAddSubmit, reset: resetAdd } = useForm();

  // Create Resident Submit
  const onAddSubmit = async (data: any) => {
    try {
      const token = await getToken();
      const res = await fetch('/api/residents', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          type: data.type || 'TENANT',
          apartmentId: data.apartmentId ? parseInt(data.apartmentId) : null,
          familyMembers: data.familyMembers ? parseInt(data.familyMembers) : 1,
          startDate: data.startDate || null,
          notes: data.notes || null
        })
      });
      if (res.ok) {
        toast.success('تم تسجيل الساكن بنجاح');
        setIsAddOpen(false);
        resetAdd();
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'حدث خطأ أثناء إضافة الساكن');
      }
    } catch (e) {
      toast.error('حدث خطأ في الاتصال بالخادم');
    }
  };

  // Open Edit Modal
  const openEditModal = (resident: any) => {
    setEditingResident(resident);
    setEditName(resident.name);
    setEditPhone(resident.phone || '');
    setEditType(resident.type || 'TENANT');
    setEditApartmentId(resident.apartmentId ? resident.apartmentId.toString() : '');
    setEditFamilyMembers(resident.familyMembers ? resident.familyMembers.toString() : '1');
    setEditStartDate(resident.startDate ? new Date(resident.startDate).toISOString().split('T')[0] : '');
    setEditNotes(resident.notes || '');
  };

  // Submit Edit Resident
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResident) return;
    setSubmittingEdit(true);

    try {
      const token = await getToken();
      const res = await fetch(`/api/residents/${editingResident.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName,
          phone: editPhone,
          type: editType,
          apartmentId: editApartmentId ? parseInt(editApartmentId) : null,
          familyMembers: parseInt(editFamilyMembers) || 1,
          startDate: editStartDate || null,
          notes: editNotes
        })
      });

      if (res.ok) {
        toast.success('تم تحديث بيانات الساكن بنجاح');
        setEditingResident(null);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'فشل تحديث بيانات الساكن');
      }
    } catch (e) {
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Submit Delete Resident
  const handleDeleteSubmit = async () => {
    if (!deletingResident) return;
    setSubmittingDelete(true);

    try {
      const token = await getToken();
      const res = await fetch(`/api/residents/${deletingResident.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success(`تم حذف الساكن ${deletingResident.name} بنجاح`);
        setDeletingResident(null);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'فشل حذف الساكن');
      }
    } catch (e) {
      toast.error('حدث خطأ أثناء محاولة الحذف');
    } finally {
      setSubmittingDelete(false);
    }
  };

  // Open Add Debt Modal for Resident
  const openDebtModal = (resident: any) => {
    setDebtResident(resident);
    setDebtAmount('');
    setDebtSource('PREVIOUS');
    setDebtNotes(`استحقاق مالي للساكن ${resident.name}${resident.apartment?.number ? ` - شقة ${resident.apartment.number}` : ''}`);
    setDebtDueDate('');
  };

  // Submit Add Debt / Entitlement to Resident
  const handleDebtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtResident) return;

    const amountNum = parseFloat(debtAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('يرجى إدخال مبلغ استحقاق صحيح أكبر من الصفر');
      return;
    }

    setSubmittingDebt(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/debts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          residentId: debtResident.id,
          apartmentId: debtResident.apartmentId || null,
          amount: amountNum,
          originalAmount: amountNum,
          source: debtSource,
          notes: debtNotes,
          dueDate: debtDueDate || null
        })
      });

      if (res.ok) {
        toast.success(`تم قيد الاستحقاق المالي بقيمة ₪${amountNum.toFixed(2)} للساكن ${debtResident.name} بنجاح`);
        setDebtResident(null);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'فشل قيد الاستحقاق المالي');
      }
    } catch (e) {
      toast.error('حدث خطأ أثناء قيد الاستحقاق المالي');
    } finally {
      setSubmittingDebt(false);
    }
  };

  // Open Credit Modal
  const openCreditModal = (resident: any) => {
    setCreditResident(resident);
    setCreditAmount('');
    setCreditSource('MANAGEMENT_REIMBURSEMENT');
    setCreditNotes(`مستحقات للساكن / رصيد دائن - ${resident.name}`);
    setCreditDate(new Date().toISOString().split('T')[0]);
    setCreditAddToCash(false);
  };

  // Submit Add Credit to Resident
  const handleCreditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditResident) return;
    
    const amountNum = parseFloat(creditAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('يرجى إدخال مبلغ رصيد صحيح');
      return;
    }

    setSubmittingCredit(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          residentId: creditResident.id,
          apartmentId: creditResident.apartmentId || null,
          amount: amountNum,
          source: creditSource,
          notes: creditNotes,
          date: creditDate,
          addToCashFund: creditAddToCash
        })
      });

      if (res.ok) {
        toast.success(`تمت إضافة رصيد دائن بقيمة ₪${amountNum.toFixed(2)} للساكن ${creditResident.name} بنجاح`);
        setCreditResident(null);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'فشل إضافة الرصيد الدائن');
      }
    } catch (e) {
      toast.error('حدث خطأ أثناء تسجيل الرصيد الدائن');
    } finally {
      setSubmittingCredit(false);
    }
  };

  const filteredResidents = residents.filter(r => {
    const term = searchTerm.toLowerCase();
    const matchesName = r.name.toLowerCase().includes(term);
    const matchesPhone = r.phone && r.phone.toLowerCase().includes(term);
    const matchesApt = r.apartment && r.apartment.number.toLowerCase().includes(term);
    return matchesName || matchesPhone || matchesApt;
  });

  const totalCreditsSum = residents.reduce((acc, curr) => acc + (parseFloat(curr.creditBalance) || 0), 0);
  const ownersCount = residents.filter(r => r.type === 'OWNER').length;
  const tenantsCount = residents.filter(r => r.type === 'TENANT').length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <User className="h-8 w-8 text-primary" />
            إدارة السكان والمُلاك
          </h1>
          <p className="text-muted-foreground mt-1">
            عرض وتعديل وحذف بيانات السكان، إدارة الشقق المرتبطة، والأرصدة الدائنة المستحقة للسكان.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-1.5">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button onClick={() => setIsAddOpen(true)} className="gap-2 bg-primary font-bold">
            <Plus className="h-4 w-4" />
            تسجيل ساكن جديد
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-card border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">إجمالي السكان</p>
              <h3 className="text-2xl font-black mt-1 text-foreground">{residents.length}</h3>
            </div>
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
              <User className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">المُلاك</p>
              <h3 className="text-2xl font-black mt-1 text-blue-600">{ownersCount}</h3>
            </div>
            <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-600">
              <Building className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">المستأجرون</p>
              <h3 className="text-2xl font-black mt-1 text-purple-600">{tenantsCount}</h3>
            </div>
            <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-600">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-emerald-50/50 border border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-800 font-semibold">إجمالي الأرصدة الدائنة المتاحة</p>
              <h3 className="text-2xl font-black mt-1 text-emerald-700 font-mono">₪{totalCreditsSum.toFixed(2)}</h3>
            </div>
            <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-700">
              <Wallet className="h-6 w-6" />
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
                placeholder="ابحث باسم الساكن، رقم الهاتف، أو رقم الشقة..." 
                className="pr-9 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Badge variant="outline" className="text-xs font-semibold py-1 px-2.5">
              عدد السكان: {filteredResidents.length}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-right font-bold w-[200px]">اسم الساكن</TableHead>
                  <TableHead className="text-right font-bold w-[100px]">النوع</TableHead>
                  <TableHead className="text-right font-bold w-[130px]">الشقة المرتبطة</TableHead>
                  <TableHead className="text-right font-bold w-[130px]">رقم الهاتف</TableHead>
                  <TableHead className="text-right font-bold w-[150px]">الرصيد الدائن المتاح</TableHead>
                  <TableHead className="text-center font-bold min-w-[380px]">خيارات وإدارة الساكن</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      جاري تحميل بيانات السكان...
                    </TableCell>
                  </TableRow>
                ) : filteredResidents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                        <span className="font-semibold text-base">لا يوجد سكان مطابقين لمعايير البحث</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredResidents.map((resident) => {
                    const creditBal = parseFloat(resident.creditBalance || '0');
                    const hasCredit = creditBal > 0;
                    const docCount = Array.isArray(resident.statementDocuments) 
                      ? resident.statementDocuments.length 
                      : (resident.statementFileUrl ? 1 : 0);

                    return (
                      <TableRow key={resident.id} className="hover:bg-muted/30 transition-colors">
                        {/* Name */}
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="bg-primary/10 p-2 rounded-full text-primary">
                              <User className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-foreground text-sm">{resident.name}</span>
                              {resident.familyMembers > 1 && (
                                <span className="text-[11px] text-muted-foreground">
                                  {resident.familyMembers} أفراد أسرة
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Type */}
                        <TableCell>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs font-semibold ${
                              resident.type === 'OWNER' 
                                ? 'bg-blue-100 text-blue-800 border-blue-200' 
                                : 'bg-purple-100 text-purple-800 border-purple-200'
                            }`}
                          >
                            {resident.type === 'OWNER' ? 'مالك' : 'مستأجر'}
                          </Badge>
                        </TableCell>

                        {/* Apartment */}
                        <TableCell>
                          {resident.apartment ? (
                            <div className="flex items-center gap-1.5 font-bold text-primary">
                              <Building className="h-3.5 w-3.5" />
                              <span>شقة {resident.apartment.number}</span>
                              {resident.apartment.floor && (
                                <span className="text-xs text-muted-foreground font-normal">
                                  ({resident.apartment.floor})
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">بدون شقة</span>
                          )}
                        </TableCell>

                        {/* Phone */}
                        <TableCell>
                          {resident.phone ? (
                            <div className="flex items-center gap-1.5 text-xs text-foreground font-mono">
                              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{resident.phone}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        {/* Credit Balance */}
                        <TableCell>
                          {hasCredit ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100/80 text-emerald-800 border border-emerald-300 font-mono font-bold text-xs">
                              <Coins className="h-3.5 w-3.5 text-emerald-600" />
                              <span>₪{creditBal.toFixed(2)}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">0.00 ₪</span>
                          )}
                        </TableCell>

                        {/* Action Buttons: Organized neatly with Details, Add Entitlement, Add Credit, Edit, Delete */}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {/* 1. Details & Statement Documents Button */}
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setSelectedDetailsResident(resident)}
                              className="h-8 px-2.5 gap-1.5 text-xs bg-blue-50/80 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-900 font-bold transition-all cursor-pointer shadow-2xs"
                              title="عرض ملف الساكن وتفاصيل استحقاقاته ورفع ملفات Excel/Word/PDF"
                            >
                              <FileText className="h-3.5 w-3.5 text-blue-600" />
                              <span>التفاصيل</span>
                              {docCount > 0 && (
                                <span className="bg-blue-600 text-white text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold">
                                  {docCount}
                                </span>
                              )}
                            </Button>

                            {/* 2. Add Entitlement / Debt Button */}
                            <Button 
                              variant="default" 
                              size="sm" 
                              onClick={() => openDebtModal(resident)}
                              className="h-8 px-2.5 gap-1 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-bold transition-colors cursor-pointer shadow-2xs"
                              title="قيد استحقاق مالي جديد على الساكن"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>استحقاق</span>
                            </Button>

                            {/* 3. Add Credit Button */}
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openCreditModal(resident)}
                              className="h-8 px-2 gap-1 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer font-bold"
                              title="إضافة رصيد دائن للساكن"
                            >
                              <Coins className="h-3.5 w-3.5 text-emerald-600" />
                              <span>رصيد</span>
                            </Button>

                            {/* 4. Edit Button */}
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openEditModal(resident)}
                              className="h-8 px-2 gap-1 text-xs hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                              title="تعديل بيانات الساكن"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              <span>تعديل</span>
                            </Button>
                            
                            {/* 5. Delete Button */}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setDeletingResident(resident)}
                              className="h-8 px-2 gap-1 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                              title="حذف الساكن"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>حذف</span>
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
          ADD RESIDENT MODAL (تسجيل ساكن جديد)
          ========================================================================================= */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[480px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Plus className="h-5 w-5 text-primary" />
              <span>تسجيل ساكن جديد</span>
            </DialogTitle>
            <DialogDescription>
              أدخل بيانات الساكن أو المالك مع إمكانية ربطه بالشقة وتحديد عدد أفراد الأسرة.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit(onAddSubmit)} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-foreground">الاسم الكامل *</label>
                <Input 
                  {...regAdd('name')} 
                  placeholder="مثال: أحمد محمود" 
                  required 
                  className="bg-background font-semibold"
                />
              </div>

              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-foreground">رقم الهاتف</label>
                <Input 
                  {...regAdd('phone')} 
                  placeholder="059xxxxxxx" 
                  className="bg-background font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-foreground">صفة الساكن</label>
                <select 
                  {...regAdd('type')} 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="TENANT">مستأجر</option>
                  <option value="OWNER">مالك</option>
                </select>
              </div>

              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-foreground">الشقة السكنية</label>
                <select 
                  {...regAdd('apartmentId')} 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">-- بدون شقة حالياً --</option>
                  {apartments.map(apt => (
                    <option key={apt.id} value={apt.id}>
                      شقة {apt.number} {apt.floor ? `(${apt.floor})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-foreground">عدد أفراد الأسرة</label>
                <Input 
                  type="number" 
                  defaultValue={1}
                  {...regAdd('familyMembers')} 
                  className="bg-background"
                />
              </div>

              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-foreground">تاريخ بدء السكن</label>
                <Input 
                  type="date" 
                  {...regAdd('startDate')} 
                  className="bg-background"
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-bold text-foreground">ملاحظات إضافية</label>
              <Input 
                {...regAdd('notes')} 
                placeholder="أي ملاحظات خاصة بالساكن..." 
                className="bg-background"
              />
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" className="font-bold">
                حفظ الساكن
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* =========================================================================================
          EDIT RESIDENT MODAL (تعديل الساكن)
          ========================================================================================= */}
      <Dialog open={!!editingResident} onOpenChange={(open) => { if (!open) setEditingResident(null); }}>
        <DialogContent className="sm:max-w-[480px]" dir="rtl">
          {editingResident && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <Edit3 className="h-5 w-5 text-primary" />
                  <span>تعديل بيانات الساكن: {editingResident.name}</span>
                </DialogTitle>
                <DialogDescription>
                  تعديل الاسم، الهاتف، الشقة المرتبطة، والصفة.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <label className="text-xs font-bold text-foreground">الاسم الكامل *</label>
                    <Input 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required 
                      className="bg-background font-semibold"
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <label className="text-xs font-bold text-foreground">رقم الهاتف</label>
                    <Input 
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="bg-background font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <label className="text-xs font-bold text-foreground">صفة الساكن</label>
                    <select 
                      value={editType}
                      onChange={(e) => setEditType(e.target.value)}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="TENANT">مستأجر</option>
                      <option value="OWNER">مالك</option>
                    </select>
                  </div>

                  <div className="grid gap-1.5">
                    <label className="text-xs font-bold text-foreground">الشقة السكنية</label>
                    <select 
                      value={editApartmentId}
                      onChange={(e) => setEditApartmentId(e.target.value)}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">-- بدون شقة --</option>
                      {apartments.map(apt => (
                        <option key={apt.id} value={apt.id.toString()}>
                          شقة {apt.number} {apt.floor ? `(${apt.floor})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <label className="text-xs font-bold text-foreground">عدد أفراد الأسرة</label>
                    <Input 
                      type="number" 
                      value={editFamilyMembers}
                      onChange={(e) => setEditFamilyMembers(e.target.value)}
                      className="bg-background"
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <label className="text-xs font-bold text-foreground">تاريخ بدء السكن</label>
                    <Input 
                      type="date" 
                      value={editStartDate}
                      onChange={(e) => setEditStartDate(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <label className="text-xs font-bold text-foreground">ملاحظات</label>
                  <Input 
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="bg-background"
                  />
                </div>
              </div>

              <DialogFooter className="mt-4 gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingResident(null)}>
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
          ADD DEBT / ENTITLEMENT MODAL (إضافة استحقاق مالي للساكن)
          ========================================================================================= */}
      <Dialog open={!!debtResident} onOpenChange={(open) => { if (!open) setDebtResident(null); }}>
        <DialogContent className="sm:max-w-[480px]" dir="rtl">
          {debtResident && (
            <form onSubmit={handleDebtSubmit} className="space-y-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg text-primary">
                  <FileText className="h-5 w-5 text-primary" />
                  <span>إضافة استحقاق مالي للساكن: {debtResident.name}</span>
                </DialogTitle>
                <DialogDescription>
                  قيد استحقاق مالي أو دين جديد على الساكن {debtResident.apartment ? `(شقة ${debtResident.apartment.number})` : ''} يتم تسجيله في مصفوفة الديون وكشف الحساب.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <label className="text-xs font-bold text-foreground">المبلغ المستحق (₪) *</label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0.01"
                      placeholder="0.00" 
                      value={debtAmount} 
                      onChange={(e) => setDebtAmount(e.target.value)}
                      required 
                      className="bg-background font-mono font-bold text-base"
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <label className="text-xs font-bold text-foreground">نوع الاستحقاق *</label>
                    <select 
                      value={debtSource} 
                      onChange={(e) => setDebtSource(e.target.value)}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="PREVIOUS">استحقاق سابق / رصيد افتتاحي</option>
                      <option value="MONTHLY_SUBSCRIPTION">اشتراك شهري / خدمات</option>
                      <option value="WATER_DELIVERY">تعبئة واستهلاك مياه</option>
                      <option value="APARTMENT_RENT">إيجار شقة</option>
                      <option value="OTHER">أخرى / متنوع</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <label className="text-xs font-bold text-foreground">تاريخ الاستحقاق (اختياري)</label>
                  <Input 
                    type="date" 
                    value={debtDueDate} 
                    onChange={(e) => setDebtDueDate(e.target.value)}
                    className="bg-background"
                  />
                </div>

                <div className="grid gap-1.5">
                  <label className="text-xs font-bold text-foreground">البيان / تفاصيل الاستحقاق</label>
                  <Input 
                    value={debtNotes} 
                    onChange={(e) => setDebtNotes(e.target.value)}
                    placeholder="مثال: اشتراك شهر 8 أو استحقاق سابق"
                    className="bg-background"
                  />
                </div>

                {debtResident.creditBalance && parseFloat(debtResident.creditBalance) > 0 && (
                  <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                    <Coins className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>
                      تنبيه: يتوفر لدى الساكن <strong>رصيد دائن ₪{parseFloat(debtResident.creditBalance).toFixed(2)}</strong> يمكنك استخدامه للسداد من كشف الحساب.
                    </span>
                  </div>
                )}
              </div>

              <DialogFooter className="mt-4 gap-2">
                <Button type="button" variant="outline" onClick={() => setDebtResident(null)}>
                  إلغاء
                </Button>
                <Button 
                  type="submit" 
                  disabled={submittingDebt} 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                >
                  {submittingDebt ? 'جاري القيد...' : 'تأكيد قيد الاستحقاق'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* =========================================================================================
          ADD CREDIT MODAL (إضافة رصيد دائن للساكن)
          ========================================================================================= */}
      <Dialog open={!!creditResident} onOpenChange={(open) => { if (!open) setCreditResident(null); }}>
        <DialogContent className="sm:max-w-[480px]" dir="rtl">
          {creditResident && (
            <form onSubmit={handleCreditSubmit} className="space-y-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg text-emerald-700">
                  <Coins className="h-5 w-5 text-emerald-600" />
                  <span>إضافة رصيد دائن للساكن: {creditResident.name}</span>
                </DialogTitle>
                <DialogDescription>
                  تسجيل مبلغ مستحق للساكن على الإدارة أو دفعة مسبقة يتم الخصم منها عند وجود استحقاقات كالمياه والاشتراكات.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 mt-2">
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-900 space-y-1">
                  <p className="font-bold">💡 كيف يعمل الرصيد الدائن؟</p>
                  <p>
                    سيتم حفظ هذا المبلغ كرصيد دائن في حساب الساكن/الشقة، وعند إصدار أي استحقاق لاحق (تعبئة مياه، صيانة، إيجار)، سيطلب النظام تأكيد خصم المبلغ مباشرة من هذا الرصيد.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <label className="text-xs font-bold text-foreground">المبلغ المضاف للرصيد (₪) *</label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(e.target.value)}
                      placeholder="0.00 ₪"
                      required 
                      className="bg-background font-mono font-bold text-base"
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <label className="text-xs font-bold text-foreground">تاريخ التسجيل</label>
                    <Input 
                      type="date" 
                      value={creditDate}
                      onChange={(e) => setCreditDate(e.target.value)}
                      required 
                      className="bg-background"
                    />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <label className="text-xs font-bold text-foreground">سبب / مصدر الرصيد الدائن</label>
                  <select 
                    value={creditSource}
                    onChange={(e) => setCreditSource(e.target.value)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="MANAGEMENT_REIMBURSEMENT">مبلغ مستحق للساكن على الإدارة (تسوية/صيانة)</option>
                    <option value="ADVANCE_PAYMENT">دفعة مسبقة نقدية من الساكن</option>
                    <option value="OVERPAYMENT">فائض من دفعة سابقة</option>
                    <option value="DEPOSIT">تأمين مسترد</option>
                    <option value="OTHER">أخرى</option>
                  </select>
                </div>

                <div className="grid gap-1.5">
                  <label className="text-xs font-bold text-foreground">البيان / تفاصيل العملية</label>
                  <Input 
                    value={creditNotes}
                    onChange={(e) => setCreditNotes(e.target.value)}
                    placeholder="مثال: تعويض الساكن عن إصلاح مضخة المياه من حسابه الخاص"
                    required
                    className="bg-background"
                  />
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-lg border bg-muted/30">
                  <input 
                    type="checkbox"
                    id="addToCashFund"
                    checked={creditAddToCash}
                    onChange={(e) => setCreditAddToCash(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="addToCashFund" className="text-xs text-foreground cursor-pointer">
                    تسجيل المبلغ كإيداع نقدي مقبوض في صندوق العمارة (في حال دفع الساكن كاش مقدماً)
                  </label>
                </div>
              </div>

              <DialogFooter className="mt-4 gap-2">
                <Button type="button" variant="outline" onClick={() => setCreditResident(null)}>
                  إلغاء
                </Button>
                <Button 
                  type="submit" 
                  disabled={submittingCredit} 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {submittingCredit ? 'جاري الإضافة...' : 'تأكيد إضافة الرصيد'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* =========================================================================================
          DELETE CONFIRMATION MODAL (حذف الساكن)
          ========================================================================================= */}
      <Dialog open={!!deletingResident} onOpenChange={(open) => { if (!open) setDeletingResident(null); }}>
        <DialogContent className="sm:max-w-[420px]" dir="rtl">
          {deletingResident && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center gap-3 text-destructive">
                  <div className="p-2.5 rounded-full bg-destructive/10">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg">تأكيد حذف الساكن</DialogTitle>
                    <DialogDescription className="text-xs mt-0.5">
                      سيتم حذف الساكن وفك ارتباطه بالشقة السكنية.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-3 bg-muted/40 rounded-lg border text-sm space-y-1.5">
                <p>هل أنت متأكد من رغبتك في حذف <strong className="text-foreground">{deletingResident.name}</strong>؟</p>
                <p className="text-xs text-muted-foreground">
                  سيتم الاحتفاظ بالديون السابقة وربطها بالشقة دون حذف العمليات المحاسبية.
                </p>
              </div>

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setDeletingResident(null)}>
                  إلغاء
                </Button>
                <Button 
                  type="button" 
                  variant="destructive" 
                  disabled={submittingDelete} 
                  onClick={handleDeleteSubmit}
                  className="font-bold"
                >
                  {submittingDelete ? 'جاري الحذف...' : 'نعم، احذف الساكن'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* =========================================================================================
          RESIDENT DETAILS & STATEMENT DOCUMENTS MODAL (تفاصيل ومستندات الساكن)
          ========================================================================================= */}
      <ResidentDetailsModal
        isOpen={!!selectedDetailsResident}
        resident={selectedDetailsResident}
        isAdmin={true}
        onClose={() => setSelectedDetailsResident(null)}
        onResidentUpdated={(updated) => {
          setResidents(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r));
          setSelectedDetailsResident(updated);
        }}
      />
    </div>
  );
}
