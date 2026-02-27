export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getProfileById, getReportsByProfile, getLatestMetricsForProfile } from '@/lib/db';
import { generateHealthSummary } from '@/lib/claude';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const { profileId } = await params;

  const profile = await getProfileById(profileId);
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const reports = await getReportsByProfile(profileId);
  if (reports.length === 0) {
    return NextResponse.json({ summary: null });
  }

  const metrics = await getLatestMetricsForProfile(profileId);
  if (metrics.length === 0) {
    return NextResponse.json({ summary: null });
  }

  try {
    const summary = await generateHealthSummary(metrics, profile);
    return NextResponse.json({ summary });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    if (msg.includes('ANTHROPIC_API_KEY')) {
      return NextResponse.json({ summary: null, note: 'Configure ANTHROPIC_API_KEY to enable AI summaries.' });
    }
    console.error('Summary error:', err);
    return NextResponse.json({ summary: null });
  }
}
