'use client';

import { useEffect, useState } from 'react';

interface HealthSummaryProps {
  profileId: string;
}

export default function HealthSummary({ profileId }: HealthSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setSummary(null);
    fetch(`/api/summary/${profileId}`)
      .then((r) => r.json())
      .then((data) => setSummary(data.summary ?? null))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, [profileId]);

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
        <div className="h-4 bg-blue-100 rounded animate-pulse w-3/4 mb-2" />
        <div className="h-4 bg-blue-100 rounded animate-pulse w-1/2" />
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-900">
      <span className="font-semibold text-blue-700 mr-2">AI Summary</span>
      {summary}
    </div>
  );
}
