import { DELIVERY_DRIVER_ALLOWED_TRANSITIONS, DELIVERY_PORTAL_MESSAGE_MAX_LEN } from '../domain/invariants';
import {
  PortalAuthError,
  PortalForbiddenError,
  PortalTransitionError,
  PortalValidationError,
} from '../domain/errors';
import type { DeliveryPortalAudience, DeliveryStatus, PublicDeliverySession } from '../domain/types';

export function assertAudience(session: PublicDeliverySession, expected: DeliveryPortalAudience) {
  if (session.audience !== expected) {
    throw new PortalForbiddenError('invalid_audience');
  }
}

export function assertCapability(session: PublicDeliverySession, capability: string) {
  if (!session.capabilities.includes(capability)) {
    throw new PortalForbiddenError('missing_capability');
  }
}

export function assertAllowedTransition(current: DeliveryStatus, next: DeliveryStatus) {
  const allowed = DELIVERY_DRIVER_ALLOWED_TRANSITIONS[current] ?? [];
  if (!allowed.includes(next)) {
    throw new PortalTransitionError();
  }
}

export function assertValidCoordinates(latitude: number, longitude: number) {
  if (latitude < -90 || latitude > 90) {
    throw new PortalValidationError('invalid_latitude');
  }
  if (longitude < -180 || longitude > 180) {
    throw new PortalValidationError('invalid_longitude');
  }
}

export function assertMessageBody(body: string) {
  const normalized = body.trim();
  if (!normalized) {
    throw new PortalValidationError('empty_message');
  }
  if (normalized.length > DELIVERY_PORTAL_MESSAGE_MAX_LEN) {
    throw new PortalValidationError('message_too_long');
  }
}

export function assertLinkStillActive(link: {
  revokedAt: string | null
  expiresAt: string
} | null): void {
  if (!link || link.revokedAt !== null) {
    throw new PortalAuthError('link_revoked_or_not_found')
  }
  if (new Date(link.expiresAt).getTime() <= Date.now()) {
    throw new PortalAuthError('link_expired')
  }
}
