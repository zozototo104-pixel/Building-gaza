import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Building, 
  User, 
  Phone, 
  Wallet, 
  Plus, 
  Coins, 
  Printer, 
  Calendar, 
  Droplets, 
  Zap, 
  FileText, 
  Clock, 
  Tag, 
  CreditCard, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import type { DebtItem, ApartmentDebtSummary } from './DebtsMatrixTable';

interface ApartmentDebtSheetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apartmentSummary: ApartmentDebtSummary | null;
  apartmentId?: number | null;
  initialOpenAddForm?: boolean;
  onRefresh: () => void;
}

export default function ApartmentDebtSheetModal({
  open,
  onOpenChange,
  apartmentSummary: initialSummary,
  apartmentId,
  initialOpenAddForm = false,
  onRefresh
}: ApartmentDebtSheetModalProps) {
  const { getToken } = useAuth();
  
  const [currentApartment, setCurrentApartment] = useState<ApartmentDebtSummary | null>(initialSummary);
  const [loadingApartment, setLoadingApartment] = useState(false);

  // Active category filter tab
  const [detailTab, setDetailTab] = useState('ALL');

  // Inline Add Debt Item form
  const [isAddOpen, setIsAddOpen] = useState(initialOpenAddForm);
  const [newSource, setNewSource] = useState('PREVIOUS');
  const [newAmount, setNewAmount] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Single Debt Payment modal
  const [payingItem, setPayingItem] = useState<DebtItem | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'CASH' | 'CREDIT' | 'BANK_TRANSFER' | 'E_WALLET' | 'CHEQUE'>('CASH');
  const [secondaryMethod, setSecondaryMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'E_WALLET' | 'CHEQUE'>('CASH');
  const [payNotes, setPayNotes] = useState('');
  const [payReference, setPayReference] = useState('');
  const [secondaryReference, setSecondaryReference] = useState('');
  const [submittingPay, setSubmittingPay] = useState(false);

  // Quick Add Credit Modal
  const [isAddCreditOpen, setIsAddCreditOpen] = useState(false);
  const [addCreditAmount, setAddCreditAmount] = useState('');
  const [addCreditSource, setAddCreditSource] = useState('MANAGEMENT_REIMBURSEMENT');
  const [addCreditNotes, setAddCreditNotes] = useState('');
  const [submittingAddCredit, setSubmittingAddCredit] = useState(false);

  // Edit Item modal
  const [editingItem, setEditingItem] = useState<DebtItem | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editSource, setEditSource] = useState('PREVIOUS');
  const [editNotes, setEditNotes] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editCreatedAt, setEditCreatedAt] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Delete Item modal
  const [itemToDelete, setItemToDelete] = useState<DebtItem | null>(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  // Fetch or sync apartment data
  useEffect(() => {
    if (initialSummary) {
      setCurrentApartment(initialSummary);
    }
  }, [initialSummary]);

  useEffect(() => {
    setIsAddOpen(initialOpenAddForm);
  }, [initialOpenAddForm, open]);

  // Fetch full details if only apartmentId is provided
  useEffect(() => {
    if (open && apartmentId && (!currentApartment || currentApartment.apartmentId !== apartmentId)) {
      const fetchApt = async () => {
        setLoadingApartment(true);
        try {
          const token = await getToken();
          const res = await fetch('/api/debts/summary', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const list: ApartmentDebtSummary[] = await res.json();
            const found = list.find(a => a.apartmentId === apartmentId);
            if (found) {
              setCurrentApartment(found);
            }
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingApartment(false);
        }
      };
      fetchApt();
    }
  }, [open, apartmentId, getToken]);

  if (!open) return null;

  // Helper for source badge
  const getSourceBadge = (source: string) => {
    const s = (source || '').toUpperCase();
    if (s === 'PREVIOUS' || s === 'PRIOR_DEBT' || s === 'PREV') {
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">استحقاق سابق</Badge>;
    }
    if (s === 'WATER') {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">تعبئة مياه</Badge>;
    }
    if (s === 'SERVICE' || s === 'SUBSCRIPTION') {
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">اشتراك خدمات</Badge>;
    }
    if (s === 'RENT') {
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">إيجار</Badge>;
    }
    return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">بند إضافي / آخر</Badge>;
  };

  // Add new debt item
  const handleAddNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentApartment) return;
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
          apartmentId: currentApartment.apartmentId,
          residentId: currentApartment.residentId || null,
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

        // Refresh parent
        onRefresh();

        // Refetch summary for this apartment
        const summaryRes = await fetch('/api/debts/summary', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (summaryRes.ok) {
          const list: ApartmentDebtSummary[] = await summaryRes.json();
          const found = list.find(a => a.apartmentId === currentApartment.apartmentId);
          if (found) setCurrentApartment(found);
        }
      } else {
        toast.error(resData.error || 'فشلت إضافة بند الدين');
      }
    } catch (err: any) {
      toast.error('حدث خطأ أثناء الإضافة: ' + (err?.message || ''));
    } finally {
      setSubmittingAdd(false);
    }
  };

  // Single payment handler
  const handleSinglePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingItem || !currentApartment) return;
    const amountVal = parseFloat(payAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      toast.error('يرجى إدخال مبلغ سداد صحيح');
      return;
    }
    if (amountVal > parseFloat(payingItem.remainingAmount)) {
      toast.error(`المبلغ المدخل أكبر من المتبقي (₪${payingItem.remainingAmount})`);
      return;
    }

    const availableCredit = currentApartment.creditBalance || 0;
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
          residentId: payingItem.residentId || currentApartment.residentId
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

        // Update current apartment details
        const summaryRes = await fetch('/api/debts/summary', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (summaryRes.ok) {
          const list: ApartmentDebtSummary[] = await summaryRes.json();
          const found = list.find(a => a.apartmentId === currentApartment.apartmentId);
          if (found) setCurrentApartment(found);
        }
      } else {
        toast.error(resData.error || 'حدث خطأ أثناء السداد');
      }
    } catch (err) {
      toast.error('فشلت العملية، يرجى المحاولة لاحقاً');
    } finally {
      setSubmittingPay(false);
    }
  };

  // Edit item handler
  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !currentApartment) return;
    const amountVal = parseFloat(editAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }

    setSubmittingEdit(true);
    try {
      const token = await getToken();
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

        // Update currentApartment in-place for instant feedback
        const updatedDetails = currentApartment.details.map(d => {
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

        setCurrentApartment(prev => prev ? {
          ...prev,
          totalDebt: newTotal,
          details: updatedDetails
        } : null);

        onRefresh();

        const summaryRes = await fetch('/api/debts/summary', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (summaryRes.ok) {
          const list: ApartmentDebtSummary[] = await summaryRes.json();
          const found = list.find(a => a.apartmentId === currentApartment.apartmentId);
          if (found) setCurrentApartment(found);
        }
      } else {
        const data = await res.json();
        toast.error(data.error || 'فشل التعديل');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء التعديل');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Delete item handler
  const confirmDeleteItem = async () => {
    if (!itemToDelete || !currentApartment) return;
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
        onRefresh();

        const updatedDetails = currentApartment.details.filter(d => d.id !== debtId);
        const newTotal = updatedDetails.filter(d => d.status !== 'PAID').reduce((s, d) => s + (parseFloat(d.remainingAmount) || 0), 0);
        setCurrentApartment(prev => prev ? {
          ...prev,
          totalDebt: newTotal,
          itemsCount: updatedDetails.length,
          details: updatedDetails
        } : null);
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

  // Add resident credit handler
  const handleAddResidentCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentApartment) return;
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
          apartmentId: currentApartment.apartmentId,
          residentId: currentApartment.residentId || null,
          amount: amountVal,
          source: addCreditSource,
          notes: addCreditNotes || `رصيد دائن لشقة ${currentApartment.apartmentNumber}`
        })
      });
      if (res.ok) {
        toast.success(`تمت إضافة رصيد دائن بقيمة ₪${amountVal.toFixed(2)} بنجاح`);
        setIsAddCreditOpen(false);
        setAddCreditAmount('');
        setAddCreditNotes('');
        setCurrentApartment(prev => prev ? { ...prev, creditBalance: (prev.creditBalance || 0) + amountVal } : null);
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

  // Filter items based on active chip
  const filteredDetails = (currentApartment?.details || []).filter(item => {
    if (detailTab === 'ALL') return true;
    if (detailTab === 'OPEN') return item.status !== 'PAID';
    if (detailTab === 'PAID') return item.status === 'PAID';
    return item.source === detailTab;
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          {loadingApartment ? (
            <div className="py-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p>جاري تحميل كشف وجدول ديون الشقة...</p>
            </div>
          ) : currentApartment ? (
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
                        <span>كشف واستحقاقات شقة {currentApartment.apartmentNumber}</span>
                        {currentApartment.floor && (
                          <Badge variant="outline" className="text-xs font-normal">
                            الطابق: {currentApartment.floor}
                          </Badge>
                        )}
                      </DialogTitle>
                      <DialogDescription className="text-sm mt-1 flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1 text-foreground font-semibold">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {currentApartment.residentName || 'بدون ساكن مسجل'}
                        </span>
                        {currentApartment.residentPhone && (
                          <span className="flex items-center gap-1 text-muted-foreground" dir="ltr">
                            <Phone className="h-3.5 w-3.5" />
                            {currentApartment.residentPhone}
                          </span>
                        )}
                      </DialogDescription>
                    </div>
                  </div>

                  {/* Badges & Balance Summary */}
                  <div className="flex flex-wrap items-center gap-2">
                    {currentApartment.creditBalance !== undefined && currentApartment.creditBalance > 0 && (
                      <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 text-right flex flex-col items-start sm:items-end justify-center min-w-[160px]">
                        <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                          <Wallet className="h-3.5 w-3.5 text-emerald-600" />
                          رصيد دائن متاح للساكن
                        </span>
                        <span className="text-2xl font-extrabold text-emerald-700 font-mono">
                          ₪{currentApartment.creditBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}

                    <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-right flex flex-col items-start sm:items-end justify-center min-w-[170px]">
                      <span className="text-xs font-bold text-destructive">مبلغ الدين الموحد المستحق</span>
                      <span className="text-2xl font-extrabold text-destructive">
                        ₪{currentApartment.totalDebt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              {/* Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-muted/30 rounded-xl border">
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant={isAddOpen ? "secondary" : "default"}
                    onClick={() => setIsAddOpen(!isAddOpen)}
                    className="gap-1.5 text-xs font-bold shadow-xs cursor-pointer"
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
                      setAddCreditNotes(`رصيد دائن - شقة ${currentApartment.apartmentNumber}`);
                    }}
                    className="gap-1.5 text-xs font-bold border-emerald-300 text-emerald-700 hover:bg-emerald-50 cursor-pointer"
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
                    className="gap-1.5 text-xs h-8 cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    طباعة كشف الحساب
                  </Button>
                </div>
              </div>

              {/* Category Filter Chips */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">تصفية حسب نوع البند:</span>
                  <span className="text-xs font-mono text-muted-foreground">
                    إجمالي البنود: {currentApartment.details.length} (المعروض: {filteredDetails.length})
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    type="button"
                    variant={detailTab === 'ALL' ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs h-7 px-2.5 rounded-full"
                    onClick={() => setDetailTab('ALL')}
                  >
                    جميع البنود ({currentApartment.details.length})
                  </Button>
                  <Button
                    type="button"
                    variant={detailTab === 'OPEN' ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs h-7 px-2.5 rounded-full text-destructive border-destructive/30"
                    onClick={() => setDetailTab('OPEN')}
                  >
                    غير مسدد ({currentApartment.details.filter(d => d.status !== 'PAID').length})
                  </Button>
                  <Button
                    type="button"
                    variant={detailTab === 'PAID' ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs h-7 px-2.5 rounded-full text-green-700 border-green-200"
                    onClick={() => setDetailTab('PAID')}
                  >
                    مسدد بالكامل ({currentApartment.details.filter(d => d.status === 'PAID').length})
                  </Button>
                  {currentApartment.breakdown.water > 0 && (
                    <Button
                      type="button"
                      variant={detailTab === 'WATER' ? 'default' : 'outline'}
                      size="sm"
                      className="text-xs h-7 px-2.5 rounded-full text-blue-700 border-blue-200"
                      onClick={() => setDetailTab('WATER')}
                    >
                      مياه (₪{currentApartment.breakdown.water})
                    </Button>
                  )}
                  {currentApartment.breakdown.service > 0 && (
                    <Button
                      type="button"
                      variant={detailTab === 'SERVICE' ? 'default' : 'outline'}
                      size="sm"
                      className="text-xs h-7 px-2.5 rounded-full text-emerald-700 border-emerald-200"
                      onClick={() => setDetailTab('SERVICE')}
                    >
                      اشتراك (₪{currentApartment.breakdown.service})
                    </Button>
                  )}
                  {currentApartment.breakdown.rent > 0 && (
                    <Button
                      type="button"
                      variant={detailTab === 'RENT' ? 'default' : 'outline'}
                      size="sm"
                      className="text-xs h-7 px-2.5 rounded-full text-amber-700 border-amber-200"
                      onClick={() => setDetailTab('RENT')}
                    >
                      إيجار (₪{currentApartment.breakdown.rent})
                    </Button>
                  )}
                  {currentApartment.breakdown.previous > 0 && (
                    <Button
                      type="button"
                      variant={detailTab === 'PREVIOUS' ? 'default' : 'outline'}
                      size="sm"
                      className="text-xs h-7 px-2.5 rounded-full text-purple-700 border-purple-200"
                      onClick={() => setDetailTab('PREVIOUS')}
                    >
                      استحقاق سابق (₪{currentApartment.breakdown.previous})
                    </Button>
                  )}
                  {currentApartment.breakdown.extra > 0 && (
                    <Button
                      type="button"
                      variant={detailTab === 'EXTRA' ? 'default' : 'outline'}
                      size="sm"
                      className="text-xs h-7 px-2.5 rounded-full text-slate-700 border-slate-200"
                      onClick={() => setDetailTab('EXTRA')}
                    >
                      إضافي (₪{currentApartment.breakdown.extra})
                    </Button>
                  )}
                </div>
              </div>

              {/* Add New Debt Form */}
              {isAddOpen && (
                <form onSubmit={handleAddNewItem} className="p-4 bg-muted/40 rounded-xl border border-primary/20 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-sm font-bold text-primary flex items-center gap-1.5">
                      <Plus className="h-4 w-4" />
                      إضافة بند مالي جديد لشقة {currentApartment.apartmentNumber}
                    </span>
                    <span className="text-xs text-muted-foreground">سيتم قيده فوراً كدين مستحق</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">نوع البند / المصدر *</label>
                      <select 
                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-semibold"
                        value={newSource}
                        onChange={(e) => setNewSource(e.target.value)}
                      >
                        <option value="PREVIOUS">استحقاق سابق / رصيد افتتاحي</option>
                        <option value="WATER">تعبئة مياه</option>
                        <option value="SERVICE">اشتراك خدمات وصيانة</option>
                        <option value="RENT">إيجار شقة</option>
                        <option value="EXTRA">بند إضافي / رسوم أخرى</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">المبلغ (₪) *</label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        required
                        className="h-9 text-xs font-mono font-bold"
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">تاريخ الاستحقاق (اختياري)</label>
                      <Input 
                        type="date" 
                        className="h-9 text-xs"
                        value={newDueDate}
                        onChange={(e) => setNewDueDate(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">ملاحظات / البيان</label>
                      <Input 
                        placeholder="مثال: فاتورة استحقاق شهر 8" 
                        className="h-9 text-xs"
                        value={newNotes}
                        onChange={(e) => setNewNotes(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button 
                      type="button" 
                      variant="ghost" 
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
                      className="text-xs font-bold gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {submittingAdd ? 'جاري الحفظ...' : 'حفظ وقيد البند المالي'}
                    </Button>
                  </div>
                </form>
              )}

              {/* Debt Items Table */}
              <div className="border rounded-xl overflow-hidden bg-card">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="text-right font-bold w-[130px]">نوع البند</TableHead>
                      <TableHead className="text-right font-bold w-[130px]">المبلغ الأصلي</TableHead>
                      <TableHead className="text-right font-bold w-[140px]">المتبقي المستحق</TableHead>
                      <TableHead className="text-right font-bold w-[120px]">تاريخ الاستحقاق</TableHead>
                      <TableHead className="text-right font-bold">البيان / ملاحظات</TableHead>
                      <TableHead className="text-center font-bold w-[110px]">الحالة</TableHead>
                      <TableHead className="text-center font-bold w-[200px]">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDetails.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                            <span className="font-semibold text-base">لا توجد بنود مطابقة في هذا التصنيف</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDetails.map((item) => {
                        const isPaid = item.status === 'PAID';
                        const isPartiallyPaid = item.status === 'PARTIALLY_PAID';
                        const remVal = parseFloat(item.remainingAmount);

                        return (
                          <TableRow key={item.id} className={isPaid ? 'bg-muted/20 opacity-75' : ''}>
                            {/* Source */}
                            <TableCell>{getSourceBadge(item.source)}</TableCell>

                            {/* Original Amount */}
                            <TableCell className="font-mono text-xs">
                              ₪{parseFloat(item.originalAmount || item.amount).toFixed(2)}
                            </TableCell>

                            {/* Remaining Amount */}
                            <TableCell>
                              <span className={`font-mono text-sm font-extrabold ${isPaid ? 'text-green-700' : 'text-destructive'}`}>
                                ₪{remVal.toFixed(2)}
                              </span>
                            </TableCell>

                            {/* Due Date */}
                            <TableCell className="text-xs text-muted-foreground">
                              {item.dueDate ? (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{new Date(item.dueDate).toLocaleDateString('ar-EG')}</span>
                                </div>
                              ) : (
                                <span>{new Date(item.createdAt).toLocaleDateString('ar-EG')}</span>
                              )}
                            </TableCell>

                            {/* Notes */}
                            <TableCell className="text-xs font-medium text-foreground">
                              {item.notes || '-'}
                            </TableCell>

                            {/* Status */}
                            <TableCell className="text-center">
                              {isPaid ? (
                                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 text-[10px]">
                                  مسدد بالكامل
                                </Badge>
                              ) : isPartiallyPaid ? (
                                <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]">
                                  مسدد جزئياً
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200 text-[10px]">
                                  غير مسدد
                                </Badge>
                              )}
                            </TableCell>

                            {/* Actions */}
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {!isPaid && (
                                  <Button 
                                    size="sm" 
                                    className="bg-green-600 hover:bg-green-700 text-white text-xs h-8 px-2.5 gap-1 cursor-pointer font-bold shadow-xs"
                                    onClick={() => {
                                      setPayingItem(item);
                                      setPayAmount(remVal.toFixed(2));
                                      setPayMethod(currentApartment.creditBalance && currentApartment.creditBalance > 0 ? 'CREDIT' : 'CASH');
                                      setPayNotes(`سداد بند: ${item.notes || item.source} - شقة ${currentApartment.apartmentNumber}`);
                                    }}
                                  >
                                    <CreditCard className="h-3.5 w-3.5" />
                                    <span>سداد</span>
                                  </Button>
                                )}

                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-xs h-8 px-2 text-muted-foreground hover:text-foreground cursor-pointer"
                                  onClick={() => {
                                    setEditingItem(item);
                                    setEditAmount(item.originalAmount || item.amount);
                                    setEditSource(item.source);
                                    setEditNotes(item.notes || '');
                                    const dDue = item.dueDate ? new Date(item.dueDate) : null;
                                    const dCreated = item.createdAt ? new Date(item.createdAt) : null;
                                    const dueIso = dDue && !isNaN(dDue.getTime()) ? dDue.toISOString().split('T')[0] : '';
                                    const createdIso = dCreated && !isNaN(dCreated.getTime()) ? dCreated.toISOString().split('T')[0] : '';
                                    setEditDueDate(dueIso || createdIso || new Date().toISOString().split('T')[0]);
                                    setEditCreatedAt(createdIso || dueIso || new Date().toISOString().split('T')[0]);
                                  }}
                                  title="تعديل بيانات البند وتاريخه"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </Button>

                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-destructive hover:bg-destructive/10 text-xs h-8 px-2 cursor-pointer"
                                  onClick={() => setItemToDelete(item)}
                                  title="حذف البند نهائياً"
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
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              لا توجد بيانات متاحة لهذه الشقة.
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pay Single Item Modal */}
      <Dialog open={!!payingItem} onOpenChange={(open) => { if (!open) setPayingItem(null); }}>
        <DialogContent className="sm:max-w-[440px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-green-600" />
              <span>تسجيل سداد بند مالي</span>
            </DialogTitle>
            <DialogDescription>
              تسجيل دفعة نقدية أو خصم من الرصيد الدائن لشقة {currentApartment?.apartmentNumber}
            </DialogDescription>
          </DialogHeader>

          {payingItem && (
            <form onSubmit={handleSinglePayment} className="space-y-4 mt-2">
              <div className="bg-muted/40 p-3 rounded-lg border text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">البند:</span>
                  <span className="font-bold">{payingItem.notes || payingItem.source}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المتبقي المستحق:</span>
                  <span className="font-bold text-destructive font-mono text-sm">₪{parseFloat(payingItem.remainingAmount).toFixed(2)}</span>
                </div>
                {currentApartment?.creditBalance !== undefined && currentApartment.creditBalance > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold pt-1 border-t">
                    <span>رصيد الساكن الدائن:</span>
                    <span className="font-mono">₪{currentApartment.creditBalance.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">مبلغ السداد (₪) *</label>
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    step="0.01" 
                    max={parseFloat(payingItem.remainingAmount)}
                    placeholder="0.00" 
                    required 
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="font-mono font-bold text-base"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    className="text-xs whitespace-nowrap cursor-pointer"
                    onClick={() => setPayAmount(parseFloat(payingItem.remainingAmount).toFixed(2))}
                  >
                    سداد كامل
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">طريقة السداد *</label>
                <select 
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-semibold"
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                >
                  <option value="CASH">نقدي (CASH)</option>
                  {currentApartment?.creditBalance !== undefined && currentApartment.creditBalance > 0 && (
                    <option value="CREDIT">خصم من الرصيد الدائن المتاح (₪{currentApartment.creditBalance.toFixed(2)})</option>
                  )}
                  <option value="BANK_TRANSFER">تحويل بنكي</option>
                  <option value="E_WALLET">محفظة إلكترونية</option>
                  <option value="CHEQUE">شيك</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">ملاحظات السند / البيان</label>
                <Input 
                  placeholder="ملاحظات السند" 
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="text-xs"
                />
              </div>

              <DialogFooter className="mt-4 gap-2">
                <Button type="button" variant="outline" onClick={() => setPayingItem(null)}>
                  إلغاء
                </Button>
                <Button 
                  type="submit" 
                  disabled={submittingPay} 
                  className="bg-green-600 hover:bg-green-700 text-white font-bold gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {submittingPay ? 'جاري القيد...' : 'تأكيد وقيد السداد'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Single Item Modal */}
      <Dialog open={!!editingItem} onOpenChange={(open) => { if (!open) setEditingItem(null); }}>
        <DialogContent className="sm:max-w-[420px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Edit3 className="h-5 w-5 text-primary" />
              <span>تعديل بند الدين</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEditItem} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">المصدر</label>
              <select 
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs"
                value={editSource}
                onChange={(e) => setEditSource(e.target.value)}
              >
                <option value="PREVIOUS">استحقاق سابق</option>
                <option value="WATER">تعبئة مياه</option>
                <option value="SERVICE">اشتراك خدمات</option>
                <option value="RENT">إيجار</option>
                <option value="EXTRA">إضافي / آخر</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">المبلغ (₪) *</label>
              <Input 
                type="number" 
                step="0.01" 
                required 
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="font-mono font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">تاريخ الاستحقاق</label>
                <Input 
                  type="date" 
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">تاريخ التسجيل / البند</label>
                <Input 
                  type="date" 
                  value={editCreatedAt}
                  onChange={(e) => setEditCreatedAt(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
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

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">ملاحظات / البيان</label>
              <Input 
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={submittingEdit} className="font-bold cursor-pointer">
                {submittingEdit ? 'جاري الحفظ...' : 'حفظ التعديلات'}
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

      {/* Add Resident Credit Modal */}
      <Dialog open={isAddCreditOpen} onOpenChange={setIsAddCreditOpen}>
        <DialogContent className="sm:max-w-[420px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700 text-lg">
              <Coins className="h-5 w-5 text-emerald-600" />
              <span>إضافة رصيد دائن للساكن</span>
            </DialogTitle>
            <DialogDescription>
              قيد رصيد دائن للساكن ({currentApartment?.residentName}) - شقة {currentApartment?.apartmentNumber}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddResidentCredit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">مبلغ الرصيد الدائن (₪) *</label>
              <Input 
                type="number" 
                step="0.01" 
                placeholder="0.00" 
                required 
                value={addCreditAmount}
                onChange={(e) => setAddCreditAmount(e.target.value)}
                className="font-mono font-bold text-base"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">سبب / مصدر الرصيد الدائن *</label>
              <select 
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs"
                value={addCreditSource}
                onChange={(e) => setAddCreditSource(e.target.value)}
              >
                <option value="MANAGEMENT_REIMBURSEMENT">تسوية وإرجاع مالي من الإدارة</option>
                <option value="OVERPAYMENT">دفعة زائدة سابقة</option>
                <option value="SERVICES_CREDIT">تعويض أو رصيد خدمات</option>
                <option value="OTHER">مصدر آخر</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">ملاحظات / البيان</label>
              <Input 
                placeholder="بيان الرصيد الدائن" 
                value={addCreditNotes}
                onChange={(e) => setAddCreditNotes(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddCreditOpen(false)}>
                إلغاء
              </Button>
              <Button 
                type="submit" 
                disabled={submittingAddCredit} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 cursor-pointer"
              >
                <Coins className="h-4 w-4" />
                {submittingAddCredit ? 'جاري القيد...' : 'إضافة الرصيد'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
