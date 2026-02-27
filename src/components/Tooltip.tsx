'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  /** 'above-left' (default) | 'above-center' | 'right' */
  position?: 'above-left' | 'above-center' | 'right';
  maxWidth?: string;
}

export default function Tooltip({ content, children, position = 'above-left', maxWidth = 'max-w-[240px]' }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  const posClass =
    position === 'right'
      ? 'left-full top-1/2 -translate-y-1/2 ml-2'
      : position === 'above-center'
      ? 'bottom-full left-1/2 -translate-x-1/2 mb-1.5'
      : 'bottom-full left-0 mb-1.5';

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          className={`absolute ${posClass} z-50 ${maxWidth} w-max bg-gray-800 text-white text-xs rounded px-2.5 py-1.5 leading-relaxed shadow-lg pointer-events-none whitespace-normal`}
        >
          {content}
        </span>
      )}
    </span>
  );
}
