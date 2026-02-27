'use client';

import { useState } from 'react';

interface DobEditModalProps {
  profileId: string;
  currentDob: string | null;
  onClose: () => void;
  onSaved: (newDob: string | null) => void;
}

export default function DobEditModal({ profileId, currentDob, onClose, onSaved }: DobEditModalProps) {
  const [value, setValue] = useState(currentDob ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    const dob = value.trim() || null;
    if (dob && !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      setError('Enter a valid date');
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/profiles/${profileId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date_of_birth: dob }),
    });
    setSaving(false);
    if (res.ok) {
      onSaved(dob);
    } else {
      setError('Failed to save. Try again.');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-6 w-80" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold text-gray-800 mb-4">Edit Date of Birth</h3>
        <input
          type="date"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
          max={new Date().toISOString().slice(0, 10)}
        />
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
