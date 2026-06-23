'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

const updatePasswordSchema = z.object({
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'La confirmación debe tener al menos 6 caracteres'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>;

export default function UpdatePasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: UpdatePasswordFormValues) => {
    setError(null);
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
      } else {
        setSuccess(true);
        setLoading(false);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (err) {
      setError('Ocurrió un error inesperado al actualizar la contraseña.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-brand-dark">
          Actualizar contraseña
        </h2>
        <p className="text-sm text-stone-500">
          Introduce tu nueva contraseña a continuación
        </p>
      </div>

      {success ? (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-sm space-y-2">
          <p className="font-semibold">¡Contraseña actualizada con éxito!</p>
          <p className="text-stone-600 text-xs">
            Serás redirigido a la pantalla de inicio de sesión en unos segundos.
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
              Nueva Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              disabled={loading}
              className={`w-full px-3 py-2.5 border rounded-lg bg-stone-50 text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all text-sm ${
                errors.password ? 'border-red-500 focus:ring-red-200' : 'border-brand-border focus:ring-brand-primary/20'
              }`}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
              Confirmar Nueva Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              disabled={loading}
              className={`w-full px-3 py-2.5 border rounded-lg bg-stone-50 text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all text-sm ${
                errors.confirmPassword ? 'border-red-500 focus:ring-red-200' : 'border-brand-border focus:ring-brand-primary/20'
              }`}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>
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
                Actualizando contraseña...
              </>
            ) : (
              'Guardar nueva contraseña'
            )}
          </button>
        </form>
      )}
    </div>
  );
}
