'use client';

import { useEffect, useState } from 'react';
import { getDashboardData } from '@/actions/dashboard.actions';
import { getClients } from '@/actions/clientes.actions';
import { getServices } from '@/actions/servicios.actions';
import { getProducts } from '@/actions/productos.actions';
import { getRemindersData } from '@/actions/recordatorios.actions';
import { DashboardSkeleton } from '@/components/shared/loading-skeleton';
import { APP_CURRENCY_SYMBOL, formatCurrency } from '@/lib/currency';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Clock, Calendar, AlertTriangle, 
  Scissors, Package, DollarSign, RefreshCw, Bell, ChevronRight
} from 'lucide-react';

const COLORS = ['#a58a73', '#4a5759', '#735d78', '#5b7065', '#d4a373'];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [reminders, setReminders] = useState<any[]>([]);
  
  // Filter lists
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Filter selections
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [clientId, setClientId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [productId, setProductId] = useState('');
  const [status, setStatus] = useState('');

  const loadFilters = async () => {
    try {
      const [c, s, p] = await Promise.all([
        getClients(),
        getServices(),
        getProducts()
      ]);
      setClients(c);
      setServices(s);
      setProducts(p);
    } catch (err) {
      console.error('Error loading filter options:', err);
    }
  };

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const startIso = startDate ? new Date(startDate + 'T00:00:00Z').toISOString() : undefined;
      const endIso = endDate ? new Date(endDate + 'T23:59:59Z').toISOString() : undefined;

      const [dashboardData, remindersRes] = await Promise.all([
        getDashboardData({
          startDate: startIso,
          endDate: endIso,
          clientId: clientId || undefined,
          serviceId: serviceId || undefined,
          productId: productId || undefined,
          status: status || undefined,
        }),
        getRemindersData()
      ]);
      setData(dashboardData);
      setReminders(remindersRes.candidates);
    } catch (err) {
      console.error('Error loading dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFilters();
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [startDate, endDate, clientId, serviceId, productId, status]);

  const handleResetFilters = () => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    setStartDate(d.toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
    setClientId('');
    setServiceId('');
    setProductId('');
    setStatus('');
  };

  if (loading && !data) {
    return <DashboardSkeleton />;
  }

  const kpis = data?.kpis || {
    totalRevenue: 0,
    totalCost: 0,
    totalMargin: 0,
    hoursWorked: 0,
    appointmentsCount: 0,
    completedCount: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-brand-dark">Dashboard</h2>
          <p className="text-sm text-stone-500">
            Analiza el rendimiento comercial, gastos y rentabilidad de tu estudio
          </p>
        </div>
        <button
          onClick={loadDashboard}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2 border border-brand-border bg-white hover:bg-brand-light text-stone-600 text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Filter Deck */}
      <div className="bg-white p-6 border border-brand-border rounded-xl shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400">Filtrar Análisis</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-[10px] text-stone-400 uppercase font-semibold">Desde</label>
            <input
              type="date"
              className="w-full px-2.5 py-1.5 border border-brand-border rounded-lg bg-stone-50 text-xs text-brand-dark focus:outline-none"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          {/* End Date */}
          <div className="space-y-1">
            <label className="text-[10px] text-stone-400 uppercase font-semibold">Hasta</label>
            <input
              type="date"
              className="w-full px-2.5 py-1.5 border border-brand-border rounded-lg bg-stone-50 text-xs text-brand-dark focus:outline-none"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          {/* Client */}
          <div className="space-y-1">
            <label className="text-[10px] text-stone-400 uppercase font-semibold">Cliente</label>
            <select
              className="w-full px-2.5 py-1.5 border border-brand-border rounded-lg bg-stone-50 text-xs text-brand-dark focus:outline-none"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              <option value="">Todos</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </div>
          {/* Service */}
          <div className="space-y-1">
            <label className="text-[10px] text-stone-400 uppercase font-semibold">Servicio</label>
            <select
              className="w-full px-2.5 py-1.5 border border-brand-border rounded-lg bg-stone-50 text-xs text-brand-dark focus:outline-none"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
            >
              <option value="">Todos</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {/* Product */}
          <div className="space-y-1">
            <label className="text-[10px] text-stone-400 uppercase font-semibold">Consumo Producto</label>
            <select
              className="w-full px-2.5 py-1.5 border border-brand-border rounded-lg bg-stone-50 text-xs text-brand-dark focus:outline-none"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">Todos</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          {/* Status */}
          <div className="space-y-1 flex flex-col justify-between">
            <label className="text-[10px] text-stone-400 uppercase font-semibold">Estado Cita</label>
            <div className="flex space-x-2">
              <select
                className="flex-grow px-2.5 py-1.5 border border-brand-border rounded-lg bg-stone-50 text-xs text-brand-dark focus:outline-none"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="scheduled">Programada</option>
                <option value="completed">Completada</option>
                <option value="cancelled">Cancelada</option>
                <option value="no_show">Ausente</option>
              </select>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-2 py-1.5 border border-brand-border rounded-lg bg-white text-stone-500 hover:bg-stone-50 text-xs font-semibold cursor-pointer"
                title="Limpiar filtros"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Income Card */}
        <div className="bg-white p-6 border border-brand-border rounded-xl shadow-sm space-y-2 relative overflow-hidden animate-slide-up">
          <div className="flex justify-between items-start text-stone-400">
            <span className="text-xs uppercase font-bold tracking-wider">Ingresos totales</span>
            <DollarSign className="w-5 h-5 text-brand-primary" />
          </div>
          <p className="text-2xl font-bold text-brand-dark">
            {formatCurrency(kpis.totalRevenue)}
          </p>
          <div className="flex items-center text-xs text-emerald-600 font-semibold space-x-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Estimado + Realizado</span>
          </div>
        </div>

        {/* Cost Card */}
        <div className="bg-white p-6 border border-brand-border rounded-xl shadow-sm space-y-2 relative overflow-hidden animate-slide-up">
          <div className="flex justify-between items-start text-stone-400">
            <span className="text-xs uppercase font-bold tracking-wider">Gastos de Operación</span>
            <TrendingDown className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-brand-dark">
            {formatCurrency(kpis.totalCost)}
          </p>
          <div className="text-[11px] text-stone-400 leading-normal">
            Suma de materiales + mano de obra
          </div>
        </div>

        {/* Margin Card */}
        <div className="bg-white p-6 border border-brand-border rounded-xl shadow-sm space-y-2 relative overflow-hidden bg-brand-light/10 animate-slide-up">
          <div className="flex justify-between items-start text-brand-primary">
            <span className="text-xs uppercase font-bold tracking-wider">Margen Neto</span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-700">
            {formatCurrency(kpis.totalMargin)}
          </p>
          <div className="flex items-center space-x-1.5 text-xs text-stone-500">
            <span>Rentabilidad: </span>
            <span className="font-semibold text-brand-dark">
              {kpis.totalRevenue > 0 ? ((kpis.totalMargin / kpis.totalRevenue) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        {/* Summary Activity Card */}
        <div className="bg-white p-6 border border-brand-border rounded-xl shadow-sm space-y-2 relative overflow-hidden animate-slide-up">
          <div className="flex justify-between items-start text-stone-400">
            <span className="text-xs uppercase font-bold tracking-wider">Volumen Citas</span>
            <Calendar className="w-5 h-5 text-brand-primary" />
          </div>
          <p className="text-2xl font-bold text-brand-dark">{kpis.appointmentsCount} citas</p>
          <div className="flex items-center space-x-1.5 text-xs text-stone-500">
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            <span>Trabajado: </span>
            <span className="font-semibold text-brand-dark">{kpis.hoursWorked} hrs</span>
          </div>
        </div>
      </div>

      {/* Graphics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Cost Monthly trends */}
        <div className="bg-white p-6 border border-brand-border rounded-xl shadow-sm space-y-4">
          <div>
            <h4 className="font-serif text-lg font-bold text-brand-dark">Tendencias Financieras</h4>
            <p className="text-xs text-stone-400">Comparativa mensual de ingresos frente a costos</p>
          </div>
          
          <div className="h-72 w-full text-xs">
            {data?.chartTrends?.length === 0 ? (
              <div className="h-full flex items-center justify-center text-stone-400 italic">No hay datos suficientes en el periodo.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chartTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f2eb" />
                  <XAxis dataKey="month" stroke="#78716c" />
                  <YAxis stroke="#78716c" />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ background: '#fff', border: '1px solid #e7e3de' }} />
                  <Legend />
                  <Bar dataKey="revenue" name="Ingresos" fill="#b99d85" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cost" name="Costos" fill="#1c1917" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Profit margins Monthly trends */}
        <div className="bg-white p-6 border border-brand-border rounded-xl shadow-sm space-y-4">
          <div>
            <h4 className="font-serif text-lg font-bold text-brand-dark">Evolución de Margen</h4>
            <p className="text-xs text-stone-400">Margen neto de ganancia generado mes a mes</p>
          </div>

          <div className="h-72 w-full text-xs">
            {data?.chartTrends?.length === 0 ? (
              <div className="h-full flex items-center justify-center text-stone-400 italic">No hay datos suficientes en el periodo.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.chartTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f2eb" />
                  <XAxis dataKey="month" stroke="#78716c" />
                  <YAxis stroke="#78716c" />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ background: '#fff', border: '1px solid #e7e3de' }} />
                  <Legend />
                  <Line type="monotone" dataKey="margin" name={`Margen (${APP_CURRENCY_SYMBOL})`} stroke="#c5a880" strokeWidth={2.5} dot={{ fill: '#b99d85' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Service categorization - Pie chart */}
        <div className="bg-white p-6 border border-brand-border rounded-xl shadow-sm space-y-4">
          <div>
            <h4 className="font-serif text-lg font-bold text-brand-dark">Servicios más Frecuentes</h4>
            <p className="text-xs text-stone-400">Distribución de servicios solicitados</p>
          </div>

          <div className="h-72 w-full text-xs flex flex-col sm:flex-row items-center justify-around">
            {data?.frequentServices?.length === 0 ? (
              <div className="w-full flex items-center justify-center text-stone-400 italic">No hay datos disponibles en el periodo.</div>
            ) : (
              <>
                <div className="h-full w-full sm:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.frequentServices}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="name"
                      >
                        {data.frequentServices.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value} servicios`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Custom Legend */}
                <div className="space-y-2.5 max-w-xs w-full sm:w-1/2 pl-4">
                  {data.frequentServices.map((entry: any, index: number) => (
                    <div key={entry.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-stone-700 truncate max-w-[120px] font-medium">{entry.name}</span>
                      </div>
                      <span className="font-bold text-brand-dark text-right pl-2">
                        {entry.count} ({formatCurrency(entry.revenue)})
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Product consumption level */}
        <div className="bg-white p-6 border border-brand-border rounded-xl shadow-sm space-y-4">
          <div>
            <h4 className="font-serif text-lg font-bold text-brand-dark">Consumo de Productos</h4>
            <p className="text-xs text-stone-400">Mayores consumos de stock en cabina (cantidad)</p>
          </div>

          <div className="h-72 w-full text-xs">
            {data?.topProducts?.length === 0 ? (
              <div className="h-full flex items-center justify-center text-stone-400 italic">No hay registros de consumo en el periodo.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topProducts} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f5f2eb" />
                  <XAxis type="number" stroke="#78716c" />
                  <YAxis dataKey="name" type="category" stroke="#78716c" width={100} />
                  <Tooltip contentStyle={{ background: '#white', border: '1px solid #e7e3de' }} />
                  <Bar dataKey="quantity" name="Cantidad usada" radius={[0, 4, 4, 0]}>
                    {data.topProducts.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Lists & Warnings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-white border border-brand-border rounded-xl shadow-sm overflow-hidden animate-slide-up flex flex-col justify-between">
          <div>
            <div className="px-6 py-5 border-b border-brand-border bg-red-50/10 flex items-center justify-between">
              <h4 className="font-serif text-lg font-bold text-red-800 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
                Alertas de Stock Bajo
              </h4>
              <span className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-full px-2 py-0.5 font-bold">
                {data?.lowStockProducts?.length || 0}
              </span>
            </div>
            
            <div className="divide-y divide-brand-border">
              {(!data?.lowStockProducts || data.lowStockProducts.length === 0) ? (
                <div className="p-6 text-center text-stone-400 italic text-sm">
                  ✓ Todo el inventario se encuentra en niveles saludables.
                </div>
              ) : (
                data.lowStockProducts.map((p: any) => (
                  <div key={p.id} className="px-6 py-4 flex items-center justify-between text-sm hover:bg-stone-50/50">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-brand-dark">{p.name}</p>
                      <p className="text-xs text-stone-400">{p.brand || 'Sin marca'} | Proveedor: {p.supplier || '-'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">{p.current_stock} {p.unit}</p>
                      <p className="text-xs text-stone-400">Mínimo: {p.minimum_stock} {p.unit}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Pending Return Reminders */}
        <div className="bg-white border border-brand-border rounded-xl shadow-sm overflow-hidden animate-slide-up flex flex-col justify-between">
          <div>
            <div className="px-6 py-5 border-b border-brand-border bg-amber-50/10 flex items-center justify-between">
              <h4 className="font-serif text-lg font-bold text-amber-800 flex items-center">
                <Bell className="w-5 h-5 mr-2 text-amber-500" />
                Retornos Pendientes
              </h4>
              <span className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-2 py-0.5 font-bold">
                {reminders.length || 0}
              </span>
            </div>
            
            <div className="divide-y divide-brand-border">
              {reminders.length === 0 ? (
                <div className="p-6 text-center text-stone-400 italic text-sm">
                  ✓ Todos tus clientes están al día con sus retornos.
                </div>
              ) : (
                reminders.slice(0, 5).map((candidate: any) => {
                  const labelStatus = candidate.status === 'overdue' ? 'Vencido' : 'Próximo';
                  return (
                    <div key={`${candidate.client_id}:${candidate.service_id}`} className="px-6 py-4 flex items-center justify-between text-sm hover:bg-stone-50/50">
                      <div className="space-y-0.5 max-w-[150px]">
                        <p className="font-semibold text-brand-dark truncate">{candidate.client_name}</p>
                        <p className="text-xs text-stone-400 truncate">{candidate.service_name}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          candidate.status === 'overdue' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {labelStatus} {candidate.days_overdue >= 0 ? `hace ${candidate.days_overdue}d` : `en ${Math.abs(candidate.days_overdue)}d`}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          {reminders.length > 0 && (
            <div className="px-6 py-3.5 bg-stone-50 border-t border-brand-border text-center">
              <a
                href="/app/recordatorios"
                className="inline-flex items-center justify-center space-x-1 text-xs text-brand-primary hover:text-brand-gold font-bold transition-colors"
              >
                <span>Gestionar todos los recordatorios</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Upcoming Appointments Calendar list */}
        <div className="bg-white border border-brand-border rounded-xl shadow-sm overflow-hidden animate-slide-up flex flex-col justify-between">
          <div>
            <div className="px-6 py-5 border-b border-brand-border bg-brand-cream/15 flex items-center justify-between">
              <h4 className="font-serif text-lg font-bold text-brand-dark flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-brand-primary" />
                Próximas Citas Agendadas
              </h4>
              <span className="text-xs text-brand-primary bg-brand-light border border-brand-border rounded-full px-2 py-0.5 font-semibold">
                {data?.upcomingAppointments?.length || 0}
              </span>
            </div>
            
            <div className="divide-y divide-brand-border">
              {(!data?.upcomingAppointments || data.upcomingAppointments.length === 0) ? (
                <div className="p-6 text-center text-stone-400 italic text-sm">
                  No hay próximas citas programadas en la agenda.
                </div>
              ) : (
                data.upcomingAppointments.map((app: any) => {
                  const clientName = app.clients?.full_name || 'Cliente sin registrar';
                  const dateStr = new Date(app.starts_at).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div key={app.id} className="px-6 py-4 flex items-center justify-between text-sm hover:bg-stone-50/50">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-brand-dark">{clientName}</p>
                        <p className="text-xs text-stone-400">{app.clients?.phone || 'Sin teléfono'}</p>
                      </div>
                      <div className="text-right font-medium text-stone-600">
                        <p className="text-xs text-brand-primary font-bold">{dateStr}</p>
                        <p className="text-[10px] text-stone-400">Estado: {app.status}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
