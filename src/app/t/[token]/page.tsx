import DeliveryPortalRoot from '@/components/DeliveryPortalRoot'
import type { PortalSessionResolved, PublicDeliveryTrackingView, DriverDeliveryJobView } from '@/types/portal'
import { trackingViewToState, jobViewToState } from '@/lib/portal-mapper'

// Next.js 14: params is synchronous. In Next.js 15, params becomes Promise<...> and must be awaited.
interface Props {
  params: { token: string }
}

export default async function DeliveryPortalPage({ params }: Props) {
  const { token } = params

  // Step 1: resolve session (same-origin — no DELIVERY_BACKEND_URL needed)
  const sessionRes = await fetch(`/api/external/delivery/session/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
    cache: 'no-store',
  })
  if (!sessionRes.ok) return <TokenErrorPage />

  const session = await sessionRes.json() as PortalSessionResolved

  // Step 2: fetch appropriate view
  const viewRes = await fetch(
    `/api/external/delivery/${session.audience === 'driver' ? 'job' : 'tracking'}`,
    { headers: { Authorization: `Bearer ${session.portalSessionToken}` }, cache: 'no-store' },
  )
  if (!viewRes.ok) return <TokenErrorPage />

  const view = await viewRes.json()

  // Step 3: decode deliveryId + tenantId from JWT payload (base64url, no npm needed)
  let deliveryId: string
  let tenantId: string
  try {
    const jwtPayload = JSON.parse(
      Buffer.from(session.portalSessionToken.split('.')[1], 'base64url').toString(),
    )
    // JWT is signed with camelCase claims (session-jwt.ts)
    if (!jwtPayload.deliveryId) throw new Error('missing deliveryId in token')
    if (!jwtPayload.tenantId)   throw new Error('missing tenantId in token')
    deliveryId = jwtPayload.deliveryId
    tenantId   = jwtPayload.tenantId
  } catch {
    return <TokenErrorPage />
  }

  // Step 4: map to initial state
  const initialState = session.audience === 'driver'
    ? jobViewToState(view as DriverDeliveryJobView)
    : trackingViewToState(view as PublicDeliveryTrackingView)

  // Step 5: render
  return (
    <DeliveryPortalRoot
      portalSessionToken={session.portalSessionToken}
      audience={session.audience}
      deliveryId={deliveryId}
      tenantId={tenantId}
      initialState={initialState}
    />
  )
}

function TokenErrorPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-4">📦</div>
        <h1 className="text-xl font-semibold text-gray-800 mb-2">
          Link inválido ou expirado
        </h1>
        <p className="text-gray-500 text-sm">
          Este link de acompanhamento não está mais disponível.
        </p>
      </div>
    </main>
  )
}
