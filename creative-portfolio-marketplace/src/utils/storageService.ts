import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FreelancerProfile, PortfolioItem, FeedPost, CategorySection } from '../types';

// Global cache for signed URLs to optimize performance
const signedUrlsCache: Record<string, { url: string; expiresAt: number }> = {};

/**
 * Checks if a path is a Supabase Storage path.
 */
export function isStoragePath(path: string | null | undefined): boolean {
  if (!path) return false;
  const s = path.trim();
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:')) {
    return false;
  }
  return s.includes('/');
}

/**
 * Extracts the storage file path from a signed or public Supabase URL.
 */
export function getStoragePathFromUrl(url: string | null | undefined): string {
  if (!url) return '';
  const s = url.trim();
  if (s.includes('/storage/v1/object/')) {
    const parts = s.split('/app-files/');
    if (parts.length > 1) {
      const pathWithQuery = parts[1];
      const path = pathWithQuery.split('?')[0]; // remove query parameters
      return decodeURIComponent(path);
    }
  }
  return s;
}

/**
 * Generates a signed URL for a given Supabase Storage path.
 * Uses a global cache to avoid redundant API requests.
 */
export async function getSignedUrl(path: string | null | undefined): Promise<string> {
  if (!path) return '';
  const trimmed = path.trim();
  if (!isStoragePath(trimmed)) {
    return trimmed;
  }

  const now = Date.now();
  const cached = signedUrlsCache[trimmed];
  if (cached && cached.expiresAt > now + 60000) { // Valid for at least another minute
    return cached.url;
  }

  try {
    const { data, error } = await supabase.storage
      .from('app-files')
      .createSignedUrl(trimmed, 3600); // 1 hour expiry

    if (error) throw error;
    if (data?.signedUrl) {
      signedUrlsCache[trimmed] = {
        url: data.signedUrl,
        expiresAt: now + 3600 * 1000
      };
      return data.signedUrl;
    }
  } catch (err) {
    console.warn('Failed to generate signed URL for storage path:', trimmed, err);
  }
  return '';
}

/**
 * React hook to retrieve a signed URL for any image or video source dynamically.
 */
