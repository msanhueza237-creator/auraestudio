'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ServiceSchema, type ServiceFormInput } from '@/lib/validations/servicio.schema';

function isMissingMaintenanceDaysColumn(error: { message?: string; code?: string } | null) {
  const message = error?.message?.toLowerCase() ?? '';

  return (
    message.includes('maintenance_days') &&
    (message.includes('schema cache') ||
      message.includes('column') ||
      message.includes('could not find'))
  );
}

function withoutMaintenanceDays(input: ServiceFormInput) {
  const rest = { ...input };
  delete rest.maintenance_days;
  return rest;
}

export async function getServices(search?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');

  let query = supabase
    .from('services')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true });

  if (search && search.trim() !== '') {
    query = query.ilike('name', `%${search.trim()}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching services:', error);
    throw new Error('No se pudieron obtener los servicios');
  }

  return data;
}

export async function createService(input: ServiceFormInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'No autorizado' };
  }

  const parsed = ServiceSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: 'Datos de entrada no validos' };
  }

  let response = await supabase
    .from('services')
    .insert({
      user_id: user.id,
      ...parsed.data,
    })
    .select()
    .single();

  if (isMissingMaintenanceDaysColumn(response.error)) {
    console.warn('services.maintenance_days is missing in database. Retrying create without it.');
    response = await supabase
      .from('services')
      .insert({
        user_id: user.id,
        ...withoutMaintenanceDays(parsed.data),
      })
      .select()
      .single();
  }

  const { data, error } = response;

  if (error) {
    console.error('Error creating service:', error);
    return { success: false, error: error.message || 'No se pudo crear el servicio' };
  }

  revalidatePath('/app/servicios');
  return { success: true, data };
}

export async function updateService(id: string, input: ServiceFormInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'No autorizado' };
  }

  const parsed = ServiceSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: 'Datos de entrada no validos' };
  }

  let response = await supabase
    .from('services')
    .update(parsed.data)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (isMissingMaintenanceDaysColumn(response.error)) {
    console.warn('services.maintenance_days is missing in database. Retrying update without it.');
    response = await supabase
      .from('services')
      .update(withoutMaintenanceDays(parsed.data))
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
  }

  const { data, error } = response;

  if (error) {
    console.error('Error updating service:', error);
    return { success: false, error: error.message || 'No se pudo actualizar el servicio' };
  }

  revalidatePath('/app/servicios');
  return { success: true, data };
}

export async function deleteService(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');

  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting service:', error);
    throw new Error(error.message || 'No se pudo eliminar el servicio');
  }

  revalidatePath('/app/servicios');
  return { success: true };
}
