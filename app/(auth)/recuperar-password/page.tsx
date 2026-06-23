'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { Loader2, ArrowLeft } from 'lucide-react';

const recoverySchema = z.object({
  email: z.string().email('Por favor introduce un correo válido'),
});

type RecoveryFormValues = z.infer<typeof recoverySchema>;

export default function RecoverPasswordPage() {
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecoveryFormValues>({
    resolver: zodResolver(recoverySchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: RecoveryFormValues) => {
    setError(null);
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/actualizar-password`,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
      } else {
        setSuccess(true);
        setLoading(false);
      }
    } catch (err) {
      setError('Ocurrió un error inesperado al intentar enviar el enlace de recuperación.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link
          href="/login"
          className="inline-flex items-center text-xs text-stone-500 hover:text-brand-primary transition-colors"
        >
          <ArrowLeft className="w-4.5 h-4.5 mr-1" />
          Volver a iniciar sesión
        </Link>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-brand-dark">
          Recuperar contraseña
        </h2>
        <p className="text-sm text-stone-500">
          Introduce tu correo y te enviaremos las instrucciones para restablecer tu contraseña
        </p>
      </div>

      {success ? (
        <div className="p-4 bg-amber-50/50 border border-amber-200 text-amber-900 rounded-lg text-sm space-y-2">
          <p className="font-semibold">¡Correo de recuperación enviado!</p>
          <p className="text-stone-600 text-xs">
            Revisa tu bandeja de entrada y sigue el enlace para restablecer tu contraseña.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
              Correo electrónico
            </label>
            <input
              type="email"
              placeholder="ejemplo@auraestudio.com"
              disabled={loading}
              className={`w-full px-3 py-2.5 border rounded-lg bg-stone-50 text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all text-sm ${
                errors.email ? 'border-red-500 focus:ring-red-200' : 'border-brand-border focus:ring-brand-primary/20'
              }`}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-3 px-4 bg-brand-primary hover:bg-[#a58a73] text-white text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 disabled:opacity-75 transition-all cursor-pointer shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando enlace...
              </>
            ) : (
              'Enviar instrucciones'
            )}
          </button>
        </form>
      )}
    </div>
  );
}
