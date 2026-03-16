import { createDeliveriesPublicPortalFacade } from '@/modules/deliveries-public-portal/bootstrap/create-deliveries-public-portal-facade';
import { mapHttpError } from '@/modules/deliveries-public-portal/http/errors';
import { readValidatedJson } from '@/modules/deliveries-public-portal/http/json';
import { ResolveSessionSchema } from '@/modules/deliveries-public-portal/http/schemas';

export async function POST(req: Request) {
  try {
    const { facade } = createDeliveriesPublicPortalFacade();
    const body = await readValidatedJson(req, ResolveSessionSchema);

    const result = await facade.resolvePortalSession({ token: body.token });

    return Response.json({
      sessionId: result.session.sessionId,
      audience: result.session.audience,
      deliveryPublicRef: result.deliveryPublicRef,
      expiresAt: result.session.expiresAt,
      capabilities: result.session.capabilities,
      portalSessionToken: result.portalSessionToken,
    });
  } catch (error) {
    return mapHttpError(error);
  }
}
