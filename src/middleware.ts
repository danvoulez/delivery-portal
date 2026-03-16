import { NextRequest, NextResponse } from 'next/server'
import { getResolveRateLimit, getWriteRateLimit, buildRateLimitKey, RESOLVE_PATH } from '@/lib/rate-limit'

const PORTAL_WRITE_PATHS = new Set([
  '/api/external/delivery/session/resolve',
  '/api/external/delivery/messages',
  '/api/external/delivery/location',
  '/api/external/delivery/status',
  '/api/external/delivery/proof',
])

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (!PORTAL_WRITE_PATHS.has(pathname)) return NextResponse.next()

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
  // Extract last 16 chars of Bearer token as session shard key (not the full token — avoids logging secrets)
  const auth = req.headers.get('authorization') ?? ''
  const rawToken = auth.startsWith('Bearer ') ? auth.slice(7) : undefined
  const sessionShard = rawToken ? rawToken.slice(-16) : undefined

  const key = buildRateLimitKey(pathname, ip, sessionShard)
  const limiter = pathname === RESOLVE_PATH ? getResolveRateLimit() : getWriteRateLimit()

  const { success, remaining, reset } = await limiter.limit(key)

  if (!success) {
    return NextResponse.json(
      { error: 'rate_limit_exceeded' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }

  const res = NextResponse.next()
  res.headers.set('X-RateLimit-Remaining', String(remaining))
  return res
}

export const config = {
  matcher: ['/api/external/delivery/:path*'],
}
