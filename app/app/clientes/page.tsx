'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  getClients, 
  createClient, 
  updateClient, 
  deleteClient 
} from '@/actions/clientes.actions';
import { ClientSchema, type ClientFormInput } from '@/lib/validations/cliente.schema';
import { getProducts } from '@/actions/productos.actions';
import ConfirmDialog from '@/components/shared/confirm-dialog';
import EmptyState from '@/components/shared/empty-state';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  User, 
  Phone, 
  Mail, 
  Calendar as CalendarIcon, 
  X,
  Heart
} from 'lucide-react';

export default function ClientesPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  
  // Modals & triggers
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [clientToDelete, setClientToDelete] = useState<any | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ClientFormInput>({
    resolver: zodResolver(ClientSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      email: '',
      birth_date: '',
      notes: '',
      preferences: '',
      alerts: '',
    },
  });

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await getClients(search);
      setClients(data);

      const prods = await getProducts();
      setAvailableProducts(prods.filter((p: any) => p.is_active));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      loadClients();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search]);

  const handleOpenCreate = () => {
    setEditingClient(null);
    setSelectedProductIds([]);
    reset({
      full_name: '',
      phone: '',
      email: '',
      birth_date: '',
      notes: '',
      preferences: '',
      alerts: '',
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (client: any) => {
    setEditingClient(client);
    setSelectedProductIds(client.client_preferred_products?.map((cpp: any) => cpp.product_id) || []);
    reset({
      full_name: client.full_name,
      phone: client.phone || '',
      email: client.email || '',
      birth_date: client.birth_date || '',
      notes: client.notes || '',
      preferences: client.preferences || '',
      alerts: client.alerts || '',
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: ClientFormInput) => {
    setFormLoading(true);
    setFormError(null);
    try {
      if (editingClient) {
        await updateClient(editingClient.id, data, selectedProductIds);
      } else {
        await createClient(data, selectedProductIds);
      }
      setIsFormOpen(false);
      loadClients();
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar el cliente');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;
    setFormLoading(true);
    try {
      await deleteClient(clientToDelete.id);
      setClientToDelete(null);
      loadClients();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar el cliente');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-brand-dark">Clientes</h2>
          <p className="text-sm text-stone-500">
            Administra la base de datos de tus clientes y sus fichas de estética
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-brand-primary hover:bg-[#a58a73] text-white text-sm font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 border border-brand-border rounded-xl shadow-sm flex items-center">
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-stone-400" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-brand-border rounded-lg bg-stone-50 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-sm text-brand-dark"
          />
        </div>
      </div>

      {/* Clients list/table */}
      {loading ? (
        <TableSkeleton rows={5} />
      ) : clients.length === 0 ? (
        <EmptyState
          icon={User}
          title={search ? "Sin resultados" : "No hay clientes"}
          description={search ? "Prueba a buscar con otro nombre o palabra clave." : "Comienza agregando tu primer cliente al salón de belleza."}
          actionLabel={search ? undefined : "Agregar Cliente"}
          onAction={search ? undefined : handleOpenCreate}
        />
      ) : (
        <div className="bg-white border border-brand-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border bg-brand-cream/10 text-xs font-semibold uppercase tracking-wider text-stone-500">
                  <th className="px-6 py-4">Nombre</th>
                  <th className="px-6 py-4">Contacto</th>
                  <th className="px-6 py-4">Detalles</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-brand-cream/5 text-sm transition-colors">
                    {/* Name */}
                    <td className="px-6 py-4 font-medium text-brand-dark">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-brand-light flex items-center justify-center text-brand-primary border border-brand-border">
                          {client.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-brand-dark">{client.full_name}</p>
                          {client.birth_date && (
                            <p className="text-xs text-stone-400 flex items-center mt-0.5">
                              <CalendarIcon className="w-3.5 h-3.5 mr-1" />
                              Cumpleaños: {client.birth_date}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Contact */}
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-xs">
                        {client.phone && (
                          <p className="flex items-center text-stone-600">
                            <Phone className="w-3.5 h-3.5 mr-1.5 text-stone-400" />
                            {client.phone}
                          </p>
                        )}
                        {client.email && (
                          <p className="flex items-center text-stone-600">
                            <Mail className="w-3.5 h-3.5 mr-1.5 text-stone-400" />
                            {client.email}
                          </p>
                        )}
                        {!client.phone && !client.email && (
                          <span className="text-stone-400 italic">Sin contacto</span>
                        )}
                      </div>
                    </td>
                    {/* Notes & Alerts & Preferred Products */}
                    <td className="px-6 py-4">
                      <div className="max-w-xs space-y-1">
                        {client.alerts && (
                          <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded px-2 py-0.5 inline-block">
                            Alerta: {client.alerts}
                          </p>
                        )}
                        {client.preferences && (
                          <p className="text-xs text-stone-600 truncate">
                            <span className="font-semibold text-brand-dark">Pref:</span> {client.preferences}
                          </p>
                        )}
                        {client.notes && (
                          <p className="text-xs text-stone-500 truncate italic">
                            "{client.notes}"
                          </p>
                        )}
                        {client.client_preferred_products && client.client_preferred_products.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1 pt-1.5 border-t border-brand-border/30">
                            {client.client_preferred_products.map((cpp: any) => (
                              <span 
                                key={cpp.product_id} 
                                className="inline-flex items-center text-[10px] bg-brand-light text-brand-primary border border-brand-border/50 px-1.5 py-0.5 rounded-full font-medium"
                                title={`${cpp.products?.name} (${cpp.products?.brand || ''})`}
                              >
                                <Heart className="w-2.5 h-2.5 mr-0.5 fill-brand-primary text-brand-primary animate-scale-in" />
                                <span className="truncate max-w-[80px]">{cpp.products?.name}</span>
                              </span>
                            ))}
                          </div>
                        )}
                        {!client.alerts && !client.preferences && !client.notes && (!client.client_preferred_products || client.client_preferred_products.length === 0) && (
                          <span className="text-stone-400 text-xs italic">-</span>
                        )}
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2.5">
                        <button
                          onClick={() => handleOpenEdit(client)}
                          className="p-1.5 text-stone-500 hover:text-brand-primary hover:bg-brand-light rounded-lg transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Edit className="w-4.5 h-4.5" />
                        </button>
                        <button
                          onClick={() => setClientToDelete(client)}
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
                {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
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
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    placeholder="Ana María"
                    className={`w-full px-3 py-2 border rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${
                      errors.full_name ? 'border-red-500' : 'border-brand-border'
                    }`}
                    {...register('full_name')}
                  />
                  {errors.full_name && (
                    <p className="text-xs text-red-600">{errors.full_name.message}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    placeholder="+34 600 000 000"
                    className="w-full px-3 py-2 border border-brand-border rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                    {...register('phone')}
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
                    Correo electrónico
                  </label>
                  <input
                    type="text"
                    placeholder="cliente@ejemplo.com"
                    className={`w-full px-3 py-2 border rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${
                      errors.email ? 'border-red-500' : 'border-brand-border'
                    }`}
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {/* Birth Date */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-brand-border rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-brand-dark"
                    {...register('birth_date')}
                  />
                </div>

                {/* Alerts/Alergias */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-red-600 uppercase tracking-wider flex items-center">
                    Alergias o Advertencias
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Alérgica a tintes con amoníaco"
                    className="w-full px-3 py-2 border border-red-200 rounded-lg bg-red-50/20 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 text-brand-dark"
                    {...register('alerts')}
                  />
                </div>

                {/* Preferences */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
                    Preferencias de peinado/servicio
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Prefiere café con leche, tintes rubios fríos"
                    className="w-full px-3 py-2 border border-brand-border rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                    {...register('preferences')}
                  />
                </div>

                {/* Preferred Products Checkbox List */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider block">
                    Productos de Preferencia
                  </label>
                  {availableProducts.length === 0 ? (
                    <p className="text-xs text-stone-400 italic">No hay productos cargados en el catálogo.</p>
                  ) : (
                    <div className="border border-brand-border rounded-lg bg-stone-50 divide-y divide-brand-border max-h-40 overflow-y-auto">
                      {availableProducts.map(p => {
                        const isChecked = selectedProductIds.includes(p.id);
                        return (
                          <div 
                            key={p.id}
                            onClick={() => {
                              setSelectedProductIds(prev => 
                                prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]
                              );
                            }}
                            className="p-2.5 flex items-center justify-between hover:bg-white cursor-pointer text-xs"
                          >
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}} // handled by row click
                                className="rounded text-brand-primary focus:ring-brand-primary border-brand-border w-3.5 h-3.5 cursor-pointer"
                              />
                              <span className="font-medium text-brand-dark">{p.name}</span>
                            </div>
                            <span className="text-[10px] text-stone-400 font-semibold uppercase">{p.brand || '-'}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
                    Notas Generales
                  </label>
                  <textarea
                    placeholder="Observaciones adicionales..."
                    rows={3}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-brand-dark"
                    {...register('notes')}
                  />
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
                  {formLoading ? 'Guardando...' : 'Guardar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        onConfirm={handleDeleteConfirm}
        loading={formLoading}
        title="¿Eliminar cliente?"
        description={`¿Estás seguro de que deseas eliminar permanentemente a "${clientToDelete?.full_name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar cliente"
      />
    </div>
  );
}
