'use strict';

import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-brand-border rounded-xl bg-white max-w-lg mx-auto my-8 animate-fade-in shadow-sm">
      <div className="w-12 h-12 rounded-full bg-brand-light flex items-center justify-center mb-4 text-brand-primary">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold text-brand-dark mb-1">{title}</h3>
      <p className="text-sm text-stone-500 mb-6 max-w-sm">{description}</p>
      
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center justify-center px-4 py-2 bg-brand-primary hover:bg-[#a58a73] text-white text-sm font-medium rounded-lg transition-colors cursor-pointer shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
