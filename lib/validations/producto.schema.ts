import { z } from 'zod'

export const ProductSchema = z.object({
  name: z.string().min(1, 'El nombre del producto es obligatorio'),
  brand: z.string().nullish(),
  category: z.string().nullish(),
  sku: z.string().nullish(),
  unit: z.string().min(1, 'La unidad de medida es obligatoria'),
  unit_cost: z.number().min(0, 'El costo unitario debe ser mayor o igual a 0'),
  current_stock: z.number().min(0, 'El stock actual debe ser mayor o igual a 0'),
  minimum_stock: z.number().min(0, 'El stock mínimo debe ser mayor o igual a 0'),
  supplier: z.string().nullish(),
  is_active: z.boolean(),
})

export type ProductFormInput = z.infer<typeof ProductSchema>
