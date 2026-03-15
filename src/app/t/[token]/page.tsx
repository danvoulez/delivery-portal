import DeliveryPortalRoot from '@/components/DeliveryPortalRoot'
import type { PortalSession } from '@/types/portal'

interface Props {
  params: { token: string }
}

export default async function DeliveryPortalPage({ params }: Props) {
  const { token } = params

  let session: PortalSession

  try {
    const res = await fetch(
      `${process.env.DELIVERY_BACKEND_URL}/api/external/session/resolve`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
        cache: 'no-store',
      },
    )

    if (!res.ok) return <TokenErrorPage />

    session = (await res.json()) as PortalSession
  } catch {
    return <TokenErrorPage />
  }

  return (
    <DeliveryPortalRoot
      portalSessionToken={session.portalSessionToken}
      audience={session.audience}
      deliveryId={session.deliveryId}
      initialSnapshot={session.snapshot}
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
