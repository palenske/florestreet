import { z } from 'zod'

const pointType = z.enum(['fruit', 'flower', 'herb'])

export const createPointSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres').max(120),
  description: z.string().max(2000).optional().nullable(),
  type: pointType,
  hasFruit: z.boolean(),
  imageUrl: z.string().optional().nullable(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().max(300).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  recordedAt: z.string().optional(),
})

export const updatePointSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres').max(120).optional(),
  description: z.string().max(2000).optional().nullable(),
  type: pointType.optional(),
  hasFruit: z.boolean().optional(),
  imageUrl: z.string().optional().nullable(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  address: z.string().max(300).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  recordedAt: z.string().optional(),
})

export type CreatePointInput = z.infer<typeof createPointSchema>
export type UpdatePointInput = z.infer<typeof updatePointSchema>
