'use client';

import { useState } from 'react';

interface WeightEditModalProps {
  profileId: string;
  currentWeight: number | null;
  onClose: () => void;
  onSaved: (newWeight: number) => void;
}

export default function WeightEditModal({ profileId, currentWeight, onClose, onSaved }: WeightEditModalProps) {
  const [value, setValue] = useState(currentWeight?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      setError('Enter a valid weight in kg');
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/profiles/${profileId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weight_kg: num, weight_updated_at: new Date().toISOString() }),
    });
    setSaving(false);
    if (res.ok) {
      onSaved(num);
    } else {
      setError('Failed to save. Try again.');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-6 w-80" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold text-gray-800 mb-4">Update Weight</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Weight in kg"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <span className="text-sm text-gray-500">kg</span>
        </div>
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
