import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { TrendingUp, ArrowDownRight, ArrowUpRight, Wallet, Coins } from 'lucide-react';

interface FinancialFlowItem {
  monthKey: string;
  monthName: string;
  income: number;
  expense: number;
  net: number;
  balance: number;
}

interface FinancialFlowChartProps {
  data?: FinancialFlowItem[];
  currentBalance?: number;
  totalIncome?: number;
  totalExpense?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const income = payload.find((p: any) => p.dataKey === 'income')?.value || 0;
    const expense = payload.find((p: any) => p.dataKey === 'expense')?.value || 0;
    const balance = payload.find((p: any) => p.dataKey === 'balance')?.value || 0;
    const net = income - expense;

    return (
      <div className="bg-popover/95 backdrop-blur-xs border border-border shadow-xl rounded-xl p-3.5 text-xs space-y-2 min-w-[200px]" dir="rtl">
        <p className="font-bold text-sm text-foreground border-b pb-1.5">{label}</p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              المقبوضات (الإيرادات):
            </span>
            <span className="font-bold text-emerald-600">₪{Number(income).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-rose-600 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              المصروفات:
            </span>
            <span className="font-bold text-rose-600">₪{Number(expense).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex items-center justify-between gap-4 border-t pt-1.5 text-muted-foreground">
            <span>صافي حركة الشهر:</span>
            <span className={`font-bold ${net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {net >= 0 ? '+' : ''}₪{Number(net).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-dashed pt-1.5 font-bold">
            <span className="flex items-center gap-1.5 text-blue-600">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
              المتبقي في الصندوق:
            </span>
            <span className="text-blue-700 font-extrabold text-sm">
              ₪{Number(balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function FinancialFlowChart({
  data = [],
  currentBalance = 0,
  totalIncome = 0,
  totalExpense = 0,
}: FinancialFlowChartProps) {
  // If no data, render graceful fallback
  const chartData = data.length > 0 ? data : [
    {
      monthKey: 'current',
      monthName: 'الشهر الحالي',
      income: totalIncome,
      expense: totalExpense,
      net: totalIncome - totalExpense,
      balance: currentBalance,
    }
  ];

  return (
    <Card className="shadow-xs overflow-hidden border-border/80" dir="rtl">
      <CardHeader className="border-b bg-muted/20 pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <TrendingUp className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg font-bold text-foreground">
                التدفق المالي: المقبوضات والمصروفات والمتبقي في الصندوق
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              تحليل مالي شهري يربط حركة المقبوضات وصرف الصندوق مع المتبقي التراكمي
            </CardDescription>
          </div>

          {/* Quick Financial Summary Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200/60 text-xs font-semibold">
              <ArrowUpRight className="h-4 w-4" />
              <span>المقبوضات:</span>
              <span className="font-extrabold">₪{Number(totalIncome).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg border border-rose-200/60 text-xs font-semibold">
              <ArrowDownRight className="h-4 w-4" />
              <span>المصروفات:</span>
              <span className="font-extrabold">₪{Number(totalExpense).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200/60 text-xs font-semibold">
              <Wallet className="h-4 w-4" />
              <span>المتبقي بالصندوق:</span>
              <span className="font-extrabold text-sm">₪{Number(currentBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#e11d48" stopOpacity={0.6} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.6} />
              
              <XAxis 
                dataKey="monthName" 
                tickLine={false} 
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                dy={8}
              />
              
              <YAxis 
                tickLine={false} 
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickFormatter={(val) => `₪${val.toLocaleString()}`}
                dx={-8}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              <Legend 
                verticalAlign="top" 
                align="right"
                wrapperStyle={{ paddingBottom: '16px', fontSize: '12px' }}
                formatter={(value) => {
                  if (value === 'income') return <span className="text-emerald-700 font-bold ml-3">المقبوضات (إيراد)</span>;
                  if (value === 'expense') return <span className="text-rose-700 font-bold ml-3">المصروفات</span>;
                  if (value === 'balance') return <span className="text-blue-700 font-bold ml-1">المتبقي في الصندوق (الرصيد)</span>;
                  return value;
                }}
              />

              {/* Income Bar */}
              <Bar 
                dataKey="income" 
                name="income"
                fill="url(#incomeGradient)" 
                radius={[6, 6, 0, 0]} 
                maxBarSize={45} 
              />

              {/* Expense Bar */}
              <Bar 
                dataKey="expense" 
                name="expense"
                fill="url(#expenseGradient)" 
                radius={[6, 6, 0, 0]} 
                maxBarSize={45} 
              />

              {/* Running Balance Line */}
              <Line 
                type="monotone" 
                dataKey="balance" 
                name="balance"
                stroke="#2563eb" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 7, fill: '#1d4ed8', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
