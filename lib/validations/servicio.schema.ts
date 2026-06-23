import { z } from 'zod'

export const ServiceSchema = z.object({
  name: z.string().min(1, 'El nombre del servicio es obligatorio'),
  category: z.string().nullish(),
  description: z.string().nullish(),
  base_price: z.number().min(0, 'El precio base debe ser mayor o igual a 0'),
  estimated_minutes: z.number().min(1, 'La duración estimada debe ser mayor a 0'),
  estimated_labor_cost: z.number().min(0, 'El costo de mano de obra estimado debe ser mayor o igual a 0'),
  maintenance_days: z.number().min(0, 'Los días para retoque deben ser mayores o iguales a 0').nullish(),
  is_active: z.boolean(),
})

export type ServiceFormInput = z.infer<typeof ServiceSchema>
