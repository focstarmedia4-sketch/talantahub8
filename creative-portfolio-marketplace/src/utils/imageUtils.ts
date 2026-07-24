/**
 * Optimizes image URLs (particularly Unsplash and external CDNs)
 * to serve compressed WebP/AVIF images at appropriate dimensions.
 */
export function optimizeImageUrl(url?: string, width: number = 600, quality: number = 75): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.includes('images.unsplash.com')) {
    const baseUrl = trimmed.split('?')[0];
    return `${baseUrl}?auto=format&fit=crop&w=${width}&q=${quality}`;
  }
  return trimmed;
}

export function optimizeAvatarUrl(url?: string): string {
  return optimizeImageUrl(url, 200, 75);
}

export function optimizeCardUrl(url?: string): string {
  return optimizeImageUrl(url, 600, 75);
}

export function optimizeHeroUrl(url?: string): string {
  return optimizeImageUrl(url, 1200, 80);
}
