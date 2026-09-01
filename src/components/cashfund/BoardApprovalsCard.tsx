import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, CheckCircle2, XCircle, ThumbsUp, ThumbsDown, Clock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface BoardApprovalsProps {
  requests: Array<{
    id: number;
    description: string;
    category: string;
    amount: number;
    date: string;
    payee: string;
    notes: string;
    requestedBy: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    approvals: string[];
    createdAt: string;
  }>;
  requiredApprovals: number;
  onUpdate: () => void;
  getToken: () => Promise<string | null>;
}

export function BoardApprovalsCard({ requests, requiredApprovals, onUpdate, getToken }: BoardApprovalsProps) {
  const handleVote = async (id: number, action: 'APPROVE' | 'REJECT') => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/expense-approvals/${id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });

      if (!res.ok) {
        throw new Error('فشل تسجيل التصويت');
      }

      toast.success(action === 'APPROVE' ? 'تم تسجيل موافقتك على المصروف' : 'تم رفض طلب المصروف');
      onUpdate();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء التصويت');
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'PENDING');

  return (
    <Card id="section-board-approvals" className="overflow-hidden border border-border shadow-xs bg-card">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">طلبات موافقة المجلس على المصروفات</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                المصروفات التي تتجاوز سقف الصرف وتتطلب موافقة أعضاء مجلس الإدارة
              </CardDescription>
            </div>
          </div>
          {pendingRequests.length > 0 && (
            <Badge className="bg-amber-500 text-white font-mono text-xs">
              {pendingRequests.length} طلب معلق
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5">
        {requests.length === 0 ? (
          <div className="border border-dashed border-border rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-2">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-foreground">لا توجد طلبات مصروفات معلقة أو مسجلة حتى الآن.</p>
            <p className="text-xs text-muted-foreground">أي مصروف يتجاوز حد الصرف سيظهر تلقائياً هنا لطلب اعتماد أعضاء المجلس.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">{req.description}</span>
                    <Badge
                      variant="outline"
                      className={
                        req.status === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : req.status === 'REJECTED'
                          ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      }
                    >
                      {req.status === 'APPROVED' ? 'تم الاعتماد' : req.status === 'REJECTED' ? 'مرفوض' : 'قيد التصويت'}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">
                      {req.amount.toFixed(2)} شيكل
                    </span>
                    {req.payee && <span>المستلم: {req.payee}</span>}
                    <span>طالب الصرف: {req.requestedBy}</span>
                    <span>الموافقات: ({req.approvals.length} من {requiredApprovals})</span>
                  </div>
                  {req.approvals.length > 0 && (
                    <div className="text-[11px] text-muted-foreground">
                      المعتمدون: {req.approvals.join('، ')}
                    </div>
                  )}
                </div>

                {req.status === 'PENDING' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleVote(req.id, 'APPROVE')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-3 gap-1 rounded-lg"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                      موافقة
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVote(req.id, 'REJECT')}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 border-rose-200 font-bold text-xs h-8 px-3 gap-1 rounded-lg"
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                      رفض
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
