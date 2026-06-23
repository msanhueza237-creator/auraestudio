'use server';

import { createClient as getSupabaseClient } from '@/lib/supabase/server';
import { ClientSchema, type ClientFormInput } from '@/lib/validations/cliente.schema';
import { revalidatePath } from 'next/cache';

export async function getClients(search?: string) {
  const supabase = await getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');

  let data;
  let error;

  try {
    let query = supabase
      .from('clients')
      .select(`
        *,
        client_preferred_products (
          product_id,
          products (
            id,
            name,
            brand
          )
        )
      `)
      .eq('user_id', user.id)
      .order('full_name', { ascending: true });

    if (search && search.trim() !== '') {
      query = query.ilike('full_name', `%${search.trim()}%`);
    }

    const response = await query;
    data = response.data;
    error = response.error;

    // Handle missing table relationship (PGRST200) fallback
    if (error && (error.code === 'PGRST200' || error.message?.includes('client_preferred_products'))) {
      console.warn('Fallback to basic query due to missing relation in DB:', error.message);
      const fallbackResponse = await fetchBasicClients(supabase, user.id, search);
      data = fallbackResponse.data;
      error = fallbackResponse.error;
    }
  } catch (err) {
    console.warn('Fallback to basic query due to exception:', err);
    const fallbackResponse = await fetchBasicClients(supabase, user.id, search);
    data = fallbackResponse.data;
    error = fallbackResponse.error;
  }

  if (error) {
    console.error('Error fetching clients:', error);
    throw new Error('No se pudieron obtener los clientes');
  }

  return data;
}

async function fetchBasicClients(supabase: any, userId: string, search?: string) {
  let query = supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .order('full_name', { ascending: true });

  if (search && search.trim() !== '') {
    query = query.ilike('full_name', `%${search.trim()}%`);
  }

  return await query;
}

export async function createClient(input: ClientFormInput, preferredProductIds?: string[]) {
  const supabase = await getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');

  const parsed = ClientSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error('Datos de entrada no válidos');
  }

  const { data, error } = await supabase
    .from('clients')
    .insert({
      user_id: user.id,
      ...parsed.data,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating client:', error);
    throw new Error(error.message || 'No se pudo crear el cliente');
  }

  if (preferredProductIds && preferredProductIds.length > 0) {
    const toInsert = preferredProductIds.map(pid => ({
      client_id: data.id,
      product_id: pid
    }));
    const { error: relationError } = await supabase
      .from('client_preferred_products')
      .insert(toInsert);

    if (relationError) {
      console.error('Error creating client preferred products:', relationError);
    }
  }

  revalidatePath('/app/clientes');
  return data;
}

export async function updateClient(id: string, input: ClientFormInput, preferredProductIds?: string[]) {
  const supabase = await getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');

  const parsed = ClientSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error('Datos de entrada no válidos');
  }

  const { data, error } = await supabase
    .from('clients')
    .update(parsed.data)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating client:', error);
    throw new Error(error.message || 'No se pudo actualizar el cliente');
  }

  // Clear existing relationships
  const { error: deleteError } = await supabase
    .from('client_preferred_products')
    .delete()
    .eq('client_id', id);

  if (deleteError) {
    console.error('Error clearing client preferred products:', deleteError);
  }

  // Insert new ones
  if (preferredProductIds && preferredProductIds.length > 0) {
    const toInsert = preferredProductIds.map(pid => ({
      client_id: id,
      product_id: pid
    }));
    const { error: relationError } = await supabase
      .from('client_preferred_products')
      .insert(toInsert);

    if (relationError) {
      console.error('Error updating client preferred products:', relationError);
    }
  }

  revalidatePath('/app/clientes');
  return data;
}

export async function deleteClient(id: string) {
  const supabase = await getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');

  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting client:', error);
    throw new Error(error.message || 'No se pudo eliminar el cliente');
  }

  revalidatePath('/app/clientes');
  return { success: true };
}
