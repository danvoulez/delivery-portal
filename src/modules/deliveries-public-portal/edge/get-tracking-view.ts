import type { DeliveriesPublicPortalService } from '../application/contracts';
import type { PublicDeliverySession } from '../domain/types';

export async function getTrackingViewHandler(
  _req: Request,
  session: PublicDeliverySession,
  service: DeliveriesPublicPortalService
) {
  const view = await service.getPublicDeliveryTrackingView(session);
  return Response.json(view, { status: 200 });
}
