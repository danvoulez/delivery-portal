import type { SupabaseClient } from '@supabase/supabase-js';

export interface PublishDeliveryPortalRealtimeEventInput<TPayload> {
  channel: string;
  event: {
    eventName: string;
    tenantId: string;
    deliveryId: string;
    occurredAt: string;
    payload: TPayload;
  };
}

export interface DeliveryPortalRealtimePublisher {
  publish<TPayload>(input: PublishDeliveryPortalRealtimeEventInput<TPayload>): Promise<void>;
}

export class SupabaseDeliveryPortalRealtimePublisher
  implements DeliveryPortalRealtimePublisher
{
  constructor(private readonly supabase: SupabaseClient) {}

  async publish<TPayload>(input: PublishDeliveryPortalRealtimeEventInput<TPayload>): Promise<void> {
    const channel = this.supabase.channel(input.channel);

    await channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.send({
          type: 'broadcast',
          event: input.event.eventName,
          payload: input.event,
        });
        await channel.unsubscribe();
      }
    });
  }
}
