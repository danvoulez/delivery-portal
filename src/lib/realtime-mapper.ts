/**
 * Translates Supabase Realtime broadcast events (backend contract) into
 * PortalEvents (frontend reducer contract).
 *
 * Backend broadcast envelope:
 *   { eventName, tenantId, deliveryId, occurredAt, payload: { ...eventSpecific } }
 *
 * Backend event names (canonical):
 *   delivery.status.updated   payload: { previousStatus, currentStatus, statusLabel, proofFileId }
 *   delivery.location.updated payload: { locationId, latitude, longitude, accuracyMeters, recordedAt }
 *   delivery.message.posted   payload: { messageId, audience, senderLabel, body, createdAt }
 *   delivery.proof.attached   payload: { proofFileId }
 */

import type { DeliveryMessageView, DeliveryStatus } from '@/types/portal'
import type { PortalEvent } from '@/lib/delivery-state'

interface BroadcastEnvelope {
  occurredAt: string
  payload: Record<string, unknown>
}

export function realtimeBroadcastToPortalEvent(
  event: string,
  rawPayload: unknown,
): PortalEvent | null {
  const env = rawPayload as BroadcastEnvelope

  switch (event) {
    case 'delivery.status.updated':
      return {
        type: 'status_update',
        status: env.payload.currentStatus as DeliveryStatus,
        updated_at: env.occurredAt,
      }

    case 'delivery.location.updated':
      return {
        type: 'location_update',
        latitude:        env.payload.latitude        as number,
        longitude:       env.payload.longitude       as number,
        accuracy_meters: env.payload.accuracyMeters  as number | null,
        recorded_at:     env.payload.recordedAt      as string,
      }

    case 'delivery.message.posted':
      return {
        type: 'new_message',
        message: {
          id:          env.payload.messageId   as string,
          audience:    env.payload.audience    as DeliveryMessageView['audience'],
          senderLabel: env.payload.senderLabel as string,
          body:        env.payload.body        as string,
          createdAt:   env.payload.createdAt   as string,
        },
      }

    case 'delivery.proof.attached':
      return {
        type: 'proof_attached',
        proof_file_id: env.payload.proofFileId as string,
      }

    default:
      console.warn(`[portal] Unknown broadcast event: "${event}" — ignored`)
      return null
  }
}
