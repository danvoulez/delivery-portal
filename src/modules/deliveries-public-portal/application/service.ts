import type {
  AttachProofFromPublicSessionInput,
  CreateDeliveryAccessLinkInput,
  CreateDeliveryAccessLinkResult,
  DeliveriesPublicPortalService,
  DriverDeliveryJobView,
  PostDeliveryMessageInput,
  PostDriverLocationInput,
  PublicDeliveryTrackingView,
  ResolveDeliveryPortalSessionInput,
  ResolveDeliveryPortalSessionResult,
  RevokeDeliveryAccessLinkInput,
  UpdateDeliveryStatusFromPublicSessionInput,
} from './contracts';
import type { PublicDeliverySession } from '../domain/types';
import { PortalAuthError } from '../domain/errors';
import {
  assertAllowedTransition,
  assertAudience,
  assertCapability,
  assertMessageBody,
  assertValidCoordinates,
} from './policy';

export interface DeliveryAccessLinksRepo {
  insertAccessLink(input: {
    id: string;
    tenantId: string;
    deliveryId: string;
    audience: 'customer' | 'driver';
    tokenHash: string;
    expiresAt: string;
    createdByProfileId: string;
  }): Promise<void>;

  findActiveByTokenHash(tokenHash: string): Promise<{
    id: string;
    tenantId: string;
    deliveryId: string;
    audience: 'customer' | 'driver';
    expiresAt: string;
    revokedAt: string | null;
  } | null>;

  touchLastAccessed(id: string, accessedAt: string): Promise<void>;
  revoke(accessLinkId: string): Promise<void>;
}

export interface DeliveriesReadRepo {
  getDeliveryPublicRef(deliveryId: string): Promise<string>;
  getCurrentStatus(deliveryId: string): Promise<any>;
  getTrackingView(deliveryId: string): Promise<PublicDeliveryTrackingView>;
  getDriverJobView(deliveryId: string): Promise<DriverDeliveryJobView>;
}

export interface DeliveryLocationsRepo {
  insertLocation(input: {
    id: string;
    tenantId: string;
    deliveryId: string;
    latitude: number;
    longitude: number;
    accuracyMeters: number | null;
    recordedAt: string;
    sourceType: 'public_session';
    sourceSessionId: string;
  }): Promise<void>;
}

export interface DeliveryMessagesRepo {
  insertMessage(input: {
    id: string;
    tenantId: string;
    deliveryId: string;
    audience: 'customer' | 'driver';
    senderType: 'public_session';
    senderLabel: string;
    body: string;
    sourceSessionId: string;
  }): Promise<void>;
}

export interface DeliveriesWriteRepo {
  updateStatus(input: {
    deliveryId: string;
    tenantId: string;
    nextStatus: string;
    proofFileId?: string | null;
    sourceSessionId: string;
  }): Promise<void>;

  attachProof(input: {
    deliveryId: string;
    tenantId: string;
    proofFileId: string;
    sourceSessionId: string;
  }): Promise<void>;
}

export interface PortalRealtimePublisher {
  publish(event: {
    tenantId: string;
    deliveryId: string;
    eventName: string;
    occurredAt: string;
  }): Promise<void>;
}

export interface PortalDeps {
  accessLinksRepo: DeliveryAccessLinksRepo;
  deliveriesReadRepo: DeliveriesReadRepo;
  deliveriesWriteRepo: DeliveriesWriteRepo;
  locationsRepo: DeliveryLocationsRepo;
  messagesRepo: DeliveryMessagesRepo;
  hashToken(token: string): Promise<string>;
  generateId(): string;
  generateToken(): string;
  makeLinkUrl(token: string): string;
  issueSession(input: Omit<PublicDeliverySession, 'sessionId'>): Promise<PublicDeliverySession>;
  publishRealtime: PortalRealtimePublisher['publish'];
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

export class DeliveriesPublicPortalServiceImpl implements DeliveriesPublicPortalService {
  constructor(private readonly deps: PortalDeps) {}

  async resolveSession(
    input: ResolveDeliveryPortalSessionInput
  ): Promise<ResolveDeliveryPortalSessionResult> {
    const tokenHash = await this.deps.hashToken(input.token);
    const link = await this.deps.accessLinksRepo.findActiveByTokenHash(tokenHash);

    if (!link || link.revokedAt) {
      throw new PortalAuthError();
    }

    if (new Date(link.expiresAt).getTime() <= Date.now()) {
      throw new PortalAuthError();
    }

    await this.deps.accessLinksRepo.touchLastAccessed(link.id, new Date().toISOString());

    const session = await this.deps.issueSession({
      tenantId: link.tenantId,
      deliveryId: link.deliveryId,
      audience: link.audience,
      expiresAt: link.expiresAt,
      capabilities: capabilitiesForAudience(link.audience),
      accessLinkId: link.id,
    });

    const deliveryPublicRef = await this.deps.deliveriesReadRepo.getDeliveryPublicRef(link.deliveryId);

    return {
      sessionId: session.sessionId,
      audience: session.audience,
      deliveryPublicRef,
      expiresAt: session.expiresAt,
      capabilities: session.capabilities,
    };
  }

