'use server';

import { createClient } from '@/lib/supabase/server';
import { ProductSchema, type ProductFormInput } from '@/lib/validations/producto.schema';
import { revalidatePath } from 'next/cache';

export async function getProducts(search?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');

  let query = supabase
    .from('products')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true });

  if (search && search.trim() !== '') {
    query = query.ilike('name', `%${search.trim()}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching products:', error);
    throw new Error('No se pudieron obtener los productos');
  }

  return data;
}

export async function createProduct(input: ProductFormInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');

  const parsed = ProductSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error('Datos de entrada no válidos');
  }

  const { data, error } = await supabase
    .from('products')
    .insert({
      user_id: user.id,
      ...parsed.data,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating product:', error);
    throw new Error(error.message || 'No se pudo crear el producto');
  }

  revalidatePath('/app/productos');
  return data;
}

export async function updateProduct(id: string, input: ProductFormInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');

  const parsed = ProductSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error('Datos de entrada no válidos');
  }

  const { data, error } = await supabase
    .from('products')
    .update(parsed.data)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating product:', error);
    throw new Error(error.message || 'No se pudo actualizar el producto');
  }

  revalidatePath('/app/productos');
  return data;
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting product:', error);
    throw new Error(error.message || 'No se pudo eliminar el producto');
  }

  revalidatePath('/app/productos');
  return { success: true };
}

export async function createStockMovement(input: {
  product_id: string;
  movement_type: 'purchase' | 'adjustment' | 'return' | 'waste';
  quantity: number;
  direction: 'increase' | 'decrease';
  unit_cost?: number;
  reference?: string;
  notes?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');

  if (input.quantity <= 0) {
    throw new Error('La cantidad debe ser mayor a 0');
  }

  // 1. Fetch current product stock and details
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('current_stock, unit_cost')
    .eq('id', input.product_id)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !product) {
    throw new Error('Producto no encontrado');
  }

  // 2. Compute new stock level
  const qty = Number(input.quantity);
  const current = Number(product.current_stock);
  const newStock = input.direction === 'increase' ? current + qty : current - qty;

  if (newStock < 0) {
    throw new Error('La operación resultaría en stock negativo');
  }

  // 3. Insert stock movement record
  const { error: moveError } = await supabase
    .from('stock_movements')
    .insert({
      user_id: user.id,
      product_id: input.product_id,
      movement_type: input.movement_type,
      quantity: qty,
      unit_cost: input.unit_cost || null,
      reference: input.reference || null,
      notes: input.notes || null,
    });

  if (moveError) {
    console.error('Error inserting stock movement:', moveError);
    throw new Error('No se pudo registrar el movimiento de stock');
  }

  // 4. Update product's current stock and unit_cost (if purchase)
  const updatePayload: Record<string, any> = {
    current_stock: newStock,
  };

  if (input.movement_type === 'purchase' && input.unit_cost !== undefined) {
    updatePayload.unit_cost = input.unit_cost;
  }

  const { error: updateError } = await supabase
    .from('products')
    .update(updatePayload)
    .eq('id', input.product_id)
    .eq('user_id', user.id);

  if (updateError) {
    console.error('Error updating product stock:', updateError);
    throw new Error('No se pudo actualizar el inventario del producto');
  }

  revalidatePath('/app/productos');
  revalidatePath('/app/dashboard');
  return { success: true };
}
