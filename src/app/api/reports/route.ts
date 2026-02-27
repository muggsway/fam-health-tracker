export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getReportsByProfile } from '@/lib/db';

export async function GET(request: NextRequest) {
  const profileId = request.nextUrl.searchParams.get('profileId');
  if (!profileId) {
    return NextResponse.json({ error: 'profileId is required' }, { status: 400 });
  }
  const reports = await getReportsByProfile(profileId);
  return NextResponse.json(reports);
}
