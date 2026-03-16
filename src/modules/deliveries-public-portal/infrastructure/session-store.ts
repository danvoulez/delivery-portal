/**
 * Sessão curta assinada ou guardada em storage efêmero.
 * Para começar simples: cookie httpOnly ou bearer assinado pelo backend.
 */
import type { PublicDeliverySession } from '../domain/types';

export interface SessionStore {
  issue(session: Omit<PublicDeliverySession, 'sessionId'>): Promise<PublicDeliverySession>;
  read(sessionToken: string): Promise<PublicDeliverySession>;
}
