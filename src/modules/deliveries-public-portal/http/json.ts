import type { ZodSchema } from 'zod'
import { PortalValidationError } from '../domain/errors'

export async function readJson<T>(req: Request): Promise<T> {
  return req.json() as Promise<T>
}

export async function readValidatedJson<T>(
  req: Request,
  schema: ZodSchema<T>
): Promise<T> {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    throw new PortalValidationError('invalid_json')
  }
  const result = schema.safeParse(raw)
  if (!result.success) {
    const first = result.error.issues[0]
    throw new PortalValidationError(`invalid_request: ${first.path.join('.')}: ${first.message}`)
  }
  return result.data
}

export function noContent(): Response {
  return new Response(null, { status: 204 })
}
