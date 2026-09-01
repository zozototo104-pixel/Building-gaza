import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building, 
  User, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  Droplets, 
  Zap, 
  FileText, 
  Plus, 
  Trash2, 
  Edit3, 
  CreditCard, 
  Printer, 
  Calendar, 
  Coins, 
  Clock, 
  ChevronRight,
  Layers,
  Phone,
  Tag,
  Wallet,
  ZapOff
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import { formatDebtSource } from '@/lib/utils';

export interface DebtItem {
  id: number;
  apartmentId: number;
  residentId?: number | null;
  amount: string;
  originalAmount: string;
  remainingAmount: string;
  paidAmount?: string;
  dueDate?: string | null;
  createdAt: string;
  status: 'OPEN' | 'PARTIALLY_PAID' | 'PAID';
  source: string; // PREVIOUS, WATER, SERVICE, RENT, EXTRA, OTHER
  notes?: string | null;
  apartment?: any;
  resident?: any;
}

export interface ApartmentDebtSummary {
  apartmentId: number;
  apartmentNumber: string;
  floor?: string;
  residentId?: number | null;
  residentName: string;
  residentType?: string;
  residentPhone?: string;
  creditBalance?: number;
  totalDebt: number;
  itemsCount: number;
  breakdown: {
    previous: number;
    water: number;
    service: number;
    rent: number;
    extra: number;
  };
  details: DebtItem[];
}

interface DebtsMatrixTableProps {
  data: ApartmentDebtSummary[];
  loading?: boolean;
  onRefresh: () => void;
}

