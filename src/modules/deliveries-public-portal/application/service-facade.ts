import {
  assertAllowedTransition,
  assertAudience,
  assertCapability,
  assertLinkStillActive,
  assertMessageBody,
  assertValidCoordinates,
} from './policy';
import { PortalAuthError } from '../domain/errors';
import type { PublicDeliverySession } from '../domain/types';
import type {
  AttachProofFromSessionInput,
  AttachProofFromSessionResult,
  DeliveriesPublicPortalFacade,
  ListMessagesForSessionResult,
  PostLocationFromSessionInput,
  PostLocationFromSessionResult,
  PostMessageFromSessionInput,
  PostMessageFromSessionResult,
  PostStatusFromSessionInput,
  PostStatusFromSessionResult,
  ResolvePortalSessionInput,
  ResolvePortalSessionResult,
} from './contracts-facade';

export interface AccessLinksLookupRepo {
  findActiveByTokenHash(tokenHash: string): Promise<{
    id: string;
    tenantId: string;
    deliveryId: string;
    audience: 'customer' | 'driver';
    expiresAt: string;
    revokedAt: string | null;
  } | null>;
  touchLastAccessed(id: string, accessedAt: string): Promise<void>;
  // Used by write-path revocation check (Task 4)
  findById(id: string): Promise<{
    id: string;
    tenantId: string;
    revokedAt: string | null;
    expiresAt: string;
  } | null>;
}

export interface TenantAwareDeliveriesReadRepo {
  getTrackingViewForTenant(tenantId: string, deliveryId: string): Promise<any>;
  getDriverJobViewForTenant(tenantId: string, deliveryId: string): Promise<any>;
  listMessagesForTenant(tenantId: string, deliveryId: string, limit?: number): Promise<any[]>;
  getCurrentStatusForTenant(tenantId: string, deliveryId: string): Promise<string>;
}

export interface TenantAwareDeliveriesWriteRepo {
  updateStatus(input: {
    tenantId: string;
    deliveryId: string;
    nextStatus: string;
    proofFileId?: string | null;
    sourceSessionId: string;
  }): Promise<void>;
  attachProof(input: {
    tenantId: string;
    deliveryId: string;
    proofFileId: string;
    sourceSessionId: string;
  }): Promise<void>;
}

export interface TenantAwareMessagesRepo {
  insertMessage(input: {
    id: string;
    tenantId: string;
    deliveryId: string;
    audience: 'customer' | 'driver';
    senderLabel: string;
    body: string;
    sourceSessionId: string;
  }): Promise<void>;
}

export interface TenantAwareLocationsRepo {
  insertLocation(input: {
    id: string;
    tenantId: string;
    deliveryId: string;
    latitude: number;
    longitude: number;
    accuracyMeters: number | null;
    recordedAt: string;
    sourceSessionId: string;
  }): Promise<void>;
}

export interface PortalSessionSigner {
  issue(session: Omit<PublicDeliverySession, 'sessionId'>): Promise<PublicDeliverySession>;
  sign(session: PublicDeliverySession): Promise<string>;
}

export interface PortalRealtimePublisher {
  publish<TPayload>(input: {
    channel: string;
    event: {
      eventName: string;
      tenantId: string;
      deliveryId: string;
      occurredAt: string;
      payload: TPayload;
    };
  }): Promise<void>;
}

export interface DeliveriesPublicPortalFacadeDeps {
  accessLinksRepo: AccessLinksLookupRepo;
  deliveriesReadRepo: TenantAwareDeliveriesReadRepo;
  deliveriesWriteRepo: TenantAwareDeliveriesWriteRepo;
  messagesRepo: TenantAwareMessagesRepo;
  locationsRepo: TenantAwareLocationsRepo;
  hashToken(token: string): Promise<string>;
  issueSession(input: Omit<PublicDeliverySession, 'sessionId'>): Promise<PublicDeliverySession>;
  signSession(session: PublicDeliverySession): Promise<string>;
  buildDeliveryChannel(tenantId: string, deliveryId: string): string;
  publishRealtime: PortalRealtimePublisher['publish'];
  generateId(): string;
}