  async getPublicDeliveryTrackingView(session: PublicDeliverySession): Promise<PublicDeliveryTrackingView> {
    assertAudience(session, 'customer');
    assertCapability(session, 'delivery:tracking:read');
    return this.deps.deliveriesReadRepo.getTrackingView(session.deliveryId);
  }

  async getDriverDeliveryJobView(session: PublicDeliverySession): Promise<DriverDeliveryJobView> {
    assertAudience(session, 'driver');
    assertCapability(session, 'delivery:job:read');
    return this.deps.deliveriesReadRepo.getDriverJobView(session.deliveryId);
  }

  async listDeliveryMessagesForSession(session: PublicDeliverySession) {
    if (session.audience === 'customer') {
      return (await this.deps.deliveriesReadRepo.getTrackingView(session.deliveryId)).messageThreadPreview;
    }
    return (await this.deps.deliveriesReadRepo.getDriverJobView(session.deliveryId)).messageThreadPreview;
  }

  async createDeliveryAccessLink(
    input: CreateDeliveryAccessLinkInput,
    actorProfileId: string
  ): Promise<CreateDeliveryAccessLinkResult> {
    const token = this.deps.generateToken();
    const tokenHash = await this.deps.hashToken(token);
    const accessLinkId = this.deps.generateId();

    // TODO: tenantId viria do actor context / aggregate lookup
    const tenantId = 'resolve-from-delivery';

    await this.deps.accessLinksRepo.insertAccessLink({
      id: accessLinkId,
      tenantId,
      deliveryId: input.deliveryId,
      audience: input.audience,
      tokenHash,
      expiresAt: input.expiresAt,
      createdByProfileId: actorProfileId,
    });

    return {
      accessLinkId,
      linkUrl: this.deps.makeLinkUrl(token),
    };
  }

  async revokeDeliveryAccessLink(input: RevokeDeliveryAccessLinkInput): Promise<void> {
    await this.deps.accessLinksRepo.revoke(input.accessLinkId);
  }

  async postDriverLocation(session: PublicDeliverySession, input: PostDriverLocationInput): Promise<void> {
    assertAudience(session, 'driver');
    assertCapability(session, 'delivery:location:write');
    assertValidCoordinates(input.latitude, input.longitude);

    await this.deps.locationsRepo.insertLocation({
      id: this.deps.generateId(),
      tenantId: session.tenantId,
      deliveryId: session.deliveryId,
      latitude: input.latitude,
      longitude: input.longitude,
      accuracyMeters: input.accuracyMeters ?? null,
      recordedAt: input.recordedAt,
      sourceType: 'public_session',
      sourceSessionId: session.sessionId,
    });

    await this.deps.publishRealtime({
      tenantId: session.tenantId,
      deliveryId: session.deliveryId,
      eventName: 'delivery.location.updated',
      occurredAt: new Date().toISOString(),
    });
  }

  async postDeliveryMessage(session: PublicDeliverySession, input: PostDeliveryMessageInput): Promise<void> {
    assertCapability(session, 'delivery:messages:write');
    assertMessageBody(input.body);

    await this.deps.messagesRepo.insertMessage({
      id: this.deps.generateId(),
      tenantId: session.tenantId,
      deliveryId: session.deliveryId,
      audience: session.audience,
      senderType: 'public_session',
      senderLabel: session.audience === 'customer' ? 'Customer' : 'Driver',
      body: input.body.trim(),
      sourceSessionId: session.sessionId,
    });

    await this.deps.publishRealtime({
      tenantId: session.tenantId,
      deliveryId: session.deliveryId,
      eventName: 'delivery.message.posted',
      occurredAt: new Date().toISOString(),
    });
  }

  async updateDeliveryStatusFromPublicSession(
    session: PublicDeliverySession,
    input: UpdateDeliveryStatusFromPublicSessionInput
  ): Promise<void> {
    assertAudience(session, 'driver');
    assertCapability(session, 'delivery:status:write');

    const currentStatus = await this.deps.deliveriesReadRepo.getCurrentStatus(session.deliveryId);
    assertAllowedTransition(currentStatus, input.nextStatus);

    await this.deps.deliveriesWriteRepo.updateStatus({
      deliveryId: session.deliveryId,
      tenantId: session.tenantId,
      nextStatus: input.nextStatus,
      proofFileId: input.proofFileId ?? null,
      sourceSessionId: session.sessionId,
    });

    await this.deps.publishRealtime({
      tenantId: session.tenantId,
      deliveryId: session.deliveryId,
      eventName: 'delivery.status.updated',
      occurredAt: new Date().toISOString(),
    });
  }

  async attachProofFromPublicSession(session: PublicDeliverySession, input: AttachProofFromPublicSessionInput): Promise<void> {
    assertAudience(session, 'driver');
    assertCapability(session, 'delivery:proof:write');

    await this.deps.deliveriesWriteRepo.attachProof({
      deliveryId: session.deliveryId,
      tenantId: session.tenantId,
      proofFileId: input.proofFileId,
      sourceSessionId: session.sessionId,
    });

    await this.deps.publishRealtime({
      tenantId: session.tenantId,
      deliveryId: session.deliveryId,
      eventName: 'delivery.proof.attached',
      occurredAt: new Date().toISOString(),
    });
  }
}
