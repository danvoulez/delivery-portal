export type DeliveryStatus =
  | 'assigned'
  | 'en_route_pickup'
  | 'picked_up'
  | 'en_route_dropoff'
  | 'delivered'
  | 'failed_attempt'

export type Audience = 'customer' | 'driver'

export interface PortalMessage {
  id: string
  delivery_id: string
  body: string
  sender_audience: Audience
  created_at: string
}

export interface LatestLocation {
  lat: number
  lng: number
  accuracy_meters: number | null
  recorded_at: string
}

export interface DeliverySnapshot {
  id: string
  tenant_id: string
  status: DeliveryStatus
  public_ref: string | null
  pickup_address_line: string | null
  dropoff_address_line: string | null
  customer_name: string | null
  driver_name: string | null
  proof_file_id: string | null
  created_at: string
  updated_at: string
  messages: PortalMessage[]
  latest_location: LatestLocation | null
}

export interface PortalSession {
  portalSessionToken: string
  audience: Audience
  deliveryId: string
  snapshot: DeliverySnapshot
}
