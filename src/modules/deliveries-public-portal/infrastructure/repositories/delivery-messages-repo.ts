import type { SupabaseClient } from '@supabase/supabase-js';
import type { DeliveryMessagesRepo } from '../../application/contracts';

export class SupabaseDeliveryMessagesRepo implements DeliveryMessagesRepo {
  constructor(private readonly supabase: SupabaseClient) {}

  async insertMessage(input: {
    id: string;
    tenantId: string;
    deliveryId: string;
    audience: 'customer' | 'driver';
    senderType: 'public_session';
    senderLabel: string;
    body: string;
    sourceSessionId: string;
  }): Promise<void> {
    const { error } = await this.supabase.rpc('insert_delivery_message_from_public_session', {
      p_id: input.id,
      p_tenant_id: input.tenantId,
      p_delivery_id: input.deliveryId,
      p_audience: input.audience,
      p_sender_label: input.senderLabel,
      p_body: input.body,
      p_source_session_id: input.sourceSessionId,
    });
    if (error) throw error;
  }
}
