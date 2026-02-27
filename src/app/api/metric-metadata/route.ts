export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getAllMetricMetadata } from '@/lib/db';

export async function GET() {
  const metadata = await getAllMetricMetadata();
  return NextResponse.json(metadata);
}
