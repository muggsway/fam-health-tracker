'use client';

import type { Profile } from '@/types';

interface ProfileTabsProps {
  profiles: Profile[];
  activeId: string;
  onChange: (id: string) => void;
}

export default function ProfileTabs({ profiles, activeId, onChange }: ProfileTabsProps) {
  return (
    <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
      {profiles.map((p) => (
        <button
          key={p.id}
          onClick={() => onChange(p.id)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeId === p.id
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {p.name}
        </button>
      ))}
    </div>
  );
}
