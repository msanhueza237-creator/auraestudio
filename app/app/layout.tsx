import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AppSidebar from '@/components/shared/app-sidebar';
import Topbar from '@/components/shared/topbar';
import MobileNavigation from '@/components/shared/mobile-navigation';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Validate session on server-side
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile metadata
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, business_name')
    .eq('id', user.id)
    .single();

  const fullName = profile?.full_name || user.email?.split('@')[0] || 'Profesional';
  const businessName = profile?.business_name || 'Aura Estudio';

  return (
    <div className="min-h-screen bg-brand-cream lg:flex">
      {/* Sidebar Navigation */}
      <AppSidebar businessName={businessName} />

      {/* Main Workspace Area */}
      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        {/* Header Topbar */}
        <Topbar userName={fullName} businessName={businessName} />

        {/* Dynamic page contents with layout alignment */}
        <main className="flex-grow px-4 pb-28 pt-20 animate-fade-in sm:px-6 lg:px-8 lg:pb-12 lg:pt-24">
          {children}
        </main>
      </div>

      <MobileNavigation businessName={businessName} />
    </div>
  );
}
