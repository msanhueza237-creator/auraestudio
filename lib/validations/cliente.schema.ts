import { z } from 'zod'

export const ClientSchema = z.object({
  full_name: z.string().min(1, 'El nombre es obligatorio'),
  phone: z.string().nullish(),
  email: z.union([z.string().email('El correo electrónico no es válido'), z.literal('')]).nullish(),
  birth_date: z.string().nullish(),
  notes: z.string().nullish(),
  preferences: z.string().nullish(),
  alerts: z.string().nullish(),
})

export type ClientFormInput = z.infer<typeof ClientSchema>
