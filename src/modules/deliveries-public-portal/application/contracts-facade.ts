import type {
  DeliveryPortalAudience,
  PublicDeliverySession,
} from '../domain/types';
import type {
  DeliveryMessageView,
  DriverDeliveryJobView,
  PublicDeliveryTrackingView,
} from './contracts';

export interface ResolvePortalSessionInput {
  token: string;
}

export interface ResolvePortalSessionResult {
  session: PublicDeliverySession;
  portalSessionToken: string;
  deliveryPublicRef: string;
}

export interface ListMessagesForSessionResult {
  messages: DeliveryMessageView[];
}

export interface PostMessageFromSessionInput {
  body: string;
}

export interface PostMessageFromSessionResult {
  messageId: string;
}

export interface PostLocationFromSessionInput {
  latitude: number;
  longitude: number;
  accuracyMeters?: number | null;
  recordedAt?: string;
}

export interface PostLocationFromSessionResult {
  locationId: string;
}

export interface PostStatusFromSessionInput {
  nextStatus: string;
  proofFileId?: string | null;
}

export interface PostStatusFromSessionResult {
  previousStatus: string;
  currentStatus: string;
}

export interface AttachProofFromSessionInput {
  proofFileId: string;
}

export interface AttachProofFromSessionResult {
  proofFileId: string;
}

export interface DeliveriesPublicPortalFacade {
  resolvePortalSession(input: ResolvePortalSessionInput): Promise<ResolvePortalSessionResult>;
  getTrackingViewForSession(session: PublicDeliverySession): Promise<PublicDeliveryTrackingView>;
  getDriverJobViewForSession(session: PublicDeliverySession): Promise<DriverDeliveryJobView>;
  listMessagesForSession(session: PublicDeliverySession): Promise<ListMessagesForSessionResult>;
  postMessageFromSession(
    session: PublicDeliverySession,
    input: PostMessageFromSessionInput
  ): Promise<PostMessageFromSessionResult>;
  postLocationFromSession(
    session: PublicDeliverySession,
    input: PostLocationFromSessionInput
  ): Promise<PostLocationFromSessionResult>;
  postStatusFromSession(
    session: PublicDeliverySession,
    input: PostStatusFromSessionInput
  ): Promise<PostStatusFromSessionResult>;
  attachProofFromSession(
    session: PublicDeliverySession,
    input: AttachProofFromSessionInput
  ): Promise<AttachProofFromSessionResult>;
}
