'use client';

import { useEffect, useState, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  getAppointments,
  updateAppointmentStatus 
} from '@/actions/citas.actions';
import { getProducts } from '@/actions/productos.actions';
import { getServices } from '@/actions/servicios.actions';
import { 
  addServiceToAppointment,
  updateAppointmentService,
  removeServiceFromAppointment,
  addProductUsage,
  removeProductUsage
} from '@/actions/servicios-prestados.actions';
import { APP_CURRENCY_SYMBOL, formatCurrency } from '@/lib/currency';
import ConfirmDialog from '@/components/shared/confirm-dialog';
import EmptyState from '@/components/shared/empty-state';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { 
  Plus, 
  Scissors, 
  Package, 
  Check, 
  Trash2, 
  Clock, 
  DollarSign, 
  Calculator, 
  TrendingUp, 
  ChevronRight, 
  Clipboard, 
  X,
  AlertCircle
} from 'lucide-react';

export default function ServiciosPrestadosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appointmentIdParam = searchParams.get('appointment_id');

  const [appointments, setAppointments] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states for adding service
  const [newServiceId, setNewServiceId] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');

  // Form states for editing a service
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editMinutes, setEditMinutes] = useState(30);
  const [editPrice, setEditPrice] = useState(0);
  const [editNotes, setEditNotes] = useState('');

  // Form states for adding product usage
  const [usageServiceId, setUsageServiceId] = useState<string | null>(null);
  const [usageProductId, setUsageProductId] = useState('');
  const [usageQty, setUsageQty] = useState('');
  const [bypassStock, setBypassStock] = useState(false);

  const loadInitialData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      // Query scheduled and completed appointments
      const apps = await getAppointments();
      setAppointments(apps);

      // Query products & active services
      const prods = await getProducts();
      setProducts(prods.filter(p => p.is_active));

      const svcs = await getServices();
      setServices(svcs.filter(s => s.is_active));

      // Resolve which appointment to load
      if (appointmentIdParam) {
        const matched = apps.find(a => a.id === appointmentIdParam);
        if (matched) {
          setSelectedAppointment(matched);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [appointmentIdParam]);

  const handleSelectAppointment = (id: string) => {
    const matched = appointments.find(a => a.id === id);
    if (matched) {
      setSelectedAppointment(matched);
      // Update URL query parameter without full reload
      router.push(`/app/servicios-prestados?appointment_id=${id}`);
    } else {
      setSelectedAppointment(null);
      router.push('/app/servicios-prestados');
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment || !newServiceId) return;

    setActionLoading(true);
    setErrorMessage(null);
    try {
      const price = newServicePrice ? Number(newServicePrice) : undefined;
      await addServiceToAppointment(selectedAppointment.id, newServiceId, price);
      
      // Reload appointment to fetch updated cost calculations
      await reloadSelectedAppointment();
      setNewServiceId('');
      setNewServicePrice('');
    } catch (err: any) {
      setErrorMessage(err.message || 'No se pudo agregar el servicio.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEditService = (as: any) => {
    setEditingServiceId(as.id);
    setEditMinutes(as.minutes_spent);
    setEditPrice(Number(as.price_charged));
    setEditNotes(as.notes || '');
  };

  const handleSaveServiceEdit = async (asId: string) => {
    if (!selectedAppointment) return;
    setActionLoading(true);
    setErrorMessage(null);
    try {
      await updateAppointmentService(asId, selectedAppointment.id, editMinutes, editPrice, editNotes);
      setEditingServiceId(null);
      await reloadSelectedAppointment();
    } catch (err: any) {
      setErrorMessage(err.message || 'No se pudo actualizar el servicio.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveService = async (asId: string) => {
    if (!selectedAppointment) return;
    if (!confirm('¿Estás seguro de que deseas eliminar este servicio de la cita? Se devolverá también el stock de los productos consumidos.')) return;
    
    setActionLoading(true);
    setErrorMessage(null);
    try {
      await removeServiceFromAppointment(asId, selectedAppointment.id);
      await reloadSelectedAppointment();
    } catch (err: any) {
      setErrorMessage(err.message || 'No se pudo eliminar el servicio.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddProductUsage = async (e: React.FormEvent, asId: string) => {
    e.preventDefault();
    if (!selectedAppointment || !usageProductId || !usageQty) return;

    setActionLoading(true);
    setErrorMessage(null);
    try {
      const qty = Number(usageQty);
      await addProductUsage(asId, selectedAppointment.id, usageProductId, qty, bypassStock);
      
      await reloadSelectedAppointment();
      // Reset usage forms
      setUsageServiceId(null);
      setUsageProductId('');
      setUsageQty('');
      setBypassStock(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'No se pudo registrar el consumo.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveProductUsage = async (usageId: string, asId: string) => {
    if (!selectedAppointment) return;
    setActionLoading(true);
    setErrorMessage(null);
    try {
      await removeProductUsage(usageId, asId, selectedAppointment.id);
      await reloadSelectedAppointment();
    } catch (err: any) {
      setErrorMessage(err.message || 'No se pudo remover el consumo.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteAppointment = async () => {
    if (!selectedAppointment) return;
    setActionLoading(true);
    setErrorMessage(null);
    try {
      await updateAppointmentStatus(selectedAppointment.id, 'completed');
      await reloadSelectedAppointment();
    } catch (err: any) {
      setErrorMessage(err.message || 'No se pudo completar la cita.');
    } finally {
      setActionLoading(false);
    }
  };

  const reloadSelectedAppointment = async () => {
    const apps = await getAppointments();
    setAppointments(apps);
    const matched = apps.find(a => a.id === selectedAppointment.id);
    if (matched) {
      setSelectedAppointment(matched);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div>
        <h2 className="font-serif text-2xl font-bold text-brand-dark">Ficha de Servicio Prestado</h2>
        <p className="text-sm text-stone-500">
          Registra el consumo real de stock y tiempos de mano de obra de cada servicio
        </p>
      </div>

      {/* Appointment selector */}
      <div className="bg-white p-6 border border-brand-border rounded-xl shadow-sm space-y-4">
        <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider block">
          Seleccionar Cita para Trabajar
        </label>
        <select
          className="w-full md:max-w-xl px-3 py-2.5 border border-brand-border rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-brand-dark cursor-pointer font-medium"
          value={selectedAppointment?.id || ''}
          onChange={(e) => handleSelectAppointment(e.target.value)}
        >
          <option value="">-- Selecciona una cita del calendario --</option>
          {appointments.map((app) => {
            const dateStr = new Date(app.starts_at).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            });
            const clientName = app.clients?.full_name || 'Cliente sin registrar';
            const statusLabel = app.status === 'completed' ? '✓ Completada' : app.status === 'cancelled' ? '✗ Cancelada' : '⏱ Programada';
            
            return (
              <option key={app.id} value={app.id}>
                {dateStr} - {clientName} ({statusLabel})
              </option>
            );
          })}
        </select>
      </div>

      {/* Error alert toast */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center space-x-2 animate-fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main workspace (visible when an appointment is selected) */}
      {!selectedAppointment ? (
        <EmptyState
          icon={Clipboard}
          title="Selecciona una cita"
          description="Escoge una cita en el selector superior o presiona el botón 'Ficha' en la agenda de citas para registrar servicios prestados y consumos."
        />
      ) : (
        <div className="space-y-6">
          {/* Appointment overview panel */}
          <div className="bg-white border border-brand-border rounded-xl shadow-sm overflow-hidden animate-slide-up">
            {/* Header info */}
            <div className="px-6 py-5 border-b border-brand-border bg-brand-cream/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-brand-primary uppercase tracking-widest font-bold">
                  Ficha de ejecución
                </p>
                <h3 className="font-serif text-xl font-bold text-brand-dark mt-1">
                  {selectedAppointment.clients?.full_name || 'Cliente sin registrar'}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Horario: {new Date(selectedAppointment.starts_at).toLocaleString('es-ES', { 
                    dateStyle: 'medium', 
                    timeStyle: 'short' 
                  })}
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  selectedAppointment.status === 'completed'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : selectedAppointment.status === 'cancelled'
                    ? 'bg-red-50 text-red-700 border border-red-100'
                    : 'bg-brand-light text-brand-primary border border-brand-border'
                }`}>
                  {selectedAppointment.status === 'completed' ? 'Completada' : selectedAppointment.status === 'cancelled' ? 'Cancelada' : 'Programada'}
                </span>

                {selectedAppointment.status === 'scheduled' && (
                  <button
                    onClick={handleCompleteAppointment}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-brand-primary hover:bg-[#a58a73] text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4.5 h-4.5" />
                    <span>Marcar Completada</span>
                  </button>
                )}
              </div>
            </div>

            {/* Financial KPI metrics row */}
            <div className="grid grid-cols-2 md:grid-cols-4 border-b border-brand-border bg-stone-50/50">
              <div className="p-6 border-r border-brand-border flex flex-col justify-between">
                <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Total Cobrado</span>
                <span className="text-xl font-bold text-brand-dark mt-2">
                  {formatCurrency(selectedAppointment.total_price)}
                </span>
              </div>
              <div className="p-6 border-r border-brand-border flex flex-col justify-between">
                <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Costo Materiales</span>
                <span className="text-xl font-bold text-brand-dark mt-2">
                  {formatCurrency(
                    selectedAppointment.appointment_services?.reduce((acc: number, curr: any) => acc + Number(curr.product_cost || 0), 0) || 0
                  )}
                </span>
              </div>
              <div className="p-6 border-r border-brand-border flex flex-col justify-between">
                <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Costo Mano de Obra</span>
                <span className="text-xl font-bold text-brand-dark mt-2">
                  {formatCurrency(
                    selectedAppointment.appointment_services?.reduce((acc: number, curr: any) => acc + Number(curr.labor_cost || 0), 0) || 0
                  )}
                </span>
              </div>
              <div className="p-6 flex flex-col justify-between bg-brand-light/20">
                <span className="text-[10px] text-brand-primary uppercase tracking-widest font-bold">Margen Estimado</span>
                <span className="text-xl font-bold text-emerald-600 mt-2">
                  {formatCurrency(selectedAppointment.total_price - selectedAppointment.total_cost)}
                </span>
              </div>
            </div>
          </div>

          {/* List of associated services */}
          <div className="space-y-4">
            <h4 className="font-serif text-lg font-bold text-brand-dark">Servicios y Tratamientos Realizados</h4>

            {(!selectedAppointment.appointment_services || selectedAppointment.appointment_services.length === 0) ? (
              <div className="p-8 bg-white border border-brand-border rounded-xl text-center text-stone-400 italic text-sm">
                No hay servicios asociados a esta cita. Utiliza el panel inferior para agregar uno.
              </div>
            ) : (
              selectedAppointment.appointment_services.map((as: any) => {
                const isEditing = editingServiceId === as.id;

                return (
                  <div key={as.id} className="bg-white border border-brand-border rounded-xl shadow-sm p-6 space-y-6 animate-fade-in">
                    {/* Service Header / Inputs */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-brand-border pb-4">
                      <div className="flex items-start space-x-3.5">
                        <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center text-brand-primary border border-brand-border">
                          <Scissors className="w-5 h-5" />
                        </div>
                        {isEditing ? (
                          <div className="space-y-1">
                            <span className="text-sm font-semibold text-brand-dark">{as.service_name}</span>
                            <p className="text-[11px] text-stone-400">Modificando valores reales</p>
                          </div>
                        ) : (
                          <div>
                            <h5 className="text-base font-bold text-brand-dark">{as.service_name}</h5>
                            {as.notes && (
                              <p className="text-xs text-stone-500 italic mt-0.5">"{as.notes}"</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Inputs / Info values */}
                      <div className="flex items-center space-x-6">
                        {isEditing ? (
                          <div className="flex items-center space-x-4">
                            {/* Duration */}
                            <div className="space-y-1">
                              <label className="text-[10px] text-stone-400 uppercase font-semibold">Minutos Reales</label>
                              <div className="flex items-center space-x-1.5">
                                <input
                                  type="number"
                                  className="w-16 px-2 py-1 border border-brand-border rounded bg-stone-50 text-xs text-brand-dark focus:outline-none"
                                  value={editMinutes}
                                  onChange={(e) => setEditMinutes(Number(e.target.value))}
                                />
                                <span className="text-xs text-stone-400">min</span>
                              </div>
                            </div>
                            {/* Price charged */}
                            <div className="space-y-1">
                              <label className="text-[10px] text-stone-400 uppercase font-semibold">Precio Cobrado ({APP_CURRENCY_SYMBOL})</label>
                              <div className="flex items-center space-x-1.5">
                                <input
                                  type="number"
                                  className="w-20 px-2 py-1 border border-brand-border rounded bg-stone-50 text-xs text-brand-dark focus:outline-none"
                                  value={editPrice}
                                  onChange={(e) => setEditPrice(Number(e.target.value))}
                                />
                                <span className="text-xs text-stone-400">{APP_CURRENCY_SYMBOL}</span>
                              </div>
                            </div>
                            {/* Notes */}
                            <div className="space-y-1">
                              <label className="text-[10px] text-stone-400 uppercase font-semibold">Notas de ejecución</label>
                              <input
                                type="text"
                                placeholder="Ej. Duración especial"
                                className="w-32 px-2 py-1 border border-brand-border rounded bg-stone-50 text-xs text-brand-dark focus:outline-none"
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-stone-600">
                             <div>
                               <p className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold">Minutos</p>
                               <p className="font-semibold text-brand-dark">{as.minutes_spent} min</p>
                             </div>
                             <div>
                               <p className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold">Precio</p>
                               <p className="font-semibold text-brand-dark">
                                 {formatCurrency(as.price_charged)}
                               </p>
                             </div>
                             <div>
                               <p className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold">Mano de Obra</p>
                               <p className="font-semibold text-brand-dark">
                                 {formatCurrency(as.labor_cost)}
                               </p>
                             </div>
                             <div>
                               <p className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold">Materiales</p>
                               <p className="font-semibold text-brand-dark">
                                 {formatCurrency(as.product_cost)}
                               </p>
                             </div>
                             <div className="bg-stone-50 px-2 py-1 rounded border border-brand-border/40">
                               <p className="text-[10px] text-brand-primary uppercase tracking-widest font-bold">Costo total</p>
                               <p className="font-bold text-brand-dark">
                                 {formatCurrency(as.total_cost)}
                               </p>
                             </div>
                           </div>
                        )}

                        {/* Edit/Save Actions buttons */}
                        <div className="flex items-center space-x-2 border-l border-brand-border pl-4">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleSaveServiceEdit(as.id)}
                                disabled={actionLoading}
                                className="p-1.5 bg-brand-primary text-white rounded hover:bg-[#a58a73] transition-colors cursor-pointer"
                                title="Guardar cambios"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingServiceId(null)}
                                className="p-1.5 border border-brand-border rounded hover:bg-brand-light transition-colors cursor-pointer text-stone-600"
                                title="Cancelar"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleOpenEditService(as)}
                                className="p-1.5 border border-brand-border hover:bg-brand-light rounded-lg transition-colors cursor-pointer text-stone-600"
                                title="Modificar tiempos/precio"
                              >
                                <Clock className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRemoveService(as.id)}
                                className="p-1.5 border border-brand-border hover:border-red-200 hover:bg-red-50 rounded-lg transition-colors cursor-pointer text-stone-400 hover:text-red-600"
                                title="Eliminar servicio"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Products Consumed section */}
                    <div className="space-y-3 pl-6">
                      <div className="flex items-center justify-between">
                        <h6 className="text-xs font-semibold text-brand-dark uppercase tracking-widest flex items-center">
                          <Package className="w-4 h-4 mr-1.5 text-stone-400" />
                          Productos Consumidos en este servicio
                        </h6>
                        
                        {usageServiceId !== as.id && (
                          <button
                            onClick={() => {
                              setUsageServiceId(as.id);
                              setUsageProductId('');
                              setUsageQty('');
                              setBypassStock(false);
                            }}
                            className="inline-flex items-center text-xs text-brand-primary hover:text-brand-gold font-medium transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Agregar Producto
                          </button>
                        )}
                      </div>

                      {/* Add Product Usage Form */}
                      {usageServiceId === as.id && (
                        <form 
                          onSubmit={(e) => handleAddProductUsage(e, as.id)}
                          className="p-4 border border-brand-border bg-stone-50 rounded-lg space-y-3 animate-fade-in"
                        >
                          <div className="flex items-center justify-between border-b border-brand-border pb-1.5 mb-2">
                            <span className="text-xs font-semibold text-brand-dark">Consumir Material</span>
                            <button
                              type="button"
                              onClick={() => setUsageServiceId(null)}
                              className="text-stone-400 hover:text-stone-600 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Product selection */}
                            <div className="space-y-1">
                              <label className="text-[10px] text-stone-400 uppercase font-semibold">Producto</label>
                              <select
                                className="w-full px-2.5 py-1.5 border border-brand-border rounded bg-white text-xs text-brand-dark"
                                required
                                value={usageProductId}
                                onChange={(e) => setUsageProductId(e.target.value)}
                              >
                                <option value="">Selecciona...</option>
                                {products.map(p => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} ({p.current_stock} {p.unit})
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Quantity */}
                            <div className="space-y-1">
                              <label className="text-[10px] text-stone-400 uppercase font-semibold">Cantidad</label>
                              <input
                                type="number"
                                step="0.001"
                                min="0.001"
                                placeholder="Cant."
                                className="w-full px-2.5 py-1.5 border border-brand-border rounded bg-white text-xs text-brand-dark"
                                required
                                value={usageQty}
                                onChange={(e) => setUsageQty(e.target.value)}
                              />
                            </div>

                            {/* Options */}
                            <div className="flex items-center pt-5">
                              <input
                                type="checkbox"
                                id="bypass"
                                checked={bypassStock}
                                onChange={(e) => setBypassStock(e.target.checked)}
                                className="rounded text-brand-primary focus:ring-brand-primary border-brand-border w-3.5 h-3.5 cursor-pointer mr-1.5"
                              />
                              <label htmlFor="bypass" className="text-[11px] text-stone-600 font-medium cursor-pointer">
                                Permitir stock negativo
                              </label>
                            </div>

                            {/* Submit */}
                            <div className="flex items-end">
                              <button
                                type="submit"
                                disabled={actionLoading}
                                className="w-full py-1.5 bg-brand-primary hover:bg-[#a58a73] text-white text-xs font-semibold rounded shadow-sm transition-colors cursor-pointer"
                              >
                                Registrar Consumo
                              </button>
                            </div>
                          </div>
                        </form>
                      )}

                      {/* Display usages */}
                      {(!as.service_product_usage || as.service_product_usage.length === 0) ? (
                        <p className="text-xs text-stone-400 italic">No se han registrado consumos para este servicio.</p>
                      ) : (
                        <div className="divide-y divide-brand-border/60 bg-stone-50/20 border border-brand-border/60 rounded-lg overflow-hidden">
                          {as.service_product_usage.map((pu: any) => (
                            <div key={pu.id} className="p-3 flex items-center justify-between text-xs hover:bg-stone-50/50">
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-brand-dark">{pu.product_name}</span>
                                <span className="text-stone-400">|</span>
                                <span className="text-stone-600">Consumido: {pu.quantity_used} {pu.unit}</span>
                              </div>
                              
                              <div className="flex items-center space-x-4">
                                <span className="font-semibold text-stone-700">
                                  Costo: {formatCurrency(pu.total_cost)}
                                </span>
                                <button
                                  onClick={() => handleRemoveProductUsage(pu.id, as.id)}
                                  className="p-1 hover:bg-red-50 text-stone-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                                  title="Eliminar consumo y devolver al stock"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick form to add service to current appointment */}
          <div className="bg-white border border-brand-border rounded-xl p-6 shadow-sm animate-fade-in space-y-4">
            <h5 className="font-serif text-base font-bold text-brand-dark">Asociar otro servicio a la cita</h5>
            
            <form onSubmit={handleAddService} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-1">
                <label className="text-[10px] text-stone-400 uppercase font-semibold">Seleccionar Servicio</label>
                <select
                  className="w-full px-3 py-2 border border-brand-border rounded-lg bg-stone-50 text-sm focus:outline-none text-brand-dark"
                  required
                  value={newServiceId}
                  onChange={(e) => setNewServiceId(e.target.value)}
                >
                  <option value="">Selecciona...</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({formatCurrency(s.base_price)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-stone-400 uppercase font-semibold">Precio Especial ({APP_CURRENCY_SYMBOL}) - Opcional</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Dejar vacío para usar base"
                  className="w-full px-3 py-2 border border-brand-border rounded-lg bg-stone-50 text-sm focus:outline-none text-brand-dark"
                  value={newServicePrice}
                  onChange={(e) => setNewServicePrice(e.target.value)}
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={actionLoading || !newServiceId}
                  className="w-full py-2 bg-brand-primary hover:bg-[#a58a73] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center space-x-1 disabled:opacity-50"
                >
                  <Plus className="w-4.5 h-4.5" />
                  <span>Agregar a la Cita</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
