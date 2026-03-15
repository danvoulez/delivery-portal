import type { DeliveryState } from '@/lib/delivery-state'

export type DeliveryStatus =
  | 'assigned'
  | 'en_route_pickup'
  | 'picked_up'
  | 'en_route_dropoff'
  | 'delivered'
  | 'failed_attempt'

export type Audience = 'customer' | 'driver'

// ─── Backend DTO types (verbatim from contracts.ts) ──────────────────────────

export interface LatestLocationView {
  latitude: number
  longitude: number
  accuracyMeters: number | null
  recordedAt: string
}

export interface DeliveryMessageView {
  id: string
  senderLabel: string
  body: string
  createdAt: string
  audience: 'customer' | 'driver' | 'ops' | 'system'
}

export interface DeliveryTimelineItem {
  type: string
  label: string
  at: string
}

export interface PublicDeliveryTrackingView {
  deliveryPublicRef: string
  status: DeliveryStatus
  statusLabel: string
  timeline: DeliveryTimelineItem[]
  etaSimple: string | null
  destinationSummary: string
  latestLocation: LatestLocationView | null
  lastLocationAt: string | null
  proofSummary: { available: boolean; label?: string } | null
  messageThreadPreview: DeliveryMessageView[]
}

export interface DriverDeliveryJobView {
  deliveryPublicRef: string
  pickupSummary: string
  dropoffSummary: string
  instructions: string | null
  currentStatus: DeliveryStatus
  allowedNextStatuses: DeliveryStatus[]
  proofRequirements: { requiredForStatuses: DeliveryStatus[] }
  messageThreadPreview: DeliveryMessageView[]
  navigationDeepLink: string | null
}

// ─── Session resolve response ─────────────────────────────────────────────────

export interface PortalSessionResolved {
  sessionId: string
  audience: Audience
  deliveryPublicRef: string
  expiresAt: string
  capabilities: string[]
  portalSessionToken: string
}

// ─── Props passed from page.tsx to DeliveryPortalRoot ────────────────────────
// Used as documentation of the DeliveryPortalRoot prop contract; not imported directly

export interface PortalProps {
  portalSessionToken: string
  audience: Audience
  deliveryId: string          // decoded from JWT
  initialState: DeliveryState // already mapped — imported from lib/delivery-state
}
