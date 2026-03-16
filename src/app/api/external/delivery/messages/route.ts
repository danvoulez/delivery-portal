import { createDeliveriesPublicPortalFacade } from '@/modules/deliveries-public-portal/bootstrap/create-deliveries-public-portal-facade';
import { readPortalSessionFromRequest } from '@/modules/deliveries-public-portal/http/auth';
import { mapHttpError } from '@/modules/deliveries-public-portal/http/errors';
import { readValidatedJson } from '@/modules/deliveries-public-portal/http/json';
import { PostMessageSchema } from '@/modules/deliveries-public-portal/http/schemas';

export async function GET() {
  try {
    const { facade, issuer } = createDeliveriesPublicPortalFacade();
    const session = await readPortalSessionFromRequest(issuer);
    const result = await facade.listMessagesForSession(session);
    return Response.json(result);
  } catch (error) {
    return mapHttpError(error);
  }
}

export async function POST(req: Request) {
  try {
    const { facade, issuer } = createDeliveriesPublicPortalFacade();
    const session = await readPortalSessionFromRequest(issuer);
    const body = await readValidatedJson(req, PostMessageSchema);
    const result = await facade.postMessageFromSession(session, { body: body.body });
    return Response.json(result, { status: 201 });
  } catch (error) {
    return mapHttpError(error);
  }
}
