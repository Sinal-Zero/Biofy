const DANGEROUS = /^javascript:/i;
const SAFE_SCHEMA = /^(https?:|mailto:|tel:|sms:|wa\.me|whatsapp)/i;

export function normalizeUrl(raw: string): string {
  if (typeof raw !== "string") return "";
  const u = raw.trim();
  if (!u) return "";
  if (DANGEROUS.test(u)) return "";
  if (SAFE_SCHEMA.test(u)) return u;
  if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return "";
  if (!/^https?:\/\//i.test(u)) return `https://${u}`;
  return u;
}

export function isValidUrl(u: string): boolean {
  const n = normalizeUrl(u);
  return n.length > 0 && n !== u || /^https?:\/\//i.test(u);
}
