'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addServiceToAppointment(
  appointmentId: string,
  serviceId: string,
  customPrice?: number
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');

  // 1. Get service details
  const { data: service, error: svcError } = await supabase
    .from('services')
    .select('*')
    .eq('id', serviceId)
    .eq('user_id', user.id)
    .single();

  if (svcError || !service) {
    throw new Error('Servicio no encontrado');
  }

  // 2. Get hourly cost
  const { data: profile } = await supabase
    .from('profiles')
    .select('hourly_cost')
    .eq('id', user.id)
    .single();

  const hourlyCost = Number(profile?.hourly_cost || 0);
  const catalogLaborCost = service.estimated_labor_cost ? Number(service.estimated_labor_cost) : 0;
  const laborCost = catalogLaborCost > 0 ? catalogLaborCost : (service.estimated_minutes / 60) * hourlyCost;

  // 3. Insert service
  const { data, error: insertError } = await supabase
    .from('appointment_services')
    .insert({
      user_id: user.id,
      appointment_id: appointmentId,
      service_id: serviceId,
      service_name: service.name,
      price_charged: customPrice !== undefined ? customPrice : service.base_price,
      minutes_spent: service.estimated_minutes,
      labor_cost: Number(laborCost.toFixed(2)),
      product_cost: 0,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error adding service to appointment:', insertError);
    throw new Error('No se pudo asociar el servicio a la cita');
  }

  // 4. Recalculate totals
  await supabase.rpc('recalculate_appointment_totals', {
    target_id: appointmentId
  });

  revalidatePath('/app/agenda');
  revalidatePath('/app/servicios-prestados');
  return data;
}

