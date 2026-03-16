import type { SupabaseClient } from '@supabase/supabase-js';
import type { DeliveryPortalAudience } from '../../domain/types';
import type { DeliveryAccessLinksRepo } from '../../application/service';

export class SupabaseAccessLinksRepo implements DeliveryAccessLinksRepo {
  constructor(private readonly supabase: SupabaseClient) {}

  async insertAccessLink(input: {
    id: string;
    tenantId: string;
    deliveryId: string;
    audience: DeliveryPortalAudience;
    tokenHash: string;
    expiresAt: string;
    createdByProfileId: string;
  }): Promise<void> {
    const { error } = await this.supabase.rpc('create_delivery_access_link', {
      p_id: input.id,
      p_tenant_id: input.tenantId,
      p_delivery_id: input.deliveryId,
      p_audience: input.audience,
      p_token_hash: input.tokenHash,
      p_expires_at: input.expiresAt,
      p_created_by_profile_id: input.createdByProfileId,
    });

    if (error) throw error;
  }

  async findActiveByTokenHash(tokenHash: string) {
    const { data, error } = await this.supabase.rpc(
      'get_active_delivery_access_link_by_token_hash',
      { p_token_hash: tokenHash }
    );

    if (error) throw error;
    if (!data || data.length === 0) return null;

    const row = data[0] as {
      id: string;
      tenant_id: string;
      delivery_id: string;
      audience: 'customer' | 'driver';
      expires_at: string;
      revoked_at: string | null;
    };
    return {
      id: row.id,
      tenantId: row.tenant_id,
      deliveryId: row.delivery_id,
      audience: row.audience,
      expiresAt: row.expires_at,
      revokedAt: row.revoked_at,
    };
  }

  async touchLastAccessed(id: string, accessedAt: string): Promise<void> {
    const { error } = await this.supabase.rpc(
      'touch_delivery_access_link_last_accessed',
      { p_id: id, p_accessed_at: accessedAt }
    );
    if (error) throw error;
  }

  async findById(id: string): Promise<{
    id: string;
    tenantId: string;
    revokedAt: string | null;
    expiresAt: string;
  } | null> {
    const { data, error } = await this.supabase
      .from('delivery_access_links')
      .select('id, tenant_id, revoked_at, expires_at')
      .eq('id', id)
      .maybeSingle()   // ← was .single() — maybeSingle returns null data (no error) when row absent

    if (error) {
      // Genuine DB/network error — do not silently treat as "not found"
      console.error('[portal_access_link_lookup_failed]', error.message)
      return null
    }
    if (!data) return null

    return {
      id:        data.id,
      tenantId:  data.tenant_id,
      revokedAt: data.revoked_at,
      expiresAt: data.expires_at,
    }
  }

  async revoke(accessLinkId: string): Promise<void> {
    const { error } = await this.supabase.rpc('revoke_delivery_access_link', {
      p_access_link_id: accessLinkId,
      p_revoked_by_profile_id: 'system',
    });
    if (error) throw error;
  }
}
