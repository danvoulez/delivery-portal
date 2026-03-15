'use client'

import type { DeliverySnapshot, Audience } from '@/types/portal'

interface Props {
  portalSessionToken: string
  audience: Audience
  deliveryId: string
  initialSnapshot: DeliverySnapshot
}

export default function DeliveryPortalRoot({ initialSnapshot }: Props) {
  return <div>Loading... {initialSnapshot.id}</div>
}
