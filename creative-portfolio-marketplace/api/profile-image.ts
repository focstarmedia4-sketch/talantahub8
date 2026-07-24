import { createClient } from '@supabase/supabase-js';
import type { Request, Response } from 'express';

const SUPABASE_URL = "https://ppncmiuqtqtlemhkkzrk.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_8hJ6svy_GgTK6dfnPDnXhw_tXzhBXOI";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);

const DEFAULT_LOGO_URL = 'https://ppncmiuqtqtlemhkkzrk.supabase.co/storage/v1/object/public/ulpoaded%20images/talanta%20hub%20logo.png';

export default async function handler(req: Request, res: Response) {
  const usernameParam = req.query.username || req.query.profile;
  const idParam = req.query.id || req.query.userId;
  const username = typeof usernameParam === 'string' ? usernameParam.toLowerCase().trim() : '';
  const id = typeof idParam === 'string' ? idParam.trim() : '';

  if (!username && !id) {
    return res.redirect(302, DEFAULT_LOGO_URL);
  }

  try {
    let query = supabase.from('profiles').select('avatar_url, username');
    
    if (username) {
      query = query.eq('username', username);
    } else if (id) {
      query = query.eq('id', id);
    }

    const { data: profile, error } = await query.maybeSingle();

    if (error || !profile || !profile.avatar_url) {
      return res.redirect(302, DEFAULT_LOGO_URL);
    }

    const avatarPath = profile.avatar_url.trim();

    // If it's already an absolute HTTP/HTTPS URL (e.g. social signup avatar)
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
      // Fetch it or redirect to it. Serving via redirect is simple, but we can fetch & pipe to ensure stable content-type.
      // Let's redirect since it is already public.
      return res.redirect(302, avatarPath);
    }

    // If it's a Supabase storage path in the private 'app-files' bucket
    // Generate a temporary signed URL (valid for 60 seconds) on the server.
    const { data, error: signError } = await supabase.storage
      .from('app-files')
      .createSignedUrl(avatarPath, 60);

    if (signError || !data?.signedUrl) {
      console.error('Error generating signed URL for profile avatar:', signError);
      return res.redirect(302, DEFAULT_LOGO_URL);
    }

    // Fetch the raw image data from the private bucket using the server-side signed URL
    const imgRes = await fetch(data.signedUrl);
    if (!imgRes.ok) {
      throw new Error(`Failed to fetch from signed URL: ${imgRes.statusText}`);
    }

    const arrayBuffer = await imgRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Identify the content type, default to image/jpeg if not found
    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';

    res.setHeader('Content-Type', contentType);
    // Dynamic caching headers so WhatsApp/Facebook can cache this avatar for 1 day
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    
    return res.status(200).send(buffer);
  } catch (err) {
    console.error('Failed to serve profile image:', err);
    return res.redirect(302, DEFAULT_LOGO_URL);
  }
}
