'use client';

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../../components/layout/AppShell';
import { ComplaintDetailView } from '../../../components/complaints/ComplaintDetailView';
import { getComplaintById } from '../../../data/mockData';

export default function ComplaintDetailPage({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const caseId = resolvedParams.id;
  const complaint = getComplaintById(caseId);

  const handleBack = () => {
    // Preserve history/context when navigating back
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handleSelectRelatedCase = (relatedId) => {
    router.push(`/complaints/${relatedId}`);
  };

  return (
    <AppShell
      activeTab="complaints"
      onSelectTab={(tab) => router.push(`/?tab=${tab}`)}
      selectedBureau="all"
      onSelectBureau={(bureau) => router.push(`/?bureau=${bureau}`)}
      searchQuery=""
      onSearchChange={() => {}}
      onOpenNotifications={() => {}}
    >
      <ComplaintDetailView
        complaint={complaint}
        onBack={handleBack}
        onSelectRelatedCase={handleSelectRelatedCase}
      />
    </AppShell>
  );
}
