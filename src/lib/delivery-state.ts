import type { DeliverySnapshot, DeliveryStatus, LatestLocation, PortalMessage } from '@/types/portal'

export interface DeliveryState {
  id: string
  tenantId: string
  status: DeliveryStatus
  publicRef: string | null
  pickupAddressLine: string | null
  dropoffAddressLine: string | null
  customerName: string | null
  driverName: string | null
  proofFileId: string | null
  updatedAt: string
  messages: PortalMessage[]
  latestLocation: LatestLocation | null
}

export type PortalEvent =
  | { type: 'status_update'; status: DeliveryStatus; updated_at: string }
  | { type: 'location_update'; latitude: number; longitude: number; accuracy_meters: number | null; recorded_at: string }
  | { type: 'new_message'; message: PortalMessage }
  | { type: 'proof_attached'; proof_file_id: string }

export function snapshotToState(snapshot: DeliverySnapshot): DeliveryState {
  return {
    id: snapshot.id,
    tenantId: snapshot.tenant_id,
    status: snapshot.status,
    publicRef: snapshot.public_ref,
    pickupAddressLine: snapshot.pickup_address_line,
    dropoffAddressLine: snapshot.dropoff_address_line,
    customerName: snapshot.customer_name,
    driverName: snapshot.driver_name,
    proofFileId: snapshot.proof_file_id,
    updatedAt: snapshot.updated_at,
    messages: snapshot.messages,
    latestLocation: snapshot.latest_location,
  }
}

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
