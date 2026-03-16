import { getDeliveriesPublicPortalConfig } from '../infrastructure/config';
import { hashPortalToken, generateOpaqueToken } from '../infrastructure/token';
import { JwtPortalSessionIssuer } from '../infrastructure/session-jwt';
import { createSupabaseAdminClient } from '../infrastructure/supabase-admin';
import { SupabaseAccessLinksRepo } from '../infrastructure/repositories/access-links-repo';
import { SupabaseDeliveriesReadRepo } from '../infrastructure/repositories/deliveries-read-repo';
import { SupabaseDeliveriesWriteRepo } from '../infrastructure/repositories/deliveries-write-repo';
import { SupabaseDeliveryLocationsRepo } from '../infrastructure/repositories/delivery-locations-repo';
import { SupabaseDeliveryMessagesRepo } from '../infrastructure/repositories/delivery-messages-repo';
import { SupabaseDeliveryPortalRealtimePublisher } from '../infrastructure/realtime/publisher';
import { deliveryChannel } from '../infrastructure/realtime/channels';

export function createDeliveriesPublicPortalRuntime() {
  const config = getDeliveriesPublicPortalConfig();
  const supabase = createSupabaseAdminClient();

  const issuer = new JwtPortalSessionIssuer(
    config.portalSessionSecret,
    config.portalSessionTtlSeconds
  );

  const accessLinksRepo = new SupabaseAccessLinksRepo(supabase);
  const deliveriesReadRepo = new SupabaseDeliveriesReadRepo(supabase);
  const deliveriesWriteRepo = new SupabaseDeliveriesWriteRepo(supabase);
  const locationsRepo = new SupabaseDeliveryLocationsRepo(supabase);
  const messagesRepo = new SupabaseDeliveryMessagesRepo(supabase);
  const realtimePublisher = new SupabaseDeliveryPortalRealtimePublisher(supabase);

  return {
    issuer,
    config,
    repos: {
      accessLinksRepo,
      deliveriesReadRepo,
      deliveriesWriteRepo,
      locationsRepo,
      messagesRepo,
    },
    realtimePublisher,
    hashPortalToken,
  };
}
