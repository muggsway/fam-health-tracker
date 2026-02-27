export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { updateProfile, getProfileById, addWeightEntry } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const allowed = ['name', 'date_of_birth', 'blood_group', 'height_cm', 'weight_kg', 'weight_updated_at'];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  await updateProfile(id, updates);

  // Record weight history entry whenever weight is updated
  if (typeof updates.weight_kg === 'number') {
    try {
      await addWeightEntry(id, updates.weight_kg, typeof updates.weight_updated_at === 'string' ? updates.weight_updated_at : undefined);
    } catch {
      // Non-fatal: weight history insert failed
    }
  }

  const profile = await getProfileById(id);
  return NextResponse.json(profile);
}
