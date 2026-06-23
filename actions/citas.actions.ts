'use server';

import { createClient } from '@/lib/supabase/server';
import { AppointmentSchema, type AppointmentFormInput } from '@/lib/validations/cita.schema';
import { revalidatePath } from 'next/cache';

export async function getAppointments(filters?: {
  client_id?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');

  let query = supabase
    .from('appointments')
    .select(`
      *,
      clients (
        id,
        full_name,
        phone
      ),
      appointment_services (
        id,
        service_id,
        service_name,
        price_charged,
        minutes_spent,
        labor_cost,
        product_cost,
        total_cost,
        notes,
        service_product_usage (
          id,
          product_id,
          product_name,
          quantity_used,
          unit,
          unit_cost_at_usage,
          total_cost
        )
      )
    `)
    .eq('user_id', user.id)
    .order('starts_at', { ascending: true });

  if (filters?.client_id) {
    query = query.eq('client_id', filters.client_id);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.start_date) {
    query = query.gte('starts_at', filters.start_date);
  }
  if (filters?.end_date) {
    query = query.lte('starts_at', filters.end_date);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching appointments:', error);
    throw new Error('No se pudieron obtener las citas');
  }

  return data;
}

export async function createAppointment(
  input: AppointmentFormInput & {
    selectedServices: { service_id: string; price_charged?: number }[];
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');

  const parsed = AppointmentSchema.safeParse(input);
  if (!parsed.success) {
    console.error('Validation error:', parsed.error);
    throw new Error('Datos de entrada no válidos');
  }

  // 1. Fetch user hourly cost from profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('hourly_cost')
    .eq('id', user.id)
    .single();

  const hourlyCost = Number(profile?.hourly_cost || 0);

  // 2. Insert appointment record
  const { data: appointment, error: appError } = await supabase
    .from('appointments')
    .insert({
      user_id: user.id,
      client_id: parsed.data.client_id,
      starts_at: parsed.data.starts_at,
      ends_at: parsed.data.ends_at,
      status: parsed.data.status || 'scheduled',
      title: parsed.data.title || null,
      notes: parsed.data.notes || null,
      total_price: 0,
      total_cost: 0,
    })
    .select()
    .single();

  if (appError || !appointment) {
    console.error('Error creating appointment:', appError);
    throw new Error(appError?.message || 'No se pudo crear la cita');
  }

  // 3. For each selected service, insert into appointment_services
  if (input.selectedServices && input.selectedServices.length > 0) {
    const serviceIds = input.selectedServices.map(s => s.service_id);
    
    const { data: originalServices } = await supabase
      .from('services')
      .select('*')
      .in('id', serviceIds);

    if (originalServices && originalServices.length > 0) {
      const servicesToInsert = input.selectedServices.map(sel => {
        const orig = originalServices.find(o => o.id === sel.service_id);
        const minutes = orig?.estimated_minutes || 30;
        const price = sel.price_charged !== undefined ? sel.price_charged : (orig?.base_price || 0);
        
        const catalogLaborCost = orig?.estimated_labor_cost ? Number(orig.estimated_labor_cost) : 0;
        const laborCost = catalogLaborCost > 0 ? catalogLaborCost : (minutes / 60) * hourlyCost;

        return {
          user_id: user.id,
          appointment_id: appointment.id,
          service_id: sel.service_id,
          service_name: orig?.name || 'Servicio',
          price_charged: price,
          minutes_spent: minutes,
          labor_cost: Number(laborCost.toFixed(2)),
          product_cost: 0,
          notes: '',
        };
      });

      const { error: servicesError } = await supabase
        .from('appointment_services')
        .insert(servicesToInsert);

      if (servicesError) {
        console.error('Error inserting appointment services:', servicesError);
      }
    }
  }

  // 4. Run recalculate totals function via RPC
  const { error: rpcError } = await supabase.rpc('recalculate_appointment_totals', {
    target_id: appointment.id
  });

  if (rpcError) {
    console.error('Error calling recalculate_appointment_totals RPC:', rpcError);
  }

  revalidatePath('/app/agenda');
  revalidatePath('/app/dashboard');
  return appointment;
}

export async function updateAppointment(
  id: string,
  input: AppointmentFormInput
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');

  const parsed = AppointmentSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error('Datos de entrada no válidos');
  }

  const { data, error } = await supabase
    .from('appointments')
    .update({
      client_id: parsed.data.client_id,
      starts_at: parsed.data.starts_at,
      ends_at: parsed.data.ends_at,
      status: parsed.data.status,
      title: parsed.data.title,
      notes: parsed.data.notes,
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating appointment:', error);
    throw new Error(error.message || 'No se pudo actualizar la cita');
  }

  // Re-run totals in case dates/status changed
  await supabase.rpc('recalculate_appointment_totals', {
    target_id: id
  });

  revalidatePath('/app/agenda');
  revalidatePath('/app/dashboard');
  revalidatePath(`/app/servicios-prestados`);
  return data;
}

export async function updateAppointmentStatus(
  id: string,
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');

  const { data, error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating status:', error);
    throw new Error('No se pudo cambiar el estado de la cita');
  }

  revalidatePath('/app/agenda');
  revalidatePath('/app/dashboard');
  revalidatePath(`/app/servicios-prestados`);
  return data;
}

export async function deleteAppointment(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');

  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting appointment:', error);
    throw new Error(error.message || 'No se pudo eliminar la cita');
  }

  revalidatePath('/app/agenda');
  revalidatePath('/app/dashboard');
  return { success: true };
}
