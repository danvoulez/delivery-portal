import type { DeliveriesPublicPortalService } from '../application/contracts';
import type { PublicDeliverySession } from '../domain/types';

export async function postMessageHandler(
  req: Request,
  session: PublicDeliverySession,
  service: DeliveriesPublicPortalService
) {
  const body = await req.json();

  await service.postDeliveryMessage(session, {
    body: body.body,
  });

  return new Response(null, { status: 204 });
}
