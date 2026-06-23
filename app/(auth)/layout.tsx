import Image from 'next/image';
import { Star } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-brand-cream">
      {/* Left side: Form content */}
      <div className="flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12 bg-white shadow-xl relative z-10">
        <div className="w-full max-w-md mx-auto space-y-8 animate-slide-up">
          <div className="text-center md:text-left">
            <h1 className="font-serif text-3xl font-bold tracking-tight text-brand-dark">
              Aura Estudio
            </h1>
            <p className="mt-2 text-sm text-stone-500">
              Gestión premium de peluquería y estética
            </p>
          </div>
          {children}
        </div>
      </div>

      {/* Right side: Visual background with quote */}
      <div className="hidden md:block relative h-full w-full bg-stone-900">
        <Image
          src="/auth-bg.png"
          alt="Aura Estudio Editorial portrait"
          fill
          priority
          sizes="50vw"
          className="object-cover object-center opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-stone-950/20" />
        
        {/* Testimonial card in glassmorphic overlay */}
        <div className="absolute bottom-12 left-12 right-12">
          <div className="glass-dark rounded-xl p-8 text-white space-y-4">
            <p className="font-serif text-lg italic leading-relaxed text-stone-100">
              "Usamos Aura Estudio para coordinar toda nuestra agenda de citas y el stock en tiempo real. Ha cambiado por completo la experiencia de nuestras clientas y la rentabilidad del salón."
            </p>
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="font-medium text-brand-gold">Sofía Aura</p>
                <p className="text-xs text-stone-300">Fundadora, Aura Salón Boutique</p>
              </div>
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-brand-gold text-brand-gold" />
                ))}
              </div>
            </div>
            
            {/* Carousel dots indicator */}
            <div className="flex space-x-2 pt-2">
              <span className="h-1.5 w-8 rounded-full bg-brand-primary" />
              <span className="h-1.5 w-1.5 rounded-full bg-stone-500" />
              <span className="h-1.5 w-1.5 rounded-full bg-stone-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