export async function updateAppointmentService(
  id: string,
  appointmentId: string,
  minutesSpent: number,
  priceCharged: number,
  notes?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');

  // 1. Get hourly cost
  const { data: profile } = await supabase
    .from('profiles')
    .select('hourly_cost')
    .eq('id', user.id)
    .single();

  const hourlyCost = Number(profile?.hourly_cost || 0);

  // Get the appointment service details to find the service_id
  const { data: appService } = await supabase
    .from('appointment_services')
    .select('service_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  let laborCost = 0;
  if (appService?.service_id) {
    const { data: service } = await supabase
      .from('services')
      .select('estimated_labor_cost')
      .eq('id', appService.service_id)
      .eq('user_id', user.id)
      .single();

    const catalogLaborCost = service?.estimated_labor_cost ? Number(service.estimated_labor_cost) : 0;
    if (catalogLaborCost > 0) {
      laborCost = catalogLaborCost;
    } else {
      laborCost = (minutesSpent / 60) * hourlyCost;
    }
  } else {
    laborCost = (minutesSpent / 60) * hourlyCost;
  }

  // 2. Update service record
  const { data, error } = await supabase
    .from('appointment_services')
    .update({
      minutes_spent: minutesSpent,
      price_charged: priceCharged,
      labor_cost: Number(laborCost.toFixed(2)),
      notes: notes || null,
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating appointment service:', error);
    throw new Error('No se pudo actualizar el servicio de la cita');
  }

  // 3. Recalculate appointment totals
  await supabase.rpc('recalculate_appointment_totals', {
    target_id: appointmentId
  });

  revalidatePath('/app/agenda');
  revalidatePath('/app/servicios-prestados');
  return data;
}

export async function removeServiceFromAppointment(id: string, appointmentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');

  // Before deleting, find all products used by this appointment service so we can RESTORE their stock!
  const { data: productUsages } = await supabase
    .from('service_product_usage')
    .select('id, product_id, quantity_used')
    .eq('appointment_service_id', id)
    .eq('user_id', user.id);

  if (productUsages && productUsages.length > 0) {
    for (const usage of productUsages) {
      await removeProductUsage(usage.id, id, appointmentId);
    }
  }

  // Delete appointment service
  const { error } = await supabase
    .from('appointment_services')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error removing service:', error);
    throw new Error('No se pudo eliminar el servicio de la cita');
  }

  // Recalculate totals
  await supabase.rpc('recalculate_appointment_totals', {
    target_id: appointmentId
  });

  revalidatePath('/app/agenda');
  revalidatePath('/app/servicios-prestados');
  return { success: true };
}

export async function addProductUsage(
  appointmentServiceId: string,
  appointmentId: string,
  productId: string,
  quantityUsed: number,
  bypassStockCheck = false
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');

  if (quantityUsed <= 0) {
    throw new Error('La cantidad debe ser mayor a 0');
  }

  // 1. Get product details
  const { data: product, error: prodError } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('user_id', user.id)
    .single();

  if (prodError || !product) {
    throw new Error('Producto no encontrado');
  }

  const stock = Number(product.current_stock);
  if (!bypassStockCheck && quantityUsed > stock) {
    throw new Error(`Stock insuficiente. Stock actual: ${stock} ${product.unit}.`);
  }

  // 2. Insert into service_product_usage
  const { data: usage, error: insertError } = await supabase
    .from('service_product_usage')
    .insert({
      user_id: user.id,
      appointment_service_id: appointmentServiceId,
      product_id: productId,
      product_name: product.name,
      quantity_used: quantityUsed,
      unit: product.unit,
      unit_cost_at_usage: product.unit_cost,
    })
    .select()
    .single();

  if (insertError || !usage) {
    console.error('Error inserting product usage:', insertError);
    throw new Error('No se pudo registrar el consumo del producto');
  }

  // 3. Deduct stock from products table
  const { error: stockError } = await supabase
    .from('products')
    .update({
      current_stock: stock - quantityUsed,
    })
    .eq('id', productId)
    .eq('user_id', user.id);

  if (stockError) {
    console.error('Error updating stock level:', stockError);
  }

  // 4. Create stock movement record
  const { error: moveError } = await supabase
    .from('stock_movements')
    .insert({
      user_id: user.id,
      product_id: productId,
      movement_type: 'usage',
      quantity: quantityUsed,
      unit_cost: product.unit_cost,
      reference: `Servicio Cita ID: ${appointmentId}`,
      notes: `Consumo en servicio: ${usage.product_name}`,
    });

  if (moveError) {
    console.error('Error creating stock movement:', moveError);
  }

  // 5. Run recalculation of service costs
  await supabase.rpc('recalculate_appointment_service_cost', {
    target_id: appointmentServiceId
  });

  // 6. Run recalculation of appointment totals
  await supabase.rpc('recalculate_appointment_totals', {
    target_id: appointmentId
  });

  revalidatePath('/app/agenda');
  revalidatePath('/app/productos');
  revalidatePath('/app/servicios-prestados');
  revalidatePath('/app/dashboard');
  return usage;
}

export async function removeProductUsage(
  id: string,
  appointmentServiceId: string,
  appointmentId: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');

  // 1. Get usage details before deletion
  const { data: usage, error: fetchError } = await supabase
    .from('service_product_usage')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !usage) {
    throw new Error('Consumo de producto no encontrado');
  }

  // 2. Delete usage record
  const { error: deleteError } = await supabase
    .from('service_product_usage')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (deleteError) {
    console.error('Error deleting product usage:', deleteError);
    throw new Error('No se pudo eliminar el registro de consumo');
  }

  if (usage.product_id) {
    // 3. Restore stock level in products
    const { data: product } = await supabase
      .from('products')
      .select('current_stock')
      .eq('id', usage.product_id)
      .eq('user_id', user.id)
      .single();

    if (product) {
      const current = Number(product.current_stock);
      const qty = Number(usage.quantity_used);

      await supabase
        .from('products')
        .update({
          current_stock: current + qty,
        })
        .eq('id', usage.product_id)
        .eq('user_id', user.id);
        
      // 4. Create stock movement (return) to record audit trail
      await supabase
        .from('stock_movements')
        .insert({
          user_id: user.id,
          product_id: usage.product_id,
          movement_type: 'return',
          quantity: qty,
          unit_cost: usage.unit_cost_at_usage,
          reference: `Servicio Cita ID: ${appointmentId}`,
          notes: `Devolución de consumo de servicio: ${usage.product_name}`,
        });
    }
  }

  // 5. Run recalculation of service costs
  await supabase.rpc('recalculate_appointment_service_cost', {
    target_id: appointmentServiceId
  });

  // 6. Run recalculation of appointment totals
  await supabase.rpc('recalculate_appointment_totals', {
    target_id: appointmentId
  });

  revalidatePath('/app/agenda');
  revalidatePath('/app/productos');
  revalidatePath('/app/servicios-prestados');
  revalidatePath('/app/dashboard');
  return { success: true };
}
