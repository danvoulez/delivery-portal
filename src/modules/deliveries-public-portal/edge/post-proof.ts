import type { DeliveriesPublicPortalService } from '../application/contracts';
import type { PublicDeliverySession } from '../domain/types';

export async function postProofHandler(
  req: Request,
  session: PublicDeliverySession,
  service: DeliveriesPublicPortalService
) {
  const body = await req.json();

  await service.attachProofFromPublicSession(session, {
    proofFileId: body.proofFileId,
  });

  return new Response(null, { status: 204 });
}
