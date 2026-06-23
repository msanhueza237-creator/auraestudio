'use client';

import { useEffect, useState } from 'react';
import { getRemindersData, sendReminderEmails, type RetouchCandidate } from '@/actions/recordatorios.actions';
import { APP_CURRENCY_SYMBOL, formatCurrency } from '@/lib/currency';
import EmptyState from '@/components/shared/empty-state';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { 
  Bell, 
  Mail, 
  Send, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Check, 
  AlertCircle, 
  X, 
  RefreshCw, 
  Sliders, 
  Eye, 
  Info,
  ChevronRight
} from 'lucide-react';

export default function RecordatoriosPage() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [data, setData] = useState<{ candidates: RetouchCandidate[]; stats: any }>({
    candidates: [],
    stats: { overdue: 0, dueSoon: 0, sentThisMonth: 0 }
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Selection states
  const [selectedIds, setSelectedIds] = useState<string[]>([]); // Array of "client_id:service_id"

  // Template states
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [subjectTemplate, setSubjectTemplate] = useState('¡Es hora de tu retoque en Aura Estudio!');
  const [bodyTemplate, setBodyTemplate] = useState(
    'Hola {{CLIENT_NAME}},\n\nEsperamos que estés muy bien. Hace un tiempo te realizaste el servicio de {{SERVICE_NAME}} con nosotros y ya está pronto a requerir mantención o retoque.\n\nTe invitamos a agendar tu próxima hora en AURA Estudio para mantener tu look radiante.\n\n¡Te esperamos!'
  );

  // Sending progress states
  const [sendingProgress, setSendingProgress] = useState<{ current: number; total: number } | null>(null);

  const loadData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const reminders = await getRemindersData();
      setData(reminders);
    } catch (err: any) {
      setErrorMessage(err.message || 'No se pudieron cargar los recordatorios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = data.candidates.map(c => `${c.client_id}:${c.service_id}`);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectCandidate = (clientId: string, serviceId: string, checked: boolean) => {
    const key = `${clientId}:${serviceId}`;
    if (checked) {
      setSelectedIds(prev => [...prev, key]);
    } else {
      setSelectedIds(prev => prev.filter(id => id !== key));
    }
  };

  const handleSendBatchReminders = async () => {
    if (selectedIds.length === 0) return;
    setActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setSendingProgress({ current: 0, total: selectedIds.length });

    const selectedCandidates = data.candidates.filter(c => 
      selectedIds.includes(`${c.client_id}:${c.service_id}`)
    );

    const emailPayload = selectedCandidates.map(c => ({
      client_id: c.client_id,
      service_id: c.service_id,
      client_name: c.client_name,
      client_email: c.client_email,
      service_name: c.service_name
    }));

    try {
      // Simulate sending progression for premium feel
      for (let i = 1; i <= selectedIds.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 300)); // Delay between email sends
        setSendingProgress({ current: i, total: selectedIds.length });
      }

      const res = await sendReminderEmails(emailPayload, subjectTemplate, bodyTemplate);
      
      setSuccessMessage(`¡Se han procesado ${res.successCount} recordatorios correctamente y guardado en el historial!`);
      setSelectedIds([]);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al enviar los recordatorios.');
    } finally {
      setActionLoading(false);
      setSendingProgress(null);
    }
  };

  // Helper to construct mailto link
  const getMailtoLink = (candidate: RetouchCandidate) => {
    const customizedBody = bodyTemplate
      .replace(/{{CLIENT_NAME}}/g, candidate.client_name)
      .replace(/{{SERVICE_NAME}}/g, candidate.service_name);
    
    return `mailto:${candidate.client_email}?subject=${encodeURIComponent(subjectTemplate)}&body=${encodeURIComponent(customizedBody)}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-brand-dark">Recordatorios de Retorno</h2>
          <p className="text-sm text-stone-500">
            Monitorea los tiempos de posible retorno de tus clientes y contáctalos para agendar su próxima hora
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowTemplateEditor(!showTemplateEditor)}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2 border border-brand-border bg-white hover:bg-brand-light text-stone-600 text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-brand-primary" />
            <span>{showTemplateEditor ? 'Ocultar Plantilla' : 'Configurar Plantilla'}</span>
          </button>
          <button
            onClick={loadData}
            disabled={loading || actionLoading}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2 border border-brand-border bg-white hover:bg-brand-light text-stone-600 text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Overdue Card */}
        <div className="bg-white p-6 border border-red-100 rounded-xl shadow-sm space-y-2 relative overflow-hidden bg-red-50/5 animate-slide-up">
          <div className="flex justify-between items-start text-red-500">
            <span className="text-xs uppercase font-bold tracking-wider">Retornos Vencidos</span>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-800">
            {data.stats.overdue} clientes
          </p>
          <div className="text-[11px] text-stone-400 leading-normal">
            Han superado la fecha de retorno recomendada
          </div>
        </div>

        {/* Due Soon Card */}
        <div className="bg-white p-6 border border-amber-100 rounded-xl shadow-sm space-y-2 relative overflow-hidden bg-amber-50/5 animate-slide-up">
          <div className="flex justify-between items-start text-amber-500">
            <span className="text-xs uppercase font-bold tracking-wider">Retornos Próximos</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-800">
            {data.stats.dueSoon} clientes
          </p>
          <div className="text-[11px] text-stone-400 leading-normal">
            Requieren retorno en los próximos 7 días
          </div>
        </div>

        {/* Sent Reminders Card */}
        <div className="bg-white p-6 border border-brand-border rounded-xl shadow-sm space-y-2 relative overflow-hidden bg-brand-light/10 animate-slide-up">
          <div className="flex justify-between items-start text-brand-primary">
            <span className="text-xs uppercase font-bold tracking-wider">Enviados (Últimos 30 días)</span>
            <Bell className="w-5 h-5 text-brand-primary" />
          </div>
          <p className="text-2xl font-bold text-brand-dark">
            {data.stats.sentThisMonth} recordatorios
          </p>
          <div className="text-[11px] text-stone-400 leading-normal">
            Registrados con estado enviado en el historial
          </div>
        </div>
      </div>

      {/* Email Template Config Drawer (Collapsible) */}
      {showTemplateEditor && (
        <div className="bg-white border border-brand-border rounded-xl p-6 shadow-sm animate-fade-in space-y-4">
          <h4 className="font-serif text-base font-bold text-brand-dark flex items-center">
            <Mail className="w-4.5 h-4.5 mr-2 text-brand-primary" />
            Configuración de Plantilla de Email
          </h4>
          <p className="text-xs text-stone-500">
            Personaliza el asunto y cuerpo de los correos que se enviarán. Puedes usar los tags dinámicos <code className="bg-stone-100 px-1 py-0.5 rounded text-red-600 font-semibold">{"{{CLIENT_NAME}}"}</code> y <code className="bg-stone-100 px-1 py-0.5 rounded text-red-600 font-semibold">{"{{SERVICE_NAME}}"}</code> para completarlos automáticamente con los datos de cada cliente.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              {/* Subject */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider block">Asunto del Email</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-brand-border rounded-lg bg-stone-50 text-sm focus:outline-none text-brand-dark font-medium"
                  value={subjectTemplate}
                  onChange={(e) => setSubjectTemplate(e.target.value)}
                />
              </div>

              {/* Body */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider block">Cuerpo del Mensaje</label>
                <textarea
                  rows={6}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg bg-stone-50 text-sm focus:outline-none text-brand-dark"
                  value={bodyTemplate}
                  onChange={(e) => setBodyTemplate(e.target.value)}
                />
              </div>
            </div>

            {/* Live Preview Container */}
            <div className="border border-brand-border/60 bg-stone-50/50 rounded-xl p-6 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-[10px] text-brand-primary uppercase tracking-widest font-bold block">Vista Previa (Ejemplo)</span>
                <div className="bg-white p-4 border border-brand-border rounded-lg shadow-sm space-y-2 text-xs text-stone-700">
                  <p><span className="font-bold text-stone-400">Asunto:</span> {subjectTemplate}</p>
                  <hr className="border-brand-border/40 my-2" />
                  <p className="whitespace-pre-line leading-relaxed">
                    {bodyTemplate
                      .replace(/{{CLIENT_NAME}}/g, 'María González')
                      .replace(/{{SERVICE_NAME}}/g, 'Coloración / Tintura')}
                  </p>
                </div>
              </div>
              <div className="text-[10px] text-stone-400 flex items-start space-x-1.5 pt-2">
                <Info className="w-3.5 h-3.5 flex-shrink-0 text-stone-400" />
                <span>Esta plantilla se usará tanto para el envío simulado directo en sistema como para el botón rápido de correo manual (mailto).</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts / Success notices */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center space-x-2 animate-fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center space-x-2 animate-fade-in">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Action Progress Overlay */}
      {sendingProgress && (
        <div className="p-4 bg-brand-light/30 border border-brand-border text-brand-primary rounded-xl text-sm flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <span>Enviando correos... procesando {sendingProgress.current} de {sendingProgress.total}</span>
          </div>
          <span className="font-bold text-xs">{Math.round((sendingProgress.current / sendingProgress.total) * 100)}%</span>
        </div>
      )}

      {/* Bulk actions and candidates grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h4 className="font-serif text-lg font-bold text-brand-dark">Clientes Candidatos a Retorno</h4>
          
          {selectedIds.length > 0 && (
            <button
              onClick={handleSendBatchReminders}
              disabled={actionLoading}
              className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-brand-primary hover:bg-[#a58a73] text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>Enviar recordatorio a {selectedIds.length} seleccionados</span>
            </button>
          )}
        </div>

        {loading ? (
          <TableSkeleton rows={5} />
        ) : data.candidates.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="Sin candidatos pendientes"
            description="Todos tus clientes están al día con sus retornos, o no has definido tiempos de posible retorno en el catálogo de servicios."
          />
        ) : (
          <div className="bg-white border border-brand-border rounded-xl shadow-sm overflow-hidden animate-slide-up">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-brand-border bg-brand-cream/10 text-xs font-semibold uppercase tracking-wider text-stone-500">
                    <th className="px-6 py-4 w-12 text-center">
                      <input
                        type="checkbox"
                        className="rounded text-brand-primary focus:ring-brand-primary border-brand-border w-4 h-4 cursor-pointer"
                        checked={selectedIds.length === data.candidates.length}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Servicio</th>
                    <th className="px-6 py-4">Último Servicio</th>
                    <th className="px-6 py-4">Retorno Recomendado</th>
                    <th className="px-6 py-4">Estado Retorno</th>
                    <th className="px-6 py-4 text-center">Último Recordatorio</th>
                    <th className="px-6 py-4 text-right">Enviar Individual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border text-sm">
                  {data.candidates.map((candidate) => {
                    const rowKey = `${candidate.client_id}:${candidate.service_id}`;
                    const isSelected = selectedIds.includes(rowKey);
                    
                    return (
                      <tr key={rowKey} className={`hover:bg-brand-cream/5 transition-colors ${isSelected ? 'bg-brand-light/10' : ''}`}>
                        {/* Checkbox */}
                        <td className="px-6 py-4 text-center">
                          <input
                            type="checkbox"
                            className="rounded text-brand-primary focus:ring-brand-primary border-brand-border w-4 h-4 cursor-pointer"
                            checked={isSelected}
                            onChange={(e) => handleSelectCandidate(candidate.client_id, candidate.service_id, e.target.checked)}
                          />
                        </td>

                        {/* Client details */}
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-brand-dark">{candidate.client_name}</p>
                            <p className="text-xs text-stone-400">
                              {candidate.client_email || 'Sin email'} {candidate.client_phone ? `| ${candidate.client_phone}` : ''}
                            </p>
                          </div>
                        </td>

                        {/* Service badge */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-brand-light text-brand-primary border border-brand-border/40">
                            {candidate.service_name}
                          </span>
                        </td>

                        {/* Last service execution date */}
                        <td className="px-6 py-4 text-stone-600">
                          <div className="flex items-center space-x-1.5">
                            <Calendar className="w-4 h-4 text-stone-400" />
                            <span>{formatDate(candidate.last_service_date)}</span>
                          </div>
                        </td>

                        {/* Recommended retouch date */}
                        <td className="px-6 py-4 text-stone-600 font-medium">
                          {formatDate(candidate.due_date)}
                        </td>

                        {/* Retouch status days */}
                        <td className="px-6 py-4">
                          {candidate.status === 'overdue' ? (
                            <span className="inline-flex items-center space-x-1 text-xs text-red-600 font-semibold bg-red-50 border border-red-100 rounded px-2 py-0.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                              <span>Retorno vencido hace {candidate.days_overdue} d</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-xs text-amber-600 font-semibold bg-amber-50 border border-amber-100 rounded px-2 py-0.5">
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              <span>Retorno en {Math.abs(candidate.days_overdue)} d</span>
                            </span>
                          )}
                        </td>

                        {/* Last reminder sent */}
                        <td className="px-6 py-4 text-center text-xs text-stone-500">
                          {candidate.last_reminder_sent_at ? (
                            <span className="inline-flex items-center space-x-1 font-medium text-emerald-600">
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span>{new Date(candidate.last_reminder_sent_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                            </span>
                          ) : (
                            <span className="text-stone-400 italic">No enviado</span>
                          )}
                        </td>

                        {/* Single Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {/* Mailto link */}
                            {candidate.client_email && (
                              <a
                                href={getMailtoLink(candidate)}
                                className="p-1.5 border border-brand-border text-stone-600 hover:text-brand-primary hover:bg-brand-light rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                                title="Enviar manualmente por Gmail/Mailto"
                              >
                                <Mail className="w-4 h-4" />
                              </a>
                            )}
                            {/* Automated sending simulator */}
                            <button
                              onClick={async () => {
                                setActionLoading(true);
                                setErrorMessage(null);
                                setSuccessMessage(null);
                                try {
                                  await sendReminderEmails(
                                    [{
                                      client_id: candidate.client_id,
                                      service_id: candidate.service_id,
                                      client_name: candidate.client_name,
                                      client_email: candidate.client_email,
                                      service_name: candidate.service_name
                                    }],
                                    subjectTemplate,
                                    bodyTemplate
                                  );
                                  setSuccessMessage(`¡Recordatorio para ${candidate.client_name} registrado en el historial!`);
                                  await loadData();
                                } catch (err: any) {
                                  setErrorMessage(err.message || 'Error al enviar recordatorio.');
                                } finally {
                                  setActionLoading(false);
                                }
                              }}
                              disabled={actionLoading}
                              className="p-1.5 bg-brand-primary hover:bg-[#a58a73] text-white rounded-lg transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
                              title="Registrar envío en historial"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
