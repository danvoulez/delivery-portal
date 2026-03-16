export interface DeliveriesPublicPortalConfig {
  appUrl: string;
  portalSessionSecret: string;
  portalSessionTtlSeconds: number;
}

export function getDeliveriesPublicPortalConfig(): DeliveriesPublicPortalConfig {
  const appUrl = process.env.APP_URL;
  const portalSessionSecret = process.env.PORTAL_JWT_SECRET ?? process.env.PORTAL_SESSION_SECRET;
  const ttl = process.env.PORTAL_SESSION_TTL_SECONDS ?? '3600';

  if (!appUrl) throw new Error('Missing APP_URL');
  if (!portalSessionSecret) throw new Error('Missing PORTAL_JWT_SECRET');

  return {
    appUrl,
    portalSessionSecret,
    portalSessionTtlSeconds: Number(ttl),
  };
}
