import type { DeliveriesPublicPortalService } from '../application/contracts';
import type { PublicDeliverySession } from '../domain/types';

export async function postStatusHandler(
  req: Request,
  session: PublicDeliverySession,
  service: DeliveriesPublicPortalService
) {
  const body = await req.json();

  await service.updateDeliveryStatusFromPublicSession(session, {
    nextStatus: body.nextStatus,
    proofFileId: body.proofFileId ?? null,
  });

  return new Response(null, { status: 204 });
}
