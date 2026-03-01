import { upsertProfile } from './db';

const PROFILES = [
  { id: 'raj-kumar', name: 'Raj Kumar' },
  { id: 'anju', name: 'Anju' },
  { id: 'sugandha', name: 'Sugandha' },
  { id: 'chiranjaya', name: 'Chiranjaya' },
  { id: 'amit', name: 'Amit' },
  { id: 'vishakha', name: 'Vishakha' },
  {
    id: 'mugdha',
    name: 'Mugdha',
    date_of_birth: null,
    blood_group: null,
    height_cm: null,
    weight_kg: null,
  },
  { id: 'akshit', name: 'Akshit' },
];

export async function seedData(): Promise<void> {
  for (const p of PROFILES) {
    await upsertProfile(p as Parameters<typeof upsertProfile>[0]);
  }
}
