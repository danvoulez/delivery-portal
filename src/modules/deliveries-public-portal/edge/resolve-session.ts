import type { DeliveriesPublicPortalService } from '../application/contracts';

export async function resolveSessionHandler(req: Request, service: DeliveriesPublicPortalService) {
  const body = await req.json();
  const result = await service.resolveSession({ token: body.token });

  return Response.json(result, { status: 200 });
}