export function useSignedUrl(path: string | null | undefined): string {
  const [url, setUrl] = useState<string>(() => {
    if (!path) return '';
    if (!isStoragePath(path)) return path;
    const cached = signedUrlsCache[path.trim()];
    if (cached && cached.expiresAt > Date.now() + 60000) {
      return cached.url;
    }
    return '';
  });

  useEffect(() => {
    if (!path) {
      setUrl('');
      return;
    }
    const trimmed = path.trim();
    if (!isStoragePath(trimmed)) {
      setUrl(trimmed);
      return;
    }

    let isMounted = true;
    getSignedUrl(trimmed).then((resolvedUrl) => {
      if (isMounted) {
        setUrl(resolvedUrl);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [path]);

  return url;
}

/**
 * Converts a base64 data URI to a Blob.
 */
export function dataURItoBlob(dataURI: string): Blob {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}

/**
 * Helper to generate UUID.
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Uploads a base64 data URL to Supabase Storage.
 * Saves file under {auth.uid()}/{featureName}/{recordId}/{uuid}.{extension}
 */
export async function uploadBase64(
  base64: string,
  userId: string,
  featureName: string,
  recordId: string
): Promise<string> {
  if (!base64.startsWith('data:')) {
    return base64; // Already a URL or path
  }

  try {
    const blob = dataURItoBlob(base64);
    const mime = blob.type;
    let extension = 'jpg';
    if (mime === 'image/png') extension = 'png';
    else if (mime === 'image/gif') extension = 'gif';
    else if (mime === 'image/webp') extension = 'webp';
    else if (mime === 'video/mp4') extension = 'mp4';
    else if (mime === 'video/webm') extension = 'webm';
    else if (mime === 'video/ogg') extension = 'ogg';

    const uuid = generateUUID();
    const filePath = `${userId}/${featureName}/${recordId}/${uuid}.${extension}`;

    const { error } = await supabase.storage
      .from('app-files')
      .upload(filePath, blob, {
        contentType: mime,
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;
    return filePath;
  } catch (err) {
    console.error('Error uploading base64 to storage:', err);
    throw err;
  }
}

/**
 * Scans a profile, uploads any base64 properties to Storage, and returns the updated profile
 * with storage paths.
 */
export async function processProfileUploads(profile: FreelancerProfile): Promise<FreelancerProfile> {
  const userId = profile.id;
  const updated = { ...profile };

  // 1. Avatar
  if (updated.avatarUrl && updated.avatarUrl.startsWith('data:')) {
    updated.avatarUrl = await uploadBase64(updated.avatarUrl, userId, 'profile', 'avatar');
  }
  if (updated.originalAvatarUrl && updated.originalAvatarUrl.startsWith('data:')) {
    updated.originalAvatarUrl = await uploadBase64(updated.originalAvatarUrl, userId, 'profile', 'avatar-original');
  }

  // 2. Cover Banner
  if (updated.coverUrl && updated.coverUrl.startsWith('data:')) {
    updated.coverUrl = await uploadBase64(updated.coverUrl, userId, 'profile', 'cover');
  }
  if (updated.originalCoverUrl && updated.originalCoverUrl.startsWith('data:')) {
    updated.originalCoverUrl = await uploadBase64(updated.originalCoverUrl, userId, 'profile', 'cover-original');
  }

  // 3. Portfolio items
  if (updated.portfolio && updated.portfolio.length > 0) {
    updated.portfolio = await Promise.all(
      updated.portfolio.map(async (item) => {
        const itemCopy = { ...item };
        const recordId = item.id;
        
        if (itemCopy.imageUrl && itemCopy.imageUrl.startsWith('data:')) {
          itemCopy.imageUrl = await uploadBase64(itemCopy.imageUrl, userId, 'portfolio', recordId);
        }
        
        if (itemCopy.videoUrl && itemCopy.videoUrl.startsWith('data:')) {
          itemCopy.videoUrl = await uploadBase64(itemCopy.videoUrl, userId, 'portfolio', recordId);
        }
        
        if (itemCopy.galleryUrls && itemCopy.galleryUrls.length > 0) {
          itemCopy.galleryUrls = await Promise.all(
            itemCopy.galleryUrls.map(async (gUrl, idx) => {
              if (gUrl && gUrl.startsWith('data:')) {
                return await uploadBase64(gUrl, userId, 'portfolio', `${recordId}-gallery-${idx}`);
              }
              return gUrl;
            })
          );
        }
        
        return itemCopy;
      })
    );
  }

  // 4. Feed posts
  if (updated.feedPosts && updated.feedPosts.length > 0) {
    updated.feedPosts = await Promise.all(
      updated.feedPosts.map(async (post) => {
        const postCopy = { ...post };
        if (postCopy.imageUrl && postCopy.imageUrl.startsWith('data:')) {
          postCopy.imageUrl = await uploadBase64(postCopy.imageUrl, userId, 'feed-posts', post.id);
        }
        return postCopy;
      })
    );
  }

  // 5. Notable clients
  if (updated.notableClients && updated.notableClients.length > 0) {
    updated.notableClients = await Promise.all(
      updated.notableClients.map(async (client) => {
        const clientCopy = { ...client };
        if (clientCopy.logoUrl && clientCopy.logoUrl.startsWith('data:')) {
          clientCopy.logoUrl = await uploadBase64(clientCopy.logoUrl, userId, 'company', 'logo');
        }
        return clientCopy;
      })
    );
  }

  return updated;
}

/**
 * Scans a profile, fetches signed URLs for any storage paths, and returns the profile.
 */
export async function resolveProfileUrls(profile: FreelancerProfile): Promise<FreelancerProfile> {
  const updated = { ...profile };

  // Avatar
  if (isStoragePath(updated.avatarUrl)) {
    updated.avatarUrl = await getSignedUrl(updated.avatarUrl);
  }
  if (isStoragePath(updated.originalAvatarUrl)) {
    updated.originalAvatarUrl = await getSignedUrl(updated.originalAvatarUrl);
  }

  // Cover
  if (isStoragePath(updated.coverUrl)) {
    updated.coverUrl = await getSignedUrl(updated.coverUrl);
  }
  if (isStoragePath(updated.originalCoverUrl)) {
    updated.originalCoverUrl = await getSignedUrl(updated.originalCoverUrl);
  }

  // Portfolio
  if (updated.portfolio && updated.portfolio.length > 0) {
    updated.portfolio = await Promise.all(
      updated.portfolio.map(async (item) => {
        const itemCopy = { ...item };
        if (isStoragePath(itemCopy.imageUrl)) {
          itemCopy.imageUrl = await getSignedUrl(itemCopy.imageUrl);
        }
        if (isStoragePath(itemCopy.videoUrl)) {
          itemCopy.videoUrl = await getSignedUrl(itemCopy.videoUrl);
        }
        if (itemCopy.galleryUrls && itemCopy.galleryUrls.length > 0) {
          itemCopy.galleryUrls = await Promise.all(
            itemCopy.galleryUrls.map(async (gUrl) => {
              if (isStoragePath(gUrl)) {
                return await getSignedUrl(gUrl);
              }
              return gUrl;
            })
          );
        }
        return itemCopy;
      })
    );
  }

  // Feed posts
  if (updated.feedPosts && updated.feedPosts.length > 0) {
    updated.feedPosts = await Promise.all(
      updated.feedPosts.map(async (post) => {
        const postCopy = { ...post };
        if (isStoragePath(postCopy.imageUrl)) {
          postCopy.imageUrl = await getSignedUrl(postCopy.imageUrl);
        }
        return postCopy;
      })
    );
  }

  // Notable clients
  if (updated.notableClients && updated.notableClients.length > 0) {
    updated.notableClients = await Promise.all(
      updated.notableClients.map(async (client) => {
        const clientCopy = { ...client };
        if (isStoragePath(clientCopy.logoUrl)) {
          clientCopy.logoUrl = await getSignedUrl(clientCopy.logoUrl);
        }
        return clientCopy;
      })
    );
  }

  return updated;
}

/**
 * Converts all signed URLs in a profile back into raw storage paths.
 */
export function cleanProfileUrls(profile: FreelancerProfile): FreelancerProfile {
  const updated = { ...profile };

  updated.avatarUrl = getStoragePathFromUrl(updated.avatarUrl);
  updated.originalAvatarUrl = getStoragePathFromUrl(updated.originalAvatarUrl);

  updated.coverUrl = getStoragePathFromUrl(updated.coverUrl);
  updated.originalCoverUrl = getStoragePathFromUrl(updated.originalCoverUrl);

  if (updated.portfolio && updated.portfolio.length > 0) {
    updated.portfolio = updated.portfolio.map((item) => {
      const itemCopy = { ...item };
      itemCopy.imageUrl = getStoragePathFromUrl(itemCopy.imageUrl);
      if (itemCopy.videoUrl) {
        itemCopy.videoUrl = getStoragePathFromUrl(itemCopy.videoUrl);
      }
      if (itemCopy.galleryUrls && itemCopy.galleryUrls.length > 0) {
        itemCopy.galleryUrls = itemCopy.galleryUrls.map(gUrl => getStoragePathFromUrl(gUrl));
      }
      return itemCopy;
    });
  }

  if (updated.feedPosts && updated.feedPosts.length > 0) {
    updated.feedPosts = updated.feedPosts.map((post) => {
      const postCopy = { ...post };
      postCopy.imageUrl = getStoragePathFromUrl(postCopy.imageUrl);
      return postCopy;
    });
  }

  if (updated.notableClients && updated.notableClients.length > 0) {
    updated.notableClients = updated.notableClients.map((client) => {
      const clientCopy = { ...client };
      clientCopy.logoUrl = getStoragePathFromUrl(clientCopy.logoUrl);
      return clientCopy;
    });
  }

  return updated;
}

/**
 * Extracts all unique storage file paths from a profile.
 */
export function getAllStoragePaths(profile: FreelancerProfile | null | undefined): string[] {
  if (!profile) return [];
  const paths: string[] = [];

  const add = (url: string | null | undefined) => {
    if (url) {
      const p = getStoragePathFromUrl(url);
      if (isStoragePath(p)) {
        paths.push(p);
      }
    }
  };

  add(profile.avatarUrl);
  add(profile.originalAvatarUrl);
  add(profile.coverUrl);
  add(profile.originalCoverUrl);

  if (profile.portfolio) {
    profile.portfolio.forEach((item) => {
      add(item.imageUrl);
      add(item.videoUrl);
      if (item.galleryUrls) {
        item.galleryUrls.forEach(url => add(url));
      }
    });
  }

  if (profile.feedPosts) {
    profile.feedPosts.forEach((post) => {
      add(post.imageUrl);
    });
  }

  if (profile.notableClients) {
    profile.notableClients.forEach((client) => {
      add(client.logoUrl);
    });
  }

  return paths;
}

/**
 * Compares old and new profile to find any storage paths that have been removed.
 */
export function findRemovedStoragePaths(oldProfile: FreelancerProfile, newProfile: FreelancerProfile): string[] {
  const oldPaths = getAllStoragePaths(oldProfile);
  const newPaths = getAllStoragePaths(newProfile);

  return oldPaths.filter(path => !newPaths.includes(path));
}

/**
 * Deletes multiple files from Supabase Storage.
 */
export async function deleteStorageFiles(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  try {
    const { error } = await supabase.storage
      .from('app-files')
      .remove(paths);
    if (error) throw error;
    console.log('Successfully deleted storage files:', paths);
  } catch (err) {
    console.warn('Failed to delete storage files from bucket:', paths, err);
  }
}
