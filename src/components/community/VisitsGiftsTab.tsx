import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Gift, Plus, Search, Calendar, HeartHandshake, Printer, Edit2, Trash2, Coins } from 'lucide-react';
import { VisitGift } from '@/types';

interface VisitsGiftsTabProps {
  visits: VisitGift[];
  onAdd: () => void;
  onEdit: (visit: VisitGift) => void;
  onDelete: (id: number) => void;
  onPrint: () => void;
}

export function VisitsGiftsTab({
  visits,
  onAdd,
  onEdit,
  onDelete,
  onPrint
}: VisitsGiftsTabProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const filtered = visits.filter((v) => {
    const matchType = typeFilter === 'ALL' || v.type === typeFilter;
    const matchSearch =
      search === '' ||
      v.beneficiary.toLowerCase().includes(search.toLowerCase()) ||
      v.type.toLowerCase().includes(search.toLowerCase()) ||
      (v.description && v.description.toLowerCase().includes(search.toLowerCase()));
    return matchType && matchSearch;
  });

  const totalAmount = visits.reduce((sum, v) => sum + (parseFloat(v.amount as string) || 0), 0);

  const getOccasionIcon = (type: string) => {
    if (type.includes('مريض') || type.includes('سلامة')) return '🏥';
    if (type.includes('زواج') || type.includes('مباركة')) return '🌸';
    if (type.includes('مولود')) return '👶';
    if (type.includes('عزاء') || type.includes('مواساة')) return '🕊️';
    if (type.includes('هدية') || type.includes('تكريم')) return '🎁';
    return '✨';
  };

  return (
    <div className="space-y-4">
      {/* Top summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground block font-medium">إجمالي المناسبات والزيارات</span>
              <span className="text-lg font-bold text-slate-900 mt-1 block">{visits.length} مناسبة</span>
            </div>
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
              <HeartHandshake className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground block font-medium">مخصصات الهدايا والمصروفات</span>
              <span className="text-lg font-bold text-emerald-600 mt-1 block">
                {totalAmount.toLocaleString()} <span className="text-xs font-normal">ر.س</span>
              </span>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Coins className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground block font-medium">صندوق التكافل الاجتماعي</span>
              <span className="text-xs font-semibold text-blue-600 mt-1 block">نشط ومتصل بالصندوق المالي</span>
            </div>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Gift className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action and filter bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="البحث باسم الساكن أو نوع المناسبة..."
              className="pr-9 h-9 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrint}
            className="h-9 gap-1.5 text-xs text-slate-700 bg-white"
          >
            <Printer className="w-3.5 h-3.5" />
            طباعة السجل
          </Button>
          <Button onClick={onAdd} className="h-9 gap-2 text-xs">
            <Plus className="w-4 h-4" />
            تسجيل زيارة / هدية
          </Button>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-300 bg-slate-50/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 bg-rose-100/70 text-rose-700 rounded-full mb-3">
              <HeartHandshake className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">لا توجد زيارات أو مناسبات مسجلة</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              سجل زيارات التكافل، عيادات المرضى، والتهاني لمشاركتها وتوثيقها رسمياً.
            </p>
            <Button onClick={onAdd} className="mt-4 gap-2 text-xs">
              <Plus className="w-4 h-4" />
              تسجيل مناسبة جديدة
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-200 overflow-hidden shadow-2xs">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="text-right text-xs">نوع المناسبة</TableHead>
                <TableHead className="text-right text-xs">المستفيد / الساكن</TableHead>
                <TableHead className="text-right text-xs">قيمة الهدية</TableHead>
                <TableHead className="text-right text-xs">التاريخ</TableHead>
                <TableHead className="text-right text-xs">التفاصيل والملاحظات</TableHead>
                <TableHead className="text-center text-xs">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50/70">
                  <TableCell className="font-semibold text-xs text-slate-800">
                    <span className="ml-1.5">{getOccasionIcon(item.type)}</span>
                    {item.type}
                  </TableCell>
                  <TableCell className="font-bold text-xs text-slate-900">{item.beneficiary}</TableCell>
                  <TableCell className="font-bold text-xs text-emerald-600">
                    {parseFloat(item.amount as string || '0').toLocaleString()} ر.س
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {item.date ? new Date(item.date).toLocaleDateString('ar-EG') : '-'}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 max-w-[280px] truncate">
                    {item.description || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-amber-600 hover:bg-amber-50"
                        onClick={() => onEdit(item)}
                        title="تعديل"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-rose-600 hover:bg-rose-50"
                        onClick={() => onDelete(item.id)}
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
