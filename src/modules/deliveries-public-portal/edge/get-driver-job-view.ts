import type { DeliveriesPublicPortalService } from '../application/contracts';
import type { PublicDeliverySession } from '../domain/types';

export async function getDriverJobViewHandler(
  _req: Request,
  session: PublicDeliverySession,
  service: DeliveriesPublicPortalService
) {
  const view = await service.getDriverDeliveryJobView(session);
  return Response.json(view, { status: 200 });
}
