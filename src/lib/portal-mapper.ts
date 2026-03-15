import type { PublicDeliveryTrackingView, DriverDeliveryJobView, LatestLocationView } from '@/types/portal'
import type { DeliveryState } from '@/lib/delivery-state'

export function mapLocation(loc: LatestLocationView): DeliveryState['latestLocation'] {
  return {
    lat: loc.latitude,
    lng: loc.longitude,
    accuracy_meters: loc.accuracyMeters,
    recorded_at: loc.recordedAt,
  }
}

export function trackingViewToState(view: PublicDeliveryTrackingView): DeliveryState {
  return {
    status: view.status,
    latestLocation: view.latestLocation ? mapLocation(view.latestLocation) : null,
    messages: view.messageThreadPreview,
    proofFileId: null,
    // lastLocationAt is the closest proxy available — backend PublicDeliveryTrackingView
    // does not expose delivery.updated_at directly. Null means "not yet known".
    updatedAt: view.lastLocationAt ?? null,
  }
}

export function jobViewToState(view: DriverDeliveryJobView): DeliveryState {
  return {
    status: view.currentStatus,
    latestLocation: null,
    messages: view.messageThreadPreview,
    proofFileId: null,  // DriverDeliveryJobView carries no proof file ID — set on proof_attached event
    updatedAt: null,
  }
}
