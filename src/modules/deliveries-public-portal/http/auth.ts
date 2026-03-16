import { headers } from 'next/headers';
import { PortalAuthError } from '../domain/errors';
import type { PublicDeliverySession } from '../domain/types';
import type { PortalSessionIssuer } from '../infrastructure/session-jwt';

export async function readPortalSessionFromRequest(
  issuer: PortalSessionIssuer
): Promise<PublicDeliverySession> {
  const h = await headers();
  const auth = h.get('authorization');

  if (!auth || !auth.startsWith('Bearer ')) {
    throw new PortalAuthError('missing_portal_session');
  }

  const token = auth.slice('Bearer '.length).trim();
  if (!token) {
    throw new PortalAuthError('missing_portal_session');
  }

  return issuer.read(token);
}
