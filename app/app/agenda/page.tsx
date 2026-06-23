'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  getAppointments, 
  createAppointment, 
  updateAppointment, 
  updateAppointmentStatus,
  deleteAppointment 
} from '@/actions/citas.actions';
import { getClients } from '@/actions/clientes.actions';
import { getServices } from '@/actions/servicios.actions';
import { AppointmentSchema, type AppointmentFormInput } from '@/lib/validations/cita.schema';
import { formatCurrency } from '@/lib/currency';
import ConfirmDialog from '@/components/shared/confirm-dialog';
import EmptyState from '@/components/shared/empty-state';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  User, 
  Scissors, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  ClipboardCheck, 
  Trash2, 
  CheckCircle2, 
  XSquare, 
  X, 
  MoreVertical,
  PlusCircle,
  Edit
} from 'lucide-react';

export default function AgendaPage() {
  const router = useRouter();
  const [monthAppointments, setMonthAppointments] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Date helper to get YYYY-MM-DD in local time
  const getLocalDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Date filter: defaults to today
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return getLocalDateString(new Date());
  });

  // Month navigation state
  const [currentMonth, setCurrentMonth] = useState<number>(() => new Date().getMonth());
  const [currentYear, setCurrentYear] = useState<number>(() => new Date().getFullYear());

  // Modal triggers
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any | null>(null);
  const [appointmentToDelete, setAppointmentToDelete] = useState<any | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Selected services in form state
  const [formSelectedServices, setFormSelectedServices] = useState<{ service_id: string; price_charged?: number }[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AppointmentFormInput>({
    resolver: zodResolver(AppointmentSchema),
    defaultValues: {
      client_id: '',
      starts_at: '',
      ends_at: '',
      status: 'scheduled',
      title: '',
      notes: '',
    },
  });

  // Generate 42 days grid for the current visible month
  const getGridDays = () => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    const gridStart = new Date(currentYear, currentMonth, 1 - startOffset);
    
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const gridDays = getGridDays();
      const firstDay = gridDays[0];
      const lastDay = gridDays[gridDays.length - 1];
      
      const startStr = `${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(2, '0')}-${String(firstDay.getDate()).padStart(2, '0')}T00:00:00Z`;
      const endStr = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}T23:59:59Z`;

      const appData = await getAppointments({
        start_date: startStr,
        end_date: endStr
      });
      setMonthAppointments(appData);

      // Cache clients and active services for the modals
      const clientsData = await getClients();
      setClients(clientsData);

      const servicesData = await getServices();
      setServices(servicesData.filter(s => s.is_active));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentMonth, currentYear]);

  useEffect(() => {
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      if (y !== currentYear || m !== currentMonth) {
        setCurrentYear(y);
        setCurrentMonth(m);
      }
    }
  }, [selectedDate]);

  // Derived state: appointments for the selected date
  const appointments = monthAppointments.filter(app => {
    return getLocalDateString(new Date(app.starts_at)) === selectedDate;
  });

  const handlePrevDay = () => {
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const current = new Date(y, m, d);
      current.setDate(current.getDate() - 1);
      setSelectedDate(getLocalDateString(current));
    }
  };

  const handleNextDay = () => {
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const current = new Date(y, m, d);
      current.setDate(current.getDate() + 1);
      setSelectedDate(getLocalDateString(current));
    }
  };

  const handlePrevMonth = () => {
    let newMonth = currentMonth - 1;
    let newYear = currentYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    
    const firstDay = new Date(newYear, newMonth, 1);
    setSelectedDate(getLocalDateString(firstDay));
  };

  const handleNextMonth = () => {
    let newMonth = currentMonth + 1;
    let newYear = currentYear;
    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    
    const firstDay = new Date(newYear, newMonth, 1);
    setSelectedDate(getLocalDateString(firstDay));
  };

  const handleOpenCreate = () => {
    setEditingAppointment(null);
    setFormSelectedServices([]);
    
    // Set default datetimes to selected date, starting at the next hour
    const now = new Date();
    const startHour = String(now.getHours() + 1).padStart(2, '0');
    const endHour = String(now.getHours() + 2).padStart(2, '0');
    
    reset({
      client_id: '',
      starts_at: `${selectedDate}T${startHour}:00`,
      ends_at: `${selectedDate}T${endHour}:00`,
      status: 'scheduled',
      title: '',
      notes: '',
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (app: any) => {
    setEditingAppointment(app);
    setFormSelectedServices(
      app.appointment_services?.map((as: any) => ({
        service_id: as.service_id,
        price_charged: Number(as.price_charged),
      })) || []
    );

    // Format ISO string to datetime-local value (YYYY-MM-DDTHH:MM)
    const startIso = new Date(app.starts_at).toISOString().slice(0, 16);
    const endIso = new Date(app.ends_at).toISOString().slice(0, 16);

    reset({
      client_id: app.client_id || '',
      starts_at: startIso,
      ends_at: endIso,
      status: app.status,
      title: app.title || '',
      notes: app.notes || '',
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: AppointmentFormInput) => {
    setFormLoading(true);
    setFormError(null);
    try {
      // Parse ISO dates back with offset or convert to UTC strings
      const payload = {
        ...data,
        starts_at: new Date(data.starts_at).toISOString(),
        ends_at: new Date(data.ends_at).toISOString(),
      };

      if (editingAppointment) {
        await updateAppointment(editingAppointment.id, payload);
        // Note: appointment services modification for edit is handled in the execution sheet
      } else {
        await createAppointment({
          ...payload,
          selectedServices: formSelectedServices,
        });
      }
      setIsFormOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Error al agendar la cita');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: any) => {
    try {
      await updateAppointmentStatus(id, status);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error al actualizar estado');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!appointmentToDelete) return;
    setFormLoading(true);
    try {
      await deleteAppointment(appointmentToDelete.id);
      setAppointmentToDelete(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar la cita');
    } finally {
      setFormLoading(false);
    }
  };

  const toggleFormService = (serviceId: string, price: number) => {
    const exists = formSelectedServices.some(s => s.service_id === serviceId);
    if (exists) {
      setFormSelectedServices(prev => prev.filter(s => s.service_id !== serviceId));
    } else {
      setFormSelectedServices(prev => [...prev, { service_id: serviceId, price_charged: price }]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-brand-dark">Agenda de Citas</h2>
          <p className="text-sm text-stone-500">
            Organiza los horarios de tus clientes, cabinas y cabellos
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-brand-primary hover:bg-[#a58a73] text-white text-sm font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Agendar Cita</span>
        </button>
      </div>

      {/* Calendario Mensual Completo */}
      <div className="bg-white p-6 border border-brand-border rounded-xl shadow-sm space-y-4">
        {/* Month Selector Header */}
        <div className="flex items-center justify-between pb-2 border-b border-brand-border/50">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-brand-primary" />
            <h3 className="font-serif text-lg font-bold text-brand-dark capitalize">
              {new Date(currentYear, currentMonth).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 border border-brand-border rounded-lg hover:bg-brand-light transition-colors cursor-pointer text-stone-600"
              title="Mes Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const today = new Date();
                setCurrentMonth(today.getMonth());
                setCurrentYear(today.getFullYear());
                setSelectedDate(getLocalDateString(today));
              }}
              className="px-3 py-1.5 border border-brand-border rounded-lg hover:bg-brand-light transition-colors text-xs font-semibold text-brand-dark cursor-pointer"
            >
              Hoy
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 border border-brand-border rounded-lg hover:bg-brand-light transition-colors cursor-pointer text-stone-600"
              title="Siguiente Mes"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="space-y-1">
          {/* Weekdays Header */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-stone-500 uppercase tracking-wider py-2">
            <span>Lun</span>
            <span>Mar</span>
            <span>Mié</span>
            <span>Jue</span>
            <span>Vie</span>
            <span>Sáb</span>
            <span>Dom</span>
          </div>

          {/* 42 Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {getGridDays().map((day, idx) => {
              const isCurrentMonth = day.getMonth() === currentMonth;
              const formatted = getLocalDateString(day);
              const isSelected = formatted === selectedDate;
              const isToday = getLocalDateString(new Date()) === formatted;
              
              const dayApps = monthAppointments.filter(app => {
                return getLocalDateString(new Date(app.starts_at)) === formatted;
              });
              const activeApps = dayApps.filter(app => app.status !== 'cancelled');

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(formatted)}
                  className={`min-h-[90px] p-2 border rounded-xl flex flex-col justify-between cursor-pointer transition-all ${
                    isCurrentMonth ? 'bg-white hover:bg-stone-50' : 'bg-stone-50/40 text-stone-400 hover:bg-stone-100/40'
                  } ${
                    isSelected 
                      ? 'ring-2 ring-brand-primary border-transparent shadow-sm bg-brand-light/10' 
                      : isToday 
                      ? 'border-brand-primary bg-brand-light/20' 
                      : 'border-brand-border'
                  } ${
                    activeApps.length > 0 && !isSelected
                      ? 'bg-brand-light/50 border-brand-primary/20 hover:bg-brand-light/80' 
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                      isToday 
                        ? 'bg-brand-primary text-white font-bold' 
                        : isSelected 
                        ? 'text-brand-primary font-bold'
                        : isCurrentMonth 
                        ? 'text-brand-dark' 
                        : 'text-stone-400/80'
                    }`}>
                      {day.getDate()}
                    </span>
                    {activeApps.length > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                    )}
                  </div>

                  {/* Client miniature list */}
                  <div className="mt-2 flex-1 flex flex-col justify-end space-y-1 overflow-hidden">
                    {activeApps.slice(0, 2).map((app, appIdx) => {
                      const clientName = app.clients?.full_name || 'Sin registrar';
                      const parts = clientName.split(' ');
                      const shortName = parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : parts[0];

                      return (
                        <span
                          key={appIdx}
                          className="text-[9px] leading-tight font-semibold text-brand-dark/95 bg-white/90 border border-brand-border/40 px-1 py-0.5 rounded truncate block w-full text-center shadow-xs"
                          title={`${clientName} - ${new Date(app.starts_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`}
                        >
                          {shortName}
                        </span>
                      );
                    })}
                    {activeApps.length > 2 && (
                      <span className="text-[8px] text-stone-500 font-bold text-center block leading-none pt-0.5">
                        +{activeApps.length - 2} más
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detalle del Día - List Header */}
      <div className="pt-2">
        <h3 className="font-serif text-lg font-bold text-brand-dark">Detalle del Día</h3>
      </div>

      {/* Date controls and Picker */}
      <div className="bg-white p-4 border border-brand-border rounded-xl shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrevDay}
            className="p-2 border border-brand-border rounded-lg hover:bg-brand-light transition-colors cursor-pointer text-stone-600"
          >
            <ChevronLeft className="w-4.5 h-4.5" />
          </button>
          
          <div className="flex items-center space-x-2 px-3 py-1.5 border border-brand-border rounded-lg bg-stone-50 text-brand-dark font-medium text-sm">
            <CalendarIcon className="w-4 h-4 text-brand-primary" />
            <span>
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </span>
          </div>

          <button
            onClick={handleNextDay}
            className="p-2 border border-brand-border rounded-lg hover:bg-brand-light transition-colors cursor-pointer text-stone-600"
          >
            <ChevronRight className="w-4.5 h-4.5" />
          </button>
        </div>

        <div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 border border-brand-border rounded-lg bg-stone-50 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-sm font-medium text-brand-dark cursor-pointer"
          />
        </div>
      </div>

      {/* Appointments slot list */}
      {loading ? (
        <TableSkeleton rows={3} />
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={CalendarIcon}
          title="Sin citas agendadas"
          description="No tienes citas registradas para este día."
          actionLabel="Agendar Cita"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {appointments.map((app) => {
            const clientName = app.clients?.full_name || 'Cliente sin registrar';
            const starts = new Date(app.starts_at);
            const ends = new Date(app.ends_at);
            const timeStr = `${String(starts.getHours()).padStart(2, '0')}:${String(starts.getMinutes()).padStart(2, '0')} - ${String(ends.getHours()).padStart(2, '0')}:${String(ends.getMinutes()).padStart(2, '0')}`;

            return (
              <div 
                key={app.id} 
                className={`bg-white border rounded-xl shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:shadow-md ${
                  app.status === 'cancelled' 
                    ? 'border-red-100 bg-red-50/10' 
                    : app.status === 'completed'
                    ? 'border-emerald-100 bg-emerald-50/5'
                    : 'border-brand-border'
                }`}
              >
                {/* Slot info */}
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-full flex flex-col items-center justify-center flex-shrink-0 border ${
                    app.status === 'cancelled'
                      ? 'bg-red-50 text-red-600 border-red-100'
                      : app.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      : 'bg-brand-light text-brand-primary border-brand-border'
                  }`}>
                    <Clock className="w-5 h-5" />
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-brand-dark">{timeStr}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${
                        app.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : app.status === 'cancelled'
                          ? 'bg-red-50 text-red-700 border border-red-100'
                          : app.status === 'no_show'
                          ? 'bg-stone-100 text-stone-600 border border-stone-200'
                          : 'bg-brand-light text-brand-primary border border-brand-border'
                      }`}>
                        {app.status === 'completed' ? 'Completada' : app.status === 'cancelled' ? 'Cancelada' : app.status === 'no_show' ? 'Ausente' : 'Programada'}
                      </span>
                    </div>
                    
                    <h4 className="font-serif text-lg font-bold text-brand-dark flex items-center">
                      <User className="w-4 h-4 mr-1.5 text-stone-400" />
                      {clientName}
                    </h4>

                    {/* Services checklist summary */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {app.appointment_services?.map((as: any) => (
                        <span key={as.id} className="inline-flex items-center px-2 py-0.5 bg-stone-100 text-stone-600 rounded text-xs border border-stone-200">
                          <Scissors className="w-3.5 h-3.5 mr-1 text-stone-400" />
                          {as.service_name}
                        </span>
                      ))}
                      {(!app.appointment_services || app.appointment_services.length === 0) && (
                        <span className="text-xs text-stone-400 italic">Sin servicios seleccionados</span>
                      )}
                    </div>

                    {app.notes && (
                      <p className="text-xs text-stone-500 italic max-w-lg">
                        "Notas: {app.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Financial Summary & Actions */}
                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-brand-border pt-4 md:pt-0">
                  <div className="text-right">
                    <p className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold">Cobrado / Estimado</p>
                    <p className="text-lg font-bold text-brand-dark">
                      {formatCurrency(app.total_price)}
                    </p>
                    {app.status === 'completed' && (
                      <p className="text-xs text-emerald-600 font-medium mt-0.5">
                        Margen: {formatCurrency(app.total_price - app.total_cost)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Execution Sheet direct link */}
                    <button
                      onClick={() => router.push(`/app/servicios-prestados?appointment_id=${app.id}`)}
                      className="inline-flex items-center space-x-1.5 px-3 py-2 bg-brand-primary hover:bg-[#a58a73] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                      title="Registrar Consumos y Minutos"
                    >
                      <ClipboardCheck className="w-4 h-4" />
                      <span>Ficha</span>
                    </button>

                    {/* Simple status fast selectors */}
                    {app.status === 'scheduled' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(app.id, 'completed')}
                          className="p-2 border border-brand-border hover:border-emerald-200 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors cursor-pointer"
                          title="Marcar Completada"
                        >
                          <CheckCircle2 className="w-4.5 h-4.5" />
                        </button>
                        <button
                          onClick={() => handleStatusChange(app.id, 'cancelled')}
                          className="p-2 border border-brand-border hover:border-red-200 hover:bg-red-50 text-red-600 rounded-lg transition-colors cursor-pointer"
                          title="Cancelar Cita"
                        >
                          <XSquare className="w-4.5 h-4.5" />
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => handleOpenEdit(app)}
                      className="p-2 border border-brand-border hover:bg-brand-light text-stone-600 rounded-lg transition-colors cursor-pointer"
                      title="Editar Horario"
                    >
                      <Edit className="w-4.5 h-4.5" />
                    </button>

                    <button
                      onClick={() => setAppointmentToDelete(app)}
                      className="p-2 border border-brand-border hover:border-red-200 hover:bg-red-50 text-stone-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar cita"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Appointment Drawer */}
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
                {editingAppointment ? 'Modificar Horario Cita' : 'Agendar Cita'}
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

                {/* Client selection */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
                    Cliente *
                  </label>
                  <select
                    className={`w-full px-3 py-2 border rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-brand-dark ${
                      errors.client_id ? 'border-red-500' : 'border-brand-border'
                    }`}
                    {...register('client_id')}
                  >
                    <option value="">Selecciona un cliente...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.full_name}</option>
                    ))}
                  </select>
                  {errors.client_id && (
                    <p className="text-xs text-red-600">{errors.client_id.message}</p>
                  )}
                </div>

                {/* Date & Time: Starts At */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
                    Inicio de la Cita *
                  </label>
                  <input
                    type="datetime-local"
                    className={`w-full px-3 py-2 border rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-brand-dark ${
                      errors.starts_at ? 'border-red-500' : 'border-brand-border'
                    }`}
                    {...register('starts_at')}
                  />
                  {errors.starts_at && (
                    <p className="text-xs text-red-600">{errors.starts_at.message}</p>
                  )}
                </div>

                {/* Date & Time: Ends At */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
                    Fin de la Cita *
                  </label>
                  <input
                    type="datetime-local"
                    className={`w-full px-3 py-2 border rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-brand-dark ${
                      errors.ends_at ? 'border-red-500' : 'border-brand-border'
                    }`}
                    {...register('ends_at')}
                  />
                  {errors.ends_at && (
                    <p className="text-xs text-red-600">{errors.ends_at.message}</p>
                  )}
                </div>

                {/* Status (only on edits) */}
                {editingAppointment && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
                      Estado
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-brand-border rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-brand-dark"
                      {...register('status')}
                    >
                      <option value="scheduled">Programada</option>
                      <option value="completed">Completada</option>
                      <option value="cancelled">Cancelada</option>
                      <option value="no_show">Ausente (No asistió)</option>
                    </select>
                  </div>
                )}

                {/* Services selection (only on creation) */}
                {!editingAppointment && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider block">
                      Seleccionar Servicios Iniciales
                    </label>
                    {services.length === 0 ? (
                      <p className="text-xs text-stone-400 italic">No tienes servicios cargados en el catálogo.</p>
                    ) : (
                      <div className="border border-brand-border rounded-lg bg-stone-50 divide-y divide-brand-border max-h-48 overflow-y-auto">
                        {services.map(s => {
                          const isChecked = formSelectedServices.some(fs => fs.service_id === s.id);
                          return (
                            <div 
                              key={s.id}
                              onClick={() => toggleFormService(s.id, s.base_price)}
                              className="p-3 flex items-center justify-between hover:bg-white cursor-pointer text-sm"
                            >
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}} // handled by row click
                                  className="rounded text-brand-primary focus:ring-brand-primary border-brand-border w-4 h-4 cursor-pointer"
                                />
                                <span className="font-medium text-brand-dark">{s.name}</span>
                              </div>
                              <div className="text-xs text-stone-500">
                                <span>{s.estimated_minutes} min | </span>
                                <span className="font-semibold text-brand-dark">{formatCurrency(s.base_price)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
                    Notas de Cita
                  </label>
                  <textarea
                    placeholder="Instrucciones especiales..."
                    rows={2}
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
                  {formLoading ? 'Guardando...' : 'Guardar Cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!appointmentToDelete}
        onClose={() => setAppointmentToDelete(null)}
        onConfirm={handleDeleteConfirm}
        loading={formLoading}
        title="¿Eliminar cita de la agenda?"
        description={`¿Estás seguro de que deseas eliminar permanentemente esta cita? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar cita"
      />
    </div>
  );
}
