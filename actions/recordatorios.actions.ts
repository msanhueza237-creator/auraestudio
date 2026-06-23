'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface RetouchCandidate {
  client_id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  service_id: string;
  service_name: string;
  last_service_date: string;
  due_date: string;
  days_overdue: number; // Positive if overdue, negative if due soon
  status: 'overdue' | 'due_soon';
  last_reminder_sent_at: string | null;
}

export async function getRemindersData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');

  // 1. Fetch active services (all of them, then filter in JS to be crash-proof)
  const { data: services, error: svcError } = await supabase
    .from('services')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (svcError || !services) {
    console.error('Error fetching services for reminders:', svcError);
    return { candidates: [], stats: { overdue: 0, dueSoon: 0, sentThisMonth: 0 } };
  }

  const activeRetouchServices = services.filter(
    (s) => s.maintenance_days && Number(s.maintenance_days) > 0
  );

  if (activeRetouchServices.length === 0) {
    return { candidates: [], stats: { overdue: 0, dueSoon: 0, sentThisMonth: 0 } };
  }

  // 2. Fetch clients
  const { data: clients, error: clientError } = await supabase
    .from('clients')
    .select('id, full_name, email, phone')
    .eq('user_id', user.id);

  if (clientError || !clients) {
    console.error('Error fetching clients for reminders:', clientError);
    return { candidates: [], stats: { overdue: 0, dueSoon: 0, sentThisMonth: 0 } };
  }

  // 3. Fetch appointments (completed and scheduled)
  const { data: appointments, error: appError } = await supabase
    .from('appointments')
    .select(`
      id,
      client_id,
      starts_at,
      status,
      appointment_services (
        id,
        service_id,
        service_name
      )
    `)
    .eq('user_id', user.id)
    .in('status', ['completed', 'scheduled'])
    .order('starts_at', { ascending: false });

  if (appError || !appointments) {
    console.error('Error fetching appointments for reminders:', appError);
    return { candidates: [], stats: { overdue: 0, dueSoon: 0, sentThisMonth: 0 } };
  }

  // 4. Fetch reminder history with try-catch fallback in case migration isn't run yet
  let history: any[] = [];
  try {
    const { data: histData, error: histError } = await supabase
      .from('reminders_history')
      .select('*')
      .eq('user_id', user.id)
      .order('sent_at', { ascending: false });
      
    if (!histError && histData) {
      history = histData;
    }
  } catch (err) {
    console.warn('reminders_history table might not exist yet:', err);
  }

  const candidates: RetouchCandidate[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 5. Match retouch candidates
  for (const client of clients) {
    const clientApps = appointments.filter((a) => a.client_id === client.id);
    const completedApps = clientApps.filter((a) => a.status === 'completed');
    const scheduledApps = clientApps.filter((a) => a.status === 'scheduled');

    for (const service of activeRetouchServices) {
      // Find latest completed appointment containing this service
      const lastApp = completedApps.find((app) =>
        app.appointment_services?.some((as: any) => as.service_id === service.id)
      );

      if (lastApp) {
        const lastServiceDate = new Date(lastApp.starts_at);
        
        // Calculate retouch due date
        const dueDate = new Date(lastServiceDate.getTime());
        dueDate.setDate(dueDate.getDate() + Number(service.maintenance_days));
        dueDate.setHours(0, 0, 0, 0);

        // Check if there is a future scheduled appointment for this service
        const hasFutureApp = scheduledApps.some(
          (app) =>
            new Date(app.starts_at) > lastServiceDate &&
            app.appointment_services?.some((as: any) => as.service_id === service.id)
        );

        if (!hasFutureApp) {
          const timeDiff = today.getTime() - dueDate.getTime();
          const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

          // Candidates are overdue (daysDiff >= 0) or due soon (within the next 7 days: daysDiff >= -7)
          if (daysDiff >= -7) {
            const lastReminder = history.find(
              (h) => h.client_id === client.id && h.service_id === service.id
            );

            candidates.push({
              client_id: client.id,
              client_name: client.full_name,
              client_email: client.email || '',
              client_phone: client.phone || '',
              service_id: service.id,
              service_name: service.name,
              last_service_date: lastApp.starts_at,
              due_date: dueDate.toISOString(),
              days_overdue: daysDiff,
              status: daysDiff >= 0 ? 'overdue' : 'due_soon',
              last_reminder_sent_at: lastReminder ? lastReminder.sent_at : null,
            });
          }
        }
      }
    }
  }

  // Calculate statistics
  const overdueCount = candidates.filter((c) => c.status === 'overdue').length;
  const dueSoonCount = candidates.filter((c) => c.status === 'due_soon').length;

  // Calculate reminders sent this month (past 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sentThisMonth = history.filter(
    (h) => new Date(h.sent_at) >= thirtyDaysAgo && h.status === 'sent'
  ).length;

  return {
    candidates: candidates.sort((a, b) => b.days_overdue - a.days_overdue),
    stats: {
      overdue: overdueCount,
      dueSoon: dueSoonCount,
      sentThisMonth,
    },
  };
}

export async function sendReminderEmails(
  candidates: { client_id: string; service_id: string; client_name: string; client_email: string; service_name: string }[],
  subject: string,
  bodyTemplate: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');

  const results = [];

  for (const candidate of candidates) {
    const customizedBody = bodyTemplate
      .replace(/{{CLIENT_NAME}}/g, candidate.client_name)
      .replace(/{{SERVICE_NAME}}/g, candidate.service_name);

    try {
      // Here, you could integrate Nodemailer or Resend (e.g. if process.env.RESEND_API_KEY is configured)
      // For now, we simulate the sending successfully and log it in Supabase
      console.log(`Sending email to ${candidate.client_email} with subject: "${subject}" and body: "${customizedBody}"`);
      
      const { data, error } = await supabase
        .from('reminders_history')
        .insert({
          user_id: user.id,
          client_id: candidate.client_id,
          service_id: candidate.service_id,
          channel: 'email',
          status: 'sent',
          notes: `Asunto: ${subject}\n\nCuerpo: ${customizedBody}`,
        })
        .select()
        .single();

      if (error) throw error;

      results.push({ client_id: candidate.client_id, success: true, log: data });
    } catch (err: any) {
      console.error(`Failed to record reminder for ${candidate.client_name}:`, err);
      results.push({ client_id: candidate.client_id, success: false, error: err.message });
    }
  }

  revalidatePath('/app/recordatorios');
  return { results, successCount: results.filter((r) => r.success).length };
}
