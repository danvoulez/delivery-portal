'use client'

import { useCallback, useEffect, useReducer, useRef } from 'react'
import { createPortalClient } from '@/lib/supabase-portal'
import { applyEvent, type DeliveryState, type PortalEvent } from '@/lib/delivery-state'
import type { Audience, DeliveryMessageView, DeliveryStatus, PublicDeliveryTrackingView, DriverDeliveryJobView } from '@/types/portal'
import { NEXT_STATUS } from '@/lib/pipeline-steps'
import { trackingViewToState, jobViewToState } from '@/lib/portal-mapper'
import PipelineView from './pipeline/PipelineView'
import MapPanel from './map/MapPanel'
import ChatPanel from './chat/ChatPanel'
import DriverActions from './driver/DriverActions'

interface Props {
  portalSessionToken: string
  audience: Audience
  deliveryId: string
  tenantId: string
  initialState: DeliveryState
}

export default function DeliveryPortalRoot({
  portalSessionToken,
  audience,
  deliveryId,
  tenantId,
  initialState,
}: Props) {
  const [state, dispatch] = useReducer(
    (s: DeliveryState, e: PortalEvent) => applyEvent(s, e),
    initialState,
  )

  // Create once, stable ref — token is fixed for the lifetime of the session
  const supabase = useRef(createPortalClient(portalSessionToken)).current
  const tokenRef  = useRef(portalSessionToken)
  const audRef    = useRef(audience)

  useEffect(() => {
    // Channel must match the backend's deliveryChannel(tenantId, deliveryId) format
    const channel = supabase
      .channel(`delivery:${tenantId}:${deliveryId}`)
      .on('broadcast', { event: '*' }, ({ event, payload }) => {
        // Map backend event names + envelope shape → frontend PortalEvent
        // Envelope: { eventName, tenantId, deliveryId, occurredAt, payload: {...} }
        const env = payload as { occurredAt: string; payload: Record<string, unknown> }
        switch (event) {
          case 'delivery.status.updated':
            dispatch({ type: 'status_update', status: env.payload.currentStatus as DeliveryStatus, updated_at: env.occurredAt })
            break
          case 'delivery.location.updated':
            dispatch({ type: 'location_update', latitude: env.payload.latitude as number, longitude: env.payload.longitude as number, accuracy_meters: env.payload.accuracyMeters as number | null, recorded_at: env.payload.recordedAt as string })
            break
          case 'delivery.message.posted':
            dispatch({ type: 'new_message', message: { id: env.payload.messageId as string, audience: env.payload.audience as DeliveryMessageView['audience'], senderLabel: env.payload.senderLabel as string, body: env.payload.body as string, createdAt: env.payload.createdAt as string } })
            break
          case 'delivery.proof.attached':
            dispatch({ type: 'proof_attached', proof_file_id: env.payload.proofFileId as string })
            break
          default:
            console.warn(`[portal] Unknown broadcast event: "${event}" — ignored`)
        }
      })
      .subscribe(async (status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          // On reconnect: re-fetch the view via REST (same-origin) to recover missed status events.
          // Missed location pings are low-risk (next ping arrives shortly).
          // Missed messages are a known v1 gap.
          try {
            const endpoint = audRef.current === 'driver'
              ? '/api/external/delivery/job'
              : '/api/external/delivery/tracking'
            const res = await fetch(endpoint, {
              headers: { Authorization: `Bearer ${tokenRef.current}` },
              cache: 'no-store',
            })
            if (res.ok) {
              const view = await res.json()
              const s = audRef.current === 'driver'
                ? jobViewToState(view as DriverDeliveryJobView)
                : trackingViewToState(view as PublicDeliveryTrackingView)
              dispatch({ type: 'status_update', status: s.status, updated_at: s.updatedAt ?? new Date().toISOString() })
            }
          } catch (err) {
            console.error('[portal] reconnect fetch failed', err)
          }
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [deliveryId, tenantId, supabase])

  // A status is terminal when it has no next state in the machine
  const isTerminal = !(state.status in NEXT_STATUS)

  const handleNewMessage = useCallback(
    (msg: DeliveryMessageView) => dispatch({ type: 'new_message', message: msg }),
    [],  // dispatch is stable
  )

  const handleStatusUpdate = useCallback(
    (status: DeliveryStatus, updated_at: string) =>
      dispatch({ type: 'status_update', status, updated_at }),
    [],
  )

  const handleProofAttached = useCallback(
    (proof_file_id: string) => dispatch({ type: 'proof_attached', proof_file_id }),
    [],
  )

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <p className="text-xs text-gray-400 uppercase tracking-wide">Acompanhamento</p>
        <p className="text-sm font-semibold text-gray-800">
          #{deliveryId.slice(0, 8)}
        </p>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <PipelineView status={state.status} />

        {state.latestLocation && (
          <MapPanel
            latestLocation={state.latestLocation}
            dropoffAddressLine={null} // TODO: wire dropoffSummary from DriverDeliveryJobView when MapPanel uses it
            audience={audience}
            deliveryId={deliveryId}
            portalSessionToken={portalSessionToken}
          />
        )}

        <ChatPanel
          messages={state.messages}
          audience={audience}
          deliveryId={deliveryId}
          portalSessionToken={portalSessionToken}
          onNewMessage={handleNewMessage}
          isTerminal={isTerminal}
        />

        {audience === 'driver' && !isTerminal && (
          <DriverActions
            status={state.status}
            deliveryId={deliveryId}
            portalSessionToken={portalSessionToken}
            onStatusUpdate={handleStatusUpdate}
            onProofAttached={handleProofAttached}
            supabase={supabase}
          />
        )}
      </div>
    </main>
  )
}
