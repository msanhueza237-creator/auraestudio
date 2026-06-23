import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const registerSchema = z.object({
  fullName: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().min(6),
})

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null)
  const parsed = registerSchema.safeParse(payload)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Revisa los datos ingresados e intenta nuevamente.' },
      { status: 400 }
    )
  }

  const { fullName, password } = parsed.data
  const email = parsed.data.email.toLowerCase()

  try {
    const admin = createAdminClient()
    const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    })

    if (createError) {
      const message = createError.message.toLowerCase()

      if (message.includes('already') || message.includes('registered')) {
        return NextResponse.json(
          { error: 'Ya existe una cuenta registrada con este correo.' },
          { status: 409 }
        )
      }

      console.error('Register createUser error:', createError)
      return NextResponse.json(
        { error: 'No se pudo crear la cuenta. Intenta nuevamente en unos minutos.' },
        { status: 500 }
      )
    }

    const userId = createdUser.user?.id

    if (!userId) {
      return NextResponse.json(
        { error: 'No se pudo crear la cuenta. Intenta nuevamente en unos minutos.' },
        { status: 500 }
      )
    }

    const { error: profileError } = await admin
      .from('profiles')
      .upsert({ id: userId, full_name: fullName }, { onConflict: 'id' })

    if (profileError) {
      console.error('Register profile upsert error:', profileError)
    }

    const supabase = await createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      console.error('Register signIn error:', signInError)
      return NextResponse.json(
        { error: 'La cuenta fue creada, pero no se pudo iniciar sesión automáticamente. Ingresa desde la pantalla de login.' },
        { status: 201 }
      )
    }

    return NextResponse.json({ ok: true, redirectTo: '/app/dashboard' })
  } catch (error) {
    console.error('Register unexpected error:', error)
    return NextResponse.json(
      { error: 'Ocurrió un error inesperado al procesar el registro.' },
      { status: 500 }
    )
  }
}
