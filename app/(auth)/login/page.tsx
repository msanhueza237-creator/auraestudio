'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Por favor introduce un correo valido'),
  password: z.string().min(6, 'La contrasena debe tener al menos 6 caracteres'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || result?.error) {
        setError(result?.error ?? 'No se pudo iniciar sesion. Intenta nuevamente.');
        return;
      }

      router.push(result?.redirectTo ?? '/app/dashboard');
      router.refresh();
    } catch (err) {
      setError('Ocurrio un error inesperado al intentar iniciar sesion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-brand-dark">
          Ingresar a tu cuenta
        </h2>
        <p className="text-sm text-stone-500">
          Introduce tu correo y contrasena para acceder a la agenda
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
            Correo electronico
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
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
              Contrasena
            </label>
            <Link
              href="/recuperar-password"
              className="text-xs text-brand-primary hover:text-brand-gold transition-colors"
            >
              Olvidaste tu contrasena?
            </Link>
          </div>
          <input
            type="password"
            placeholder="********"
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

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center py-3 px-4 bg-brand-primary hover:bg-[#a58a73] text-white text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 disabled:opacity-75 transition-all cursor-pointer shadow-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Iniciando sesion...
            </>
          ) : (
            'Iniciar sesion'
          )}
        </button>
      </form>

      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-brand-border"></div>
        <span className="flex-shrink mx-4 text-stone-400 text-xs uppercase tracking-widest">o</span>
        <div className="flex-grow border-t border-brand-border"></div>
      </div>

      <div className="text-center">
        <p className="text-sm text-stone-600">
          No tienes una cuenta?{' '}
          <Link
            href="/registro"
            className="font-medium text-brand-primary hover:text-brand-gold transition-colors underline underline-offset-4"
          >
            Registrarse gratis
          </Link>
        </p>
      </div>
    </div>
  );
}
