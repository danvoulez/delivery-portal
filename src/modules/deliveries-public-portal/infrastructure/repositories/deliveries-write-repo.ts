import type { SupabaseClient } from '@supabase/supabase-js';
import type { DeliveriesWriteRepo } from '../../application/service';

export class SupabaseDeliveriesWriteRepo implements DeliveriesWriteRepo {
  constructor(private readonly supabase: SupabaseClient) {}

  async updateStatus(input: {
    deliveryId: string;
    tenantId: string;
    nextStatus: string;
    proofFileId?: string | null;
    sourceSessionId: string;
  }): Promise<void> {
    const { error } = await this.supabase.rpc('update_delivery_status_from_public_session', {
      p_tenant_id: input.tenantId,
      p_delivery_id: input.deliveryId,
      p_next_status: input.nextStatus,
      p_proof_file_id: input.proofFileId ?? null,
      p_source_session_id: input.sourceSessionId,
    });
    if (error) throw error;
  }

  async attachProof(input: {
    deliveryId: string;
    tenantId: string;
    proofFileId: string;
    sourceSessionId: string;
  }): Promise<void> {
    const { error } = await this.supabase.rpc('attach_delivery_proof_from_public_session', {
      p_tenant_id: input.tenantId,
      p_delivery_id: input.deliveryId,
      p_proof_file_id: input.proofFileId,
      p_source_session_id: input.sourceSessionId,
    });
    if (error) throw error;
  }
}
