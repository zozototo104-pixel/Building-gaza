import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  Zap, 
  Building2, 
  Home, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Edit3, 
  Receipt, 
  ArrowDownRight, 
  ArrowUpRight, 
  Filter, 
  Calendar, 
  Sparkles, 
  Info,
  Layers,
  History,
  Tag,
  AlertCircle,
  Coins,
  Printer,
  FileCheck,
  CreditCard,
  UserCheck,
  Send
} from 'lucide-react';
import { toast } from 'sonner';
import { formatPaymentMethod } from '@/lib/utils';

const getArabicDayName = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  return days[d.getDay()] || '';
};

export default function Services() {
  const { getToken } = useAuth();
  const [servicesData, setServicesData] = useState<any[]>([]);
  const [transactionsData, setTransactionsData] = useState<any[]>([]);
  const [subscriptionsData, setSubscriptionsData] = useState<any[]>([]);
  const [apartmentsData, setApartmentsData] = useState<any[]>([]);
  const [creditsData, setCreditsData] = useState<any[]>([]);
  const [buildingInfo, setBuildingInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('subscriptions');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterScope, setFilterScope] = useState('ALL');
  const [filterServiceId, setFilterServiceId] = useState('ALL');
  const [filterMonth, setFilterMonth] = useState('ALL');
  const [filterSubStatus, setFilterSubStatus] = useState('ALL');

  // Dialog States
  const [isNewServiceOpen, setIsNewServiceOpen] = useState(false);
  const [isNewTxOpen, setIsNewTxOpen] = useState(false);
  const [isNewSubOpen, setIsNewSubOpen] = useState(false);
  const [isBatchSubOpen, setIsBatchSubOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [editingService, setEditingService] = useState<any | null>(null);

  // Form State: Define Service
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    scope: 'BUILDING', // BUILDING, APARTMENT, GENERAL
    type: 'FIXED',
    frequency: 'MONTHLY',
    amount: '',
    notes: '',
    isActive: true
  });

  // Form State: Service Transaction
  const [txForm, setTxForm] = useState({
    serviceId: '',
    customServiceName: '',
    scope: 'BUILDING', // BUILDING, APARTMENT
    apartmentId: '',
    cost: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    isPaid: false,
    paymentMethod: 'CASH',
    deductFromCredit: false
  });

  // Form State: Subscription Collection (IMG_0600)
  const currentMonthStr = new Date().toISOString().slice(0, 7); // e.g. 2026-08
  const [subForm, setSubForm] = useState({
    apartmentId: '',
    month: currentMonthStr,
    dueAmount: '50',
    paidAmount: '50',
    paymentMethod: 'نقدي',
    collectedBy: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
    deductFromCredit: false
  });

  // Batch Monthly Generation Form
  const [batchForm, setBatchForm] = useState({
    month: currentMonthStr,
    dueAmount: '50',
    notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [resServices, resTxs, resSubs, resApts, resCredits, resBuilding] = await Promise.all([
        fetch('/api/services', { headers }),
        fetch('/api/service-transactions', { headers }),
        fetch('/api/subscriptions', { headers }),
        fetch('/api/apartments', { headers }),
        fetch('/api/credits', { headers }),
        fetch('/api/building', { headers })
      ]);

      if (resServices.ok) setServicesData(await resServices.json());
      if (resTxs.ok) setTransactionsData(await resTxs.json());
      if (resSubs.ok) setSubscriptionsData(await resSubs.json());
      if (resApts.ok) setApartmentsData(await resApts.json());
      if (resCredits.ok) setCreditsData(await resCredits.json());
      if (resBuilding.ok) setBuildingInfo(await resBuilding.json());
    } catch (e) {
      console.error(e);
      toast.error('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Save Service Definition
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.name.trim()) {
      toast.error('يرجى إدخال اسم الخدمة');
      return;
    }

    try {
      const token = await getToken();
      const url = editingService ? `/api/services/${editingService.id}` : '/api/services';
      const method = editingService ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...serviceForm,
          amount: parseFloat(serviceForm.amount) || 0
        })
      });

      if (res.ok) {
        toast.success(editingService ? 'تم تعديل الخدمة بنجاح' : 'تم حفظ تعريف الخدمة بنجاح');
        setIsNewServiceOpen(false);
        setEditingService(null);
        setServiceForm({
          name: '',
          description: '',
          scope: 'BUILDING',
          type: 'FIXED',
          frequency: 'MONTHLY',
          amount: '',
          notes: '',
          isActive: true
        });
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'حدث خطأ أثناء الحفظ');
      }
    } catch (err) {
      toast.error('حدث خطأ في الاتصال بالخادم');
    }
  };

  // Open Edit Service Modal
  const handleEditServiceClick = (service: any) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      description: service.description || '',
      scope: service.scope || 'BUILDING',
      type: service.type || 'FIXED',
      frequency: service.frequency || 'MONTHLY',
      amount: service.amount || '',
      notes: service.notes || '',
      isActive: service.isActive !== false
    });
    setIsNewServiceOpen(true);
  };

  // Delete Service Definition
  const handleDeleteService = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الخدمة من الدليل؟')) return;
    try {
      const token = await getToken();
      const res = await fetch(`/api/services/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('تم حذف الخدمة بنجاح');
        fetchData();
      } else {
        toast.error('تعذر حذف الخدمة');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  // Open New Transaction Dialog
  const handleOpenNewTransaction = (preSelectedServiceId?: number) => {
    const selectedSrv = servicesData.find(s => s.id === preSelectedServiceId) || servicesData[0];
    
    setTxForm({
      serviceId: selectedSrv ? selectedSrv.id.toString() : '',
      customServiceName: selectedSrv ? selectedSrv.name : '',
      scope: selectedSrv?.scope === 'APARTMENT' ? 'APARTMENT' : 'BUILDING',
      apartmentId: '',
      cost: selectedSrv && parseFloat(selectedSrv.amount) > 0 ? selectedSrv.amount : '0',
      date: new Date().toISOString().split('T')[0],
      notes: selectedSrv?.description ? `${selectedSrv.description}` : '',
      isPaid: false,
      paymentMethod: 'CASH',
      deductFromCredit: false
    });
    setIsNewTxOpen(true);
  };

  // Handle Save Transaction Submit
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.serviceId && !txForm.customServiceName.trim()) {
      toast.error('يرجى اختيار الخدمة المسجلة أو تحديد اسمها');
      return;
    }
    if (txForm.scope === 'APARTMENT' && !txForm.apartmentId) {
      toast.error('يرجى اختيار الشقة المستفيدة من الخدمة');
      return;
    }

    try {
      const token = await getToken();
      const dayName = getArabicDayName(txForm.date);

      const res = await fetch('/api/service-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...txForm,
          dayName,
          cost: parseFloat(txForm.cost) || 0
        })
      });

      if (res.ok) {
        toast.success(
          txForm.scope === 'BUILDING'
            ? 'تم حفظ المعاملة وخصم تكلفتها تلقائيًا من رصيد الصندوق'
            : 'تم حفظ معاملة خدمة الشقة بنجاح'
        );
        setIsNewTxOpen(false);
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'حدث خطأ أثناء حفظ المعاملة');
      }
    } catch (err) {
      toast.error('حدث خطأ في الاتصال بالخادم');
    }
  };

  // Delete Transaction
  const handleDeleteTransaction = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المعاملة؟ سيتم التراجع عن أي أثر مالي مرتبط بها.')) return;
    try {
      const token = await getToken();
      const res = await fetch(`/api/service-transactions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('تم حذف المعاملة وتحديث القيود المالية بنجاح');
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'تعذر حذف المعاملة');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  // ==========================================
  // SUBSCRIPTION COLLECTION HANDLERS (IMG_0600)
  // ==========================================

  // Open New Subscription Dialog
  const handleOpenNewSubscription = (apartmentId?: number, dueAmount?: string) => {
    setSubForm({
      apartmentId: apartmentId ? apartmentId.toString() : (apartmentsData[0]?.id?.toString() || ''),
      month: currentMonthStr,
      dueAmount: dueAmount || '50',
      paidAmount: dueAmount || '50',
      paymentMethod: 'نقدي',
      collectedBy: '',
      notes: '',
      date: new Date().toISOString().split('T')[0],
      deductFromCredit: false
    });
    setIsNewSubOpen(true);
  };

  // Handle Save Subscription Collection (Matching IMG_0600 button "حفظ وحفظ الإيصال")
  const handleSaveSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subForm.apartmentId) {
      toast.error('يرجى اختيار الشقة المرتبطة');
      return;
    }

    try {
      const token = await getToken();
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...subForm,
          dueAmount: parseFloat(subForm.dueAmount) || 0,
          paidAmount: parseFloat(subForm.paidAmount) || 0
        })
      });

      if (res.ok) {
        const createdSub = await res.json();
        toast.success('تم تسجيل تحصيل الاشتراك وتوثيق الإيصال بنجاح');
        setIsNewSubOpen(false);
        setSelectedReceipt(createdSub); // Open Receipt modal automatically
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'حدث خطأ أثناء حفظ الاشتراك');
      }
    } catch (err) {
      toast.error('حدث خطأ في الاتصال بالخادم');
    }
  };

  // Batch Generate Monthly Subscriptions
  const handleGenerateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const res = await fetch('/api/subscriptions/generate-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(batchForm)
      });

      if (res.ok) {
        const result = await res.json();
        toast.success(result.message || 'تم توليد الاشتراكات بنجاح');
        setIsBatchSubOpen(false);
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'حدث خطأ أثناء توليد الاشتراكات');
      }
    } catch (err) {
      toast.error('حدث خطأ في الاتصال بالخادم');
    }
  };

  // Delete Subscription
  const handleDeleteSubscription = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف سجل هذا الاشتراك؟ سيتم التراجع عن سند القبض والذمة المرتبطة به.')) return;
    try {
      const token = await getToken();
      const res = await fetch(`/api/subscriptions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('تم حذف سجل الاشتراك بنجاح');
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'تعذر حذف سجل الاشتراك');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  // ------------------------------------------
  // STATS & CALCULATIONS
  // ------------------------------------------
  const totalSubDues = subscriptionsData.reduce((sum, s) => sum + (parseFloat(s.dueAmount) || 0), 0);
  const totalSubPaid = subscriptionsData.reduce((sum, s) => sum + (parseFloat(s.paidAmount) || 0), 0);
  const totalSubRemaining = Math.max(0, totalSubDues - totalSubPaid);
  const collectionRate = totalSubDues > 0 ? Math.round((totalSubPaid / totalSubDues) * 100) : 100;

  const totalBuildingExpenses = transactionsData
    .filter(t => t.scope === 'BUILDING')
    .reduce((sum, t) => sum + (parseFloat(t.cost) || 0), 0);

  // Available unique months in subscriptions
  const uniqueMonths = Array.from(new Set(subscriptionsData.map(s => s.month))).filter(Boolean);

  // Filtered Subscriptions
  const filteredSubscriptions = subscriptionsData.filter(s => {
    const aptNumber = s.apartment?.number?.toString() || '';
    const resName = s.apartment?.residents?.[0]?.name?.toLowerCase() || '';
    const collector = s.collectedBy?.toLowerCase() || '';
    const notes = s.notes?.toLowerCase() || '';
    const q = searchTerm.toLowerCase();

    const matchesSearch = 
      aptNumber.includes(q) ||
      resName.includes(q) ||
      collector.includes(q) ||
      notes.includes(q) ||
      s.month?.includes(q) ||
      s.receiptNumber?.toLowerCase().includes(q);

    const matchesMonth = filterMonth === 'ALL' || s.month === filterMonth;
    const matchesStatus = filterSubStatus === 'ALL' || s.status === filterSubStatus;

    return matchesSearch && matchesMonth && matchesStatus;
  });

  // Filtered Transactions
  const filteredTransactions = transactionsData.filter(t => {
    const matchesSearch = 
      t.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.apartment?.number?.toString().includes(searchTerm) ||
      t.apartment?.residents?.[0]?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesScope = filterScope === 'ALL' || t.scope === filterScope;
    const matchesService = filterServiceId === 'ALL' || t.serviceId?.toString() === filterServiceId;

    return matchesSearch && matchesScope && matchesService;
  });

  // Filtered Services
  const filteredServices = servicesData.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Selected apartment available credit
  const selectedAptCredits = creditsData.filter(
    c => c.apartmentId === parseInt(subForm.apartmentId) && parseFloat(c.remainingAmount) > 0
  );
  const totalAvailableCreditForSub = selectedAptCredits.reduce((sum, c) => sum + parseFloat(c.remainingAmount), 0);

  return (
    <div className="space-y-6" dir="rtl">
      {/* ============================================================ */}
      {/* HEADER SECTION */}
      {/* ============================================================ */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-2xl border shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl border border-emerald-500/20">
              <Coins className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">الاشتراكات والخدمات</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                تطبيق الاشتراكات الشهرية على السكان وتسجيل التحصيل ومعاملات خدمات البناية
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Primary Action 1: Register New Subscription Collection (Matches IMG_0600) */}
          <Button 
            id="btn-new-subscription-collection"
            onClick={() => handleOpenNewSubscription()}
            className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm font-bold px-5 h-11 rounded-xl"
          >
            <Plus className="h-5 w-5" />
            تسجيل تحصيل اشتراك جديد
          </Button>

          {/* Action 2: Batch Generate Monthly Subscriptions */}
          <Button 
            id="btn-batch-generate-sub"
            variant="outline"
            onClick={() => setIsBatchSubOpen(true)}
            className="flex-1 md:flex-none gap-2 h-11 rounded-xl border-dashed"
          >
            <Sparkles className="h-4 w-4 text-emerald-600" />
            توليد استحقاقات الشهر
          </Button>

          {/* Action 3: New Service Transaction */}
          <Button 
            id="btn-new-service-tx"
            variant="outline"
            onClick={() => handleOpenNewTransaction()}
            className="flex-1 md:flex-none gap-2 h-11 rounded-xl"
          >
            <Zap className="h-4 w-4 text-orange-600" />
            معاملة خدمة جديدة
          </Button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* KPI METRIC CARDS */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Dues */}
        <Card className="bg-card hover:shadow-md transition-shadow border-emerald-100 dark:border-emerald-950/40">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">إجمالي استحقاق الاشتراكات</p>
              <p className="text-2xl font-bold text-foreground">₪{totalSubDues.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{subscriptionsData.length} سجل اشتراك مسجل</p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
              <Coins className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Collected in Cash Fund */}
        <Card className="bg-card hover:shadow-md transition-shadow border-emerald-200 dark:border-emerald-900/40">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">المحصل فعلياً بالصندوق</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">₪{totalSubPaid.toLocaleString()}</p>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 font-medium">
                نسبة التحصيل: {collectionRate}%
              </p>
            </div>
            <div className="p-3 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-xl">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Unpaid / Arrears */}
        <Card className="bg-card hover:shadow-md transition-shadow border-amber-100 dark:border-amber-950/40">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">المتبقي والذمم المستحقة</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">₪{totalSubRemaining.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">اشتراكات بانتظار السداد</p>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Services & Maintenance Expenses */}
        <Card className="bg-card hover:shadow-md transition-shadow border-orange-100 dark:border-orange-950/40">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">مصروفات خدمات المبنى</p>
              <p className="text-2xl font-bold text-orange-600">₪{totalBuildingExpenses.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{transactionsData.length} معاملة صيانة وخدمة</p>
            </div>
            <div className="p-3 bg-orange-500/10 text-orange-600 rounded-xl">
              <Zap className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================================ */}
      {/* TABS CONTAINER */}
      {/* ============================================================ */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/40 p-1.5 rounded-xl border">
          <TabsList className="grid grid-cols-3 w-full sm:w-[540px] h-10">
            <TabsTrigger value="subscriptions" className="gap-2 font-medium">
              <Coins className="h-4 w-4" />
              الاشتراكات الشهرية ({subscriptionsData.length})
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-2 font-medium">
              <Receipt className="h-4 w-4" />
              معاملات الخدمات ({transactionsData.length})
            </TabsTrigger>
            <TabsTrigger value="catalog" className="gap-2 font-medium">
              <Layers className="h-4 w-4" />
              دليل الخدمات ({servicesData.length})
            </TabsTrigger>
          </TabsList>

          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث..."
                className="pr-9 h-9 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {activeTab === 'subscriptions' && (
              <>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="ALL">كافة الشهور</option>
                  {uniqueMonths.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>

                <select
                  value={filterSubStatus}
                  onChange={(e) => setFilterSubStatus(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="ALL">كافة الحالات</option>
                  <option value="PAID">مسددة بالكامل</option>
                  <option value="PARTIAL">تحصيل جزئي</option>
                  <option value="UNPAID">غير مسددة</option>
                </select>
              </>
            )}

            {activeTab === 'transactions' && (
              <select
                value={filterScope}
                onChange={(e) => setFilterScope(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="ALL">كافة النطاقات</option>
                <option value="BUILDING">للمبنى فقط</option>
                <option value="APARTMENT">للشقق فقط</option>
              </select>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* TAB 1: MONTHLY SUBSCRIPTIONS LOG (الاشتراكات الشهرية) */}
        {/* ============================================================ */}
        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <CardTitle className="text-lg font-bold">سجل تحصيل الاشتراكات الشهرية</CardTitle>
                  <CardDescription>
                    إدارة مبالغ الاشتراكات الشهرية المطبقة على السكان ومتابعة السداد والإيصالات
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleOpenNewSubscription()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-semibold"
                  >
                    <Plus className="h-4 w-4" />
                    تسجيل تحصيل جديد
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="text-right">الشقة والساكن</TableHead>
                      <TableHead className="text-right">شهر الاشتراك</TableHead>
                      <TableHead className="text-right">المستحق</TableHead>
                      <TableHead className="text-right">المدفوع الفعلي</TableHead>
                      <TableHead className="text-right">طريقة الدفع</TableHead>
                      <TableHead className="text-right">المستلم / التوقيع</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-center">الإيصال</TableHead>
                      <TableHead className="text-center w-[70px]">إجراء</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                          جاري تحميل سجل الاشتراكات...
                        </TableCell>
                      </TableRow>
                    ) : filteredSubscriptions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-12">
                          <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                            <Coins className="h-10 w-10 text-muted-foreground/50" />
                            <p className="font-medium text-base">لا توجد اشتراكات مسجلة تطابق خيارات البحث</p>
                            <Button 
                              size="sm" 
                              onClick={() => handleOpenNewSubscription()}
                              className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                            >
                              <Plus className="h-4 w-4" />
                              تسجيل تحصيل اشتراك جديد
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSubscriptions.map((sub) => {
                        const aptNumber = sub.apartment?.number || sub.apartmentId;
                        const resName = sub.apartment?.residents?.[0]?.name;
                        const isPaid = sub.status === 'PAID';
                        const isPartial = sub.status === 'PARTIAL';

                        return (
                          <TableRow key={sub.id} className="hover:bg-muted/30 transition-colors">
                            {/* Apartment & Resident */}
                            <TableCell className="font-semibold">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-600">
                                  <Home className="h-4 w-4" />
                                </div>
                                <div>
                                  <div className="font-bold text-foreground">شقة {aptNumber}</div>
                                  {resName && <div className="text-xs text-muted-foreground font-normal">{resName}</div>}
                                </div>
                              </div>
                            </TableCell>

                            {/* Subscription Month */}
                            <TableCell>
                              <Badge variant="outline" className="font-mono bg-muted/40 text-xs px-2.5 py-0.5">
                                <Calendar className="h-3 w-3 ml-1 text-primary" />
                                {sub.month}
                              </Badge>
                            </TableCell>

                            {/* Due Amount */}
                            <TableCell>
                              <span className="font-bold text-sm text-foreground">
                                ₪{parseFloat(sub.dueAmount).toFixed(2)}
                              </span>
                            </TableCell>

                            {/* Paid Amount */}
                            <TableCell>
                              <span className={`font-bold text-sm ${parseFloat(sub.paidAmount) > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                                ₪{parseFloat(sub.paidAmount).toFixed(2)}
                              </span>
                            </TableCell>

                            {/* Payment Method */}
                            <TableCell className="text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-md">
                                <CreditCard className="h-3 w-3" />
                                {formatPaymentMethod(sub.paymentMethod)}
                              </span>
                            </TableCell>

                            {/* Collected By */}
                            <TableCell className="text-xs text-foreground font-medium">
                              {sub.collectedBy ? (
                                <span className="inline-flex items-center gap-1">
                                  <UserCheck className="h-3 w-3 text-muted-foreground" />
                                  {sub.collectedBy}
                                </span>
                              ) : (
                                <span className="text-muted-foreground italic">—</span>
                              )}
                            </TableCell>

                            {/* Status */}
                            <TableCell>
                              {isPaid ? (
                                <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1 text-[11px]">
                                  <CheckCircle2 className="h-3 w-3" />
                                  مسدد بالكامل
                                </Badge>
                              ) : isPartial ? (
                                <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 gap-1 text-[11px]">
                                  <Clock className="h-3 w-3" />
                                  تحصيل جزئي
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200 text-[11px]">
                                  غير مسدد
                                </Badge>
                              )}
                            </TableCell>

                            {/* Receipt Voucher Button */}
                            <TableCell className="text-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedReceipt(sub)}
                                className="h-8 text-xs gap-1 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              >
                                <FileCheck className="h-3.5 w-3.5" />
                                الإيصال
                              </Button>
                            </TableCell>

                            {/* Delete */}
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteSubscription(sub.id)}
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                title="حذف السجل"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB 2: SERVICE TRANSACTIONS (سجل المعاملات والتنفيذ) */}
        {/* ============================================================ */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg font-bold">سجل معاملات الخدمات المنفذة</CardTitle>
                  <CardDescription>
                    المعاملات المسجلة وفق الخدمات المعتمدة، مع بيان الأثر المالي على الصندوق والذمم
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleOpenNewTransaction()}
                  className="bg-orange-600 hover:bg-orange-700 text-white gap-1.5 font-semibold"
                >
                  <Plus className="h-4 w-4" />
                  معاملة خدمة جديدة
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="text-right">الخدمة المسجلة</TableHead>
                      <TableHead className="text-right">النطاق / المستفيد</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">التكلفة</TableHead>
                      <TableHead className="text-right">الأثر المالي</TableHead>
                      <TableHead className="text-right">البيان والملاحظات</TableHead>
                      <TableHead className="text-center w-[70px]">إجراء</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                            <Receipt className="h-10 w-10 text-muted-foreground/50" />
                            <p className="font-medium text-base">لا توجد معاملات مسجلة</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((tx) => {
                        const isBuilding = tx.scope === 'BUILDING';
                        const aptNumber = tx.apartment?.number;
                        const residentName = tx.apartment?.residents?.[0]?.name;

                        return (
                          <TableRow key={tx.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="font-semibold">
                              <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-full ${isBuilding ? 'bg-orange-500/10 text-orange-600' : 'bg-indigo-500/10 text-indigo-600'}`}>
                                  <Zap className="h-3.5 w-3.5" />
                                </div>
                                <span>{tx.serviceName}</span>
                              </div>
                            </TableCell>

                            <TableCell>
                              {isBuilding ? (
                                <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 gap-1 border-purple-200">
                                  <Building2 className="h-3 w-3" />
                                  المبنى
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 gap-1 border-indigo-200">
                                  <Home className="h-3 w-3" />
                                  شقة {aptNumber || tx.apartmentId} {residentName ? `(${residentName})` : ''}
                                </Badge>
                              )}
                            </TableCell>

                            <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                              <div>{new Date(tx.date).toLocaleDateString('ar-EG')}</div>
                              {tx.dayName && <div className="text-[10px] text-muted-foreground/75">{tx.dayName}</div>}
                            </TableCell>

                            <TableCell>
                              <span className="font-bold text-base text-foreground">
                                ₪{parseFloat(tx.cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            </TableCell>

                            <TableCell>
                              {isBuilding ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200/60 dark:bg-red-950/30 dark:text-red-300">
                                  <ArrowDownRight className="h-3 w-3" />
                                  مصروف خصم من الصندوق
                                </span>
                              ) : tx.isPaid ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                                  <CheckCircle2 className="h-3 w-3" />
                                  مسددة بالكامل
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-300">
                                  <Clock className="h-3 w-3" />
                                  ذمة مستحقة على الشقة
                                </span>
                              )}
                            </TableCell>

                            <TableCell className="text-sm text-muted-foreground max-w-[220px] truncate" title={tx.notes}>
                              {tx.notes || '—'}
                            </TableCell>

                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteTransaction(tx.id)}
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                title="حذف المعاملة"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB 3: SERVICES CATALOG (دليل الخدمات) */}
        {/* ============================================================ */}
        <TabsContent value="catalog" className="space-y-4">
          <div className="flex justify-between items-center bg-card p-4 rounded-xl border">
            <div>
              <h3 className="font-bold text-base">دليل الخدمات المعرفة</h3>
              <p className="text-xs text-muted-foreground">
                تعريف بنود الخدمات الدورية أو العامة لتسجيل معاملات التنفيذ وفقها
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingService(null);
                setServiceForm({
                  name: '',
                  description: '',
                  scope: 'BUILDING',
                  type: 'FIXED',
                  frequency: 'MONTHLY',
                  amount: '',
                  notes: '',
                  isActive: true
                });
                setIsNewServiceOpen(true);
              }}
              className="gap-2"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              تعريف خدمة جديدة
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-card rounded-xl border text-muted-foreground">
                لا توجد خدمات معرفة. اضغط على «تعريف خدمة» لإضافة بنود الخدمات.
              </div>
            ) : (
              filteredServices.map((service) => {
                const txCount = service.transactions?.length || 0;
                const totalSpent = service.transactions?.reduce(
                  (sum: number, t: any) => sum + (parseFloat(t.cost) || 0), 0
                ) || 0;

                return (
                  <Card key={service.id} className="flex flex-col justify-between hover:shadow-md transition-all border">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <CardTitle className="text-base font-bold flex items-center gap-2">
                            <span className="p-1.5 bg-primary/10 text-primary rounded-md">
                              <Zap className="h-4 w-4" />
                            </span>
                            {service.name}
                          </CardTitle>
                          <div className="flex items-center gap-1.5 pt-1">
                            <Badge variant="secondary" className="text-xs font-normal">
                              {service.scope === 'APARTMENT' ? 'خاص بالشقق' : 'للمبنى'}
                            </Badge>
                            {parseFloat(service.amount) > 0 && (
                              <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/30">
                                ₪{parseFloat(service.amount).toLocaleString()}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditServiceClick(service)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="تعديل الخدمة"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteService(service.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="حذف الخدمة"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 pt-0">
                      {service.description ? (
                        <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 p-2.5 rounded-md line-clamp-3">
                          {service.description}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">لا يوجد وصف مدخل</p>
                      )}

                      <div className="flex items-center justify-between text-xs pt-2 border-t text-muted-foreground">
                        <span>المعاملات المنفذة: <strong>{txCount}</strong></span>
                        <span>إجمالي التكلفة: <strong className="text-foreground">₪{totalSpent.toLocaleString()}</strong></span>
                      </div>

                      <Button
                        onClick={() => handleOpenNewTransaction(service.id)}
                        className="w-full bg-orange-600/90 hover:bg-orange-600 text-white gap-1.5 text-xs h-9 mt-2 font-medium"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        تسجيل معاملة لهذه الخدمة
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ============================================================ */}
      {/* DIALOG 1: NEW SUBSCRIPTION COLLECTION MODAL (Matches IMG_0600) */}
      {/* ============================================================ */}
      <Dialog open={isNewSubOpen} onOpenChange={setIsNewSubOpen}>
        <DialogContent className="sm:max-w-[460px] p-6 rounded-3xl" dir="rtl">
          <DialogHeader className="space-y-1 pb-1 text-center">
            <DialogTitle className="text-xl font-extrabold text-foreground text-center">
              تسجيل تحصيل اشتراك جديد
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground text-center">
              اختر الشقة وسجل المبالغ المستحقة والمدفوعة بوضوح.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveSubscription} className="space-y-3.5 pt-2">
            {/* 1. الشقة المرتبطة */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">الشقة المرتبطة</label>
              <select
                value={subForm.apartmentId}
                onChange={(e) => setSubForm({ ...subForm, apartmentId: e.target.value })}
                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">اختر الشقة</option>
                {apartmentsData.map((apt) => {
                  const resName = apt.residents?.[0]?.name;
                  return (
                    <option key={apt.id} value={apt.id.toString()}>
                      شقة {apt.number} {resName ? `(${resName})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 2. شهر الاشتراك (السنة والشهر) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">شهر الاشتراك (السنة والشهر)</label>
              <Input
                type="text"
                placeholder="2026-08"
                value={subForm.month}
                onChange={(e) => setSubForm({ ...subForm, month: e.target.value })}
                className="h-11 rounded-xl text-center font-bold tracking-wider text-base"
                required
              />
            </div>

            {/* 3. المبلغ المستحق والمبلغ المدفوع الفعلي */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">المبلغ المستحق (شيكل)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="50"
                  value={subForm.dueAmount}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSubForm(prev => ({
                      ...prev,
                      dueAmount: val,
                      paidAmount: prev.paidAmount === prev.dueAmount ? val : prev.paidAmount
                    }));
                  }}
                  className="h-11 rounded-xl text-center font-bold text-base"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">المبلغ المدفوع الفعلي (شيكل)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="50"
                  value={subForm.paidAmount}
                  onChange={(e) => setSubForm({ ...subForm, paidAmount: e.target.value })}
                  className="h-11 rounded-xl text-center font-bold text-base text-emerald-600"
                  required
                />
              </div>
            </div>

            {/* 4. طريقة الدفع */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">طريقة الدفع</label>
              <select
                value={subForm.paymentMethod}
                onChange={(e) => setSubForm({ ...subForm, paymentMethod: e.target.value })}
                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="نقدي">نقدي</option>
                <option value="تحويل بنكي">تحويل بنكي</option>
                <option value="شيك">شيك</option>
                <option value="رصيد دائن">خصم من الرصيد الدائن</option>
              </select>
            </div>

            {/* Credit deduction alert if available */}
            {subForm.apartmentId && totalAvailableCreditForSub > 0 && (
              <div className="flex items-center gap-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 border border-emerald-200">
                <input
                  type="checkbox"
                  id="subCreditDeduct"
                  checked={subForm.deductFromCredit}
                  onChange={(e) => setSubForm({ ...subForm, deductFromCredit: e.target.checked, paymentMethod: e.target.checked ? 'رصيد دائن' : 'نقدي' })}
                  className="rounded text-emerald-600"
                />
                <label htmlFor="subCreditDeduct" className="cursor-pointer font-medium">
                  خصم تلقائي من الرصيد الدائن المتاح للساكن (₪{totalAvailableCreditForSub.toFixed(2)})
                </label>
              </div>
            )}

            {/* 5. التوقيع الإلكتروني أو اسم المستلم */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">التوقيع الإلكتروني أو اسم المستلم</label>
              <Input
                placeholder="مثال: أبو أحمد"
                value={subForm.collectedBy}
                onChange={(e) => setSubForm({ ...subForm, collectedBy: e.target.value })}
                className="h-11 rounded-xl text-sm"
              />
            </div>

            {/* 6. ملاحظات التحصيل */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">ملاحظات التحصيل</label>
              <Textarea
                placeholder="أي ملاحظات إضافية..."
                value={subForm.notes}
                onChange={(e) => setSubForm({ ...subForm, notes: e.target.value })}
                rows={2}
                className="rounded-xl text-sm resize-none"
              />
            </div>

            {/* 7. زر الإرسال الأخضر المطابق لـ IMG_0600 */}
            <Button
              type="submit"
              className="w-full bg-[#059669] hover:bg-[#047857] text-white font-bold h-12 rounded-xl text-base shadow-sm mt-3"
            >
              حفظ وحفظ الإيصال
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* DIALOG 2: BATCH GENERATE MONTHLY DUES */}
      {/* ============================================================ */}
      <Dialog open={isBatchSubOpen} onOpenChange={setIsBatchSubOpen}>
        <DialogContent className="sm:max-w-[440px] p-6 rounded-2xl" dir="rtl">
          <DialogHeader className="space-y-1 text-center">
            <DialogTitle className="text-lg font-bold">توليد استحقاقات الاشتراك لجميع الشقق</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              تطبيق اشتراك شهري بقيمة موحدة على كافة شقق البناية لشهر محدد
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleGenerateBatch} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">شهر الاستحقاق</label>
              <Input
                type="text"
                placeholder="2026-08"
                value={batchForm.month}
                onChange={(e) => setBatchForm({ ...batchForm, month: e.target.value })}
                className="h-10 text-center font-bold"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">قيمة الاشتراك الشهري لكل شقة (شيكل)</label>
              <Input
                type="number"
                step="0.01"
                min="1"
                placeholder="50"
                value={batchForm.dueAmount}
                onChange={(e) => setBatchForm({ ...batchForm, dueAmount: e.target.value })}
                className="h-10 text-center font-bold text-base text-emerald-600"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">بيان وملاحظات</label>
              <Input
                placeholder="اشتراك خدمات وصيانة البناية الشهرية..."
                value={batchForm.notes}
                onChange={(e) => setBatchForm({ ...batchForm, notes: e.target.value })}
                className="h-10"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl"
            >
              توليد الاشتراكات لـ ({apartmentsData.length}) شقة
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* DIALOG 3: OFFICIAL RECEIPT VOUCHER MODAL (عرض الإيصال الرسمي) */}
      {/* ============================================================ */}
      <Dialog open={!!selectedReceipt} onOpenChange={() => setSelectedReceipt(null)}>
        <DialogContent className="sm:max-w-[480px] p-6 rounded-3xl" dir="rtl">
          {selectedReceipt && (
            <div className="space-y-4">
              {/* Printable Voucher Card */}
              <div id="subscription-receipt-print" className="bg-muted/20 border-2 border-dashed border-emerald-500/40 p-5 rounded-2xl space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start border-b pb-3">
                  <div>
                    <h3 className="font-extrabold text-base text-foreground">
                      {buildingInfo?.name || 'لجنة إدارة البناية'}
                    </h3>
                    <p className="text-xs text-muted-foreground">إيصال تحصيل اشتراك خدمات</p>
                  </div>
                  <div className="text-left font-mono">
                    <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 border-emerald-300 font-bold">
                      {selectedReceipt.receiptNumber || `REC-${selectedReceipt.id}`}
                    </Badge>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {new Date(selectedReceipt.date).toLocaleDateString('ar-EG')}
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-background p-2.5 rounded-lg border">
                    <span className="text-muted-foreground block text-[11px]">الشقة المستفيدة</span>
                    <span className="font-bold text-foreground text-sm">
                      شقة {selectedReceipt.apartment?.number || selectedReceipt.apartmentId}
                    </span>
                  </div>

                  <div className="bg-background p-2.5 rounded-lg border">
                    <span className="text-muted-foreground block text-[11px]">اسم الساكن</span>
                    <span className="font-bold text-foreground text-sm">
                      {selectedReceipt.apartment?.residents?.[0]?.name || '—'}
                    </span>
                  </div>

                  <div className="bg-background p-2.5 rounded-lg border">
                    <span className="text-muted-foreground block text-[11px]">شهر الاشتراك</span>
                    <span className="font-bold text-foreground font-mono">
                      {selectedReceipt.month}
                    </span>
                  </div>

                  <div className="bg-background p-2.5 rounded-lg border">
                    <span className="text-muted-foreground block text-[11px]">طريقة الدفع</span>
                    <span className="font-bold text-foreground">
                      {formatPaymentMethod(selectedReceipt.paymentMethod)}
                    </span>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/20 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-emerald-800 dark:text-emerald-300 block font-medium">المبلغ المدفوع الفعلي</span>
                    <span className="text-xs text-muted-foreground">
                      من أصل مستحق: ₪{parseFloat(selectedReceipt.dueAmount).toFixed(2)}
                    </span>
                  </div>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    ₪{parseFloat(selectedReceipt.paidAmount).toFixed(2)}
                  </div>
                </div>

                {/* Collector & Notes */}
                <div className="flex justify-between items-center text-xs pt-1 border-t text-muted-foreground">
                  <div>
                    <span>المستلم: </span>
                    <strong className="text-foreground">{selectedReceipt.collectedBy || 'إدارة الصندوق'}</strong>
                  </div>
                  <div>
                    <span>الحالة: </span>
                    <strong className="text-emerald-600 font-bold">
                      {selectedReceipt.status === 'PAID' ? 'مسدد بالكامل' : (selectedReceipt.status === 'PARTIAL' ? 'تحصيل جزئي' : 'غير مسدد')}
                    </strong>
                  </div>
                </div>

                {selectedReceipt.notes && (
                  <p className="text-[11px] text-muted-foreground italic bg-background p-2 rounded border">
                    ملاحظة: {selectedReceipt.notes}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={() => window.print()}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 h-11 rounded-xl"
                >
                  <Printer className="h-4 w-4" />
                  طباعة الإيصال
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedReceipt(null)}
                  className="h-11 rounded-xl"
                >
                  إغلاق
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* DIALOG 4: NEW SERVICE TRANSACTION (IMG_0595) */}
      {/* ============================================================ */}
      <Dialog open={isNewTxOpen} onOpenChange={setIsNewTxOpen}>
        <DialogContent className="sm:max-w-[480px] p-6 rounded-2xl" dir="rtl">
          <DialogHeader className="space-y-1.5 pb-2 text-center">
            <DialogTitle className="text-xl font-bold text-center">
              معاملة خدمة جديدة
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground text-center leading-relaxed">
              عند اختيار «المبنى» وإدخال تكلفة، تُسجّل التكلفة تلقائيًا كمصروف يخصم من رصيد الصندوق.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveTransaction} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">الخدمة المسجلة</label>
              {servicesData.length > 0 ? (
                <select
                  value={txForm.serviceId}
                  onChange={(e) => {
                    const selId = e.target.value;
                    const srv = servicesData.find(s => s.id.toString() === selId);
                    setTxForm(prev => ({
                      ...prev,
                      serviceId: selId,
                      customServiceName: srv?.name || '',
                      scope: srv?.scope === 'APARTMENT' ? 'APARTMENT' : prev.scope,
                      cost: srv && parseFloat(srv.amount) > 0 ? srv.amount : prev.cost,
                      notes: prev.notes || srv?.description || ''
                    }));
                  }}
                  className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                >
                  <option value="">-- اختر خدمة من الدليل --</option>
                  {servicesData.map((s) => (
                    <option key={s.id} value={s.id.toString()}>
                      {s.name} {s.scope === 'APARTMENT' ? '(للشقق)' : '(للمبنى)'} {parseFloat(s.amount) > 0 ? `- ₪${s.amount}` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  placeholder="اسم الخدمة..."
                  value={txForm.customServiceName}
                  onChange={(e) => setTxForm({ ...txForm, customServiceName: e.target.value })}
                  className="h-11 rounded-lg"
                  required
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">نطاق الخدمة / المستفيد</label>
              <select
                value={txForm.scope}
                onChange={(e) => setTxForm({ ...txForm, scope: e.target.value })}
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
              >
                <option value="BUILDING">المبنى (يخصم تلقائياً كمصروف من الصندوق)</option>
                <option value="APARTMENT">شقة محددة (يسجل كذمة أو يخصم من رصيد الساكن)</option>
              </select>
            </div>

            {txForm.scope === 'APARTMENT' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">اختر الشقة</label>
                <select
                  value={txForm.apartmentId}
                  onChange={(e) => setTxForm({ ...txForm, apartmentId: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="">-- اختر الشقة والساكن --</option>
                  {apartmentsData.map((apt) => {
                    const resName = apt.residents?.[0]?.name;
                    return (
                      <option key={apt.id} value={apt.id.toString()}>
                        شقة {apt.number} {resName ? `- ${resName}` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">تكلفة الخدمة (شيكل)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                value={txForm.cost}
                onChange={(e) => setTxForm({ ...txForm, cost: e.target.value })}
                className="h-11 rounded-lg text-base font-bold text-center"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">تاريخ المعاملة</label>
              <Input
                type="date"
                value={txForm.date}
                onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                className="h-10 rounded-lg"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">ملاحظات وبيان المعاملة</label>
              <Textarea
                placeholder="أدخل أي تفاصيل أو ملاحظات..."
                value={txForm.notes}
                onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })}
                rows={2}
                className="rounded-lg text-sm resize-none"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold h-12 rounded-xl text-base shadow-sm mt-2"
            >
              حفظ المعاملة
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* DIALOG 5: DEFINE / EDIT SERVICE MODAL (IMG_0594) */}
      {/* ============================================================ */}
      <Dialog open={isNewServiceOpen} onOpenChange={setIsNewServiceOpen}>
        <DialogContent className="sm:max-w-[460px] p-6 rounded-2xl" dir="rtl">
          <DialogHeader className="space-y-1 pb-2 text-center">
            <DialogTitle className="text-xl font-bold text-center">
              {editingService ? 'تعديل تعريف الخدمة' : 'تعريف خدمة'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground text-center">
              إضافة أو تحديث خدمة في الدليل لاستخدامها المتكرر في تسجيل المعاملات
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveService} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Input
                placeholder="اسم الخدمة (مثل: صيانة درج البناية، شراء مضخة مياه...)"
                value={serviceForm.name}
                onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                className="h-11 rounded-lg text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Textarea
                placeholder="وصف الخدمة (تفاصيل الأعمال المشمولة، طريقة التنفيذ...)"
                value={serviceForm.description}
                onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                rows={3}
                className="rounded-lg text-sm resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">النطاق الافتراضي للخدمة</label>
              <select
                value={serviceForm.scope}
                onChange={(e) => setServiceForm({ ...serviceForm, scope: e.target.value })}
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
              >
                <option value="BUILDING">للمبنى</option>
                <option value="APARTMENT">للشقة</option>
                <option value="GENERAL">عام</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">التكلفة المرجعية (شيكل - اختياري)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={serviceForm.amount}
                onChange={(e) => setServiceForm({ ...serviceForm, amount: e.target.value })}
                className="h-11 rounded-lg text-base text-center font-bold"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold h-12 rounded-xl text-base shadow-sm mt-2"
            >
              حفظ الخدمة
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
