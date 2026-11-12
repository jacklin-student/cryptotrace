import React from 'react';

export function DataModeBadge({ mode = 'DEMO' }) {
  const isDemo = mode?.toUpperCase() === 'DEMO';
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase transition-colors shadow-sm ${
        isDemo
          ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
          : 'bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]'
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isDemo ? 'bg-[#D97706] animate-pulse' : 'bg-[#059669]'
        }`}
      />
      {isDemo ? 'DEMO DATA' : 'VERIFIED ON-CHAIN'}
    </span>
  );
}

export function RiskBadge({ level = 'LOW', score = null }) {
  const normalized = level?.toUpperCase() || 'LOW';

  let bg = 'bg-[#EBF7F0]';
  let text = 'text-[#3E9B6B]';
  let border = 'border-[#C2E7D3]';

  if (normalized === 'HIGH' || (score !== null && score >= 70)) {
    bg = 'bg-[#FDF2F1]';
    text = 'text-[#C0392B]';
    border = 'border-[#F8D2CF]';
  } else if (normalized === 'MEDIUM' || (score !== null && score >= 40)) {
    bg = 'bg-[#FEF9ED]';
    text = 'text-[#E0A030]';
    border = 'border-[#FCE8BD]';
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${bg} ${text} ${border}`}
    >
      {normalized}
      {score !== null && (
        <span className="font-mono font-medium opacity-80">({Math.round(score)})</span>
      )}
    </span>
  );
}

export function TagBadge({ children, variant = 'skin' }) {
  let styles = 'bg-[#FBEFE7] text-[#3B2A22] border-[#F2CCB7]';
  if (variant === 'accent') styles = 'bg-[#F2CCB7] text-[#3B2A22] border-[#D9A98E]';
  if (variant === 'threat') styles = 'bg-[#FDF2F1] text-[#C0392B] border-[#F8D2CF]';
  if (variant === 'muted') styles = 'bg-gray-100 text-[#7A6257] border-gray-200';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${styles}`}>
      {children}
    </span>
  );
}
