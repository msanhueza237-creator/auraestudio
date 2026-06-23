'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  getServices, 
  createService, 
  updateService, 
  deleteService 
} from '@/actions/servicios.actions';
import { ServiceSchema, type ServiceFormInput } from '@/lib/validations/servicio.schema';
import { APP_CURRENCY_SYMBOL, formatCurrency } from '@/lib/currency';
import ConfirmDialog from '@/components/shared/confirm-dialog';
import EmptyState from '@/components/shared/empty-state';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Scissors, 
  Clock, 
  DollarSign, 
  UserCheck, 
  X 
} from 'lucide-react';

export default function ServiciosPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modals & triggers
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<any | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServiceFormInput>({
    resolver: zodResolver(ServiceSchema),
    defaultValues: {
      name: '',
      category: '',
      description: '',
      base_price: 0,
      estimated_minutes: 30,
      estimated_labor_cost: 0,
      maintenance_days: 0,
      is_active: true,
    },
  });

  const loadServices = async () => {
    setLoading(true);
    try {
      const data = await getServices(search);
      setServices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      loadServices();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search]);

  const handleOpenCreate = () => {
    setEditingService(null);
    reset({
      name: '',
      category: '',
      description: '',
      base_price: 0,
      estimated_minutes: 30,
      estimated_labor_cost: 0,
      maintenance_days: 0,
      is_active: true,
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (service: any) => {
    setEditingService(service);
    reset({
      name: service.name,
      category: service.category || '',
      description: service.description || '',
      base_price: Number(service.base_price),
      estimated_minutes: Number(service.estimated_minutes),
      estimated_labor_cost: Number(service.estimated_labor_cost),
      maintenance_days: service.maintenance_days ? Number(service.maintenance_days) : 0,
      is_active: service.is_active,
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: ServiceFormInput) => {
    setFormLoading(true);
    setFormError(null);
    try {
      if (editingService) {
        await updateService(editingService.id, data);
      } else {
        await createService(data);
      }
      setIsFormOpen(false);
      loadServices();
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar el servicio');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!serviceToDelete) return;
    setFormLoading(true);
    try {
      await deleteService(serviceToDelete.id);
      setServiceToDelete(null);
      loadServices();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar el servicio');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-brand-dark">Catálogo de Servicios</h2>
          <p className="text-sm text-stone-500">
            Define tu lista de servicios prestados, precios y tiempos estimados
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-brand-primary hover:bg-[#a58a73] text-white text-sm font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Servicio</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 border border-brand-border rounded-xl shadow-sm flex items-center">
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-stone-400" />
          <input
            type="text"
            placeholder="Buscar por nombre de servicio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-brand-border rounded-lg bg-stone-50 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-sm text-brand-dark"
          />
        </div>
      </div>

      {/* Services list/table */}
      {loading ? (
        <TableSkeleton rows={5} />
      ) : services.length === 0 ? (
        <EmptyState
          icon={Scissors}
          title={search ? "Sin resultados" : "No hay servicios"}
          description={search ? "Prueba a buscar con otro nombre o palabra clave." : "Comienza agregando tu primer servicio al catálogo (ej. Corte, Coloración)."}
          actionLabel={search ? undefined : "Agregar Servicio"}
          onAction={search ? undefined : handleOpenCreate}
        />
      ) : (
        <div className="bg-white border border-brand-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border bg-brand-cream/10 text-xs font-semibold uppercase tracking-wider text-stone-500">
                  <th className="px-6 py-4">Nombre / Categoría</th>
                  <th className="px-6 py-4">Precio Base</th>
                  <th className="px-6 py-4">Duración Estimada</th>
                  <th className="px-6 py-4">Coste Estimado M.O.</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {services.map((service) => (
                  <tr key={service.id} className="hover:bg-brand-cream/5 text-sm transition-colors">
                    {/* Name / Category */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-brand-light flex items-center justify-center text-brand-primary border border-brand-border">
                          <Scissors className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-brand-dark">{service.name}</p>
                          <p className="text-xs text-stone-400 flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span>{service.category || 'Sin categoría'}</span>
                            {service.maintenance_days && Number(service.maintenance_days) > 0 ? (
                              <span className="text-[9px] bg-brand-light text-brand-primary px-1.5 py-0.5 rounded-full font-bold border border-brand-border/40 flex items-center space-x-0.5">
                                <span>↺ Retorno: {service.maintenance_days} d</span>
                              </span>
                            ) : null}
                          </p>
                        </div>
                      </div>
                    </td>
                    {/* Price */}
                    <td className="px-6 py-4 font-semibold text-brand-dark">
                      {formatCurrency(service.base_price)}
                    </td>
                    {/* Duration */}
                    <td className="px-6 py-4 text-stone-600">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-4 h-4 text-stone-400" />
                        <span>{service.estimated_minutes} min</span>
                      </div>
                    </td>
                    {/* Labor Cost */}
                    <td className="px-6 py-4 text-stone-600">
                      {formatCurrency(service.estimated_labor_cost)}
                    </td>
                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        service.is_active 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-stone-50 text-stone-500 border border-stone-100'
                      }`}>
                        {service.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2.5">
                        <button
                          onClick={() => handleOpenEdit(service)}
                          className="p-1.5 text-stone-500 hover:text-brand-primary hover:bg-brand-light rounded-lg transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Edit className="w-4.5 h-4.5" />
                        </button>
                        <button
                          onClick={() => setServiceToDelete(service)}
                          className="p-1.5 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Drawer Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsFormOpen(false)}
          />
          
          {/* Drawer container */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-up md:animate-fade-in border-l border-brand-border">
            {/* Header */}
            <div className="h-16 border-b border-brand-border flex items-center justify-between px-6 bg-brand-cream/20">
              <h3 className="font-serif text-lg font-bold text-brand-dark">
                {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 hover:bg-brand-light rounded-lg text-stone-400 hover:text-brand-dark transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form body */}
            <form onSubmit={handleSubmit(handleFormSubmit)} className="flex-grow flex flex-col justify-between overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {formError && (
                  <div className="p-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg">
                    {formError}
                  </div>
                )}

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
                    Nombre del Servicio *
                  </label>
                  <input
                    type="text"
                    placeholder="Corte de Pelo / Tinte Orgánico"
                    className={`w-full px-3 py-2 border rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${
                      errors.name ? 'border-red-500' : 'border-brand-border'
                    }`}
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-600">{errors.name.message}</p>
                  )}
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
                    Categoría
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Cortes, Coloración, Tratamientos"
                    className="w-full px-3 py-2 border border-brand-border rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-brand-dark"
                    {...register('category')}
                  />
                </div>

                {/* Base Price */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
                    Precio Base ({APP_CURRENCY_SYMBOL}) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-stone-400 text-sm">{APP_CURRENCY_SYMBOL}</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className={`w-full pl-8 pr-3 py-2 border rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${
                        errors.base_price ? 'border-red-500' : 'border-brand-border'
                      }`}
                      {...register('base_price', { valueAsNumber: true })}
                    />
                  </div>
                  {errors.base_price && (
                    <p className="text-xs text-red-600">{errors.base_price.message}</p>
                  )}
                </div>

                {/* Estimated Minutes */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
                    Duración Estimada (Minutos) *
                  </label>
                  <input
                    type="number"
                    placeholder="30"
                    className={`w-full px-3 py-2 border rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${
                      errors.estimated_minutes ? 'border-red-500' : 'border-brand-border'
                    }`}
                    {...register('estimated_minutes', { valueAsNumber: true })}
                  />
                  {errors.estimated_minutes && (
                    <p className="text-xs text-red-600">{errors.estimated_minutes.message}</p>
                  )}
                </div>

                {/* Estimated Labor Cost */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
                    Costo de Mano de Obra Estimado ({APP_CURRENCY_SYMBOL})
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-stone-400 text-sm">{APP_CURRENCY_SYMBOL}</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className={`w-full pl-8 pr-3 py-2 border rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${
                        errors.estimated_labor_cost ? 'border-red-500' : 'border-brand-border'
                      }`}
                      {...register('estimated_labor_cost', { valueAsNumber: true })}
                    />
                  </div>
                  {errors.estimated_labor_cost && (
                    <p className="text-xs text-red-600">{errors.estimated_labor_cost.message}</p>
                  )}
                  <p className="text-[11px] text-stone-400 leading-normal">
                    Este costo se puede auto-calcular de forma real en base a los minutos empleados reales y tu costo por hora, configurado en Ajustes.
                  </p>
                </div>

                {/* Maintenance / Retouch Days */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
                    Tiempo de posible retorno (Días)
                  </label>
                  <input
                    type="number"
                    placeholder="Ej. 30"
                    className={`w-full px-3 py-2 border rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${
                      errors.maintenance_days ? 'border-red-500' : 'border-brand-border'
                    }`}
                    {...register('maintenance_days', { valueAsNumber: true })}
                  />
                  {errors.maintenance_days && (
                    <p className="text-xs text-red-600">{errors.maintenance_days.message}</p>
                  )}
                  <p className="text-[11px] text-stone-400 leading-normal">
                    Días recomendados transcurridos para que el cliente vuelva a requerir el servicio (posible retorno). Útil para recordatorios de retorno. Dejar vacío o 0 si no requiere retorno.
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
                    Descripción del Servicio
                  </label>
                  <textarea
                    placeholder="Describe el proceso, productos incluidos..."
                    rows={3}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-brand-dark"
                    {...register('description')}
                  />
                </div>

                {/* Active checkbox */}
                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    className="rounded text-brand-primary focus:ring-brand-primary border-brand-border w-4 h-4 cursor-pointer"
                    {...register('is_active')}
                  />
                  <label htmlFor="is_active" className="text-sm text-stone-700 font-medium cursor-pointer">
                    Servicio Activo (se muestra en la agenda)
                  </label>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 border-t border-brand-border flex items-center justify-end space-x-3 bg-brand-cream/10">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-brand-border hover:bg-brand-light text-stone-700 text-sm font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-brand-primary hover:bg-[#a58a73] text-white text-sm font-medium rounded-lg transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {formLoading ? 'Guardando...' : 'Guardar Servicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!serviceToDelete}
        onClose={() => setServiceToDelete(null)}
        onConfirm={handleDeleteConfirm}
        loading={formLoading}
        title="¿Eliminar servicio?"
        description={`¿Estás seguro de que deseas eliminar permanentemente el servicio "${serviceToDelete?.name}" del catálogo? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar servicio"
      />
    </div>
  );
}
