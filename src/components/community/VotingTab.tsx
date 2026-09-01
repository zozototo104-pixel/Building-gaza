import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, CheckCircle2, Calendar, Users, BarChart3, Lock, Trash2, Vote as VoteIcon } from 'lucide-react';
import { Vote, Apartment } from '@/types';

interface VotingTabProps {
  votes: Vote[];
  apartments: Apartment[];
  onAdd: () => void;
  onCastVote: (voteId: number, optionId: number, apartmentId: number) => Promise<void>;
  onToggleStatus: (voteId: number, currentStatus: string) => Promise<void>;
  onDelete: (id: number) => void;
  loading?: boolean;
}

export function VotingTab({
  votes,
  apartments,
  onAdd,
  onCastVote,
  onToggleStatus,
  onDelete,
  loading
}: VotingTabProps) {
  const [selectedApartment, setSelectedApartment] = useState<number>(apartments[0]?.id || 1);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});

  const handleSelectOption = (voteId: number, optionId: number) => {
    setSelectedOptions((prev) => ({ ...prev, [voteId]: optionId }));
  };

  const handleVoteSubmit = async (voteId: number) => {
    const optionId = selectedOptions[voteId];
    if (!optionId) return;
    await onCastVote(voteId, optionId, selectedApartment);
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Voting Apartment Selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">التصويت بالنيابة عن:</span>
          <select
            value={selectedApartment}
            onChange={(e) => setSelectedApartment(parseInt(e.target.value))}
            className="h-9 rounded-md border border-input bg-background px-3 text-xs focus:ring-2 focus:ring-ring"
          >
            {apartments.map((apt) => (
              <option key={apt.id} value={apt.id}>
                شقة {apt.unitNumber} {apt.residents?.[0]?.name ? `(${apt.residents[0].name})` : ''}
              </option>
            ))}
          </select>
        </div>

        <Button onClick={onAdd} className="gap-2 h-9 text-xs">
          <Plus className="w-4 h-4" />
          إنشاء تصويت جديد
        </Button>
      </div>

      {/* Votes List */}
      {votes.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-300 bg-slate-50/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 bg-purple-100/70 text-purple-700 rounded-full mb-3">
              <VoteIcon className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">لا توجد استطلاعات أو تصويتات حالياً</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              يمكنك إنشاء استفتاءات لأخذ آراء الملاك وسكان العمارة حول القرارات والتحسينات المشتركة.
            </p>
            <Button onClick={onAdd} className="mt-4 gap-2 text-xs">
              <Plus className="w-4 h-4" />
              إنشاء أول تصويت
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {votes.map((vote) => {
            const rawOptions = vote.options;
            const optionsList: any[] = Array.isArray(rawOptions)
              ? rawOptions.map((opt: any, idx: number) =>
                  typeof opt === 'string' ? { id: idx + 1, text: opt } : opt
                )
              : [];

            const totalVotesCount = vote.responses?.length || vote.totalVotes || 0;
            const isClosed = vote.status === 'CLOSED';

            // Check if current selected apartment has voted
            const userResponse = vote.responses?.find((r) => r.apartmentId === selectedApartment);

            return (
              <Card key={vote.id} className="border-slate-200 shadow-2xs flex flex-col justify-between overflow-hidden">
                <div>
                  <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                          <VoteIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-bold text-slate-900 leading-snug">
                            {vote.question}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-2xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {vote.startDate ? new Date(vote.startDate).toLocaleDateString('ar-EG') : '-'}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {totalVotesCount} صوت مسجل
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={isClosed ? 'secondary' : 'default'}
                        className={isClosed ? 'bg-slate-200 text-slate-700 font-normal' : 'bg-emerald-600 text-white font-normal'}
                      >
                        {isClosed ? '🔒 مغلق' : '🟢 جاري التصويت'}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-4 space-y-3">
                    {/* Voting Options & Progress Bars */}
                    {optionsList.map((opt) => {
                      const countForOpt = vote.responses?.filter((r) => r.optionId === opt.id).length || 0;
                      const percentage = totalVotesCount > 0 ? Math.round((countForOpt / totalVotesCount) * 100) : 0;
                      const isSelected = selectedOptions[vote.id] === opt.id || userResponse?.optionId === opt.id;

                      return (
                        <div
                          key={opt.id}
                          onClick={() => !isClosed && handleSelectOption(vote.id, opt.id)}
                          className={`p-3 rounded-lg border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-purple-600 bg-purple-50/60'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          } ${isClosed ? 'cursor-default' : ''}`}
                        >
                          <div className="flex justify-between items-center text-xs mb-1.5">
                            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                              {opt.text}
                            </span>
                            <span className="text-2xs font-bold text-slate-600">
                              {countForOpt} ({percentage}%)
                            </span>
                          </div>

                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-600 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}

                    {userResponse && (
                      <p className="text-2xs text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-100 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        تم تسجيل تصويت الشقة المحددة (خيار رقم {userResponse.optionId})
                      </p>
                    )}
                  </CardContent>
                </div>

                <CardFooter className="pt-2 pb-3 px-4 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {!isClosed && (
                      <Button
                        size="sm"
                        disabled={!selectedOptions[vote.id] || loading}
                        onClick={() => handleVoteSubmit(vote.id)}
                        className="h-8 text-xs bg-purple-700 hover:bg-purple-800 text-white"
                      >
                        {userResponse ? 'تحديث التصويت' : 'تأكيد صوتك'}
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-slate-600 hover:bg-slate-100"
                      onClick={() => onToggleStatus(vote.id, vote.status)}
                    >
                      {isClosed ? 'إعادة الفتح' : 'إغلاق التصويت'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-rose-600 hover:bg-rose-50"
                      onClick={() => onDelete(vote.id)}
                      title="حذف التصويت"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
