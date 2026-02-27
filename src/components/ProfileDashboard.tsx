'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Profile, HealthReport, MetricsByCategory } from '@/types';
import type { MetricMetadataRow } from '@/lib/db';
import ProfileHeader from './ProfileHeader';
import CheckupDueBanner from './CheckupDueBanner';
import MissingMetricsBanner from './MissingMetricsBanner';
import StatsSummary from './StatsSummary';
import PriorityChartsSection from './PriorityChartsSection';
import MetricsTable from './MetricsTable';
import UploadReportModal from './UploadReportModal';

interface ProfileDashboardProps {
  profileId: string;
}

interface DashboardData {
  profile: Profile;
  reports: HealthReport[];
  metricsByCategory: MetricsByCategory;
  metricMetadata: Record<string, MetricMetadataRow>;
}

export default function ProfileDashboard({ profileId }: ProfileDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [weightRefreshKey, setWeightRefreshKey] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [profilesRes, reportsRes, metricsRes, metadataRes] = await Promise.all([
        fetch('/api/profiles'),
        fetch(`/api/reports?profileId=${profileId}`),
        fetch(`/api/metrics/${profileId}`),
        fetch('/api/metric-metadata'),
      ]);
      const profiles: Profile[] = await profilesRes.json();
      const reports: HealthReport[] = await reportsRes.json();
      const metricsByCategory: MetricsByCategory = await metricsRes.json();
      const metricMetadata: Record<string, MetricMetadataRow> = await metadataRes.json();

      const profile = profiles.find((p) => p.id === profileId);
      if (!profile) return;

      setData({ profile, reports, metricsByCategory, metricMetadata });
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="p-6 text-sm text-gray-500">Profile not found.</div>;
  }

  const { profile, reports, metricsByCategory, metricMetadata } = data;
  const lastReportDate = reports[0]?.report_date ?? null;
  const hasMetrics = Object.keys(metricsByCategory).length > 0;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-screen-xl mx-auto">
      <ProfileHeader
        profile={profile}
        lastReportDate={lastReportDate}
        onWeightSaved={() => setWeightRefreshKey((k) => k + 1)}
        onUploadClick={() => setShowUpload(true)}
      />

      <div className="space-y-2">
        <CheckupDueBanner lastReportDate={lastReportDate} />
        {hasMetrics && <MissingMetricsBanner metricsByCategory={metricsByCategory} />}
      </div>

      {hasMetrics && (
        <StatsSummary
          metricsByCategory={metricsByCategory}
          lastReportDate={lastReportDate}
          profileId={profileId}
        />
      )}

      {hasMetrics ? (
        <>
          <PriorityChartsSection
            metricsByCategory={metricsByCategory}
            profileId={profileId}
            weightRefreshKey={weightRefreshKey}
          />
          <MetricsTable metricsByCategory={metricsByCategory} metricMetadata={metricMetadata} />
        </>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm">No health data yet.</p>
          <p className="text-xs mt-1">Upload a PDF lab report to get started.</p>
        </div>
      )}

      {showUpload && (
        <UploadReportModal
          profileId={profileId}
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            setShowUpload(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}
