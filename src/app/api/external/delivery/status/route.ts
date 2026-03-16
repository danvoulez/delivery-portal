import { createDeliveriesPublicPortalFacade } from '@/modules/deliveries-public-portal/bootstrap/create-deliveries-public-portal-facade';
import { readPortalSessionFromRequest } from '@/modules/deliveries-public-portal/http/auth';
import { mapHttpError } from '@/modules/deliveries-public-portal/http/errors';
import { noContent, readValidatedJson } from '@/modules/deliveries-public-portal/http/json';
import { PostStatusSchema } from '@/modules/deliveries-public-portal/http/schemas';

export async function POST(req: Request) {
  try {
    const { facade, issuer } = createDeliveriesPublicPortalFacade();
    const session = await readPortalSessionFromRequest(issuer);
    const body = await readValidatedJson(req, PostStatusSchema);
    await facade.postStatusFromSession(session, body);
    return noContent();
  } catch (error) {
    return mapHttpError(error);
  }
}