function capabilitiesForAudience(audience: 'customer' | 'driver'): string[] {
  if (audience === 'customer') {
    return ['delivery:tracking:read', 'delivery:messages:read', 'delivery:messages:write'];
  }
  return [
    'delivery:job:read',
    'delivery:status:write',
    'delivery:location:write',
    'delivery:messages:read',
    'delivery:messages:write',
    'delivery:proof:write',
  ];
}

function statusLabel(status: string): string {
  switch (status) {
    case 'assigned': return 'Assigned';
    case 'en_route_pickup': return 'Heading to pickup';
    case 'picked_up': return 'Picked up';
    case 'en_route_dropoff': return 'Out for delivery';
    case 'delivered': return 'Delivered';
    case 'failed_attempt': return 'Delivery attempt failed';
    default: return status;
  }
}

export class DeliveriesPublicPortalFacadeImpl implements DeliveriesPublicPortalFacade {
  constructor(private readonly deps: DeliveriesPublicPortalFacadeDeps) {}

  async resolvePortalSession(input: ResolvePortalSessionInput): Promise<ResolvePortalSessionResult> {
    const tokenHash = await this.deps.hashToken(input.token);
    const link = await this.deps.accessLinksRepo.findActiveByTokenHash(tokenHash);

    if (!link || link.revokedAt) {
      throw new PortalAuthError('invalid_or_expired_link');
    }

    if (new Date(link.expiresAt).getTime() <= Date.now()) {
      throw new PortalAuthError('invalid_or_expired_link');
    }

    await this.deps.accessLinksRepo.touchLastAccessed(link.id, new Date().toISOString());

    const session = await this.deps.issueSession({
      tenantId:     link.tenantId,
      deliveryId:   link.deliveryId,
      audience:     link.audience,
      expiresAt:    link.expiresAt,
      capabilities: capabilitiesForAudience(link.audience),
      accessLinkId: link.id,  // bind session to its originating access link
    });

    const portalSessionToken = await this.deps.signSession(session);

    return {
      session,
      portalSessionToken,
      deliveryPublicRef: link.deliveryId,
    };
  }

  async getTrackingViewForSession(session: PublicDeliverySession) {
    assertAudience(session, 'customer');
    assertCapability(session, 'delivery:tracking:read');
    return this.deps.deliveriesReadRepo.getTrackingViewForTenant(
      session.tenantId,
      session.deliveryId
    );
  }

  async getDriverJobViewForSession(session: PublicDeliverySession) {
    assertAudience(session, 'driver');
    assertCapability(session, 'delivery:job:read');
    return this.deps.deliveriesReadRepo.getDriverJobViewForTenant(
      session.tenantId,
      session.deliveryId
    );
  }

  async listMessagesForSession(session: PublicDeliverySession): Promise<ListMessagesForSessionResult> {
    assertCapability(session, 'delivery:messages:read');
    const messages = await this.deps.deliveriesReadRepo.listMessagesForTenant(
      session.tenantId,
      session.deliveryId,
      100
    );
    return { messages };
  }

  async postMessageFromSession(
    session: PublicDeliverySession,
    input: PostMessageFromSessionInput
  ): Promise<PostMessageFromSessionResult> {
    assertCapability(session, 'delivery:messages:write');
    assertMessageBody(input.body);

    const messageId = this.deps.generateId();
    const senderLabel = session.audience === 'customer' ? 'Customer' : 'Driver';
    const occurredAt = new Date().toISOString();

    await this.deps.messagesRepo.insertMessage({
      id: messageId,
      tenantId: session.tenantId,
      deliveryId: session.deliveryId,
      audience: session.audience,
      senderLabel,
      body: input.body.trim(),
      sourceSessionId: session.sessionId,
    });

    await this.deps.publishRealtime({
      channel: this.deps.buildDeliveryChannel(session.tenantId, session.deliveryId),
      event: {
        eventName: 'delivery.message.posted',
        tenantId: session.tenantId,
        deliveryId: session.deliveryId,
        occurredAt,
        payload: {
          messageId,
          audience: session.audience,
          senderLabel,
          body: input.body.trim(),
          createdAt: occurredAt,
        },
      },
    });

    return { messageId };
  }

