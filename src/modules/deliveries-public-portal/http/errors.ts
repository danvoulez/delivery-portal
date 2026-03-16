import {
  PortalAuthError,
  PortalForbiddenError,
  PortalTransitionError,
  PortalValidationError,
  PortalRateLimitError,
} from '../domain/errors';

export function mapHttpError(error: unknown): Response {
  if (error instanceof PortalAuthError) {
    // Warn on every auth failure — these are worth monitoring in production logs
    console.warn('[portal_auth_failed]', error.message);
    return Response.json({ error: error.message }, { status: 401 });
  }

  if (error instanceof PortalForbiddenError) {
    // Warn on forbidden — customer attempting driver action is a notable security event
    console.warn('[portal_forbidden]', error.message);
    return Response.json({ error: error.message }, { status: 403 });
  }

  if (error instanceof PortalValidationError) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  if (error instanceof PortalTransitionError) {
    return Response.json({ error: error.message }, { status: 409 });
  }

  if (error instanceof PortalRateLimitError) {
    return Response.json({ error: error.message }, { status: 429 });
  }

  // Unknown errors: log full error server-side, return generic message to client
  console.error('[portal_internal_error]', error);
  return Response.json({ error: 'internal_server_error' }, { status: 500 });
}
