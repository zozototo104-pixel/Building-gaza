import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Printer, 
  Download, 
  Calendar, 
  Filter, 
  RotateCcw,
  Building2
} from 'lucide-react';

interface ReportFiltersProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  selectedApartment: string;
  setSelectedApartment: (val: string) => void;
  apartments: any[];
  activeRangePreset: string;
  setActiveRangePreset: (preset: string) => void;
  onResetFilters: () => void;
  onPrint: () => void;
  onExportCSV: () => void;
  isExporting?: boolean;
}

export function ReportFilters({
  searchQuery,
  setSearchQuery,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  selectedApartment,
  setSelectedApartment,
  apartments,
  activeRangePreset,
  setActiveRangePreset,
  onResetFilters,
  onPrint,
  onExportCSV
}: ReportFiltersProps) {

  const handleApplyPreset = (preset: string) => {
    setActiveRangePreset(preset);
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');

    if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
      return;
    }

    if (preset === 'TODAY') {
      const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      setStartDate(todayStr);
      setEndDate(todayStr);
      return;
    }

    if (preset === 'THIS_MONTH') {
      const start = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const end = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(lastDay)}`;
      setStartDate(start);
      setEndDate(end);
      return;
    }

    if (preset === 'LAST_MONTH') {
      const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const start = `${prevMonthDate.getFullYear()}-${pad(prevMonthDate.getMonth() + 1)}-01`;
      const lastDay = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1, 0).getDate();
      const end = `${prevMonthDate.getFullYear()}-${pad(prevMonthDate.getMonth() + 1)}-${pad(lastDay)}`;
      setStartDate(start);
      setEndDate(end);
      return;
    }

    if (preset === 'THIS_YEAR') {
      const start = `${now.getFullYear()}-01-01`;
      const end = `${now.getFullYear()}-12-31`;
      setStartDate(start);
      setEndDate(end);
      return;
    }
  };

  return (
    <Card className="border border-border/80 shadow-2xs bg-card print:hidden" dir="rtl">
      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Row 1: Search & Quick Presets & Action Buttons */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث سريع: برقم الشقة، اسم الساكن، البيان، الملاحظات، أو المستلم..."
              className="pr-9 pl-3 h-10 bg-background border-border rounded-xl text-sm"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-muted-foreground">
              <Search className="h-4 w-4" />
            </div>
          </div>

          {/* Quick Range Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {[
              { id: 'ALL', label: 'كافة الفترات' },
              { id: 'TODAY', label: 'اليوم' },
              { id: 'THIS_MONTH', label: 'هذا الشهر' },
              { id: 'LAST_MONTH', label: 'الشهر السابق' },
              { id: 'THIS_YEAR', label: 'هذه السنة' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleApplyPreset(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeRangePreset === p.id
                    ? 'bg-primary text-primary-foreground shadow-2xs'
                    : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Action Buttons: Export & Print */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onExportCSV}
              className="gap-1.5 rounded-xl border-border h-9 text-xs font-semibold hover:bg-accent"
            >
              <Download className="h-3.5 w-3.5" />
              <span>تصدير Excel (CSV)</span>
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={onPrint}
              className="gap-1.5 rounded-xl h-9 text-xs font-semibold shadow-2xs"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>طباعة التقرير</span>
            </Button>
          </div>
        </div>

        {/* Row 2: Date Pickers + Apartment Filter + Reset */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-border/50 items-end">
          {/* Start Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>من تاريخ:</span>
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setActiveRangePreset('CUSTOM');
              }}
              className="h-9 text-xs bg-background border-border rounded-lg"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>إلى تاريخ:</span>
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setActiveRangePreset('CUSTOM');
              }}
              className="h-9 text-xs bg-background border-border rounded-lg"
            />
          </div>

          {/* Apartment Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              <span>تصفية حسب الشقة:</span>
            </label>
            <select
              value={selectedApartment}
              onChange={(e) => setSelectedApartment(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none font-medium"
            >
              <option value="ALL">كافة الشقق والوحدات</option>
              {apartments.map((apt) => (
                <option key={apt.id} value={apt.id.toString()}>
                  شقة {apt.number} {apt.residents && apt.residents.length > 0 ? `(${apt.residents[0].name})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filter Button */}
          <div className="flex items-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="w-full h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground rounded-lg"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>إعادة تعيين الفلاتر</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
