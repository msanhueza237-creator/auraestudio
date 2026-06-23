import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
})

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null)
  const parsed = loginSchema.safeParse(payload)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Revisa tu correo y contrasena e intenta nuevamente.' },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email.toLowerCase(),
    password: parsed.data.password,
  })

  if (error) {
    const message = error.message === 'Invalid login credentials'
      ? 'Correo electronico o contrasena incorrectos.'
      : 'No se pudo iniciar sesion. Intenta nuevamente.'

    console.error('Login error:', error)
    return NextResponse.json({ error: message }, { status: 401 })
  }

  return NextResponse.json({ ok: true, redirectTo: '/app/dashboard' })
}
