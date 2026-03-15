'use client'

import { useCallback, useEffect, useReducer, useRef } from 'react'
import { createPortalClient } from '@/lib/supabase-portal'
import { snapshotToState, applyEvent, type DeliveryState, type PortalEvent } from '@/lib/delivery-state'
import type { DeliverySnapshot, Audience, PortalMessage, DeliveryStatus } from '@/types/portal'
import { NEXT_STATUS } from '@/lib/pipeline-steps'
import PipelineView from './pipeline/PipelineView'
import MapPanel from './map/MapPanel'
import ChatPanel from './chat/ChatPanel'
import DriverActions from './driver/DriverActions'

interface Props {
  portalSessionToken: string
  audience: Audience
  deliveryId: string
  initialSnapshot: DeliverySnapshot
}

const KNOWN_EVENT_TYPES = new Set<string>([
  'status_update',
  'location_update',
  'new_message',
  'proof_attached',
])

export default function DeliveryPortalRoot({
  portalSessionToken,
  audience,
  deliveryId,
  initialSnapshot,
}: Props) {
  const [state, dispatch] = useReducer(
    (s: DeliveryState, e: PortalEvent) => applyEvent(s, e),
    initialSnapshot,
    snapshotToState,
  )

  // Create once, stable ref — token is fixed for the lifetime of the session
  const supabase = useRef(createPortalClient(portalSessionToken)).current

  useEffect(() => {
    const channel = supabase
      .channel(`delivery:${deliveryId}`)
      .on('broadcast', { event: '*' }, ({ event, payload }) => {
        if (!KNOWN_EVENT_TYPES.has(event)) {
          console.warn(`[portal] Unknown broadcast event type: "${event}" — ignored`)
          return
        }
        dispatch({ type: event, ...payload } as PortalEvent)
      })
      .subscribe(async (status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          // v1 recovery: on reconnect we only re-fetch status to patch missed status_update events.
          // Missed location_update events are low-risk (a new ping will arrive shortly).
          // Missed new_message events are a known v1 gap — a future improvement would call
          // a snapshot RPC or re-fetch messages with after_id to recover missed chat messages.
          const { data } = await supabase.rpc('get_delivery_current_status', {
            p_delivery_id: deliveryId,
          })
          if (data) {
            dispatch({ type: 'status_update', status: data.status, updated_at: data.updated_at })
          }
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [deliveryId, supabase])

  // A status is terminal when it has no next state in the machine
  const isTerminal = !(state.status in NEXT_STATUS)

  const handleNewMessage = useCallback(
    (msg: PortalMessage) => dispatch({ type: 'new_message', message: msg }),
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
          {state.publicRef ?? `#${state.id.slice(0, 8)}`}
        </p>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <PipelineView status={state.status} />

        {/* supabase is passed to MapPanel so the driver can publish location via RPC (see Task 9/MapPanel) */}
        {state.latestLocation && (
          <MapPanel
            latestLocation={state.latestLocation}
            dropoffAddressLine={state.dropoffAddressLine}
            audience={audience}
            deliveryId={deliveryId}
            supabase={supabase}
          />
        )}

        <ChatPanel
          messages={state.messages}
          audience={audience}
          deliveryId={deliveryId}
          supabase={supabase}
          onNewMessage={handleNewMessage}
        />

        {audience === 'driver' && !isTerminal && (
          <DriverActions
            status={state.status}
            deliveryId={deliveryId}
            supabase={supabase}
            onStatusUpdate={handleStatusUpdate}
            onProofAttached={handleProofAttached}
          />
        )}
      </div>
    </main>
  )
}
