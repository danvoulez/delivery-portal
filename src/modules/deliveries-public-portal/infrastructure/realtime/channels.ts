export function deliveryChannel(tenantId: string, deliveryId: string): string {
  return `delivery:${tenantId}:${deliveryId}`;
}

export function deliveriesTenantChannel(tenantId: string): string {
  return `deliveries:${tenantId}`;
}
