export type DeliveryPortalRealtimeEventName =
  | 'delivery.status.updated'
  | 'delivery.location.updated'
  | 'delivery.message.posted'
  | 'delivery.proof.attached'
  | 'delivery.access.revoked';

export interface DeliveryPortalRealtimeEnvelope<TPayload> {
  eventName: DeliveryPortalRealtimeEventName;
  tenantId: string;
  deliveryId: string;
  occurredAt: string;
  payload: TPayload;
}
