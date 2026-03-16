import type { DeliveriesPublicPortalService } from '../application/contracts';
import type { PublicDeliverySession } from '../domain/types';

export async function listMessagesHandler(
  _req: Request,
  session: PublicDeliverySession,
  service: DeliveriesPublicPortalService
) {
  const messages = await service.listDeliveryMessagesForSession(session);
  return Response.json(messages, { status: 200 });
}
