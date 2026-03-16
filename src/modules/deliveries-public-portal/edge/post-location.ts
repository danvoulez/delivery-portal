import type { DeliveriesPublicPortalService } from '../application/contracts';
import type { PublicDeliverySession } from '../domain/types';

export async function postLocationHandler(
  req: Request,
  session: PublicDeliverySession,
  service: DeliveriesPublicPortalService
) {
  const body = await req.json();

  await service.postDriverLocation(session, {
    latitude: body.latitude,
    longitude: body.longitude,
    accuracyMeters: body.accuracyMeters ?? null,
    recordedAt: body.recordedAt ?? new Date().toISOString(),
  });

  return new Response(null, { status: 204 });
}
