export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getWeightHistory } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const { profileId } = await params;
  const history = await getWeightHistory(profileId);
  return NextResponse.json(history);
}
