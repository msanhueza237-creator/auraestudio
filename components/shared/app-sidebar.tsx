'use strict';
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Scissors, 
  Package, 
  ClipboardList, 
  Settings,
  Bell
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
  { name: 'Agenda', href: '/app/agenda', icon: Calendar },
  { name: 'Clientes', href: '/app/clientes', icon: Users },
  { name: 'Servicios', href: '/app/servicios', icon: Scissors },
  { name: 'Productos y Stock', href: '/app/productos', icon: Package },
  { name: 'Servicios Prestados', href: '/app/servicios-prestados', icon: ClipboardList },
  { name: 'Recordatorios', href: '/app/recordatorios', icon: Bell },
  { name: 'Ajustes', href: '/app/ajustes', icon: Settings },
];

interface AppSidebarProps {
  businessName?: string;
}

export default function AppSidebar({ businessName = 'Aura Estudio' }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-20 hidden h-screen w-64 flex-col border-r border-brand-border bg-white lg:flex">
      {/* Brand logo/name */}
      <div className="h-16 border-b border-brand-border flex items-center px-6 bg-brand-cream/30">
        <Link href="/app/dashboard" className="flex flex-col">
          <span className="font-serif text-xl font-bold tracking-tight text-brand-dark">
            {businessName}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-brand-primary font-semibold">
            Salón de Belleza
          </span>
        </Link>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-primary text-white shadow-sm font-semibold'
                  : 'text-stone-600 hover:bg-brand-light hover:text-brand-dark'
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-stone-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-brand-border bg-brand-cream/10 text-center">
        <p className="text-[11px] text-stone-400">
          Aura Estudio &copy; 2026
        </p>
      </div>
    </aside>
  );
}
