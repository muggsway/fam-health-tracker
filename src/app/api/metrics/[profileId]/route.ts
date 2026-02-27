export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getMetricsByProfile } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const { profileId } = await params;
  const metrics = await getMetricsByProfile(profileId);
  return NextResponse.json(metrics);
}
