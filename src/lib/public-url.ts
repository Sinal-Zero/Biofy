export const PUBLIC_SITE_ORIGIN = "https://bio-fy.vercel.app";
export const PUBLIC_SITE_DISPLAY = "bio-fy.vercel.app";

export function normalizeUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 30);
}

export function getPublicBioUrl(username: string) {
  return `${PUBLIC_SITE_ORIGIN}/${username}`;
}

export function getPublicBioDisplay(username?: string | null) {
  return username ? `${PUBLIC_SITE_DISPLAY}/${username}` : `${PUBLIC_SITE_DISPLAY}/`;
}
