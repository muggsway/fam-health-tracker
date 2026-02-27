'use client';

import { useState } from 'react';
import type { Profile } from '@/types';
import WeightEditModal from './WeightEditModal';
import DobEditModal from './DobEditModal';

interface ProfileHeaderProps {
  profile: Profile;
  lastReportDate: string | null;
  onWeightSaved?: () => void;
  onUploadClick?: () => void;
}

function calcAge(dob: string | null): string | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  const years = now.getFullYear() - birth.getFullYear();
  const hadBirthday =
    now.getMonth() > birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
  return `${hadBirthday ? years : years - 1} yrs`;
}

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

// Pencil icon
function PencilIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-3 1 1-3a4 4 0 01.828-1.414z" />
    </svg>
  );
}

export default function ProfileHeader({ profile, lastReportDate, onWeightSaved, onUploadClick }: ProfileHeaderProps) {
  const [currentProfile, setCurrentProfile] = useState(profile);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showDobModal, setShowDobModal] = useState(false);

  const age = calcAge(currentProfile.date_of_birth);
  const dob = formatDate(currentProfile.date_of_birth);

  const lastReport = lastReportDate
    ? (() => {
        const [y, m] = lastReportDate.split('-').map(Number);
        return new Date(y, m - 1).toLocaleString('default', { month: 'short', year: 'numeric' });
      })()
    : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">{currentProfile.name}</h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
            {/* DOB — click pencil to edit */}
            <button
              onClick={() => setShowDobModal(true)}
              className="flex items-center gap-1 hover:text-blue-600 transition-colors"
              title="Click to edit date of birth"
            >
              {dob ? (
                <>DOB: {dob}{age ? ` (${age})` : ''}</>
              ) : (
                <span className="text-blue-500 text-xs">+ Add date of birth</span>
              )}
              <PencilIcon />
            </button>

            {currentProfile.blood_group && (
              <span className="font-medium text-red-600">Blood: {currentProfile.blood_group}</span>
            )}
            {currentProfile.height_cm && <span>Height: {currentProfile.height_cm} cm</span>}
            {currentProfile.weight_kg && (
              <button
                onClick={() => setShowWeightModal(true)}
                className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                title="Click to update weight"
              >
                Weight: {currentProfile.weight_kg} kg
                <PencilIcon />
              </button>
            )}
            {!currentProfile.weight_kg && (
              <button
                onClick={() => setShowWeightModal(true)}
                className="text-blue-500 hover:text-blue-700 text-xs"
              >
                + Add weight
              </button>
            )}
            {lastReport && <span className="text-gray-400">Last report: {lastReport}</span>}
          </div>
        </div>
        <button
          onClick={onUploadClick}
          className="flex-shrink-0 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload Report
        </button>
      </div>

      {showWeightModal && (
        <WeightEditModal
          profileId={currentProfile.id}
          currentWeight={currentProfile.weight_kg}
          onClose={() => setShowWeightModal(false)}
          onSaved={(w) => {
            setCurrentProfile((p) => ({ ...p, weight_kg: w }));
            setShowWeightModal(false);
            onWeightSaved?.();
          }}
        />
      )}

      {showDobModal && (
        <DobEditModal
          profileId={currentProfile.id}
          currentDob={currentProfile.date_of_birth}
          onClose={() => setShowDobModal(false)}
          onSaved={(dob) => {
            setCurrentProfile((p) => ({ ...p, date_of_birth: dob }));
            setShowDobModal(false);
          }}
        />
      )}
    </div>
  );
}
