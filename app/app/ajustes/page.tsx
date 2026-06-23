'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Settings, Save, Loader2, Globe, Scissors } from 'lucide-react';

const currencyOptions = [
  { value: 'EUR', label: 'Euro (€)', symbol: '€' },
  { value: 'USD', label: 'Dólar estadounidense ($)', symbol: '$' },
  { value: 'CLP', label: 'Peso chileno ($)', symbol: '$' },
  { value: 'MXN', label: 'Peso mexicano (MXN $)', symbol: '$' },
  { value: 'COP', label: 'Peso colombiano (COP $)', symbol: '$' },
  { value: 'ARS', label: 'Peso argentino (ARS $)', symbol: '$' },
  { value: 'GBP', label: 'Libra esterlina (£)', symbol: '£' },
];

export default function AjustesPage() {
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Profile states
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [hourlyCost, setHourlyCost] = useState('0');
  const [currency, setCurrency] = useState('CLP');
  const [locale, setLocale] = useState('es-ES');
  const selectedCurrency = currencyOptions.find((option) => option.value === currency) || currencyOptions[0];

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else if (profile) {
        setFullName(profile.full_name || '');
        setBusinessName(profile.business_name || '');
        setPhone(profile.phone || '');
        setHourlyCost(String(profile.hourly_cost || '0'));
        setCurrency(profile.currency === 'EUR' ? 'CLP' : profile.currency || 'CLP');
        setLocale(profile.locale || 'es-ES');
      }
    } catch (err: any) {
      setError('No se pudo cargar la configuración de perfil.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autorizado');

      const cost = Number(hourlyCost);
      if (isNaN(cost) || cost < 0) {
        throw new Error('El costo por hora debe ser un número positivo.');
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          business_name: businessName,
          phone,
          hourly_cost: cost,
          currency,
          locale,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el perfil.');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4">
        <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
        <p className="text-sm text-stone-500">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header section */}
      <div>
        <h2 className="font-serif text-2xl font-bold text-brand-dark">Ajustes Generales</h2>
        <p className="text-sm text-stone-500">
          Personaliza los detalles de tu salón, las tarifas de mano de obra y las preferencias regionales
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm animate-fade-in">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm animate-fade-in">
            ✓ ¡Configuración guardada correctamente!
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card: Profile Details */}
          <div className="bg-white p-6 border border-brand-border rounded-xl shadow-sm space-y-4">
            <h3 className="font-serif text-lg font-bold text-brand-dark flex items-center">
              <Settings className="w-5 h-5 mr-2 text-brand-primary" />
              Datos de tu Negocio
            </h3>

            {/* Salon Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider block">
                Nombre del Estudio / Salón
              </label>
              <input
                type="text"
                placeholder="Aura Estudio"
                className="w-full px-3 py-2 border border-brand-border rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-brand-dark"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>

            {/* Owner Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider block">
                Nombre de Contacto
              </label>
              <input
                type="text"
                placeholder="Ana María Pérez"
                className="w-full px-3 py-2 border border-brand-border rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-brand-dark"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            {/* Owner Phone */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider block">
                Teléfono de Contacto
              </label>
              <input
                type="text"
                placeholder="+34 600 000 000"
                className="w-full px-3 py-2 border border-brand-border rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-brand-dark"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Card: Calculations & Preferences */}
          <div className="bg-white p-6 border border-brand-border rounded-xl shadow-sm space-y-4">
            <h3 className="font-serif text-lg font-bold text-brand-dark flex items-center">
              <Scissors className="w-5 h-5 mr-2 text-brand-primary" />
              Costo de Operaciones
            </h3>

            {/* Hourly Rate */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider block">
                Costo por hora de Mano de Obra ({selectedCurrency.symbol}/hr)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-stone-400 text-sm">{selectedCurrency.symbol}</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full pl-8 pr-3 py-2 border border-brand-border rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-brand-dark"
                  value={hourlyCost}
                  onChange={(e) => setHourlyCost(e.target.value)}
                />
              </div>
              <p className="text-[11px] text-stone-400 leading-normal pt-1">
                Utilizado para computar automáticamente los costos operativos reales en tus fichas de servicios completados en base a la fórmula:
                <br />
                <code className="text-brand-primary font-semibold text-xs">costo = minutos_reales / 60 * costo_hora</code>
              </p>
            </div>

            <h3 className="font-serif text-lg font-bold text-brand-dark flex items-center pt-2">
              <Globe className="w-5 h-5 mr-2 text-brand-primary" />
              Región y Divisa
            </h3>

            {/* Currency */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider block">
                Moneda
              </label>
              <select
                className="w-full px-3 py-2 border border-brand-border rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-brand-dark"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {currencyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Locale */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider block">
                Idioma / Región (Locale)
              </label>
              <select
                className="w-full px-3 py-2 border border-brand-border rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-brand-dark"
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
              >
                <option value="es-ES">España (es-ES)</option>
                <option value="es-MX">México (es-MX)</option>
                <option value="es-CO">Colombia (es-CO)</option>
                <option value="es-AR">Argentina (es-AR)</option>
                <option value="es-CL">Chile (es-CL)</option>
                <option value="en-US">Estados Unidos (en-US)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Form Action submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saveLoading}
            className="px-6 py-3 bg-brand-primary hover:bg-[#a58a73] text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {saveLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4.5 h-4.5" />
                <span>Guardar Configuración</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
