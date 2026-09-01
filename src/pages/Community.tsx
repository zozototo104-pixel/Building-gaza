import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  Megaphone,
  HeartHandshake,
  Vote as VoteIcon,
  FileText,
  Plus
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { Announcement, VisitGift, Vote, Meeting, Apartment } from '@/types';

import { AnnouncementsTab } from '@/components/community/AnnouncementsTab';
import { AnnouncementModal } from '@/components/community/AnnouncementModal';
import { AnnouncementPrintModal } from '@/components/community/AnnouncementPrintModal';

import { VisitsGiftsTab } from '@/components/community/VisitsGiftsTab';
import { VisitGiftModal } from '@/components/community/VisitGiftModal';
import { VisitsPrintModal } from '@/components/community/VisitsPrintModal';

import { VotingTab } from '@/components/community/VotingTab';
import { VoteModal } from '@/components/community/VoteModal';

import { MeetingsTab } from '@/components/community/MeetingsTab';
import { MeetingModal } from '@/components/community/MeetingModal';
import { MeetingPrintModal } from '@/components/community/MeetingPrintModal';

export function Community() {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'announcements' | 'visits' | 'voting' | 'meetings'>('announcements');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Entities state
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [visits, setVisits] = useState<VisitGift[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);

  // Announcement modals
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);
  const [isAnnPrintOpen, setIsAnnPrintOpen] = useState(false);
  const [printAnn, setPrintAnn] = useState<Announcement | null>(null);

  // Visit modals
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<VisitGift | null>(null);
  const [isVisitsPrintOpen, setIsVisitsPrintOpen] = useState(false);

  // Vote modals
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);

  // Meeting modals
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [isMeetingPrintOpen, setIsMeetingPrintOpen] = useState(false);
  const [printMeeting, setPrintMeeting] = useState<Meeting | null>(null);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [aRes, vRes, voRes, mRes, apRes] = await Promise.all([
        fetch('/api/announcements', { headers }),
        fetch('/api/visits-gifts', { headers }),
        fetch('/api/votes', { headers }),
        fetch('/api/meetings', { headers }),
        fetch('/api/apartments', { headers })
      ]);

      if (aRes.ok) setAnnouncements(await aRes.json());
      if (vRes.ok) setVisits(await vRes.json());
      if (voRes.ok) setVotes(await voRes.json());
      if (mRes.ok) setMeetings(await mRes.json());
      if (apRes.ok) setApartments(await apRes.json());
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء تحميل بيانات المجتمع');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Announcements CRUD
  const handleCreateOrUpdateAnn = async (data: any) => {
    setActionLoading(true);
    try {
      const token = await getToken();
      const url = editingAnn ? `/api/announcements/${editingAnn.id}` : '/api/announcements';
      const method = editingAnn ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        toast.success(editingAnn ? 'تم تعديل الإعلان بنجاح' : 'تم نشر الإعلان بنجاح');
        setIsAnnModalOpen(false);
        setEditingAnn(null);
        await fetchAllData();
      } else {
        toast.error('فشل حفظ الإعلان');
      }
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء العملية');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAnn = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;
    try {
      const token = await getToken();
      const res = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('تم حذف الإعلان');
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ');
    }
  };

  // Visits & Gifts CRUD
  const handleCreateOrUpdateVisit = async (data: any) => {
    setActionLoading(true);
    try {
      const token = await getToken();
      const url = editingVisit ? `/api/visits-gifts/${editingVisit.id}` : '/api/visits-gifts';
      const method = editingVisit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        toast.success(editingVisit ? 'تم تعديل سجل المناسبة' : 'تم تسجيل المناسبة بنجاح');
        setIsVisitModalOpen(false);
        setEditingVisit(null);
        await fetchAllData();
      } else {
        toast.error('فشل تسجيل المناسبة');
      }
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteVisit = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف سجل هذه الزيارة؟')) return;
    try {
      const token = await getToken();
      const res = await fetch(`/api/visits-gifts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('تم حذف السجل');
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ');
    }
  };

  // Voting CRUD
  const handleCreateVote = async (data: any) => {
    setActionLoading(true);
    try {
      const token = await getToken();
      const optionsArray = data.options
        ? data.options.split(',').map((o: string, idx: number) => ({ id: idx + 1, text: o.trim() })).filter((o: any) => o.text)
        : [{ id: 1, text: 'نعم' }, { id: 2, text: 'لا' }];

      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          question: data.question,
          options: optionsArray,
          audience: data.audience || 'ALL',
          startDate: data.startDate || new Date().toISOString(),
          endDate: data.endDate || null,
          status: 'ACTIVE'
        })
      });

      if (res.ok) {
        toast.success('تم إنشاء التصويت بنجاح');
        setIsVoteModalOpen(false);
        await fetchAllData();
      } else {
        toast.error('فشل إنشاء التصويت');
      }
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCastVote = async (voteId: number, optionId: number, apartmentId: number) => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/votes/${voteId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          optionId,
          apartmentId
        })
      });

      if (res.ok) {
        toast.success('تم تسجيل تصويتك بنجاح');
        await fetchAllData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'فشل تسجيل التصويت');
      }
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء التصويت');
    }
  };

  const handleToggleVoteStatus = async (voteId: number, currentStatus: string) => {
    try {
      const token = await getToken();
      const newStatus = currentStatus === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
      const res = await fetch(`/api/votes/${voteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        toast.success(newStatus === 'CLOSED' ? 'تم إغلاق التصويت' : 'تم إعادة فتح التصويت');
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ');
    }
  };

  const handleDeleteVote = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التصويت؟')) return;
    try {
      const token = await getToken();
      const res = await fetch(`/api/votes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('تم حذف التصويت');
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ');
    }
  };

  // Meetings CRUD
  const handleCreateOrUpdateMeeting = async (data: any) => {
    setActionLoading(true);
    try {
      const token = await getToken();
      const url = editingMeeting ? `/api/meetings/${editingMeeting.id}` : '/api/meetings';
      const method = editingMeeting ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        toast.success(editingMeeting ? 'تم تعديل المحضر بنجاح' : 'تم حفظ محضر الاجتماع بنجاح');
        setIsMeetingModalOpen(false);
        setEditingMeeting(null);
        await fetchAllData();
      } else {
        toast.error('فشل حفظ المحضر');
      }
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMeeting = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف محضر الاجتماع هذا؟')) return;
    try {
      const token = await getToken();
      const res = await fetch(`/api/meetings/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('تم حذف المحضر');
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ');
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-600" />
            شؤون المجتمع والتكافل واتحاد الملاك
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            منصة التواصل والتعميمات الرسمية، الزيارات والهدايا، التصويت الإلكتروني، ومحاضر الاجتماعات
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-xl grid grid-cols-2 md:grid-cols-4 max-w-2xl">
          <TabsTrigger value="announcements" className="gap-2 text-xs font-semibold py-2">
            <Megaphone className="w-4 h-4 text-blue-600" />
            الإعلانات والتعميمات ({announcements.length})
          </TabsTrigger>
          <TabsTrigger value="visits" className="gap-2 text-xs font-semibold py-2">
            <HeartHandshake className="w-4 h-4 text-rose-600" />
            الزيارات والهدايا ({visits.length})
          </TabsTrigger>
          <TabsTrigger value="voting" className="gap-2 text-xs font-semibold py-2">
            <VoteIcon className="w-4 h-4 text-purple-600" />
            التصويت والقرارات ({votes.length})
          </TabsTrigger>
          <TabsTrigger value="meetings" className="gap-2 text-xs font-semibold py-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            محاضر الاجتماعات ({meetings.length})
          </TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 mt-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-3" />
            <p className="text-sm text-muted-foreground">جاري تحميل بيانات المجتمع...</p>
          </div>
        ) : (
          <>
            {/* Announcements Tab */}
            <TabsContent value="announcements" className="mt-4">
              <AnnouncementsTab
                announcements={announcements}
                onAdd={() => {
                  setEditingAnn(null);
                  setIsAnnModalOpen(true);
                }}
                onEdit={(ann) => {
                  setEditingAnn(ann);
                  setIsAnnModalOpen(true);
                }}
                onDelete={handleDeleteAnn}
                onPrint={(ann) => {
                  setPrintAnn(ann);
                  setIsAnnPrintOpen(true);
                }}
              />
            </TabsContent>

            {/* Visits & Gifts Tab */}
            <TabsContent value="visits" className="mt-4">
              <VisitsGiftsTab
                visits={visits}
                onAdd={() => {
                  setEditingVisit(null);
                  setIsVisitModalOpen(true);
                }}
                onEdit={(visit) => {
                  setEditingVisit(visit);
                  setIsVisitModalOpen(true);
                }}
                onDelete={handleDeleteVisit}
                onPrint={() => setIsVisitsPrintOpen(true)}
              />
            </TabsContent>

            {/* Voting Tab */}
            <TabsContent value="voting" className="mt-4">
              <VotingTab
                votes={votes}
                apartments={apartments}
                onAdd={() => setIsVoteModalOpen(true)}
                onCastVote={handleCastVote}
                onToggleStatus={handleToggleVoteStatus}
                onDelete={handleDeleteVote}
                loading={actionLoading}
              />
            </TabsContent>

            {/* Meetings Tab */}
            <TabsContent value="meetings" className="mt-4">
              <MeetingsTab
                meetings={meetings}
                onAdd={() => {
                  setEditingMeeting(null);
                  setIsMeetingModalOpen(true);
                }}
                onEdit={(m) => {
                  setEditingMeeting(m);
                  setIsMeetingModalOpen(true);
                }}
                onDelete={handleDeleteMeeting}
                onPrint={(m) => {
                  setPrintMeeting(m);
                  setIsMeetingPrintOpen(true);
                }}
              />
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Modals */}
      <AnnouncementModal
        open={isAnnModalOpen}
        onOpenChange={setIsAnnModalOpen}
        announcement={editingAnn}
        onSubmit={handleCreateOrUpdateAnn}
        loading={actionLoading}
      />

      <AnnouncementPrintModal
        open={isAnnPrintOpen}
        onOpenChange={setIsAnnPrintOpen}
        announcement={printAnn}
      />

      <VisitGiftModal
        open={isVisitModalOpen}
        onOpenChange={setIsVisitModalOpen}
        visitGift={editingVisit}
        onSubmit={handleCreateOrUpdateVisit}
        loading={actionLoading}
      />

      <VisitsPrintModal
        open={isVisitsPrintOpen}
        onOpenChange={setIsVisitsPrintOpen}
        visits={visits}
      />

      <VoteModal
        open={isVoteModalOpen}
        onOpenChange={setIsVoteModalOpen}
        onSubmit={handleCreateVote}
        loading={actionLoading}
      />

      <MeetingModal
        open={isMeetingModalOpen}
        onOpenChange={setIsMeetingModalOpen}
        meeting={editingMeeting}
        onSubmit={handleCreateOrUpdateMeeting}
        loading={actionLoading}
      />

      <MeetingPrintModal
        open={isMeetingPrintOpen}
        onOpenChange={setIsMeetingPrintOpen}
        meeting={printMeeting}
      />
    </div>
  );
}