export default function DebtsMatrixTable({ data, loading, onRefresh }: DebtsMatrixTableProps) {
  const { getToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'with_debt' | 'zero_debt'>('with_debt');
  
  // Modal states
  const [selectedApartment, setSelectedApartment] = useState<ApartmentDebtSummary | null>(null);
  const [detailTab, setDetailTab] = useState('ALL');
  
  // Item Action modals
  const [payingItem, setPayingItem] = useState<DebtItem | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'CASH' | 'CREDIT' | 'BANK_TRANSFER' | 'E_WALLET' | 'CHEQUE'>('CASH');
  const [secondaryMethod, setSecondaryMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'E_WALLET' | 'CHEQUE'>('CASH');
  const [payNotes, setPayNotes] = useState('');
  const [payReference, setPayReference] = useState('');
  const [secondaryReference, setSecondaryReference] = useState('');
  const [submittingPay, setSubmittingPay] = useState(false);

  // Quick Add Credit Modal inside DebtsMatrix
  const [isAddCreditOpen, setIsAddCreditOpen] = useState(false);
  const [addCreditAmount, setAddCreditAmount] = useState('');
  const [addCreditSource, setAddCreditSource] = useState('MANAGEMENT_REIMBURSEMENT');
  const [addCreditNotes, setAddCreditNotes] = useState('');
  const [submittingAddCredit, setSubmittingAddCredit] = useState(false);

  // Delete Item modal state
  const [itemToDelete, setItemToDelete] = useState<DebtItem | null>(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  // Edit Item modal
  const [editingItem, setEditingItem] = useState<DebtItem | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editCreatedAt, setEditCreatedAt] = useState('');
  const [editSource, setEditSource] = useState('OTHER');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Add Item modal for selected apartment
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newSource, setNewSource] = useState('PREVIOUS');
  const [newAmount, setNewAmount] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Global Add Debt Item modal (any apartment)
  const [isGlobalAddDebtOpen, setIsGlobalAddDebtOpen] = useState(false);
  const [globalAptId, setGlobalAptId] = useState('');
  const [globalSource, setGlobalSource] = useState('PREVIOUS');
  const [globalAmount, setGlobalAmount] = useState('');
  const [globalNotes, setGlobalNotes] = useState('');
  const [globalDueDate, setGlobalDueDate] = useState('');
  const [submittingGlobalAdd, setSubmittingGlobalAdd] = useState(false);

  // Filtered apartments
  const filteredList = (data || []).filter(item => {
    const matchesSearch = 
      item.apartmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.residentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.residentPhone && item.residentPhone.includes(searchTerm));
    
    if (!matchesSearch) return false;

    if (filterType === 'with_debt') return item.totalDebt > 0;
    if (filterType === 'zero_debt') return item.totalDebt <= 0;
    return true;
  });

  const totalOutstandingAll = (data || []).reduce((acc, curr) => acc + (curr.totalDebt || 0), 0);
  const apartmentsWithDebtCount = (data || []).filter(a => a.totalDebt > 0).length;
  const totalDebtItemsCount = (data || []).reduce((acc, curr) => acc + (curr.itemsCount || 0), 0);

  // Helper to get Arabic title and badge for debt source
  const getSourceBadge = (source: string) => {
    const s = (source || '').toUpperCase();
    if (s === 'PREVIOUS' || s === 'PRIOR_DEBT' || s === 'PREV') {
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">استحقاق سابق</Badge>;
    }
    if (s === 'WATER') {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">تعبئة مياه</Badge>;
    }
    if (s === 'SERVICE' || s === 'SUBSCRIPTION') {
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">اشتراك</Badge>;
    }
    if (s === 'RENT') {
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">إيجار</Badge>;
    }
    return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">{formatDebtSource(source)}</Badge>;
  };

  // Pay single item handler
  const handleSinglePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingItem) return;
    const amountVal = parseFloat(payAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      toast.error('يرجى إدخال مبلغ سداد صحيح');
      return;
    }
    if (amountVal > parseFloat(payingItem.remainingAmount)) {
      toast.error(`المبلغ المدخل أكبر من المتبقي (₪${payingItem.remainingAmount})`);
      return;
    }

    const availableCredit = selectedApartment?.creditBalance || 0;
    const isCredit = payMethod === 'CREDIT';
    const isSplit = isCredit && availableCredit > 0 && amountVal > availableCredit;
    const creditPortion = isCredit ? Math.min(amountVal, availableCredit) : 0;
    const secondaryPortion = isCredit ? Math.max(0, amountVal - availableCredit) : 0;

    setSubmittingPay(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/debts/${payingItem.id}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: amountVal,
          method: isCredit ? 'CREDIT' : payMethod,
          split: isSplit,
          creditAmount: creditPortion,
          secondaryAmount: secondaryPortion,
          secondaryMethod: secondaryMethod,
          reference: payReference,
          notes: payNotes,
          secondaryReference: secondaryReference || payReference,
          secondaryNotes: payNotes,
          residentId: payingItem.residentId || selectedApartment?.residentId
        })
      });

      const resData = await res.json();
      if (res.ok) {
        toast.success(resData.message || 'تم تسجيل السداد بنجاح');
        setPayingItem(null);
        setPayAmount('');
        setPayNotes('');
        setPayReference('');
        setSecondaryReference('');
        onRefresh();
        
        // Update current modal state if open
        if (selectedApartment) {
          const updatedDetails = selectedApartment.details.map(d => {
            if (d.id === payingItem.id) {
              const newRem = Math.max(0, parseFloat(d.remainingAmount) - amountVal);
              return {
                ...d,
                remainingAmount: newRem.toFixed(2),
                paidAmount: (parseFloat(d.paidAmount || '0') + amountVal).toFixed(2),
                status: (newRem <= 0 ? 'PAID' : 'PARTIALLY_PAID') as any
              };
            }
            return d;
          });
          const newTotal = updatedDetails.filter(d => d.status !== 'PAID').reduce((s, d) => s + parseFloat(d.remainingAmount), 0);
          const newCreditBal = isCredit ? Math.max(0, availableCredit - creditPortion) : availableCredit;
          setSelectedApartment({
            ...selectedApartment,
            totalDebt: newTotal,
            creditBalance: newCreditBal,
            details: updatedDetails
          });
        }
      } else {
        toast.error(resData.error || 'حدث خطأ أثناء السداد');
      }
    } catch (err) {
      toast.error('فشلت العملية، يرجى المحاولة لاحقاً');
    }
    setSubmittingPay(false);
  };

  // Edit single item handler
  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const amountVal = parseFloat(editAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }

    setSubmittingEdit(true);
    try {
      const token = await getToken();
      // Calculate remaining amount preserving past payments
      const oldOrig = parseFloat(editingItem.originalAmount || editingItem.amount) || 0;
      const oldRem = parseFloat(editingItem.remainingAmount) || 0;
      const paidSoFar = Math.max(0, oldOrig - oldRem);
      const calculatedRem = Math.max(0, amountVal - paidSoFar);

      const res = await fetch(`/api/debts/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          originalAmount: amountVal,
          remainingAmount: calculatedRem,
          notes: editNotes,
          dueDate: editDueDate || editCreatedAt || null,
          createdAt: editCreatedAt || editDueDate || null,
          date: editCreatedAt || editDueDate || null,
          source: editSource
        })
      });

      if (res.ok) {
        const updatedRecord = await res.json();
        toast.success('تم تحديث بيانات بند الدين وتاريخه بنجاح');
        setEditingItem(null);

        // Update selected apartment in-place for real-time visual feedback
        if (selectedApartment) {
          const updatedDetails = selectedApartment.details.map(d => {
            if (d.id === editingItem.id) {
              return {
                ...d,
                ...updatedRecord,
                originalAmount: amountVal.toString(),
                amount: amountVal.toString(),
                remainingAmount: calculatedRem.toString(),
                notes: editNotes,
                dueDate: editDueDate ? new Date(editDueDate).toISOString() : (editCreatedAt ? new Date(editCreatedAt).toISOString() : d.dueDate),
                createdAt: editCreatedAt ? new Date(editCreatedAt).toISOString() : (editDueDate ? new Date(editDueDate).toISOString() : d.createdAt),
                source: editSource,
                status: calculatedRem <= 0 ? 'PAID' : (calculatedRem < amountVal ? 'PARTIALLY_PAID' : 'OPEN')
              };
            }
            return d;
          });
          const newTotal = updatedDetails
            .filter(d => d.status !== 'PAID')
            .reduce((s, d) => s + (parseFloat(d.remainingAmount) || 0), 0);

          setSelectedApartment(prev => prev ? {
            ...prev,
            totalDebt: newTotal,
            details: updatedDetails
          } : null);
        }

        onRefresh();
      } else {
        const data = await res.json();
        toast.error(data.error || 'فشل التعديل');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء التعديل');
    }
    setSubmittingEdit(false);
  };

  // Delete single item handler
  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    const debtId = itemToDelete.id;
    setSubmittingDelete(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/debts/${debtId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success('تم حذف بند الدين بنجاح');
        setItemToDelete(null);
        
        if (selectedApartment) {
          const updatedDetails = selectedApartment.details.filter(d => d.id !== debtId);
          const newTotal = updatedDetails.filter(d => d.status !== 'PAID').reduce((s, d) => s + (parseFloat(d.remainingAmount) || 0), 0);
          setSelectedApartment(prev => prev ? {
            ...prev,
            totalDebt: newTotal,
            itemsCount: updatedDetails.length,
            details: updatedDetails
          } : null);
        }

        onRefresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'فشل حذف بند الدين');
      }
    } catch (err: any) {
      toast.error('حدث خطأ أثناء الحذف: ' + (err?.message || ''));
    } finally {
      setSubmittingDelete(false);
    }
  };

  // Quick Add Credit handler
  const handleQuickAddCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApartment) return;
    const amountVal = parseFloat(addCreditAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      toast.error('يرجى إدخال مبلغ رصيد صحيح');
      return;
    }
    setSubmittingAddCredit(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          apartmentId: selectedApartment.apartmentId,
          residentId: selectedApartment.residentId || null,
          amount: amountVal,
          source: addCreditSource,
          notes: addCreditNotes || `رصيد دائن لشقة ${selectedApartment.apartmentNumber}`
        })
      });
      if (res.ok) {
        toast.success(`تمت إضافة رصيد دائن بقيمة ₪${amountVal.toFixed(2)} بنجاح`);
        setIsAddCreditOpen(false);
        setAddCreditAmount('');
        setAddCreditNotes('');
        setSelectedApartment(prev => prev ? { ...prev, creditBalance: (prev.creditBalance || 0) + amountVal } : null);
        onRefresh();
      } else {
        const err = await res.json();
        toast.error(err.error || 'فشل إضافة الرصيد الدائن');
      }
    } catch (e) {
      toast.error('حدث خطأ');
    } finally {
      setSubmittingAddCredit(false);
    }
  };

  // Add new debt item to the selected apartment
  const handleAddNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApartment) return;
    const amountVal = parseFloat(newAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح أكبر من الصفر');
      return;
    }

    setSubmittingAdd(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/debts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          apartmentId: selectedApartment.apartmentId,
          residentId: selectedApartment.residentId || null,
          amount: amountVal,
          originalAmount: amountVal,
          source: newSource,
          notes: newNotes,
          dueDate: newDueDate || null
        })
      });

      const resData = await res.json();
      if (res.ok) {
        toast.success('تمت إضافة بند الدين بنجاح');
        setIsAddOpen(false);
        setNewAmount('');
        setNewNotes('');
        setNewDueDate('');

        // Immediate state update for the open apartment dialog
        const newItem: DebtItem = {
          id: resData.id || Date.now(),
          apartmentId: selectedApartment.apartmentId,
          residentId: resData.residentId || selectedApartment.residentId || null,
          amount: amountVal.toFixed(2),
          originalAmount: amountVal.toFixed(2),
          paidAmount: '0.00',
          remainingAmount: amountVal.toFixed(2),
          status: 'OPEN',
          source: newSource,
          notes: newNotes,
          dueDate: newDueDate || null,
          createdAt: new Date().toISOString()
        };

        setSelectedApartment(prev => {
          if (!prev) return null;
          const updatedDetails = [newItem, ...prev.details];
          const updatedTotal = updatedDetails
            .filter(d => d.status !== 'PAID')
            .reduce((s, d) => s + (parseFloat(d.remainingAmount) || 0), 0);
          return {
            ...prev,
            totalDebt: updatedTotal,
            itemsCount: updatedDetails.length,
            details: updatedDetails
          };
        });

        onRefresh();
      } else {
        toast.error(resData.error || 'فشلت إضافة البند المالي');
      }
    } catch (err: any) {
      toast.error('حدث خطأ أثناء إضافة البند: ' + (err?.message || 'يرجى المحاولة لاحقاً'));
    } finally {
      setSubmittingAdd(false);
    }
  };

  // Global Add new debt item (for any selected apartment)
  const handleGlobalAddNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const aptIdNum = parseInt(globalAptId);
    if (isNaN(aptIdNum)) {
      toast.error('يرجى اختيار الشقة');
      return;
    }
    const amountVal = parseFloat(globalAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح أكبر من الصفر');
      return;
    }

    setSubmittingGlobalAdd(true);
    try {
      const token = await getToken();
      const targetApt = (data || []).find(a => a.apartmentId === aptIdNum);

      const res = await fetch('/api/debts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          apartmentId: aptIdNum,
          residentId: targetApt?.residentId || null,
          amount: amountVal,
          originalAmount: amountVal,
          source: globalSource,
          notes: globalNotes,
          dueDate: globalDueDate || null
        })
      });

      const resData = await res.json();
      if (res.ok) {
        toast.success(`تمت إضافة البند المالي بقيمة ₪${amountVal.toFixed(2)} بنجاح`);
        setIsGlobalAddDebtOpen(false);
        setGlobalAmount('');
        setGlobalNotes('');
        setGlobalDueDate('');

        // If this apartment is currently selected in the details modal, update it
        if (selectedApartment && selectedApartment.apartmentId === aptIdNum) {
          const newItem: DebtItem = {
            id: resData.id || Date.now(),
            apartmentId: aptIdNum,
            residentId: resData.residentId || targetApt?.residentId || null,
            amount: amountVal.toFixed(2),
            originalAmount: amountVal.toFixed(2),
            paidAmount: '0.00',
            remainingAmount: amountVal.toFixed(2),
            status: 'OPEN',
            source: globalSource,
            notes: globalNotes,
            dueDate: globalDueDate || null,
            createdAt: new Date().toISOString()
          };

          setSelectedApartment(prev => {
            if (!prev) return null;
            const updatedDetails = [newItem, ...prev.details];
            const updatedTotal = updatedDetails
              .filter(d => d.status !== 'PAID')
              .reduce((s, d) => s + (parseFloat(d.remainingAmount) || 0), 0);
            return {
              ...prev,
              totalDebt: updatedTotal,
              itemsCount: updatedDetails.length,
              details: updatedDetails
            };
          });
        }

        onRefresh();
      } else {
        toast.error(resData.error || 'فشلت إضافة البند المالي');
      }
    } catch (err: any) {
      toast.error('حدث خطأ أثناء حفظ البند: ' + (err?.message || ''));
    } finally {
      setSubmittingGlobalAdd(false);
    }
  };

  // Filter details inside modal
  const getFilteredDetails = () => {
    if (!selectedApartment) return [];
    if (detailTab === 'ALL') return selectedApartment.details;
    if (detailTab === 'PREVIOUS') {
      return selectedApartment.details.filter(d => ['PREVIOUS', 'PRIOR_DEBT', 'PREV'].includes((d.source || '').toUpperCase()));
    }
    if (detailTab === 'WATER') {
      return selectedApartment.details.filter(d => (d.source || '').toUpperCase() === 'WATER');
    }
    if (detailTab === 'SERVICE') {
      return selectedApartment.details.filter(d => ['SERVICE', 'SUBSCRIPTION'].includes((d.source || '').toUpperCase()));
    }
    if (detailTab === 'RENT') {
      return selectedApartment.details.filter(d => (d.source || '').toUpperCase() === 'RENT');
    }
    if (detailTab === 'EXTRA') {
      return selectedApartment.details.filter(d => !['PREVIOUS', 'PRIOR_DEBT', 'PREV', 'WATER', 'SERVICE', 'SUBSCRIPTION', 'RENT'].includes((d.source || '').toUpperCase()));
    }
    return selectedApartment.details;
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Main Unified Debts Table Card */}
      <Card className="shadow-sm border">
        <CardHeader className="p-4 sm:p-6 pb-4 border-b bg-card">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">جدول الديون الموحدة في لوحة التحكم</CardTitle>
                  <CardDescription className="text-sm">
                    يعرض كل صف شقة واحدة فقط بمبلغ الدين الموحد الشامل لكافة البنود (مياه، اشتراكات، إيجار، استحقاقات سابقة، بنود إضافية).
                  </CardDescription>
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex bg-muted/60 p-1 rounded-lg border text-xs">
                <button 
                  type="button"
                  onClick={() => setFilterType('with_debt')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-all ${filterType === 'with_debt' ? 'bg-background shadow-xs text-primary font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  عليها ديون ({apartmentsWithDebtCount})
                </button>
                <button 
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-all ${filterType === 'all' ? 'bg-background shadow-xs text-primary font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  كافة الشقق ({(data || []).length})
                </button>
                <button 
                  type="button"
                  onClick={() => setFilterType('zero_debt')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-all ${filterType === 'zero_debt' ? 'bg-background shadow-xs text-green-700 font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  خالصة الذمة ({(data || []).length - apartmentsWithDebtCount})
                </button>
              </div>

              <Button 
                size="sm" 
                onClick={() => {
                  setGlobalAptId(data && data.length > 0 ? data[0].apartmentId.toString() : '');
                  setIsGlobalAddDebtOpen(true);
                  setGlobalAmount('');
                  setGlobalNotes('');
                  setGlobalDueDate('');
                  setGlobalSource('PREVIOUS');
                }} 
                className="gap-1.5 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                إضافة بند مالي
              </Button>

              <Button variant="outline" size="sm" onClick={onRefresh} className="gap-1.5 text-xs">
                <Clock className="h-3.5 w-3.5" />
                تحديث
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-4 relative max-w-md">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="ابحث برقم الشقة، اسم الساكن، أو رقم الجوال..." 
              className="pr-9 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-right font-bold w-[140px]">رقم الشقة</TableHead>
                  <TableHead className="text-right font-bold">اسم الساكن</TableHead>
                  <TableHead className="text-right font-bold">ملخص البنود المستحقة</TableHead>
                  <TableHead className="text-right font-bold w-[180px]">مبلغ الدين الموحد</TableHead>
                  <TableHead className="text-center font-bold w-[140px]">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      جاري تحميل جدول الديون الموحدة...
                    </TableCell>
                  </TableRow>
                ) : filteredList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CheckCircle2 className="h-8 w-8 text-green-500" />
                        <span className="font-semibold text-base">لا توجد ديون مطابقة للمعايير المحددة</span>
                        <span className="text-xs text-muted-foreground">جميع الشقق المعروضة مسددة بالكامل أو لا تطابق البحث.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredList.map((row) => {
                    const hasDebt = row.totalDebt > 0;
                    return (
                      <TableRow 
                        key={row.apartmentId} 
                        className={`hover:bg-muted/30 transition-colors ${hasDebt ? 'bg-destructive/5 font-medium' : ''}`}
                      >
                        {/* Apartment Number & Floor */}
                        <TableCell className="font-bold">
                          <div className="flex items-center gap-2">
                            <span className="text-base text-primary">شقة {row.apartmentNumber}</span>
                            {row.floor && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {row.floor}
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        {/* Resident Info */}
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="font-semibold text-foreground">{row.residentName}</span>
                              {row.residentId && row.residentType ? (
                                <Badge 
                                  variant="secondary" 
                                  className={`text-[10px] px-1.5 py-0 ${row.residentType === 'OWNER' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}
                                >
                                  {row.residentType === 'OWNER' ? 'مالك' : 'مستأجر'}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground border-dashed bg-muted/20">
                                  شاغرة / غير مسكن
                                </Badge>
                              )}
                            </div>
                            {row.residentPhone && (
                              <span className="text-xs text-muted-foreground mt-0.5" dir="ltr">
                                {row.residentPhone}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Breakdown summary tags */}
                        <TableCell>
                          {row.details.length === 0 || !hasDebt ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-700 font-semibold bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              خالص الذمة (لا توجد مستحقات)
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5 items-center">
                              {row.breakdown.water > 0 && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs py-0.5 gap-1">
                                  <Droplets className="h-3 w-3" />
                                  مياه: ₪{row.breakdown.water.toLocaleString()}
                                </Badge>
                              )}
                              {row.breakdown.service > 0 && (
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs py-0.5 gap-1">
                                  <Zap className="h-3 w-3" />
                                  اشتراك: ₪{row.breakdown.service.toLocaleString()}
                                </Badge>
                              )}
                              {row.breakdown.rent > 0 && (
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs py-0.5 gap-1">
                                  <FileText className="h-3 w-3" />
                                  إيجار: ₪{row.breakdown.rent.toLocaleString()}
                                </Badge>
                              )}
                              {row.breakdown.previous > 0 && (
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs py-0.5 gap-1">
                                  <Clock className="h-3 w-3" />
                                  سابق: ₪{row.breakdown.previous.toLocaleString()}
                                </Badge>
                              )}
                              {row.breakdown.extra > 0 && (
                                <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-xs py-0.5 gap-1">
                                  <Tag className="h-3 w-3" />
                                  إضافي: ₪{row.breakdown.extra.toLocaleString()}
                                </Badge>
                              )}
                            </div>
                          )}
                        </TableCell>

                        {/* Unified Total Debt Amount (Clear Display) */}
                        <TableCell>
                          <div
                            className={`flex items-center justify-between w-full px-3 py-1.5 rounded-lg border text-right ${
                              hasDebt 
                                ? 'bg-destructive/10 border-destructive/30 text-destructive' 
                                : 'bg-green-50 border-green-200 text-green-700'
                            }`}
                          >
                            <span className="text-base font-extrabold">
                              ₪{row.totalDebt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            {hasDebt ? (
                              <span className="text-[11px] font-semibold text-destructive/80">مستحق</span>
                            ) : (
                              <span className="text-[11px] font-semibold text-green-700">مسدد</span>
                            )}
                          </div>
                        </TableCell>

                        {/* Details Action Button */}
                        <TableCell className="text-center">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs font-semibold gap-1 hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                            onClick={() => {
                              setSelectedApartment(row);
                              setDetailTab('ALL');
                              setIsAddOpen(false);
                            }}
                            title="عرض تفاصيل ديون الشقة"
                          >
                            <span>عرض التفاصيل</span>
                            <ChevronRight className="h-3.5 w-3.5" />
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

      {/* =========================================================================================
          DETAILED APARTMENT DEBTS MODAL (نافذة تفصيلية تحتوي على كل بند منفصل)
          ========================================================================================= */}
      <Dialog open={!!selectedApartment} onOpenChange={(open) => { if (!open) { setSelectedApartment(null); setIsAddOpen(false); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          {selectedApartment && (
            <div className="space-y-6">
              {/* Header */}
              <DialogHeader className="border-b pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
                      <Building className="h-6 w-6" />
                    </div>
                    <div>
                      <DialogTitle className="text-2xl font-bold flex flex-wrap items-center gap-2">
                        <span>كشف ديون وتفاصيل شقة {selectedApartment.apartmentNumber}</span>
                        {selectedApartment.floor && (
                          <Badge variant="outline" className="text-xs font-normal">
                            الطابق: {selectedApartment.floor}
                          </Badge>
                        )}
                      </DialogTitle>
                      <DialogDescription className="text-sm mt-1 flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1 text-foreground font-semibold">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {selectedApartment.residentName}
                        </span>
                        {selectedApartment.residentPhone && (
                          <span className="flex items-center gap-1 text-muted-foreground" dir="ltr">
                            <Phone className="h-3.5 w-3.5" />
                            {selectedApartment.residentPhone}
                          </span>
                        )}
                      </DialogDescription>
                    </div>
                  </div>

                  {/* Unified Total Banner & Credit Balance */}
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedApartment.creditBalance !== undefined && selectedApartment.creditBalance > 0 && (
                      <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 text-right flex flex-col items-start sm:items-end justify-center min-w-[160px]">
                        <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                          <Wallet className="h-3.5 w-3.5 text-emerald-600" />
                          رصيد دائن متاح للساكن
                        </span>
                        <span className="text-2xl font-extrabold text-emerald-700 font-mono">
                          ₪{selectedApartment.creditBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}

                    <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-right flex flex-col items-start sm:items-end justify-center min-w-[170px]">
                      <span className="text-xs font-bold text-destructive">مبلغ الدين الموحد المستحق</span>
                      <span className="text-2xl font-extrabold text-destructive">
                        ₪{selectedApartment.totalDebt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              {/* Action Bar with Add Button and Print */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-muted/30 rounded-xl border">
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant={isAddOpen ? "secondary" : "default"}
                    onClick={() => setIsAddOpen(!isAddOpen)}
                    className="gap-1.5 text-xs font-bold shadow-xs"
                  >
                    <Plus className="h-4 w-4" />
                    {isAddOpen ? 'إخفاء نموذج الإضافة' : 'إضافة بند مالي للشقة'}
                  </Button>

                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setIsAddCreditOpen(true);
                      setAddCreditAmount('');
                      setAddCreditNotes(`رصيد دائن - شقة ${selectedApartment.apartmentNumber}`);
                    }}
                    className="gap-1.5 text-xs font-bold border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  >
                    <Coins className="h-4 w-4 text-emerald-600" />
                    إضافة رصيد دائن للساكن
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.print()}
                    className="gap-1.5 text-xs h-8"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    طباعة كشف الحساب
                  </Button>
                </div>
              </div>

              {/* Responsive Category Filter Chips (No base-ui tabs collision) */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground">تصنيف البنود المالية:</div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDetailTab('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      detailTab === 'ALL'
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground border-border'
                    }`}
                  >
                    الكل ({selectedApartment.details.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setDetailTab('PREVIOUS')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      detailTab === 'PREVIOUS'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-background hover:bg-purple-50 text-purple-700 border-purple-200'
                    }`}
                  >
                    استحقاقات سابقة ({selectedApartment.details.filter(d => ['PREVIOUS', 'PRIOR_DEBT', 'PREV'].includes((d.source || '').toUpperCase())).length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setDetailTab('WATER')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      detailTab === 'WATER'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-background hover:bg-blue-50 text-blue-700 border-blue-200'
                    }`}
                  >
                    تعبئة مياه ({selectedApartment.details.filter(d => (d.source || '').toUpperCase() === 'WATER').length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setDetailTab('SERVICE')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      detailTab === 'SERVICE'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-background hover:bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    اشتراكات ({selectedApartment.details.filter(d => ['SERVICE', 'SUBSCRIPTION'].includes((d.source || '').toUpperCase())).length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setDetailTab('RENT')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      detailTab === 'RENT'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-background hover:bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    إيجار ({selectedApartment.details.filter(d => (d.source || '').toUpperCase() === 'RENT').length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setDetailTab('EXTRA')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      detailTab === 'EXTRA'
                        ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                        : 'bg-background hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    بنود إضافية ({selectedApartment.details.filter(d => !['PREVIOUS', 'PRIOR_DEBT', 'PREV', 'WATER', 'SERVICE', 'SUBSCRIPTION', 'RENT'].includes((d.source || '').toUpperCase())).length})
                  </button>
                </div>
              </div>

              {/* Dedicated Add Item Section inside Modal (Collapsible and clean) */}
              {isAddOpen && (
                <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-primary/20 pb-2">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                      <Plus className="h-4 w-4" />
                      <span>إضافة بند مالي جديد لشقة {selectedApartment.apartmentNumber} ({selectedApartment.residentName})</span>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsAddOpen(false)}
                      className="text-xs h-7 px-2"
                    >
                      إلغاء
                    </Button>
                  </div>

                  <form onSubmit={handleAddNewItem} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="grid gap-1">
                        <label className="text-xs font-semibold text-foreground">نوع البند</label>
                        <select 
                          value={newSource}
                          onChange={(e) => setNewSource(e.target.value)}
                          className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                          <option value="PREVIOUS">استحقاق سابق</option>
                          <option value="WATER">تعبئة مياه</option>
                          <option value="SERVICE">اشتراك خدمات</option>
                          <option value="RENT">إيجار</option>
                          <option value="OTHER">بند إضافي / آخر</option>
                        </select>
                      </div>

                      <div className="grid gap-1">
                        <label className="text-xs font-semibold text-foreground">المبلغ المستحق (₪)</label>
                        <Input 
                          type="number" 
                          step="0.01" 
                          value={newAmount}
                          onChange={(e) => setNewAmount(e.target.value)}
                          placeholder="0.00 ₪"
                          required
                          className="h-9 text-xs bg-background"
                        />
                      </div>

                      <div className="grid gap-1">
                        <label className="text-xs font-semibold text-foreground">تاريخ الاستحقاق</label>
                        <Input 
                          type="date" 
                          value={newDueDate}
                          onChange={(e) => setNewDueDate(e.target.value)}
                          className="h-9 text-xs bg-background"
                        />
                      </div>

                      <div className="grid gap-1">
                        <label className="text-xs font-semibold text-foreground">البيان / الوصف</label>
                        <Input 
                          value={newNotes}
                          onChange={(e) => setNewNotes(e.target.value)}
                          placeholder="مثال: اشتراك شهر أغسطس"
                          required
                          className="h-9 text-xs bg-background"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsAddOpen(false)}
                        className="text-xs"
                      >
                        إلغاء
                      </Button>
                      <Button 
                        type="submit" 
                        size="sm" 
                        disabled={submittingAdd} 
                        className="font-bold text-xs"
                      >
                        {submittingAdd ? 'جاري الإضافة...' : 'حفظ البند المالي'}
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Breakdown Cards by Item Type */}
              <div className="space-y-4">
                {getFilteredDetails().length === 0 ? (
                  <div className="border rounded-xl p-8 text-center bg-muted/20">
                    <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
                    <p className="font-bold text-foreground">لا توجد بنود مستحقة في هذا القسم</p>
                    <p className="text-xs text-muted-foreground mt-1">كافة الحسابات ضمن هذا التصنيف مسددة بالكامل.</p>
                  </div>
                ) : (
                  getFilteredDetails().map((item) => {
                    const src = (item.source || 'OTHER').toUpperCase();
                    const isPaid = item.status === 'PAID';
                    const isPartial = item.status === 'PARTIALLY_PAID';

                    return (
                      <div 
                        key={item.id} 
                        className={`rounded-xl border p-4 transition-all ${
                          isPaid ? 'bg-muted/20 opacity-75 border-muted' : 'bg-card border-border shadow-xs hover:border-primary/50'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b">
                          <div className="flex items-center gap-2.5">
                            {getSourceBadge(item.source)}
                            <span className="font-bold text-base text-foreground">
                              {item.notes || `بند مالي #${item.id}`}
                            </span>
                            <Badge 
                              variant={isPaid ? 'secondary' : isPartial ? 'outline' : 'destructive'} 
                              className={`text-[10px] ${isPaid ? 'bg-green-100 text-green-800 border-green-200' : isPartial ? 'bg-amber-100 text-amber-800 border-amber-200' : ''}`}
                            >
                              {isPaid ? 'مسدد بالكامل' : isPartial ? 'مسدد جزئياً' : 'مفتوح / غير مسدد'}
                            </Badge>
                          </div>

                          {/* Amounts highlight */}
                          <div className="flex items-center gap-4 bg-muted/40 px-3 py-1.5 rounded-lg text-sm">
                            <div>
                              <span className="text-xs text-muted-foreground ml-1">الأصل:</span>
                              <span className="font-bold">₪{parseFloat(item.originalAmount || item.amount).toFixed(2)}</span>
                            </div>
                            <div className="border-r pr-3">
                              <span className="text-xs text-muted-foreground ml-1">المدفوع:</span>
                              <span className="font-bold text-green-600">₪{parseFloat(item.paidAmount || '0').toFixed(2)}</span>
                            </div>
                            <div className="border-r pr-3">
                              <span className="text-xs text-muted-foreground ml-1">المتبقي:</span>
                              <span className="font-extrabold text-destructive">₪{parseFloat(item.remainingAmount).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Specific Detailed Metadata According to Source as in User Screenshot */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 text-xs text-muted-foreground">
                          {/* 1. استحقاق سابق */}
                          {(src === 'PREVIOUS' || src === 'PRIOR_DEBT' || src === 'PREV') && (
                            <>
                              <div>
                                <span className="block font-semibold text-foreground">الوصف / البيان:</span>
                                <span>{item.notes || 'استحقاقات سابقة متراكمة'}</span>
                              </div>
                              <div>
                                <span className="block font-semibold text-foreground">تاريخ التسجيل:</span>
                                <span>{new Date(item.createdAt).toLocaleDateString('ar-EG')}</span>
                              </div>
                              <div>
                                <span className="block font-semibold text-foreground">تاريخ الاستحقاق:</span>
                                <span>{item.dueDate ? new Date(item.dueDate).toLocaleDateString('ar-EG') : 'غير محدد'}</span>
                              </div>
                              <div>
                                <span className="block font-semibold text-foreground">المرفقات:</span>
                                <span className="text-muted-foreground">لا يوجد مرفق</span>
                              </div>
                            </>
                          )}

                          {/* 2. تعبئة مياه */}
                          {src === 'WATER' && (
                            <>
                              <div>
                                <span className="block font-semibold text-foreground">تاريخ التعبئة:</span>
                                <span>{new Date(item.createdAt).toLocaleDateString('ar-EG')}</span>
                              </div>
                              <div>
                                <span className="block font-semibold text-foreground">تفاصيل الفاتورة:</span>
                                <span>{item.notes || 'فاتورة استهلاك عداد مياه'}</span>
                              </div>
                              <div>
                                <span className="block font-semibold text-foreground">تاريخ الاستحقاق:</span>
                                <span>{item.dueDate ? new Date(item.dueDate).toLocaleDateString('ar-EG') : 'خلال 14 يوم'}</span>
                              </div>
                              <div>
                                <span className="block font-semibold text-foreground">حالة السداد:</span>
                                <span className="font-bold text-foreground">{isPaid ? 'مسدد' : isPartial ? 'جزئي' : 'غير مدفوع'}</span>
                              </div>
                            </>
                          )}

                          {/* 3. اشتراك */}
                          {(src === 'SERVICE' || src === 'SUBSCRIPTION') && (
                            <>
                              <div>
                                <span className="block font-semibold text-foreground">اسم الاشتراك:</span>
                                <span>{item.notes || 'اشتراك خدمات البناية'}</span>
                              </div>
                              <div>
                                <span className="block font-semibold text-foreground">تاريخ الاستحقاق:</span>
                                <span>{item.dueDate ? new Date(item.dueDate).toLocaleDateString('ar-EG') : new Date(item.createdAt).toLocaleDateString('ar-EG')}</span>
                              </div>
                              <div>
                                <span className="block font-semibold text-foreground">المبلغ المستحق:</span>
                                <span>₪{parseFloat(item.originalAmount || item.amount).toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="block font-semibold text-foreground">المتبقي:</span>
                                <span className="font-bold text-destructive">₪{parseFloat(item.remainingAmount).toFixed(2)}</span>
                              </div>
                            </>
                          )}

                          {/* 4. إيجار */}
                          {src === 'RENT' && (
                            <>
                              <div>
                                <span className="block font-semibold text-foreground">المستأجر:</span>
                                <span>{selectedApartment.residentName}</span>
                              </div>
                              <div>
                                <span className="block font-semibold text-foreground">شهر / فترة الإيجار:</span>
                                <span>{item.notes || 'إيجار شهري'}</span>
                              </div>
                              <div>
                                <span className="block font-semibold text-foreground">تاريخ الاستحقاق:</span>
                                <span>{item.dueDate ? new Date(item.dueDate).toLocaleDateString('ar-EG') : new Date(item.createdAt).toLocaleDateString('ar-EG')}</span>
                              </div>
                              <div>
                                <span className="block font-semibold text-foreground">المتبقي:</span>
                                <span className="font-bold text-destructive">₪{parseFloat(item.remainingAmount).toFixed(2)}</span>
                              </div>
                            </>
                          )}

                          {/* 5. بند إضافي / آخر */}
                          {!['PREVIOUS', 'PRIOR_DEBT', 'PREV', 'WATER', 'SERVICE', 'SUBSCRIPTION', 'RENT'].includes(src) && (
                            <>
                              <div>
                                <span className="block font-semibold text-foreground">اسم البند:</span>
                                <span>{item.notes || 'بند إضافي'}</span>
                              </div>
                              <div>
                                <span className="block font-semibold text-foreground">التاريخ:</span>
                                <span>{new Date(item.createdAt).toLocaleDateString('ar-EG')}</span>
                              </div>
                              <div>
                                <span className="block font-semibold text-foreground">تاريخ الاستحقاق:</span>
                                <span>{item.dueDate ? new Date(item.dueDate).toLocaleDateString('ar-EG') : 'غير محدد'}</span>
                              </div>
                              <div>
                                <span className="block font-semibold text-foreground">المتبقي:</span>
                                <span className="font-bold text-destructive">₪{parseFloat(item.remainingAmount).toFixed(2)}</span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Individual Item Actions (سداد كامل أو جزئي، تعديل السجل، حذف) */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t bg-muted/10 -mx-4 -mb-4 p-3 rounded-b-xl">
                          <span className="text-[11px] text-muted-foreground">
                            * سداد هذا البند يؤثر عليه وحده ولا يؤدي إلى سداد البنود الأخرى.
                          </span>

                          <div className="flex items-center gap-2">
                            {!isPaid && (
                              <>
                                {selectedApartment.creditBalance !== undefined && selectedApartment.creditBalance > 0 && (
                                  <Button 
                                    size="sm" 
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 h-8"
                                    onClick={() => {
                                      setPayingItem(item);
                                      setPayAmount(item.remainingAmount);
                                      setPayMethod('CREDIT');
                                      setPayNotes(`خصم وتأكيد من الرصيد الدائن للساكن`);
                                      setPayReference('CREDIT_DEDUCTION');
                                    }}
                                  >
                                    <Wallet className="h-3.5 w-3.5" />
                                    ⚡ خصم من الرصيد الدائن
                                  </Button>
                                )}

                                <Button 
                                  size="sm" 
                                  className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs gap-1.5 h-8"
                                  onClick={() => {
                                    setPayingItem(item);
                                    setPayAmount(item.remainingAmount);
                                    setPayMethod('CASH');
                                    setPayNotes('');
                                    setPayReference('');
                                  }}
                                >
                                  <CreditCard className="h-3.5 w-3.5" />
                                  تسجيل سداد نقدي / بنكي
                                </Button>
                              </>
                            )}

                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-xs h-8 gap-1 cursor-pointer font-bold"
                              onClick={() => {
                                setEditingItem(item);
                                setEditAmount(item.originalAmount || item.amount);
                                setEditNotes(item.notes || '');
                                const dDue = item.dueDate ? new Date(item.dueDate) : null;
                                const dCreated = item.createdAt ? new Date(item.createdAt) : null;
                                const dueIso = dDue && !isNaN(dDue.getTime()) ? dDue.toISOString().split('T')[0] : '';
                                const createdIso = dCreated && !isNaN(dCreated.getTime()) ? dCreated.toISOString().split('T')[0] : '';
                                setEditDueDate(dueIso || createdIso || new Date().toISOString().split('T')[0]);
                                setEditCreatedAt(createdIso || dueIso || new Date().toISOString().split('T')[0]);
                                setEditSource(item.source || 'OTHER');
                              }}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              تعديل
                            </Button>

                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive hover:bg-destructive/10 text-xs h-8 gap-1 cursor-pointer"
                              onClick={() => setItemToDelete(item)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              حذف
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <DialogFooter className="border-t pt-4 flex flex-row items-center justify-between">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.print()}
                  className="gap-1.5 text-xs"
                >
                  <Printer className="h-3.5 w-3.5" />
                  طباعة كشف الحساب
                </Button>

                <Button variant="secondary" onClick={() => setSelectedApartment(null)}>
                  إغلاق
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* =========================================================================================
          SINGLE ITEM PAYMENT MODAL (تسجيل سداد لبند محدد مع دعم الخصم من الرصيد والسداد المركب)
          ========================================================================================= */}
      <Dialog open={!!payingItem} onOpenChange={(open) => { if (!open) setPayingItem(null); }}>
        <DialogContent className="sm:max-w-[480px]" dir="rtl">
          {payingItem && (() => {
            const itemRemaining = parseFloat(payingItem.remainingAmount) || 0;
            const currentPayAmount = parseFloat(payAmount) || 0;
            const availableCredit = selectedApartment?.creditBalance || 0;
            const isCreditMode = payMethod === 'CREDIT';
            const isSplit = isCreditMode && availableCredit > 0 && currentPayAmount > availableCredit;
            const creditPortion = isCreditMode ? Math.min(currentPayAmount, availableCredit) : 0;
            const secondaryPortion = isCreditMode ? Math.max(0, currentPayAmount - availableCredit) : 0;

            return (
              <form onSubmit={handleSinglePayment} className="space-y-4">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-lg">
                    <CreditCard className="h-5 w-5 text-green-600" />
                    <span>تسجيل سداد لبند: {payingItem.notes || formatDebtSource(payingItem.source)}</span>
                  </DialogTitle>
                  <DialogDescription>
                    شقة {selectedApartment?.apartmentNumber} ({selectedApartment?.residentName}) - المتبقي في هذا البند: <strong className="text-destructive font-bold">₪{payingItem.remainingAmount}</strong>
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 mt-2">
                  {/* Credit balance alert & toggle banner */}
                  {availableCredit > 0 ? (
                    <div className={`p-3 rounded-lg border text-xs transition-all ${
                      isCreditMode 
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-xs' 
                        : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold flex items-center gap-1.5 text-sm">
                          <Wallet className="h-4 w-4 text-emerald-700" />
                          رصيد دائن متاح للساكن: <span className="font-mono text-base font-extrabold text-emerald-700">₪{availableCredit.toFixed(2)}</span>
                        </span>
                        {!isCreditMode ? (
                          <button 
                            type="button" 
                            onClick={() => setPayMethod('CREDIT')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            ⚡ تفعيل الخصم من الرصيد
                          </button>
                        ) : (
                          <Badge className="bg-emerald-600 text-white text-[10px]">مُفعّل الخصم</Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-emerald-800 leading-relaxed">
                        {isCreditMode 
                          ? 'سيتم خصم المبلغ من رصيد الساكن الدائن تلقائياً.' 
                          : 'يمكنك خصم هذا الاستحقاق من الرصيد الدائن المتاح للساكن بالضغط على الزر أعلاه.'}
                      </p>
                    </div>
                  ) : isCreditMode && (
                    <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 text-xs">
                      ⚠️ لا يوجد رصيد دائن متاح للساكن حالياً. يرجى اختيار وسيلة دفع أخرى أو إضافة رصيد للساكن.
                    </div>
                  )}

                  {/* Payment Method Selector */}
                  <div className="grid gap-1.5">
                    <label className="text-xs font-semibold">طريقة السداد الأساسية</label>
                    <select 
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value as any)}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 font-medium"
                    >
                      <option value="CASH">💵 نقدي (صندوق العمارة)</option>
                      {availableCredit > 0 && (
                        <option value="CREDIT">⚡ خصم من الرصيد الدائن للساكن (رصيد متاح: ₪{availableCredit.toFixed(2)})</option>
                      )}
                      <option value="BANK_TRANSFER">🏦 تحويل بنكي</option>
                      <option value="E_WALLET">📱 محفظة إلكترونية (جوال باي / بال باي)</option>
                      <option value="CHEQUE">📝 شيك مصرفي</option>
                    </select>
                  </div>

                  {/* Payment Amount Input */}
                  <div className="grid gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold">المبلغ المراد سداده (₪)</label>
                      <span className="text-[11px] text-muted-foreground font-medium">المتبقي: ₪{payingItem.remainingAmount}</span>
                    </div>
                    <Input 
                      type="number" 
                      step="0.01" 
                      max={itemRemaining}
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder="0.00 ₪"
                      required
                      className="text-base font-bold"
                    />
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <button 
                        type="button" 
                        onClick={() => setPayAmount(payingItem.remainingAmount)}
                        className="text-[11px] px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 font-semibold cursor-pointer"
                      >
                        سداد كامل البند (₪{itemRemaining})
                      </button>
                      {isCreditMode && availableCredit > 0 && availableCredit < itemRemaining && (
                        <button 
                          type="button" 
                          onClick={() => setPayAmount(availableCredit.toString())}
                          className="text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-semibold cursor-pointer"
                        >
                          الاكتفاء بخصم الرصيد فقط (₪{availableCredit.toFixed(2)})
                        </button>
                      )}
                    </div>
                  </div>

                  {/* DYNAMIC SPLIT PAYMENT NOTICE & OPTIONS WHEN ENTERED AMOUNT > CREDIT BALANCE */}
                  {isCreditMode && availableCredit > 0 && isSplit && (
                    <div className="p-3.5 rounded-xl border-2 border-amber-300 bg-amber-50/90 text-amber-950 space-y-3 animate-in fade-in duration-200">
                      <div className="flex items-start gap-2">
                        <Coins className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-xs text-amber-900">
                            ⚡ إشعار سداد مركب (استهلاك الرصيد الدائن + دفع المتبقي)
                          </h4>
                          <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                            المبلغ المطلوب سداده (<strong>₪{currentPayAmount.toFixed(2)}</strong>) يتجاوز الرصيد الدائن المتاح للساكن (<strong>₪{availableCredit.toFixed(2)}</strong>).
                          </p>
                        </div>
                      </div>

                      {/* Detailed Breakdown */}
                      <div className="grid grid-cols-2 gap-2 bg-white/80 p-2.5 rounded-lg border border-amber-200 text-xs">
                        <div className="space-y-0.5">
                          <span className="text-[11px] text-muted-foreground block">1️⃣ المخصوم من الرصيد الدائن:</span>
                          <span className="font-extrabold text-emerald-700 text-sm">₪{creditPortion.toFixed(2)}</span>
                          <span className="text-[10px] text-muted-foreground block">(يتبقى ₪0.00 برصيده)</span>
                        </div>
                        <div className="space-y-0.5 border-r pr-2">
                          <span className="text-[11px] text-muted-foreground block">2️⃣ المبلغ المتبقي للتحصيل:</span>
                          <span className="font-extrabold text-amber-700 text-sm">₪{secondaryPortion.toFixed(2)}</span>
                          <span className="text-[10px] text-amber-800 font-semibold block">مطلوب دفعه الآن</span>
                        </div>
                      </div>

                      {/* Secondary Payment Method Selector */}
                      <div className="space-y-1.5 pt-1">
                        <label className="text-xs font-bold text-amber-950 flex items-center gap-1">
                          <span>اختر وسيلة دفع المبلغ المتبقي (₪{secondaryPortion.toFixed(2)}):</span>
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { id: 'CASH', label: '💵 نقدي (الصندوق)' },
                            { id: 'BANK_TRANSFER', label: '🏦 تحويل بنكي' },
                            { id: 'E_WALLET', label: '📱 محفظة إلكترونية' },
                            { id: 'CHEQUE', label: '📝 شيك مصرفي' },
                          ].map(opt => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setSecondaryMethod(opt.id as any)}
                              className={`text-xs py-1.5 px-2 rounded-lg font-bold border transition-all text-right cursor-pointer ${
                                secondaryMethod === opt.id
                                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                  : 'bg-white hover:bg-amber-100/70 border-amber-200 text-amber-900'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FULL CREDIT COVERAGE NOTICE */}
                  {isCreditMode && availableCredit > 0 && !isSplit && currentPayAmount > 0 && (
                    <div className="p-3 rounded-lg border border-emerald-300 bg-emerald-100/70 text-emerald-950 text-xs space-y-1 animate-in fade-in">
                      <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>الرصيد الدائن يغطي كامل المبلغ (₪{currentPayAmount.toFixed(2)})</span>
                      </div>
                      <p className="text-[11px] text-emerald-800 leading-relaxed">
                        سيتم خصم كامل المبلغ فوراً من الرصيد الدائن دون الحاجة لأي دفع نقدي. المتبقي في رصيد الساكن بعد الخصم: <strong className="font-mono font-bold">₪{(availableCredit - currentPayAmount).toFixed(2)}</strong>.
                      </p>
                    </div>
                  )}

                  <div className="grid gap-1.5">
                    <label className="text-xs font-semibold">رقم المرجع / سند القبض / إشعار التحويل (اختياري)</label>
                    <Input 
                      value={payReference}
                      onChange={(e) => setPayReference(e.target.value)}
                      placeholder="مثال: تحويل رقم #4492 أو إشعار محفظة جوال باي"
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <label className="text-xs font-semibold">ملاحظات وبيان السداد</label>
                    <Input 
                      value={payNotes}
                      onChange={(e) => setPayNotes(e.target.value)}
                      placeholder="مثال: سداد الدفعة بواسطة الساكن"
                    />
                  </div>
                </div>

                <DialogFooter className="mt-4">
                  <Button type="button" variant="outline" onClick={() => setPayingItem(null)}>
                    إلغاء
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={submittingPay || currentPayAmount <= 0} 
                    className="bg-green-600 hover:bg-green-700 font-bold"
                  >
                    {submittingPay 
                      ? 'جاري المعالجة...' 
                      : isSplit 
                        ? `تأكيد السداد المركب (خصم ₪${creditPortion.toFixed(2)} + تحصيل ₪${secondaryPortion.toFixed(2)})`
                        : isCreditMode 
                          ? `تأكيد خصم ₪${currentPayAmount.toFixed(2)} من الرصيد`
                          : `تأكيد تسجيل السداد (₪${currentPayAmount.toFixed(2)})`
                    }
                  </Button>
                </DialogFooter>
              </form>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* =========================================================================================
          EDIT ITEM MODAL (تعديل السجل)
          ========================================================================================= */}
      <Dialog open={!!editingItem} onOpenChange={(open) => { if (!open) setEditingItem(null); }}>
        <DialogContent className="sm:max-w-[440px]" dir="rtl">
          {editingItem && (
            <form onSubmit={handleEditItem} className="space-y-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <Edit3 className="h-5 w-5 text-primary" />
                  <span>تعديل بند الدين</span>
                </DialogTitle>
                <DialogDescription>
                  تعديل تفاصيل المبلغ، البيان، والتاريخ لهذا البند.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 mt-2">
                <div className="grid gap-1.5">
                  <label className="text-xs font-semibold">نوع البند</label>
                  <select 
                    value={editSource}
                    onChange={(e) => setEditSource(e.target.value)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="PREVIOUS">استحقاق سابق</option>
                    <option value="WATER">تعبئة مياه</option>
                    <option value="SERVICE">اشتراك خدمات</option>
                    <option value="RENT">إيجار</option>
                    <option value="OTHER">بند إضافي / آخر</option>
                  </select>
                </div>

                <div className="grid gap-1.5">
                  <label className="text-xs font-semibold">المبلغ (₪)</label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    placeholder="0.00 ₪"
                    required
                  />
                </div>

                <div className="grid gap-1.5">
                  <label className="text-xs font-semibold">البيان / الوصف</label>
                  <Input 
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-1.5">
                    <label className="text-xs font-semibold">تاريخ الاستحقاق</label>
                    <Input 
                      type="date" 
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-xs font-semibold">تاريخ التسجيل / البند</label>
                    <Input 
                      type="date" 
                      value={editCreatedAt}
                      onChange={(e) => setEditCreatedAt(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date().toISOString().split('T')[0];
                      setEditDueDate(today);
                      setEditCreatedAt(today);
                    }}
                    className="text-primary hover:underline cursor-pointer"
                  >
                    تعيين تاريخ اليوم
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (editDueDate) setEditCreatedAt(editDueDate);
                      else if (editCreatedAt) setEditDueDate(editCreatedAt);
                    }}
                    className="text-primary hover:underline cursor-pointer"
                  >
                    مزامنة التاريخين
                  </button>
                </div>
              </div>

              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>
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
          ADD CREDIT TO RESIDENT MODAL (إضافة رصيد دائن للساكن/الشقة مباشرة)
          ========================================================================================= */}
      <Dialog open={isAddCreditOpen} onOpenChange={setIsAddCreditOpen}>
        <DialogContent className="sm:max-w-[440px]" dir="rtl">
          {selectedApartment && (
            <form onSubmit={handleQuickAddCredit} className="space-y-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg text-emerald-700">
                  <Coins className="h-5 w-5 text-emerald-600" />
                  <span>إضافة رصيد دائن: {selectedApartment.residentName} (شقة {selectedApartment.apartmentNumber})</span>
                </DialogTitle>
                <DialogDescription>
                  تسجيل مبالغ مستحقة للساكن على الإدارة أو دفعات مسبقة للخصم المستقبلي.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 mt-2">
                <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-900">
                  💡 سيتم حفظ هذا المبلغ في رصيد الساكن، وعند وجود أي استحقاق مالي سيتم طلب تأكيد خصمه من الرصيد.
                </div>

                <div className="grid gap-1.5">
                  <label className="text-xs font-semibold">مبلغ الرصيد الدائن (₪) *</label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={addCreditAmount}
                    onChange={(e) => setAddCreditAmount(e.target.value)}
                    placeholder="0.00 ₪"
                    required
                    className="font-mono font-bold text-base"
                  />
                </div>

                <div className="grid gap-1.5">
                  <label className="text-xs font-semibold">المصدر / السبب</label>
                  <select 
                    value={addCreditSource}
                    onChange={(e) => setAddCreditSource(e.target.value)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="MANAGEMENT_REIMBURSEMENT">مبلغ مستحق للساكن على الإدارة (تسوية صيانة)</option>
                    <option value="ADVANCE_PAYMENT">دفعة مسبقة من الساكن</option>
                    <option value="OVERPAYMENT">فائض من دفعة سابقة</option>
                    <option value="OTHER">أخرى</option>
                  </select>
                </div>

                <div className="grid gap-1.5">
                  <label className="text-xs font-semibold">البيان / تفاصيل العملية</label>
                  <Input 
                    value={addCreditNotes}
                    onChange={(e) => setAddCreditNotes(e.target.value)}
                    placeholder="مثال: تعويض عن تصليح مفتاح الكهرباء"
                    required
                  />
                </div>
              </div>

              <DialogFooter className="mt-4 gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddCreditOpen(false)}>
                  إلغاء
                </Button>
                <Button 
                  type="submit" 
                  disabled={submittingAddCredit} 
                  className="bg-emerald-600 hover:bg-emerald-700 font-bold"
                >
                  {submittingAddCredit ? 'جاري الإضافة...' : 'تأكيد إضافة الرصيد'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Global Add Debt Dialog (for any apartment) */}
      <Dialog open={isGlobalAddDebtOpen} onOpenChange={setIsGlobalAddDebtOpen}>
        <DialogContent className="sm:max-w-[480px]" dir="rtl">
          <form onSubmit={handleGlobalAddNewItem} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Plus className="h-5 w-5 text-primary" />
                <span>إضافة بند مالي جديد لشقة</span>
              </DialogTitle>
              <DialogDescription>
                تسجيل دين أو استحقاق مالي جديد (مياه، اشتراك خدمات، إيجار، استحقاق سابق، أخرى) على أي شقة.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 mt-2">
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold">الشقة المستهدفة *</label>
                <select 
                  value={globalAptId}
                  onChange={(e) => setGlobalAptId(e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="">اختر الشقة...</option>
                  {(data || []).map(a => (
                    <option key={a.apartmentId} value={a.apartmentId}>
                      شقة {a.apartmentNumber} - {a.residentName || 'شاغرة / غير مسكن'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-1.5">
                <label className="text-xs font-semibold">نوع البند المالي *</label>
                <select 
                  value={globalSource}
                  onChange={(e) => setGlobalSource(e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="PREVIOUS">استحقاق سابق</option>
                  <option value="WATER">تعبئة مياه</option>
                  <option value="SERVICE">اشتراك خدمات</option>
                  <option value="RENT">إيجار</option>
                  <option value="OTHER">بند إضافي / آخر</option>
                </select>
              </div>

              <div className="grid gap-1.5">
                <label className="text-xs font-semibold">المبلغ المستحق (₪) *</label>
                <Input 
                  type="number" 
                  step="0.01" 
                  value={globalAmount}
                  onChange={(e) => setGlobalAmount(e.target.value)}
                  placeholder="0.00 ₪"
                  required
                  className="font-mono font-bold text-base"
                />
              </div>

              <div className="grid gap-1.5">
                <label className="text-xs font-semibold">البيان / الوصف والتفاصيل *</label>
                <Input 
                  value={globalNotes}
                  onChange={(e) => setGlobalNotes(e.target.value)}
                  placeholder="مثال: استحقاق مالي سابق أو اشتراك صيانة"
                  required
                />
              </div>

              <div className="grid gap-1.5">
                <label className="text-xs font-semibold">تاريخ الاستحقاق (اختياري)</label>
                <Input 
                  type="date" 
                  value={globalDueDate}
                  onChange={(e) => setGlobalDueDate(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsGlobalAddDebtOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={submittingGlobalAdd} className="font-bold">
                {submittingGlobalAdd ? 'جاري الحفظ...' : 'حفظ البند المالي'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Item Confirmation Dialog */}
      <Dialog open={!!itemToDelete} onOpenChange={(open) => { if (!open) setItemToDelete(null); }}>
        <DialogContent className="sm:max-w-[420px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive text-lg">
              <Trash2 className="h-5 w-5" />
              <span>تأكيد حذف البند المالي</span>
            </DialogTitle>
            <DialogDescription className="text-sm pt-1">
              هل أنت متأكد من رغبتك في حذف هذا البند نهائياً؟ سيتم إلغاء قيده وحذفه من سجل الشقة المالي.
            </DialogDescription>
          </DialogHeader>

          {itemToDelete && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3.5 space-y-2 text-xs mt-2">
              <div className="flex justify-between items-center font-bold text-sm text-foreground">
                <span>{itemToDelete.notes || 'بند مالي'}</span>
                <span className="font-mono text-destructive text-base font-extrabold">
                  ₪{parseFloat(itemToDelete.remainingAmount).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground pt-1 border-t border-destructive/10">
                <span>تاريخ التسجيل: {new Date(itemToDelete.createdAt).toLocaleDateString('ar-EG')}</span>
                <span>الحالة: {itemToDelete.status === 'PAID' ? 'مسدد' : 'مفتوح / غير مسدد'}</span>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setItemToDelete(null)}
              disabled={submittingDelete}
            >
              إلغاء وتراجع
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              onClick={confirmDeleteItem}
              disabled={submittingDelete}
              className="gap-2 font-bold cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              {submittingDelete ? 'جاري الحذف...' : 'تأكيد الحذف النهائي'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
