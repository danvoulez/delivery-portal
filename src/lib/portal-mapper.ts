import type { PublicDeliveryTrackingView, DriverDeliveryJobView, LatestLocationView } from '@/types/portal'
import type { DeliveryState } from '@/lib/delivery-state'

function mapLocation(loc: LatestLocationView): DeliveryState['latestLocation'] {
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
    updatedAt: view.lastLocationAt ?? new Date(0).toISOString(),
  }
}

export function jobViewToState(view: DriverDeliveryJobView): DeliveryState {
  return {
    status: view.currentStatus,
    latestLocation: null,
    messages: view.messageThreadPreview,
    proofFileId: null,
    updatedAt: new Date(0).toISOString(),
  }
}
