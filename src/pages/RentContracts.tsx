import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, 
  Plus, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Building2, 
  User, 
  Phone, 
  Calendar, 
  Coins, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter, 
  MessageCircle, 
  Edit3, 
  Trash2, 
  Printer, 
  CreditCard,
  CheckSquare,
  Square,
  DollarSign,
  Receipt,
  Eye,
  Share2,
  Percent,
  Check,
  ArrowRight,
  Wallet,
  RotateCcw
} from 'lucide-react';

const extractMonthKey = (notes: string = '', dueDate?: string | Date) => {
  const match = notes.match(/\b(\d{4}-\d{2})\b/);
  if (match) return match[1];
  if (dueDate) {
    const d = new Date(dueDate);
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
  }
  return new Date().toISOString().slice(0, 7);
};
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

export function RentContracts() {
  const { getToken } = useAuth();
  const [contracts, setContracts] = useState<any[]>([]);
  const [apartments, setApartments] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED'>('ALL');

  // Dialogs
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<any | null>(null);
  const [deletingContract, setDeletingContract] = useState<any | null>(null);
  const [expandedContract, setExpandedContract] = useState<number | null>(null);
  const [contractDebts, setContractDebts] = useState<any[]>([]);
  const [loadingDebts, setLoadingDebts] = useState(false);

  // Payment Modal State (سداد قسط كامل أو جزئي)
  const [payingDebt, setPayingDebt] = useState<any | null>(null);
  const [payAmountType, setPayAmountType] = useState<'FULL' | 'PARTIAL'>('FULL');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'E_WALLET'>('CASH');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payReference, setPayReference] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [submittingPay, setSubmittingPay] = useState(false);

  // History & Receipt Modals
  const [viewingDebtHistory, setViewingDebtHistory] = useState<any | null>(null);
  const [debtPaymentsHistory, setDebtPaymentsHistory] = useState<any[]>([]);
  const [loadingDebtPayments, setLoadingDebtPayments] = useState(false);
  const [receiptToPrint, setReceiptToPrint] = useState<any | null>(null);

  // Form State (Matching Exact Fields from User's Screenshots)
  const [formApartmentId, setFormApartmentId] = useState<string>('');
  const [formTenantName, setFormTenantName] = useState('');
  const [formTenantPhone, setFormTenantPhone] = useState('');
  const [formUnitDescription, setFormUnitDescription] = useState('');
  const [formMonthlyRent, setFormMonthlyRent] = useState('');
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Set default end date to 1 year ahead
  const defaultEndDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  }, []);
  const [formEndDate, setFormEndDate] = useState(defaultEndDate);
  const [formDueDay, setFormDueDay] = useState('1');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'EXPIRED' | 'TERMINATED'>('ACTIVE');
  const [formNotes, setFormNotes] = useState('');
  
  // Accordion for Paid Months Before Registration
  const [isPaidMonthsAccordionOpen, setIsPaidMonthsAccordionOpen] = useState(false);
  const [selectedPaidMonths, setSelectedPaidMonths] = useState<string[]>([]);
  const [submittingForm, setSubmittingForm] = useState(false);
  const [togglingStatusMonth, setTogglingStatusMonth] = useState<string | null>(null);

  // Calculate available past/current months for the given start date & end date
  const availableMonths = useMemo(() => {
    if (!formStartDate) return [];
    const start = new Date(formStartDate);
    const end = formEndDate ? new Date(formEndDate) : new Date();
    if (isNaN(start.getTime())) return [];

    const months: { key: string; label: string; yearMonth: string }[] = [];
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    const now = new Date();
    // Months up to now or end date, whichever is earlier
    const limit = isNaN(end.getTime()) ? now : (end < now ? end : now);

    while (current <= limit) {
      const y = current.getFullYear();
      const m = current.getMonth() + 1;
      const key = `${y}-${String(m).padStart(2, '0')}`;
      const monthArabic = current.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
      months.push({
        key,
        yearMonth: `${y}/${m}`,
        label: `شهر ${m} (${monthArabic})`
      });
      current.setMonth(current.getMonth() + 1);
    }
    return months;
  }, [formStartDate, formEndDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const [resC, resA, resR] = await Promise.all([
        fetch('/api/rent-contracts', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/apartments', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/residents', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (resC.ok) setContracts(await resC.json());
      if (resA.ok) setApartments(await resA.json());
      if (resR.ok) setResidents(await resR.json());
    } catch (e) {
      console.error(e);
      toast.error('فشل تحميل بيانات عقود الإيجار');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  const handleSync = async () => {
    try {
      const token = await getToken();
      const res = await fetch('/api/rent-contracts/sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`تمت مزامنة الأشهر وتوليد ${data.generated} استحقاق إيجار جديد`);
        fetchData();
        if (expandedContract) loadDebts(expandedContract);
      }
    } catch (e) {
      toast.error('حدث خطأ أثناء المزامنة');
    }
  };

  const loadDebts = async (contractId: number) => {
    setLoadingDebts(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/debts', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const allDebts = await res.json();
        const filtered = allDebts.filter((d: any) => d.source === 'RENT' && d.sourceId === contractId);
        setContractDebts(filtered);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDebts(false);
    }
  };

  const toggleExpand = (contractId: number) => {
    if (expandedContract === contractId) {
      setExpandedContract(null);
      setContractDebts([]);
    } else {
      setExpandedContract(contractId);
      loadDebts(contractId);
    }
  };

  // Open Create Dialog
  const openCreateDialog = () => {
    setEditingContract(null);
    setFormApartmentId('');
    setFormTenantName('');
    setFormTenantPhone('');
    setFormUnitDescription('');
    setFormMonthlyRent('');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    setFormEndDate(d.toISOString().split('T')[0]);
    setFormDueDay('1');
    setFormStatus('ACTIVE');
    setFormNotes('');
    setSelectedPaidMonths([]);
    setIsPaidMonthsAccordionOpen(false);
    setIsDialogOpen(true);
  };

  // Open Edit Dialog
  const openEditDialog = (contract: any) => {
    setEditingContract(contract);
    setFormApartmentId(contract.apartmentId ? String(contract.apartmentId) : '');
    setFormTenantName(contract.tenantName || contract.tenant?.name || '');
    setFormTenantPhone(contract.tenantPhone || contract.tenant?.phone || '');
    setFormUnitDescription(contract.unitDescription || (contract.apartment ? `شقة ${contract.apartment.number}` : ''));
    setFormMonthlyRent(contract.monthlyRent ? String(parseFloat(contract.monthlyRent)) : '');
    setFormStartDate(contract.startDate ? new Date(contract.startDate).toISOString().split('T')[0] : '');
    setFormEndDate(contract.endDate ? new Date(contract.endDate).toISOString().split('T')[0] : '');
    setFormDueDay(contract.dueDay ? String(contract.dueDay) : '1');
    setFormStatus(contract.status || 'ACTIVE');
    setFormNotes(contract.notes || '');
    setSelectedPaidMonths(Array.isArray(contract.paidMonths) ? contract.paidMonths : []);
    setIsPaidMonthsAccordionOpen(false);
    setIsDialogOpen(true);
  };

  // Auto-fill unit info when apartment is chosen
  const handleApartmentChange = (aptIdStr: string) => {
    setFormApartmentId(aptIdStr);
    if (!aptIdStr) return;
    const apt = apartments.find(a => String(a.id) === aptIdStr);
    if (apt) {
      if (!formUnitDescription) {
        setFormUnitDescription(`شقة رقم ${apt.number}${apt.floor ? ` - الطابق ${apt.floor}` : ''}`);
      }
      // Check if resident exists in apartment
      const res = residents.find(r => r.apartmentId === apt.id);
      if (res && !formTenantName) {
        setFormTenantName(res.name);
        if (res.phone && !formTenantPhone) {
          setFormTenantPhone(res.phone);
        }
      }
    }
  };

  // Toggle single month in paid months
  const togglePaidMonth = (monthKey: string) => {
    setSelectedPaidMonths(prev => 
      prev.includes(monthKey) 
        ? prev.filter(k => k !== monthKey) 
        : [...prev, monthKey]
    );
  };

  // Select / Deselect all available months
  const selectAllPaidMonths = () => {
    setSelectedPaidMonths(availableMonths.map(m => m.key));
  };
  const deselectAllPaidMonths = () => {
    setSelectedPaidMonths([]);
  };

  // Toggle Month Payment Status directly (e.g. from paid before registration to unpaid/open)
  const handleToggleMonthPaidStatus = async (contractId: number, monthKey: string, isPaid: boolean) => {
    setTogglingStatusMonth(monthKey);
    try {
      const token = await getToken();
      const res = await fetch(`/api/rent-contracts/${contractId}/toggle-month-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ monthKey, isPaid })
      });
      if (res.ok) {
        toast.success(isPaid ? `تم قيد شهر ${monthKey} كمسدد مسبقاً` : `تم تعيين شهر ${monthKey} كـ (غير مسدد / مستحق سداد)`);
        fetchData();
        if (expandedContract) {
          loadDebts(expandedContract);
        }
      } else {
        toast.error('فشل تحديث حالة الشهر');
      }
    } catch (e) {
      toast.error('حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setTogglingStatusMonth(null);
    }
  };

  // Submit Create or Edit Form
  const handleSubmitContract = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTenantName.trim()) {
      toast.error('يرجى إدخال اسم المستأجر الثلاثي');
      return;
    }
    if (!formUnitDescription.trim()) {
      toast.error('يرجى إدخال اسم ووصف الوحدة المؤجرة');
      return;
    }
    const rentVal = parseFloat(formMonthlyRent);
    if (isNaN(rentVal) || rentVal <= 0) {
      toast.error('يرجى إدخال قيمة إيجار شهري صحيحة');
      return;
    }
    if (!formStartDate || !formEndDate) {
      toast.error('يرجى تحديد تواريخ بداية ونهاية العقد');
      return;
    }

    setSubmittingForm(true);
    try {
      const token = await getToken();
      const payload = {
        apartmentId: formApartmentId ? parseInt(formApartmentId) : null,
        tenantName: formTenantName.trim(),
        tenantPhone: formTenantPhone.trim() || null,
        unitDescription: formUnitDescription.trim(),
        monthlyRent: rentVal,
        startDate: formStartDate,
        endDate: formEndDate,
        dueDay: parseInt(formDueDay) || 1,
        status: formStatus,
        notes: formNotes.trim() || null,
        paidMonths: selectedPaidMonths
      };

      const url = editingContract ? `/api/rent-contracts/${editingContract.id}` : '/api/rent-contracts';
      const method = editingContract ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(editingContract ? 'تم تحديث عقد الإيجار بنجاح' : 'تم حفظ وإنشاء عقد الإيجار بنجاح');
        setIsDialogOpen(false);
        fetchData();
        if (editingContract && expandedContract === editingContract.id) {
          loadDebts(editingContract.id);
        }
      } else {
        const err = await res.json();
        toast.error(err.error || 'حدث خطأ أثناء حفظ العقد');
      }
    } catch (e) {
      toast.error('فشل الاتصال بالخادم');
    } finally {
      setSubmittingForm(false);
    }
  };

  // Delete Contract
  const handleDeleteContract = async () => {
    if (!deletingContract) return;
    try {
      const token = await getToken();
      const res = await fetch(`/api/rent-contracts/${deletingContract.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('تم حذف عقد الإيجار بنجاح');
        setDeletingContract(null);
        if (expandedContract === deletingContract.id) {
          setExpandedContract(null);
        }
        fetchData();
      } else {
        toast.error('فشل حذف العقد');
      }
    } catch (e) {
      toast.error('حدث خطأ أثناء حذف العقد');
    }
  };

  // Open Payment Modal for a Rent Debt Month
  const openPayModal = (debt: any, contract?: any) => {
    const parentContract = contract || contracts.find(c => c.id === debt.sourceId);
    setPayingDebt({ ...debt, contract: parentContract });
    const rem = parseFloat(debt.remainingAmount || debt.amount || '0');
    setPayAmount(rem > 0 ? String(rem) : String(parseFloat(debt.originalAmount || debt.amount || '0')));
    setPayAmountType('FULL');
    setPayMethod('CASH');
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayReference('');
    const aptLabel = debt.apartment ? ` - شقة ${debt.apartment.number}` : (parentContract?.apartment ? ` - شقة ${parentContract.apartment.number}` : '');
    setPayNotes(`سداد ${debt.notes || 'إيجار شهري'}${aptLabel}`);
  };

  // Open Debt History / Receipts Modal
  const openDebtHistoryModal = async (debt: any, contract?: any) => {
    const parentContract = contract || contracts.find(c => c.id === debt.sourceId);
    setViewingDebtHistory({ ...debt, contract: parentContract });
    setLoadingDebtPayments(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/debts/${debt.id}/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDebtPaymentsHistory(data);
      } else {
        setDebtPaymentsHistory([]);
      }
    } catch (err) {
      console.error(err);
      setDebtPaymentsHistory([]);
    } finally {
      setLoadingDebtPayments(false);
    }
  };

  // Quick Partial Percentage Handler
  const handleQuickPercent = (pct: number) => {
    if (!payingDebt) return;
    const curRem = parseFloat(payingDebt.remainingAmount || payingDebt.amount || '0');
    const calc = Math.round((curRem * (pct / 100)) * 100) / 100;
    setPayAmount(String(calc));
    setPayAmountType('PARTIAL');
  };

  // Submit Payment for a Month
  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingDebt) return;

    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('يرجى إدخال مبلغ سداد صحيح أكبر من الصفر');
      return;
    }

    const curRem = parseFloat(payingDebt.remainingAmount || payingDebt.amount || '0');
    if (amt > curRem + 0.01) {
      toast.error(`المبلغ المدخل (₪${amt.toFixed(2)}) أكبر من المتبقي المطلوب (₪${curRem.toFixed(2)})`);
      return;
    }

    setSubmittingPay(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/debts/${payingDebt.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amount: amt,
          method: payMethod,
          date: payDate ? new Date(payDate).toISOString() : new Date().toISOString(),
          reference: payReference.trim() || null,
          notes: payNotes.trim() || `سداد ${payingDebt.notes || 'إيجار شهري'}`,
          residentId: payingDebt.residentId || payingDebt.contract?.tenantId || null
        })
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || `تم تسديد مبلغ ₪${amt.toFixed(2)} بنجاح`);
        
        const createdPayment = data.payment || {
          id: Date.now(),
          amount: amt,
          method: payMethod,
          reference: payReference,
          notes: payNotes,
          createdAt: payDate || new Date().toISOString()
        };

        // Prepare receipt to view / print
        setReceiptToPrint({
          payment: createdPayment,
          debt: payingDebt,
          contract: payingDebt.contract,
          amount: amt,
          remainingAfter: Math.max(0, curRem - amt),
          date: payDate || new Date().toISOString().split('T')[0]
        });

        setPayingDebt(null);
        if (expandedContract) loadDebts(expandedContract);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'فشل تسجيل السداد');
      }
    } catch (e) {
      toast.error('حدث خطأ أثناء تسجيل السداد');
    } finally {
      setSubmittingPay(false);
    }
  };

  // Filtered Contracts
  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      const tName = (c.tenantName || c.tenant?.name || '').toLowerCase();
      const tPhone = (c.tenantPhone || c.tenant?.phone || '').toLowerCase();
      const uDesc = (c.unitDescription || '').toLowerCase();
      const aptNum = c.apartment ? String(c.apartment.number).toLowerCase() : '';
      const query = searchQuery.toLowerCase();

      const matchesSearch = !query || 
        tName.includes(query) || 
        tPhone.includes(query) || 
        uDesc.includes(query) || 
        aptNum.includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [contracts, statusFilter, searchQuery]);

  // Statistics KPIs
  const stats = useMemo(() => {
    const total = contracts.length;
    const active = contracts.filter(c => c.status === 'ACTIVE').length;
    const expired = contracts.filter(c => c.status === 'EXPIRED').length;
    const monthlyTotal = contracts
      .filter(c => c.status === 'ACTIVE')
      .reduce((sum, c) => sum + (parseFloat(c.monthlyRent) || 0), 0);

    return { total, active, expired, monthlyTotal };
  }, [contracts]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <FileText className="h-7 w-7 text-primary" />
            <span>إدارة عقود الإيجار</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            سجل ومتابعة عقود الإيجار للمستأجرين، الوحدات المؤجرة، وتواريخ وأشهر الاستحقاق
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button 
            variant="outline" 
            onClick={handleSync} 
            className="gap-1.5 text-xs font-semibold cursor-pointer border-muted-foreground/30 hover:bg-muted"
            title="توليد استحقاقات الإيجار للأشهر الجارية"
          >
            <RefreshCw className="h-4 w-4 text-primary" />
            <span>تحديث ومزامنة الأشهر</span>
          </Button>

          <Button 
            onClick={openCreateDialog} 
            className="gap-1.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>إنشاء عقد إيجار جديد</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 bg-card border shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">إجمالي العقود</p>
              <p className="text-2xl font-black mt-1 font-mono">{stats.total}</p>
            </div>
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <FileText className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card border shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">عقود سارية ونشطة</p>
              <p className="text-2xl font-black mt-1 text-emerald-600 font-mono">{stats.active}</p>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card border shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">إجمالي الإيجار الشهري</p>
              <p className="text-2xl font-black mt-1 text-primary font-mono">
                ₪{stats.monthlyTotal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <Coins className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card border shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">عقود منتهية / ملغاة</p>
              <p className="text-2xl font-black mt-1 text-amber-600 font-mono">{stats.expired}</p>
            </div>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-3 bg-muted/20 border">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث باسم المستأجر، رقم الهاتف، أو وصف الوحدة والشقة..."
              className="pr-9 text-xs bg-background"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">جميع الحالات</option>
              <option value="ACTIVE">عقود سارية فقط</option>
              <option value="EXPIRED">عقود منتهية فقط</option>
              <option value="TERMINATED">عقود ملغاة</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Contracts Table */}
      <Card className="shadow-xs overflow-hidden border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-right font-bold">المستأجر</TableHead>
                  <TableHead className="text-right font-bold">الوحدة المؤجرة</TableHead>
                  <TableHead className="text-right font-bold">الإيجار الشهري</TableHead>
                  <TableHead className="text-right font-bold">فترة العقد</TableHead>
                  <TableHead className="text-right font-bold">يوم الاستحقاق</TableHead>
                  <TableHead className="text-center font-bold">الحالة</TableHead>
                  <TableHead className="text-center font-bold">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                        <span>جاري تحميل عقود الإيجار...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredContracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-10 w-10 text-muted-foreground/40" />
                        <p className="text-sm font-semibold">لا توجد عقود إيجار مطابقة</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={openCreateDialog}
                          className="mt-2 text-xs gap-1"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>إضافة عقد جديد</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContracts.map((c) => {
                    const isExpanded = expandedContract === c.id;
                    const tenantDisplayName = c.tenantName || c.tenant?.name || 'مستأجر غير مسمى';
                    const tenantPhoneNum = c.tenantPhone || c.tenant?.phone;

                    return (
                      <React.Fragment key={c.id}>
                        <TableRow className={`transition-colors hover:bg-muted/30 ${isExpanded ? 'bg-primary/5' : ''}`}>
                          {/* Tenant Info */}
                          <TableCell>
                            <div>
                              <p className="font-bold text-sm text-foreground flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 text-primary shrink-0" />
                                <span>{tenantDisplayName}</span>
                              </p>
                              {tenantPhoneNum ? (
                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground font-mono">
                                  <Phone className="h-3 w-3" />
                                  <span>{tenantPhoneNum}</span>
                                  <button
                                    onClick={() => {
                                      const cleanPhone = tenantPhoneNum.replace(/\D/g, '');
                                      const msg = encodeURIComponent(`مرحباً أستاذ ${tenantDisplayName}، بخصوص عقد إيجار ${c.unitDescription || ''}`);
                                      window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
                                    }}
                                    className="text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 text-[11px] font-sans font-semibold cursor-pointer"
                                    title="مراسلة عبر واتساب"
                                  >
                                    <MessageCircle className="h-3 w-3" />
                                    <span>واتساب</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-muted-foreground/70">بدون هاتف مسجل</span>
                              )}
                            </div>
                          </TableCell>

                          {/* Unit Info */}
                          <TableCell>
                            <div>
                              <p className="font-semibold text-xs text-foreground">
                                {c.unitDescription || 'وحدة سكنية'}
                              </p>
                              {c.apartment ? (
                                <Badge variant="outline" className="mt-1 text-[10px] bg-muted/40 font-mono gap-1">
                                  <Building2 className="h-2.5 w-2.5" />
                                  <span>شقة {c.apartment.number}</span>
                                </Badge>
                              ) : (
                                <span className="text-[10px] text-muted-foreground">وحدة مستقلة</span>
                              )}
                            </div>
                          </TableCell>

                          {/* Monthly Rent */}
                          <TableCell>
                            <span className="font-extrabold text-sm font-mono text-foreground bg-primary/10 text-primary px-2 py-0.5 rounded-md border border-primary/20">
                              ₪{parseFloat(c.monthlyRent).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          </TableCell>

                          {/* Contract Period */}
                          <TableCell>
                            <div className="text-xs">
                              <p className="font-medium text-foreground">
                                {new Date(c.startDate).toLocaleDateString('ar-EG')}
                              </p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                إلى {new Date(c.endDate).toLocaleDateString('ar-EG')}
                              </p>
                            </div>
                          </TableCell>

                          {/* Due Day */}
                          <TableCell>
                            <span className="text-xs font-mono font-bold">
                              يوم {c.dueDay || 1} من الشهر
                            </span>
                          </TableCell>

                          {/* Status */}
                          <TableCell className="text-center">
                            {c.status === 'ACTIVE' ? (
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-[11px]">
                                نشط وساري
                              </Badge>
                            ) : c.status === 'EXPIRED' ? (
                              <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-300 text-[11px]">
                                منتهي الصلاحية
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="text-[11px]">
                                ملغى
                              </Badge>
                            )}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              <Button
                                variant={isExpanded ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => toggleExpand(c.id)}
                                className="h-7 text-xs px-2.5 gap-1 font-semibold cursor-pointer"
                                title="عرض كشف الأشهر والأقساط"
                              >
                                <span>الأشهر</span>
                                {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(c)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-primary cursor-pointer"
                                title="تعديل العقد"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingContract(c)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                                title="حذف العقد"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Collapsible Inner Months Table */}
                        {isExpanded && (
                          <TableRow className="bg-muted/15">
                            <TableCell colSpan={7} className="p-4">
                              <div className="rounded-xl border bg-card p-4 space-y-3 shadow-2xs">
                                <div className="flex items-center justify-between border-b pb-2.5">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    <h4 className="font-bold text-sm text-foreground">
                                      كشف استحقاقات أشهر إيجار: {c.unitDescription || tenantDisplayName}
                                    </h4>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    القيمة الشهرية: ₪{parseFloat(c.monthlyRent).toFixed(2)}
                                  </span>
                                </div>

                                {loadingDebts ? (
                                  <div className="py-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                                    <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                                    <span>جاري جلب استحقاقات الأشهر...</span>
                                  </div>
                                ) : contractDebts.length === 0 ? (
                                  <div className="py-6 text-center text-xs text-muted-foreground">
                                    لا توجد استحقاقات مسجلة حالياً لهذا العقد. يمكنك الضغط على «تحديث ومزامنة الأشهر» بالأعلى لتوليد الأشهر المستحقة.
                                  </div>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <Table className="text-xs">
                                      <TableHeader className="bg-muted/30">
                                        <TableRow>
                                          <TableHead className="text-right">الشهر / البيان</TableHead>
                                          <TableHead className="text-right">تاريخ الاستحقاق</TableHead>
                                          <TableHead className="text-right">المبلغ المستحق</TableHead>
                                          <TableHead className="text-right">المدفوع</TableHead>
                                          <TableHead className="text-right">المتبقي</TableHead>
                                          <TableHead className="text-center">الحالة</TableHead>
                                          <TableHead className="text-center">إجراء السداد</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {contractDebts.map((d) => {
                                          const orig = parseFloat(d.originalAmount || d.amount);
                                          const rem = parseFloat(d.remainingAmount);
                                          const paid = orig - rem;
                                          const isPaid = d.status === 'PAID' || rem <= 0;

                                          return (
                                            <TableRow 
                                              key={d.id} 
                                              className="hover:bg-primary/5 transition-colors cursor-pointer"
                                              onClick={() => {
                                                if (isPaid) {
                                                  openDebtHistoryModal(d, c);
                                                } else {
                                                  openPayModal(d, c);
                                                }
                                              }}
                                            >
                                              <TableCell className="font-bold text-foreground py-3">
                                                <div className="flex items-center gap-1.5">
                                                  <Calendar className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                                                  <span>{d.notes || 'إيجار شهري'}</span>
                                                </div>
                                              </TableCell>
                                              <TableCell className="text-muted-foreground font-mono text-[11px]">
                                                {d.dueDate ? new Date(d.dueDate).toLocaleDateString('ar-EG') : '-'}
                                              </TableCell>
                                              <TableCell className="font-mono font-bold">
                                                ₪{orig.toFixed(2)}
                                              </TableCell>
                                              <TableCell className="font-mono text-emerald-600 font-bold">
                                                ₪{paid.toFixed(2)}
                                              </TableCell>
                                              <TableCell className={`font-mono font-black ${rem > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                                ₪{rem.toFixed(2)}
                                              </TableCell>
                                              <TableCell className="text-center">
                                                {isPaid ? (
                                                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                                                    {d.notes?.includes('(مدفوع قبل التسجيل)') ? 'مدفوع قبل التسجيل ✓' : 'مسدد بالكامل ✓'}
                                                  </Badge>
                                                ) : d.status === 'PARTIALLY_PAID' ? (
                                                  <Badge variant="secondary" className="bg-amber-100 text-amber-900 border-amber-300 text-[10px] font-bold">
                                                    سداد جزئي
                                                  </Badge>
                                                ) : (
                                                  <Badge variant="destructive" className="text-[10px] font-bold">
                                                    غير مسدد (مستحق)
                                                  </Badge>
                                                )}
                                              </TableCell>
                                              <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-center gap-1.5">
                                                  {!isPaid ? (
                                                    <>
                                                      <Button
                                                        size="sm"
                                                        onClick={() => openPayModal(d, c)}
                                                        className="h-7 text-xs px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-xs gap-1.5 transition-transform active:scale-95"
                                                        title="سداد قسط الإيجار (سداد كامل أو سداد جزئي)"
                                                      >
                                                        <CreditCard className="h-3.5 w-3.5" />
                                                        <span>سداد القسط</span>
                                                      </Button>
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={togglingStatusMonth === extractMonthKey(d.notes, d.dueDate)}
                                                        onClick={() => {
                                                          const mKey = extractMonthKey(d.notes, d.dueDate);
                                                          handleToggleMonthPaidStatus(c.id, mKey, true);
                                                        }}
                                                        className="h-7 text-[11px] px-2 text-muted-foreground hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                                                        title="تعيين هذا الشهر كـ مدفوع مسبقاً قبل التسجيل (بدون حركة صندوق)"
                                                      >
                                                        <span>قيد كمدفوع مسبقاً</span>
                                                      </Button>
                                                    </>
                                                  ) : (
                                                    <>
                                                      <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openDebtHistoryModal(d, c)}
                                                        className="h-7 text-xs px-2.5 border-emerald-300 text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100 font-bold cursor-pointer gap-1.5"
                                                        title="عرض تفاصيل وسندات السداد"
                                                      >
                                                        <Receipt className="h-3.5 w-3.5 text-emerald-600" />
                                                        <span>تفاصيل السداد</span>
                                                      </Button>
                                                      {d.notes?.includes('(مدفوع قبل التسجيل)') && (
                                                        <Button
                                                          variant="ghost"
                                                          size="sm"
                                                          disabled={togglingStatusMonth === extractMonthKey(d.notes, d.dueDate)}
                                                          onClick={() => {
                                                            const mKey = extractMonthKey(d.notes, d.dueDate);
                                                            handleToggleMonthPaidStatus(c.id, mKey, false);
                                                          }}
                                                          className="h-7 text-[11px] px-2 text-amber-700 hover:text-amber-800 hover:bg-amber-50 cursor-pointer gap-1"
                                                          title="إلغاء التعيين المسبق وجعله مستحقاً وغير مسدد"
                                                        >
                                                          <RotateCcw className="h-3 w-3" />
                                                          <span>تغيير لغير مسدد</span>
                                                        </Button>
                                                      )}
                                                    </>
                                                  )}
                                                </div>
                                              </TableCell>
                                            </TableRow>
                                          );
                                        })}
                                      </TableBody>
                                    </Table>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* =========================================================================================
          CREATE / EDIT CONTRACT MODAL (مطابق تماماً للحقول والواجهة المطلوبة)
          ========================================================================================= */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto" dir="rtl">
          <form onSubmit={handleSubmitContract} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span>{editingContract ? 'تعديل بيانات عقد الإيجار' : 'إنشاء عقد إيجار جديد'}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                سجل بيانات المستأجر ووحدة الإيجار وفترات العقد بوضوح.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 pt-2">
              {/* Field 1: ربط بشقة مسجلة (اختياري) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  ربط بشقة مسجلة (اختياري)
                </label>
                <select
                  value={formApartmentId}
                  onChange={(e) => handleApartmentChange(e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">اختر الشقة المرتبطة إن وجدت</option>
                  {apartments.map((a) => (
                    <option key={a.id} value={a.id}>
                      شقة {a.number} {a.floor ? `(الطابق ${a.floor})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Field 2: اسم المستأجر الثلاثي */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  اسم المستأجر الثلاثي *
                </label>
                <Input
                  value={formTenantName}
                  onChange={(e) => setFormTenantName(e.target.value)}
                  placeholder="مثال: أحمد محمد علي"
                  required
                  className="bg-background text-xs"
                />
              </div>

              {/* Field 3: رقم الهاتف المحمول (اختياري) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  رقم الهاتف المحمول (اختياري)
                </label>
                <Input
                  value={formTenantPhone}
                  onChange={(e) => setFormTenantPhone(e.target.value)}
                  placeholder="مثال: 0599123456 أو اتركه فارغًا"
                  className="bg-background text-xs font-mono"
                />
                <p className="text-[11px] text-muted-foreground">
                  يمكن حفظ العقد دون رقم هاتف.
                </p>
              </div>

              {/* Field 4: اسم ووصف الوحدة المؤجرة */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  اسم ووصف الوحدة المؤجرة *
                </label>
                <Input
                  value={formUnitDescription}
                  onChange={(e) => setFormUnitDescription(e.target.value)}
                  placeholder="مثال: شقة الطابق الثاني - شمالية"
                  required
                  className="bg-background text-xs"
                />
              </div>

              {/* Field 5: قيمة الإيجار الشهري (شيكل) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  قيمة الإيجار الشهري (شيكل) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="1"
                  value={formMonthlyRent}
                  onChange={(e) => setFormMonthlyRent(e.target.value)}
                  placeholder="مثال: 300"
                  required
                  className="bg-background text-sm font-mono font-bold"
                />
              </div>

              {/* Field 6: تاريخ بداية العقد (تاريخ الدخول) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  تاريخ بداية العقد (تاريخ الدخول) *
                </label>
                <Input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  required
                  className="bg-background text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  اليوم الذي يبدأ فيه احتساب الإيجار الفعلي.
                </p>
              </div>

              {/* Field 7: تاريخ نهاية العقد (تاريخ الخروج) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  تاريخ نهاية العقد (تاريخ الخروج) *
                </label>
                <Input
                  type="date"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                  required
                  className="bg-background text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  اليوم الذي ينتهي عنده العقد رسمياً.
                </p>
              </div>

              {/* Field 8: يوم استحقاق الإيجار الشهري (1 - 31) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  يوم استحقاق الإيجار الشهري (1 - 31)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={formDueDay}
                  onChange={(e) => setFormDueDay(e.target.value)}
                  className="bg-background text-xs font-mono"
                />
                <p className="text-[11px] text-muted-foreground">
                  اليوم من كل شهر الذي يتوجب فيه دفع الإيجار.
                </p>
              </div>

              {/* Field 9: حالة العقد الحالية */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  حالة العقد الحالية
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="ACTIVE">نشط وساري</option>
                  <option value="EXPIRED">منتهي الصلاحية</option>
                  <option value="TERMINATED">ملغى / مفسوخ</option>
                </select>
              </div>

              {/* Field 10: ملاحظات العقد والشروط الخاصة */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  ملاحظات العقد والشروط الخاصة
                </label>
                <Textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="أي شروط إضافية أو ملاحظات تذكر..."
                  rows={2}
                  className="bg-background text-xs"
                />
              </div>

              {/* Field 11: الأشهر المدفوعة قبل التسجيل (قابل للطي Accordion) */}
              <div className="border rounded-xl bg-muted/20 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsPaidMonthsAccordionOpen(!isPaidMonthsAccordionOpen)}
                  className="w-full flex items-center justify-between p-3 text-right hover:bg-muted/40 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">الأشهر المدفوعة قبل التسجيل</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {selectedPaidMonths.length} من {availableMonths.length} شهر تم تحديده كمدفوع
                      </p>
                    </div>
                  </div>
                  <div className="text-muted-foreground">
                    {isPaidMonthsAccordionOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isPaidMonthsAccordionOpen && (
                  <div className="p-3.5 border-t bg-background space-y-3">
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      حدد الأشهر السابقة التي دفعها المستأجر مسبقاً قبل قيد العقد في النظام لكي لا تُحسب عليه كديون متأخرة:
                    </p>

                    {availableMonths.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2 text-center">
                        لا توجد أشهر سابقة ضمن تاريخ بداية العقد الحالي.
                      </p>
                    ) : (
                      <>
                        <div className="flex items-center justify-between pb-1">
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            onClick={selectAllPaidMonths}
                            className="h-auto p-0 text-xs text-primary"
                          >
                            تحديد كل الأشهر كمدفوعة
                          </Button>
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            onClick={deselectAllPaidMonths}
                            className="h-auto p-0 text-xs text-muted-foreground"
                          >
                            إلغاء التحديد
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                          {availableMonths.map((m) => {
                            const isChecked = selectedPaidMonths.includes(m.key);
                            return (
                              <div
                                key={m.key}
                                onClick={() => togglePaidMonth(m.key)}
                                className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                                  isChecked
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                    : 'bg-muted/30 hover:bg-muted border-border text-muted-foreground'
                                }`}
                              >
                                <span>{m.label}</span>
                                {isChecked ? (
                                  <CheckSquare className="h-4 w-4 text-emerald-600" />
                                ) : (
                                  <Square className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="mt-4 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="text-xs"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={submittingForm}
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-6 cursor-pointer shadow-md"
              >
                {submittingForm ? 'جاري الحفظ...' : 'حفظ وإنشاء العقد'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* =========================================================================================
          PAYMENT MODAL (صفحة/نافذة سداد قسط الإيجار - سداد كامل أو جزئي)
          ========================================================================================= */}
      <Dialog open={!!payingDebt} onOpenChange={(open) => { if (!open) setPayingDebt(null); }}>
        <DialogContent className="sm:max-w-[540px] max-h-[92vh] overflow-y-auto" dir="rtl">
          {payingDebt && (() => {
            const orig = parseFloat(payingDebt.originalAmount || payingDebt.amount || '0');
            const curRem = parseFloat(payingDebt.remainingAmount || payingDebt.amount || '0');
            const prevPaid = Math.max(0, orig - curRem);
            const amtNum = parseFloat(payAmount) || 0;
            const remainingAfterPay = Math.max(0, curRem - amtNum);
            const tenantName = payingDebt.contract?.tenantName || payingDebt.resident?.name || 'المستأجر';
            const unitDesc = payingDebt.contract?.unitDescription || (payingDebt.apartment ? `شقة ${payingDebt.apartment.number}` : '');

            return (
              <form onSubmit={handlePaySubmit} className="space-y-4">
                <DialogHeader className="border-b pb-3 text-right">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-base font-bold text-foreground">
                        سداد قسط إيجار: {payingDebt.notes || 'إيجار شهري'}
                      </DialogTitle>
                      <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                        المستأجر: <strong className="text-foreground">{tenantName}</strong> {unitDesc ? ` | ${unitDesc}` : ''}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                {/* Financial Summary Cards */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-lg border bg-muted/20">
                    <div className="text-[10px] text-muted-foreground font-semibold">إجمالي القسط</div>
                    <div className="text-xs sm:text-sm font-bold font-mono text-foreground mt-0.5">₪{orig.toFixed(2)}</div>
                  </div>
                  <div className="p-2.5 rounded-lg border bg-emerald-50/50 border-emerald-200">
                    <div className="text-[10px] text-emerald-700 font-semibold">المسدد سابقاً</div>
                    <div className="text-xs sm:text-sm font-bold font-mono text-emerald-700 mt-0.5">₪{prevPaid.toFixed(2)}</div>
                  </div>
                  <div className="p-2.5 rounded-lg border bg-rose-50/80 border-rose-200">
                    <div className="text-[10px] text-rose-700 font-bold">المتبقي المطلوب</div>
                    <div className="text-xs sm:text-sm font-black font-mono text-rose-700 mt-0.5">₪{curRem.toFixed(2)}</div>
                  </div>
                </div>

                {/* Payment Option Selector: Full vs Partial */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground block">نوع السداد المطلوب:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPayAmountType('FULL');
                        setPayAmount(String(curRem));
                      }}
                      className={`p-2.5 rounded-lg border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        payAmountType === 'FULL'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-card text-foreground hover:bg-muted/50 border-border'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" />
                        <span>سداد كامل المتبقي</span>
                      </div>
                      <span className="font-mono text-[11px] opacity-90">₪{curRem.toFixed(2)}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPayAmountType('PARTIAL');
                        if (payAmount === String(curRem)) {
                          setPayAmount(String(Math.round((curRem / 2) * 100) / 100));
                        }
                      }}
                      className={`p-2.5 rounded-lg border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        payAmountType === 'PARTIAL'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-card text-foreground hover:bg-muted/50 border-border'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <Percent className="h-3.5 w-3.5" />
                        <span>سداد جزء من المبلغ (جزئي)</span>
                      </div>
                      <span className="text-[10px] opacity-90">تحديد مبلغ مخصص</span>
                    </button>
                  </div>
                </div>

                {/* Partial Quick Shortcuts & Amount Input */}
                <div className="space-y-2 p-3 bg-muted/25 rounded-xl border border-dashed">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">المبلغ المراد سداده الآن (₪) *</label>
                    {payAmountType === 'PARTIAL' && (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground ml-1">نسب سريعة:</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickPercent(25)}
                          className="h-5 text-[10px] px-1.5 py-0 font-bold"
                        >
                          25%
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickPercent(50)}
                          className="h-5 text-[10px] px-1.5 py-0 font-bold"
                        >
                          50%
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickPercent(75)}
                          className="h-5 text-[10px] px-1.5 py-0 font-bold"
                        >
                          75%
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={curRem}
                      value={payAmount}
                      onChange={(e) => {
                        setPayAmount(e.target.value);
                        const val = parseFloat(e.target.value);
                        if (val < curRem) {
                          setPayAmountType('PARTIAL');
                        } else if (val === curRem) {
                          setPayAmountType('FULL');
                        }
                      }}
                      required
                      className="font-mono font-black text-lg h-11 pl-9 pr-3 bg-background"
                      placeholder="0.00"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-sm text-muted-foreground">
                      ₪
                    </div>
                  </div>

                  {/* Real-time remaining balance helper */}
                  <div className="flex items-center justify-between text-[11px] pt-1 px-1">
                    <span className="text-muted-foreground">
                      المتبقي بعد هذا السداد:
                    </span>
                    <span className={`font-mono font-bold ${remainingAfterPay === 0 ? 'text-emerald-600' : 'text-amber-700'}`}>
                      {remainingAfterPay === 0 ? '✓ سيتم تسديد القسط بالكامل' : `₪${remainingAfterPay.toFixed(2)} متبقي`}
                    </span>
                  </div>
                </div>

                {/* Additional Payment Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <label className="text-xs font-bold text-foreground">طريقة الدفع *</label>
                    <select
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value as any)}
                      className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring font-medium"
                    >
                      <option value="CASH">💵 نقدي (كاش)</option>
                      <option value="BANK_TRANSFER">🏦 تحويل بنكي</option>
                      <option value="CHEQUE">📄 شيك</option>
                      <option value="E_WALLET">📱 محفظة إلكترونية</option>
                    </select>
                  </div>

                  <div className="grid gap-1">
                    <label className="text-xs font-bold text-foreground">تاريخ السداد *</label>
                    <Input
                      type="date"
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                      required
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <label className="text-xs font-bold text-foreground">رقم الإيصال / المرجع / رقم الشيك</label>
                    <Input
                      placeholder="مثال: TRX-8842 أو رقم الشيك"
                      value={payReference}
                      onChange={(e) => setPayReference(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="grid gap-1">
                    <label className="text-xs font-bold text-foreground">البيان وملاحظات السند</label>
                    <Input
                      placeholder="ملاحظات السداد..."
                      value={payNotes}
                      onChange={(e) => setPayNotes(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <DialogFooter className="mt-4 gap-2 pt-2 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setPayingDebt(null)}
                    className="text-xs font-medium"
                  >
                    إلغاء
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={submittingPay || amtNum <= 0 || amtNum > curRem + 0.01} 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 cursor-pointer shadow-sm"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{submittingPay ? 'جاري تسجيل السداد...' : `تأكيد سداد (₪${amtNum.toFixed(2)})`}</span>
                  </Button>
                </DialogFooter>
              </form>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* =========================================================================================
          DEBT HISTORY MODAL (سجل وتفاصيل سداد الشهر المستحق)
          ========================================================================================= */}
      <Dialog open={!!viewingDebtHistory} onOpenChange={(open) => { if (!open) setViewingDebtHistory(null); }}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto" dir="rtl">
          {viewingDebtHistory && (() => {
            const orig = parseFloat(viewingDebtHistory.originalAmount || viewingDebtHistory.amount || '0');
            const curRem = parseFloat(viewingDebtHistory.remainingAmount || '0');
            const totalPaid = Math.max(0, orig - curRem);
            const isFullyPaid = viewingDebtHistory.status === 'PAID' || curRem <= 0;
            const tenantName = viewingDebtHistory.contract?.tenantName || viewingDebtHistory.resident?.name || 'المستأجر';
            const unitDesc = viewingDebtHistory.contract?.unitDescription || (viewingDebtHistory.apartment ? `شقة ${viewingDebtHistory.apartment.number}` : '');

            return (
              <div className="space-y-4">
                <DialogHeader className="border-b pb-3 text-right">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Receipt className="h-5 w-5" />
                      </div>
                      <div>
                        <DialogTitle className="text-base font-bold text-foreground">
                          تفاصيل وسجل سداد: {viewingDebtHistory.notes || 'إيجار شهري'}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                          المستأجر: <strong className="text-foreground">{tenantName}</strong> {unitDesc ? ` | ${unitDesc}` : ''}
                        </DialogDescription>
                      </div>
                    </div>

                    {isFullyPaid ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-xs">
                        مسدد بالكامل ✓
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-900 border-amber-300 font-bold text-xs">
                        متبقي ₪{curRem.toFixed(2)}
                      </Badge>
                    )}
                  </div>
                </DialogHeader>

                {/* Summary Card */}
                <div className="grid grid-cols-3 gap-2 text-center p-3 bg-muted/20 rounded-xl border">
                  <div>
                    <div className="text-[10px] text-muted-foreground font-semibold">المبلغ المستحق</div>
                    <div className="text-xs sm:text-sm font-bold font-mono mt-0.5">₪{orig.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-700 font-semibold">المسدد حتى الآن</div>
                    <div className="text-xs sm:text-sm font-bold font-mono text-emerald-700 mt-0.5">₪{totalPaid.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-rose-700 font-semibold">المتبقي المطلوب</div>
                    <div className="text-xs sm:text-sm font-bold font-mono text-rose-700 mt-0.5">₪{curRem.toFixed(2)}</div>
                  </div>
                </div>

                {/* Payment History List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <span>الدفعات والسندات المسجلة لهذا الشهر:</span>
                  </h4>

                  {loadingDebtPayments ? (
                    <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                      <span>جاري جلب سجل الدفعات...</span>
                    </div>
                  ) : debtPaymentsHistory.length === 0 ? (
                    <div className="space-y-3">
                      <div className="py-6 text-center text-xs text-muted-foreground border rounded-lg bg-muted/10 p-4 leading-relaxed">
                        {isFullyPaid 
                          ? 'تم قيد هذا الشهر كـ (مدفوع مسبقاً قبل إنشاء العقد) أو كدفعة مسبقة دون تسجيل حركة نقدية في النظام.' 
                          : 'لا توجد دفعات مسجلة بعد لهذا القسط.'}
                      </div>

                      {isFullyPaid && (
                        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2.5 text-right">
                          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                            <span>هل هذا الشهر غير مسدد وتريد احتسابه كدين مستحق على المستأجر؟</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            إذا تم تحديد الشهر كمدفوع مسبقاً بالخطأ وتريد أن يظهر كـ <strong>(غير مسدد / مستحق سداد بقيمة ₪{orig.toFixed(2)})</strong>، اضغط على الزر أدناه:
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={!!togglingStatusMonth}
                            onClick={async () => {
                              const contractId = viewingDebtHistory.contract?.id || viewingDebtHistory.sourceId;
                              const mKey = extractMonthKey(viewingDebtHistory.notes, viewingDebtHistory.dueDate);
                              await handleToggleMonthPaidStatus(contractId, mKey, false);
                              setViewingDebtHistory(null);
                            }}
                            className="w-full h-8 text-xs border-amber-400 text-amber-900 dark:text-amber-100 bg-amber-100/60 hover:bg-amber-200 font-bold cursor-pointer gap-1.5 shadow-2xs"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>🔄 إلغاء التسديد المسبق وتعيين الشهر كـ (غير مسدد / مستحق)</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden divide-y text-xs">
                      {debtPaymentsHistory.map((p, idx) => {
                        const methodLabels: any = {
                          CASH: 'نقدي (كاش)',
                          BANK_TRANSFER: 'تحويل بنكي',
                          CHEQUE: 'شيك',
                          E_WALLET: 'محفظة إلكترونية'
                        };
                        return (
                          <div key={p.id || idx} className="p-3 hover:bg-muted/20 flex items-center justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-foreground font-mono">
                                  ₪{parseFloat(p.allocatedAmount || p.amount).toFixed(2)}
                                </span>
                                <Badge variant="outline" className="text-[10px]">
                                  {methodLabels[p.method] || p.method || 'نقدي'}
                                </Badge>
                                {p.reference && (
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    مرجع: {p.reference}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {p.notes || 'سداد قسط إيجار'}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-mono text-muted-foreground">
                                {p.createdAt ? new Date(p.createdAt).toLocaleDateString('ar-EG') : '-'}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setReceiptToPrint({
                                    payment: p,
                                    debt: viewingDebtHistory,
                                    contract: viewingDebtHistory.contract,
                                    amount: parseFloat(p.allocatedAmount || p.amount),
                                    remainingAfter: curRem,
                                    date: p.createdAt ? p.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]
                                  });
                                }}
                                className="h-6 text-[11px] px-2 gap-1 text-primary cursor-pointer"
                                title="طباعة سند قبض"
                              >
                                <Printer className="h-3 w-3" />
                                <span>سند</span>
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <DialogFooter className="mt-4 gap-2 pt-3 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setViewingDebtHistory(null)}
                    className="text-xs"
                  >
                    إغلاق
                  </Button>

                  {!isFullyPaid && (
                    <Button
                      type="button"
                      onClick={() => {
                        const targetDebt = viewingDebtHistory;
                        setViewingDebtHistory(null);
                        openPayModal(targetDebt, targetDebt.contract);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 cursor-pointer shadow-xs"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      <span>سداد دفعة إضافية (المتبقي ₪{curRem.toFixed(2)})</span>
                    </Button>
                  )}
                </DialogFooter>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* =========================================================================================
          RECEIPT PRINTABLE MODAL (سند قبض إيجار رسمي جاهز للطباعة والمشاركة)
          ========================================================================================= */}
      <Dialog open={!!receiptToPrint} onOpenChange={(open) => { if (!open) setReceiptToPrint(null); }}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          {receiptToPrint && (() => {
            const tenantName = receiptToPrint.contract?.tenantName || receiptToPrint.debt?.resident?.name || 'المستأجر';
            const unitDesc = receiptToPrint.contract?.unitDescription || (receiptToPrint.debt?.apartment ? `شقة ${receiptToPrint.debt.apartment.number}` : 'الوحدة السكنية');
            const receiptId = receiptToPrint.payment?.id || Date.now().toString().slice(-6);
            const receiptDate = receiptToPrint.date || new Date().toISOString().split('T')[0];
            const amt = parseFloat(receiptToPrint.amount || '0');
            const remAfter = parseFloat(receiptToPrint.remainingAfter || '0');

            const methodNames: any = {
              CASH: 'نقدي (كاش)',
              BANK_TRANSFER: 'تحويل بنكي',
              CHEQUE: 'شيك مصرفي',
              E_WALLET: 'محفظة إلكترونية'
            };

            const handleWhatsAppShare = () => {
              const text = `🧾 *سند قبض إيجار*\n` +
                `🏢 الوحدة: ${unitDesc}\n` +
                `👤 المستأجر: ${tenantName}\n` +
                `💰 المبلغ المستلم: ₪${amt.toFixed(2)}\n` +
                `📅 التاريخ: ${receiptDate}\n` +
                `📄 البيان: ${receiptToPrint.debt?.notes || 'سداد إيجار شهري'}\n` +
                `💳 طريقة الدفع: ${methodNames[receiptToPrint.payment?.method] || 'نقدي'}\n` +
                `🔖 المتبقي بعد السداد: ₪${remAfter.toFixed(2)}\n` +
                `✨ شكراً لالتزامكم بالسداد.`;
              window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
            };

            return (
              <div className="space-y-4">
                <DialogHeader className="text-center pb-2 border-b">
                  <div className="inline-flex items-center justify-center p-2 bg-emerald-100 text-emerald-800 rounded-full mx-auto mb-1">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <DialogTitle className="text-base font-black text-foreground">
                    سند قبض إيجار رسمي
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    تم تسجيل عملية السداد وإصدار السند المالي بنجاح
                  </DialogDescription>
                </DialogHeader>

                {/* Printable Voucher Paper */}
                <div id="printable-voucher" className="p-4 bg-amber-50/40 border border-amber-200/80 rounded-xl space-y-3 font-sans text-xs">
                  <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                    <div>
                      <div className="font-bold text-foreground">إدارة العقار السكني</div>
                      <div className="text-[10px] text-muted-foreground">سند قبض رقم: #{receiptId}</div>
                    </div>
                    <div className="text-left font-mono text-[11px] text-muted-foreground">
                      {receiptDate}
                    </div>
                  </div>

                  <div className="space-y-2 text-foreground">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">استلمنا من السيد/ة:</span>
                      <strong className="font-bold">{tenantName}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">الوحدة المؤجرة:</span>
                      <strong className="font-semibold">{unitDesc}</strong>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-white/80 border border-amber-200">
                      <span className="font-bold text-foreground">المبلغ المستلم:</span>
                      <strong className="font-mono text-base font-black text-emerald-700">₪{amt.toFixed(2)}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">وذلك عن قسط:</span>
                      <span>{receiptToPrint.debt?.notes || 'إيجار شهري'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">طريقة الدفع:</span>
                      <span>{methodNames[receiptToPrint.payment?.method] || 'نقدي (كاش)'}</span>
                    </div>

                    {receiptToPrint.payment?.reference && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">رقم المرجع / الشيك:</span>
                        <span className="font-mono">{receiptToPrint.payment.reference}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-amber-200/60 text-[11px]">
                      <span className="text-muted-foreground">الرصيد المتبقي على القسط:</span>
                      <span className={`font-mono font-bold ${remAfter > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {remAfter > 0 ? `₪${remAfter.toFixed(2)}` : '0.00 (مسدد بالكامل)'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 text-[10px] text-center text-muted-foreground border-t border-amber-200/60 flex items-center justify-between">
                    <span>توقيع المحاسب / الإدارة: _________________</span>
                    <span>ختم الصندوق</span>
                  </div>
                </div>

                <DialogFooter className="mt-3 gap-2 flex-wrap sm:flex-nowrap">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setReceiptToPrint(null)}
                    className="text-xs"
                  >
                    إغلاق
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleWhatsAppShare}
                    className="text-xs gap-1.5 font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
                  >
                    <Share2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>مشاركة عبر واتساب</span>
                  </Button>

                  <Button
                    type="button"
                    onClick={() => window.print()}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>طباعة سند القبض</span>
                  </Button>
                </DialogFooter>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* =========================================================================================
          DELETE CONFIRMATION MODAL
          ========================================================================================= */}
      <Dialog open={!!deletingContract} onOpenChange={(open) => { if (!open) setDeletingContract(null); }}>
        <DialogContent className="sm:max-w-[400px]" dir="rtl">
          {deletingContract && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-destructive flex items-center gap-2 text-base">
                  <AlertCircle className="h-5 w-5" />
                  <span>تأكيد حذف عقد الإيجار</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  هل أنت متأكد من رغبتك في حذف عقد المستأجر <strong>{deletingContract.tenantName || deletingContract.tenant?.name}</strong> للوحدة {deletingContract.unitDescription}؟ سيتم حذف الاستحقاقات المفتوحة غير المسددة المرتبطة به.
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="gap-2 mt-4">
                <Button variant="outline" onClick={() => setDeletingContract(null)}>
                  إلغاء
                </Button>
                <Button variant="destructive" onClick={handleDeleteContract}>
                  تأكيد الحذف
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default RentContracts;