  async postLocationFromSession(
    session: PublicDeliverySession,
    input: PostLocationFromSessionInput
  ): Promise<PostLocationFromSessionResult> {
    assertAudience(session, 'driver');
    assertCapability(session, 'delivery:location:write');
    assertValidCoordinates(input.latitude, input.longitude);

    const locationId = this.deps.generateId();
    const recordedAt = input.recordedAt ?? new Date().toISOString();
    const occurredAt = new Date().toISOString();

    await this.deps.locationsRepo.insertLocation({
      id: locationId,
      tenantId: session.tenantId,
      deliveryId: session.deliveryId,
      latitude: input.latitude,
      longitude: input.longitude,
      accuracyMeters: input.accuracyMeters ?? null,
      recordedAt,
      sourceSessionId: session.sessionId,
    });

    await this.deps.publishRealtime({
      channel: this.deps.buildDeliveryChannel(session.tenantId, session.deliveryId),
      event: {
        eventName: 'delivery.location.updated',
        tenantId: session.tenantId,
        deliveryId: session.deliveryId,
        occurredAt,
        payload: {
          locationId,
          latitude: input.latitude,
          longitude: input.longitude,
          accuracyMeters: input.accuracyMeters ?? null,
          recordedAt,
        },
      },
    });

    return { locationId };
  }

  async postStatusFromSession(
    session: PublicDeliverySession,
    input: PostStatusFromSessionInput
  ): Promise<PostStatusFromSessionResult> {
    assertAudience(session, 'driver');
    assertCapability(session, 'delivery:status:write');

    // Re-check link is still active (closes post-resolution revocation window)
    const link = await this.deps.accessLinksRepo.findById(session.accessLinkId);
    assertLinkStillActive(link);

    const previousStatus = await this.deps.deliveriesReadRepo.getCurrentStatusForTenant(
      session.tenantId,
      session.deliveryId
    );

    assertAllowedTransition(previousStatus as any, input.nextStatus as any);

    await this.deps.deliveriesWriteRepo.updateStatus({
      tenantId: session.tenantId,
      deliveryId: session.deliveryId,
      nextStatus: input.nextStatus,
      proofFileId: input.proofFileId ?? null,
      sourceSessionId: session.sessionId,
    });

    await this.deps.publishRealtime({
      channel: this.deps.buildDeliveryChannel(session.tenantId, session.deliveryId),
      event: {
        eventName: 'delivery.status.updated',
        tenantId: session.tenantId,
        deliveryId: session.deliveryId,
        occurredAt: new Date().toISOString(),
        payload: {
          previousStatus,
          currentStatus: input.nextStatus,
          statusLabel: statusLabel(input.nextStatus),
          proofFileId: input.proofFileId ?? null,
        },
      },
    });

    return {
      previousStatus,
      currentStatus: input.nextStatus,
    };
  }

  async attachProofFromSession(
    session: PublicDeliverySession,
    input: AttachProofFromSessionInput
  ): Promise<AttachProofFromSessionResult> {
    assertAudience(session, 'driver');
    assertCapability(session, 'delivery:proof:write');

    // Re-check link is still active (closes post-resolution revocation window)
    const link = await this.deps.accessLinksRepo.findById(session.accessLinkId);
    assertLinkStillActive(link);

    await this.deps.deliveriesWriteRepo.attachProof({
      tenantId: session.tenantId,
      deliveryId: session.deliveryId,
      proofFileId: input.proofFileId,
      sourceSessionId: session.sessionId,
    });

    await this.deps.publishRealtime({
      channel: this.deps.buildDeliveryChannel(session.tenantId, session.deliveryId),
      event: {
        eventName: 'delivery.proof.attached',
        tenantId: session.tenantId,
        deliveryId: session.deliveryId,
        occurredAt: new Date().toISOString(),
        payload: { proofFileId: input.proofFileId },
      },
    });

    return { proofFileId: input.proofFileId };
  }
}
