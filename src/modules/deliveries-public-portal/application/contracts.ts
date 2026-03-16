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
