import type { DeliveryStatus } from './types';

export const DELIVERY_DRIVER_ALLOWED_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  assigned: ['en_route_pickup'],
  en_route_pickup: ['picked_up'],
  picked_up: ['en_route_dropoff'],
  en_route_dropoff: ['delivered', 'failed_attempt'],
  delivered: [],
  failed_attempt: [],
};

export const DELIVERY_PORTAL_MESSAGE_MAX_LEN = 1000;
