import DeliveryPortalRoot from '@/components/DeliveryPortalRoot'
import { createDeliveriesPublicPortalFacade } from '@/modules/deliveries-public-portal/bootstrap/create-deliveries-public-portal-facade'
import { trackingViewToState, jobViewToState } from '@/lib/portal-mapper'

// Next.js 14: params is synchronous. In Next.js 15, params becomes Promise<...> and must be awaited.
interface Props {
  params: { token: string }
}

export default async function DeliveryPortalPage({ params }: Props) {
  const { token } = params

  try {
    const { facade } = createDeliveriesPublicPortalFacade()

    // Step 1: resolve session — validates token, returns session + signed JWT
    const { session, portalSessionToken } = await facade.resolvePortalSession({ token })

    // Step 2: fetch appropriate view and map to initial state
    const initialState = session.audience === 'driver'
      ? jobViewToState(await facade.getDriverJobViewForSession(session))
      : trackingViewToState(await facade.getTrackingViewForSession(session))

    return (
      <DeliveryPortalRoot
        portalSessionToken={portalSessionToken}
        audience={session.audience}
        deliveryId={session.deliveryId}
        tenantId={session.tenantId}
        initialState={initialState}
      />
    )
  } catch {
    return <TokenErrorPage />
  }
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
