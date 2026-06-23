'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

const registerSchema = z.object({
  fullName: z.string().min(2, 'El nombre completo debe tener al menos 2 caracteres'),
  email: z.string().email('Por favor introduce un correo válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'La confirmación debe tener al menos 6 caracteres'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const success = false;
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: data.fullName,
          email: data.email,
          password: data.password,
        }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || result?.error) {
        setError(result?.error ?? 'No se pudo crear la cuenta. Intenta nuevamente.');
        setLoading(false);
        return;
      }

      router.push(result?.redirectTo ?? '/app/dashboard');
      router.refresh();
    } catch (err) {
      setError('Ocurrió un error inesperado al procesar el registro.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="space-y-2">
          <h2 className="text-2xl font-serif font-bold text-brand-dark">¡Cuenta creada!</h2>
          <p className="text-sm text-stone-500">
            Registro completado con éxito. Por favor, comprueba tu correo para confirmar tu cuenta y poder iniciar sesión.
          </p>
        </div>
        <Link
          href="/login"
          className="w-full inline-flex items-center justify-center py-3 px-4 bg-brand-primary hover:bg-[#a58a73] text-white text-sm font-medium rounded-lg transition-colors cursor-pointer shadow-sm"
        >
          Ir a Iniciar Sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-brand-dark">
          Crear una cuenta nueva
        </h2>
        <p className="text-sm text-stone-500">
          Únete a Aura Estudio y empieza a optimizar tu salón hoy
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
            Nombre Completo
          </label>
          <input
            type="text"
            placeholder="Ana María Pérez"
            disabled={loading}
            className={`w-full px-3 py-2.5 border rounded-lg bg-stone-50 text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all text-sm ${
              errors.fullName ? 'border-red-500 focus:ring-red-200' : 'border-brand-border focus:ring-brand-primary/20'
            }`}
            {...register('fullName')}
          />
          {errors.fullName && (
            <p className="text-xs text-red-600">{errors.fullName.message}</p>
          )}
        </div>

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

        <div className="space-y-1">
          <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
            Contraseña
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
            Confirmar Contraseña
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
              Creando cuenta...
            </>
          ) : (
            'Registrarse'
          )}
        </button>
      </form>

      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-brand-border"></div>
        <span className="flex-shrink mx-4 text-stone-400 text-xs uppercase tracking-widest">ó</span>
        <div className="flex-grow border-t border-brand-border"></div>
      </div>

      <div className="text-center">
        <p className="text-sm text-stone-600">
          ¿Ya tienes cuenta?{' '}
          <Link
            href="/login"
            className="font-medium text-brand-primary hover:text-brand-gold transition-colors underline underline-offset-4"
          >
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
