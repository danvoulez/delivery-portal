import type {
  DeliveryMessageAudience,
  DeliveryPortalAudience,
  DeliveryStatus,
  PublicDeliverySession,
} from '../domain/types';

export interface ResolveDeliveryPortalSessionInput {
  token: string;
}

export interface ResolveDeliveryPortalSessionResult {
  sessionId: string;
  audience: DeliveryPortalAudience;
  deliveryPublicRef: string;
  expiresAt: string;
  capabilities: string[];
}

export interface DeliveryTimelineItem {
  type: string;
  label: string;
  at: string;
}

export interface LatestLocationView {
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  recordedAt: string;
}

export interface DeliveryMessageView {
  id: string;
  senderLabel: string;
  body: string;
  createdAt: string;
  audience: DeliveryMessageAudience;
}

export interface PublicDeliveryTrackingView {
  deliveryPublicRef: string;
  status: DeliveryStatus;
  statusLabel: string;
  timeline: DeliveryTimelineItem[];
  etaSimple: string | null;
  destinationSummary: string;
  latestLocation: LatestLocationView | null;
  lastLocationAt: string | null;
  proofSummary: { available: boolean; label?: string } | null;
  messageThreadPreview: DeliveryMessageView[];
}

export interface DriverDeliveryJobView {
  deliveryPublicRef: string;
  pickupSummary: string;
  dropoffSummary: string;
  instructions: string | null;
  currentStatus: DeliveryStatus;
  allowedNextStatuses: DeliveryStatus[];
  proofRequirements: {
    requiredForStatuses: DeliveryStatus[];
  };
  messageThreadPreview: DeliveryMessageView[];
  navigationDeepLink: string | null;
}

export interface CreateDeliveryAccessLinkInput {
  deliveryId: string;
  audience: DeliveryPortalAudience;
  expiresAt: string;
}

export interface CreateDeliveryAccessLinkResult {
  accessLinkId: string;
  linkUrl: string;
}

export interface RevokeDeliveryAccessLinkInput {
  accessLinkId: string;
}

export interface PostDriverLocationInput {
  latitude: number;
  longitude: number;
  accuracyMeters?: number | null;
  recordedAt: string;
}

export interface PostDeliveryMessageInput {
  body: string;
}

export interface UpdateDeliveryStatusFromPublicSessionInput {
  nextStatus: DeliveryStatus;
  proofFileId?: string | null;
}

export interface AttachProofFromPublicSessionInput {
  proofFileId: string;
}

// ---------------------------------------------------------------------------
// Repository port interfaces — implemented by the infra/repositories layer
// ---------------------------------------------------------------------------

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
  getCurrentStatus(deliveryId: string): Promise<string>;
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

export interface DeliveriesPublicPortalService {
  resolveSession(input: ResolveDeliveryPortalSessionInput): Promise<ResolveDeliveryPortalSessionResult>;

  getPublicDeliveryTrackingView(session: PublicDeliverySession): Promise<PublicDeliveryTrackingView>;
  getDriverDeliveryJobView(session: PublicDeliverySession): Promise<DriverDeliveryJobView>;
  listDeliveryMessagesForSession(session: PublicDeliverySession): Promise<DeliveryMessageView[]>;

  createDeliveryAccessLink(
    input: CreateDeliveryAccessLinkInput,
    actorProfileId: string
  ): Promise<CreateDeliveryAccessLinkResult>;

  revokeDeliveryAccessLink(
    input: RevokeDeliveryAccessLinkInput,
    actorProfileId: string
  ): Promise<void>;

  postDriverLocation(session: PublicDeliverySession, input: PostDriverLocationInput): Promise<void>;
  postDeliveryMessage(session: PublicDeliverySession, input: PostDeliveryMessageInput): Promise<void>;
  updateDeliveryStatusFromPublicSession(
    session: PublicDeliverySession,
    input: UpdateDeliveryStatusFromPublicSessionInput
  ): Promise<void>;
  attachProofFromPublicSession(
    session: PublicDeliverySession,
    input: AttachProofFromPublicSessionInput
  ): Promise<void>;
}
