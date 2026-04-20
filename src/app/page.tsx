'use client';

import { useState, useEffect } from 'react';
import type { Profile } from '@/types';
import ProfileTabs from '@/components/ProfileTabs';
import ProfileDashboard from '@/components/ProfileDashboard';

export default function Home() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/profiles')
      .then((r) => r.json())
      .then((data: Profile[]) => {
        setProfiles(data);
        setActiveId(data[0]?.id ?? '');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-500">Loading health tracker…</p>
        </div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-gray-500">No profiles found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <h1 className="text-base font-semibold text-gray-900">Family Health Tracker</h1>
      </header>

      {/* Profile Tabs */}
      <ProfileTabs profiles={profiles} activeId={activeId} onChange={setActiveId} />

      {/* Dashboard */}
      <main className="flex-1">
        {activeId && <ProfileDashboard key={activeId} profileId={activeId} />}
      </main>
    </div>
  );
}
