export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getAllProfiles, ensureDB } from '@/lib/db';

export async function GET() {
  try {
    await ensureDB();
    const profiles = await getAllProfiles();
    return NextResponse.json(profiles);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('GET /api/profiles error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
