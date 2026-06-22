/**
 * Prepend the Next.js basePath to API routes for client-side fetch() calls.
 * Next.js auto-prefixes <Link> and router.push() but NOT raw fetch().
 * This ensures /api/* calls work whether basePath is '/hq' or '/'.
 */

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function apiUrl(path: string): string {
  // Already has basePath prefix — don't double-prefix
  if (basePath && path.startsWith(basePath)) return path;
  return `${basePath}${path}`;
}
