import { createDeliveriesPublicPortalFacade } from '@/modules/deliveries-public-portal/bootstrap/create-deliveries-public-portal-facade';
import { readPortalSessionFromRequest } from '@/modules/deliveries-public-portal/http/auth';
import { mapHttpError } from '@/modules/deliveries-public-portal/http/errors';

export async function GET() {
  try {
    const { facade, issuer } = createDeliveriesPublicPortalFacade();
    const session = await readPortalSessionFromRequest(issuer);
    const result = await facade.getTrackingViewForSession(session);
    return Response.json(result);
  } catch (error) {
    return mapHttpError(error);
  }
}
