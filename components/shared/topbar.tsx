'use strict';
'use client';

import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';

interface TopbarProps {
  userName?: string;
  businessName?: string;
}

export default function Topbar({ userName, businessName = 'Aura Estudio' }: TopbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch('/auth/logout', { method: 'POST' });

      if (!response.ok) {
        console.error('Error logging out:', await response.text());
      }
    } catch (err) {
      console.error('Error logging out:', err);
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-10 flex h-16 items-center justify-between border-b border-brand-border bg-white px-4 sm:px-6 lg:left-64 lg:px-8">
      <div className="min-w-0">
        <span className="block truncate font-serif text-lg font-bold text-brand-dark lg:hidden">
          {businessName}
        </span>
        <span className="hidden text-sm text-stone-400 lg:block">Panel de Control</span>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex min-w-0 items-center gap-2 border-r border-brand-border pr-2 sm:pr-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-border bg-brand-light">
            <User className="h-4 w-4 text-brand-primary" />
          </div>
          <span className="hidden max-w-[8rem] truncate text-sm font-medium text-brand-dark sm:inline-block">
            {userName || 'Profesional'}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-red-50 hover:text-red-600 md:w-auto md:px-2"
          title="Cerrar sesion"
          type="button"
        >
          <LogOut className="h-4.5 w-4.5" />
          <span className="hidden pl-2 text-sm font-medium md:inline">Cerrar sesion</span>
        </button>
      </div>
    </header>
  );
}
