'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Bell,
  Calendar,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Scissors,
  Settings,
  Users,
  X,
} from 'lucide-react';

const primaryItems = [
  { name: 'Inicio', href: '/app/dashboard', icon: LayoutDashboard },
  { name: 'Agenda', href: '/app/agenda', icon: Calendar },
  { name: 'Clientes', href: '/app/clientes', icon: Users },
  { name: 'Stock', href: '/app/productos', icon: Package },
];

const menuItems = [
  { name: 'Servicios', href: '/app/servicios', icon: Scissors },
  { name: 'Servicios Prestados', href: '/app/servicios-prestados', icon: ClipboardList },
  { name: 'Recordatorios', href: '/app/recordatorios', icon: Bell },
  { name: 'Ajustes', href: '/app/ajustes', icon: Settings },
];

interface MobileNavigationProps {
  businessName?: string;
}

export default function MobileNavigation({ businessName = 'Aura Estudio' }: MobileNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const hasMenuActive = menuItems.some((item) => isActive(item.href));

  const handleLogout = async () => {
    setIsOpen(false);

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
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menu"
            className="absolute inset-0 bg-brand-dark/35"
            onClick={() => setIsOpen(false)}
          />
          <section className="absolute inset-x-3 bottom-24 rounded-lg border border-brand-border bg-white shadow-2xl animate-slide-up overflow-hidden">
            <div className="flex items-center justify-between border-b border-brand-border px-4 py-3">
              <div>
                <p className="font-serif text-lg font-bold text-brand-dark">{businessName}</p>
                <p className="text-[10px] uppercase tracking-widest text-brand-primary font-semibold">
                  Menu principal
                </p>
              </div>
              <button
                type="button"
                aria-label="Cerrar menu"
                className="h-10 w-10 rounded-lg border border-brand-border text-stone-500 flex items-center justify-center"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="grid grid-cols-1 gap-1 p-2">
              {[...primaryItems, ...menuItems].map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium ${
                      active
                        ? 'bg-brand-primary text-white'
                        : 'text-stone-600 hover:bg-brand-light hover:text-brand-dark'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-stone-400'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={handleLogout}
                className="mt-1 flex items-center gap-3 rounded-lg border border-red-100 bg-red-50 px-3 py-3 text-left text-sm font-medium text-red-600"
              >
                <LogOut className="h-5 w-5 text-red-500" />
                <span>Cerrar sesion</span>
              </button>
            </nav>
          </section>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-brand-border bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-10px_30px_rgba(28,25,23,0.08)] backdrop-blur lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex h-14 flex-col items-center justify-center rounded-lg text-[11px] font-medium ${
                  active ? 'bg-brand-light text-brand-dark' : 'text-stone-500'
                }`}
              >
                <Icon className={`mb-1 h-5 w-5 ${active ? 'text-brand-primary' : 'text-stone-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <button
            type="button"
            aria-label="Abrir menu"
            onClick={() => setIsOpen(true)}
            className={`flex h-14 flex-col items-center justify-center rounded-lg text-[11px] font-medium ${
              hasMenuActive || isOpen ? 'bg-brand-light text-brand-dark' : 'text-stone-500'
            }`}
          >
            <Menu className={`mb-1 h-5 w-5 ${hasMenuActive || isOpen ? 'text-brand-primary' : 'text-stone-400'}`} />
            <span>Mas</span>
          </button>
        </div>
      </nav>
    </>
  );
}
