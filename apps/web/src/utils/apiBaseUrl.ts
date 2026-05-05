const LOCAL_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  'host.docker.internal',
]);

export function isLocalApiBaseUrl(baseUrl: string): boolean {
  try {
    const parsed = new URL(baseUrl.trim());
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    const { hostname } = parsed;
    return (
      LOCAL_HOSTS.has(hostname) ||
      hostname.startsWith('169.254.') ||
      hostname.startsWith('10.') ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
    );
  } catch {
    return false;
  }
}

export function allowLocalApiWithoutKey(config: {
  allowLocalApiBaseUrl?: boolean;
  baseUrl: string;
}): boolean {
  return Boolean(config.allowLocalApiBaseUrl && isLocalApiBaseUrl(config.baseUrl));
}