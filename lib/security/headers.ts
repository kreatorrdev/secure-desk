export const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
];
export function transportHeaders(site: string) {
  return new URL(site).protocol === 'https:'
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000' }]
    : [];
}
export function contentSecurityPolicy(nonce: string, api: string, site: string, development: boolean) {
  if (!/^[A-Za-z0-9+/]{20,}={0,2}$/.test(nonce)) throw new Error('Invalid request nonce');
  const target = new URL(api), origin = new URL(site);
  if (![target, origin].every(url => ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password)) throw new Error('Invalid application origin');
  const socket = (target.protocol === 'https:' ? 'wss://' : 'ws://') + target.host;
  const developmentSocket = development ? ' ' + (origin.protocol === 'https:' ? 'wss://' : 'ws://') + origin.host : '';
  return [
    "default-src 'self'",
    "script-src 'self' 'nonce-" + nonce + "' 'strict-dynamic'" + (development ? " 'unsafe-eval'" : ''),
    "script-src-attr 'none'",
    "style-src 'self' 'nonce-" + nonce + "'",
    "style-src-attr 'none'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self' " + target.origin + ' ' + socket + developmentSocket,
    "object-src 'none'", "base-uri 'none'", "form-action 'self'", "frame-ancestors 'none'",
    ...(origin.protocol === 'https:' ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
}

export function responseContentSecurityPolicy(pathname: string, pagePolicy: string) {
  // A private byte response keeps its stricter sandbox even when Proxy headers win the merge.
  return /^\/organizations\/[^/]+\/(tickets|proposals)\/[^/]+\/attachments\/[^/]+\/?$/.test(pathname)
    ? "sandbox; default-src 'none'" : pagePolicy;
}
