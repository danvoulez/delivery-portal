import { z } from 'zod'

export const ResolveSessionSchema = z.object({
  token: z.string().min(1),
})

export const PostMessageSchema = z.object({
  body: z.string().min(1).max(1000),
})

export const PostLocationSchema = z.object({
  latitude:       z.number().min(-90).max(90),
  longitude:      z.number().min(-180).max(180),
  accuracyMeters: z.number().positive().nullable().optional(),
  recordedAt:     z.string().datetime({ offset: true }).optional(),
})

export const PostStatusSchema = z.object({
  nextStatus: z.enum([
    'assigned', 'en_route_pickup', 'picked_up',
    'en_route_dropoff', 'delivered', 'failed_attempt',
  ]),
  proofFileId: z.string().uuid().nullable().optional(),
})

export const AttachProofSchema = z.object({
  proofFileId: z.string().uuid(),
})

export type ResolveSessionInput = z.infer<typeof ResolveSessionSchema>
export type PostMessageInput    = z.infer<typeof PostMessageSchema>
export type PostLocationInput   = z.infer<typeof PostLocationSchema>
export type PostStatusInput     = z.infer<typeof PostStatusSchema>
export type AttachProofInput    = z.infer<typeof AttachProofSchema>
