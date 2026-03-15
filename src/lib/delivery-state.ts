import type { DeliveryStatus, DeliveryMessageView } from '@/types/portal'

export interface DeliveryState {
  status: DeliveryStatus
  proofFileId: string | null
  updatedAt: string
  messages: DeliveryMessageView[]
  latestLocation: {
    lat: number
    lng: number
    accuracy_meters: number | null
    recorded_at: string
  } | null
}

export type PortalEvent =
  | { type: 'status_update'; status: DeliveryStatus; updated_at: string }
  | { type: 'location_update'; latitude: number; longitude: number; accuracy_meters: number | null; recorded_at: string }
  | { type: 'new_message'; message: DeliveryMessageView }
  | { type: 'proof_attached'; proof_file_id: string }

export function applyEvent(state: DeliveryState, event: PortalEvent): DeliveryState {
  switch (event.type) {
    case 'status_update':
      return { ...state, status: event.status, updatedAt: event.updated_at }
    case 'location_update':
      // updatedAt not advanced — location pings are operational, not status transitions
      return {
        ...state,
        latestLocation: {
          lat: event.latitude,
          lng: event.longitude,
          accuracy_meters: event.accuracy_meters,
          recorded_at: event.recorded_at,
        },
      }
    case 'new_message':
      return { ...state, messages: [...state.messages, event.message] }
    case 'proof_attached':
      // updatedAt not advanced — proof attachment does not change status
      return { ...state, proofFileId: event.proof_file_id }
    default: {
      const _exhaustive: never = event
      throw new Error(`Unhandled PortalEvent type: ${(_exhaustive as any).type}`)
    }
  }
}
