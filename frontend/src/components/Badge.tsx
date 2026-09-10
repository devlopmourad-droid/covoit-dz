import React from 'react';

type Tone = 'brand' | 'accent' | 'muted' | 'success' | 'danger';

const toneClasses: Record<Tone, string> = {
  brand: 'bg-brand-light text-brand',
  accent: 'bg-accent/10 text-accent',
  muted: 'bg-gray-100 text-muted',
  success: 'bg-brand-light text-brand',
  danger: 'bg-red-50 text-red-600',
};

export default function Badge({ tone = 'brand', children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}
