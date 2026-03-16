export type DeliveryPortalAudience = 'customer' | 'driver';

export type DeliveryMessageAudience = 'customer' | 'driver' | 'ops' | 'system';
export type DeliveryMessageSenderType = 'public_session' | 'profile' | 'system';
export type DeliveryLocationSourceType = 'public_session' | 'profile' | 'system';

export type DeliveryStatus =
  | 'assigned'
  | 'en_route_pickup'
  | 'picked_up'
  | 'en_route_dropoff'
  | 'delivered'
  | 'failed_attempt';

export interface PublicDeliverySession {
  sessionId: string;
  tenantId: string;
  deliveryId: string;
  audience: DeliveryPortalAudience;
  expiresAt: string;
  capabilities: string[];
  accessLinkId: string;  // links this session back to its originating access link
}
