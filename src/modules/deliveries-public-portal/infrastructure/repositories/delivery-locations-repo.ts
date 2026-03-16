import type { SupabaseClient } from '@supabase/supabase-js';
import type { DeliveryLocationsRepo } from '../../application/contracts';

export class SupabaseDeliveryLocationsRepo implements DeliveryLocationsRepo {
  constructor(private readonly supabase: SupabaseClient) {}

  async insertLocation(input: {
    id: string;
    tenantId: string;
    deliveryId: string;
    latitude: number;
    longitude: number;
    accuracyMeters: number | null;
    recordedAt: string;
    sourceType: 'public_session';
    sourceSessionId: string;
  }): Promise<void> {
    const { error } = await this.supabase.rpc('insert_delivery_location_from_public_session', {
      p_id: input.id,
      p_tenant_id: input.tenantId,
      p_delivery_id: input.deliveryId,
      p_latitude: input.latitude,
      p_longitude: input.longitude,
      p_accuracy_meters: input.accuracyMeters,
      p_recorded_at: input.recordedAt,
      p_source_session_id: input.sourceSessionId,
    });
    if (error) throw error;
  }
}
