import { z } from 'zod'

export const AppointmentSchema = z.object({
  client_id: z.string().min(1, 'El cliente es obligatorio'),
  starts_at: z.string().min(1, 'La fecha y hora de inicio son obligatorias'),
  ends_at: z.string().min(1, 'La fecha y hora de fin son obligatorias'),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'no_show']),
  title: z.string().transform(v => v === '' ? null : v).optional().nullable(),
  notes: z.string().transform(v => v === '' ? null : v).optional().nullable(),
})

export type AppointmentFormInput = z.infer<typeof AppointmentSchema>
