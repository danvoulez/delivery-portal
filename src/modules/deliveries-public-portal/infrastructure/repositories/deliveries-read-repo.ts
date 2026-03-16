import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  DriverDeliveryJobView,
  PublicDeliveryTrackingView,
} from '../../application/contracts';
import type { DeliveriesReadRepo } from '../../application/service';

export class SupabaseDeliveriesReadRepo implements DeliveriesReadRepo {
  constructor(private readonly supabase: SupabaseClient) {}

  async getDeliveryPublicRef(deliveryId: string): Promise<string> {
    return deliveryId;
  }

  async getCurrentStatus(deliveryId: string): Promise<any> {
    throw new Error('Use getCurrentStatusForTenant instead');
  }

  async getCurrentStatusForTenant(tenantId: string, deliveryId: string): Promise<string> {
    const { data, error } = await this.supabase.rpc('get_delivery_current_status', {
      p_tenant_id: tenantId,
      p_delivery_id: deliveryId,
    });
    if (error) throw error;
    return data as string;
  }

  async getTrackingView(deliveryId: string): Promise<PublicDeliveryTrackingView> {
    throw new Error('Use getTrackingViewForTenant instead');
  }

  async getTrackingViewForTenant(
    tenantId: string,
    deliveryId: string
  ): Promise<PublicDeliveryTrackingView> {
    const { data, error } = await this.supabase.rpc('get_public_delivery_tracking_view', {
      p_tenant_id: tenantId,
      p_delivery_id: deliveryId,
    });
    if (error) throw error;
    return data as PublicDeliveryTrackingView;
  }

  async getDriverJobView(deliveryId: string): Promise<DriverDeliveryJobView> {
    throw new Error('Use getDriverJobViewForTenant instead');
  }

  async getDriverJobViewForTenant(
    tenantId: string,
    deliveryId: string
  ): Promise<DriverDeliveryJobView> {
    const { data, error } = await this.supabase.rpc('get_driver_delivery_job_view', {
      p_tenant_id: tenantId,
      p_delivery_id: deliveryId,
    });
    if (error) throw error;
    return data as DriverDeliveryJobView;
  }

  async listMessagesForTenant(
    tenantId: string,
    deliveryId: string,
    limit = 100
  ): Promise<any[]> {
    const { data, error } = await this.supabase.rpc('list_delivery_messages_for_portal', {
      p_tenant_id: tenantId,
      p_delivery_id: deliveryId,
      p_limit: limit,
    });
    if (error) throw error;
    return (data ?? []) as any[];
  }
}
