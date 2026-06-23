import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'No se pudo cerrar sesion. Intenta nuevamente.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true, redirectTo: '/login' })
}
