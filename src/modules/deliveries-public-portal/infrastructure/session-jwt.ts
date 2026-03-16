/**
 * Sessão pública curta via JWT assinado.
 * Dependência: jsonwebtoken (npm install jsonwebtoken @types/jsonwebtoken)
 */
import jwt from 'jsonwebtoken';
import type { PublicDeliverySession } from '../domain/types';
import { PortalAuthError } from '../domain/errors';

interface SessionJwtPayload {
  jti: string;           // equals sessionId — enables per-token traceability
  sessionId: string;
  tenantId: string;
  deliveryId: string;
  audience: 'customer' | 'driver';
  capabilities: string[];
  accessLinkId: string;  // the access link that originated this session
  exp: number;
}

export interface PortalSessionIssuer {
  issue(session: Omit<PublicDeliverySession, 'sessionId'>): Promise<PublicDeliverySession>;
  sign(session: PublicDeliverySession): Promise<string>;
  read(token: string): Promise<PublicDeliverySession>;
}

export class JwtPortalSessionIssuer implements PortalSessionIssuer {
  constructor(
    private readonly secret: string,
    private readonly ttlSeconds: number
  ) {}

  async issue(session: Omit<PublicDeliverySession, 'sessionId'>): Promise<PublicDeliverySession> {
    const now = Math.floor(Date.now() / 1000);
    const exp = Math.min(
      Math.floor(new Date(session.expiresAt).getTime() / 1000),
      now + this.ttlSeconds
    );

    return {
      sessionId: crypto.randomUUID(),
      tenantId: session.tenantId,
      deliveryId: session.deliveryId,
      audience: session.audience,
      capabilities: session.capabilities,
      expiresAt: new Date(exp * 1000).toISOString(),
      accessLinkId: session.accessLinkId,  // pass through
    };
  }

  async sign(session: PublicDeliverySession): Promise<string> {
    const exp = Math.floor(new Date(session.expiresAt).getTime() / 1000);

    const payload: SessionJwtPayload = {
      jti:          session.sessionId,
      sessionId:    session.sessionId,
      tenantId:     session.tenantId,
      deliveryId:   session.deliveryId,
      audience:     session.audience,
      capabilities: session.capabilities,
      accessLinkId: session.accessLinkId,
      exp,
    };

    return jwt.sign(payload, this.secret);
  }

  async read(token: string): Promise<PublicDeliverySession> {
    let decoded: SessionJwtPayload
    try {
      decoded = jwt.verify(token, this.secret) as SessionJwtPayload
    } catch {
      throw new PortalAuthError('invalid_or_expired_session')
    }

    return {
      sessionId:    decoded.sessionId,
      tenantId:     decoded.tenantId,
      deliveryId:   decoded.deliveryId,
      audience:     decoded.audience,
      capabilities: decoded.capabilities,
      expiresAt:    new Date(decoded.exp * 1000).toISOString(),
      accessLinkId: decoded.accessLinkId,
    };
  }
}
