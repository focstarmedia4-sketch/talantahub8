import { createClient } from '@supabase/supabase-js';
import type { Request, Response } from 'express';

const SUPABASE_URL = "https://ppncmiuqtqtlemhkkzrk.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_8hJ6svy_GgTK6dfnPDnXhw_tXzhBXOI";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);

const BOT_USER_AGENTS = [
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'embedly',
  'telegrambot',
  'slackbot',
  'discordbot',
  'whatsapp',
  'googlebot',
  'bingbot',
  'slack',
  'vkshare',
  'outbrain',
  'pinterest',
  'redditbot',
  'applebot'
];

function isBot(userAgent: string): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some(bot => ua.includes(bot));
}

export default async function handler(req: Request, res: Response) {
  // Extract username from query params.
  // In Vercel, query is parsed on req.query.
  const usernameParam = req.query.username || req.query.profile;
  const username = typeof usernameParam === 'string' ? usernameParam : '';

  if (!username) {
    return res.redirect(302, '/');
  }

  const userAgent = (req.headers['user-agent'] as string) || '';

  // If it's a social media crawler/bot, render the customized Open Graph page
  if (isBot(userAgent)) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, title, avatar_url, bio, category, is_public')
        .eq('username', username.toLowerCase().trim())
        .maybeSingle();

      if (error || !profile) {
        return res.status(200).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Talanta Hub | Where Talent Meets Opportunity</title>
              <meta name="description" content="Discover top creative talent in Kenya. Browse portfolios, post jobs, and connect directly on Talanta Hub.">
              
              <meta property="og:title" content="Talanta Hub | Where Talent Meets Opportunity">
              <meta property="og:description" content="Discover top creative talent in Kenya. Browse portfolios, post jobs, and connect directly on Talanta Hub.">
              <meta property="og:image" content="https://ppncmiuqtqtlemhkkzrk.supabase.co/storage/v1/object/public/ulpoaded%20images/talanta%20hub%20logo.png">
              <meta property="og:image:secure_url" content="https://ppncmiuqtqtlemhkkzrk.supabase.co/storage/v1/object/public/ulpoaded%20images/talanta%20hub%20logo.png">
              <meta property="og:image:type" content="image/png">
              <meta property="og:image:width" content="500">
              <meta property="og:image:height" content="500">
              <meta property="og:url" content="https://talantahub.co.ke/">
              <meta property="og:type" content="website">
              <meta name="twitter:card" content="summary_large_image">
            </head>
            <body>
              <h1>Talanta Hub</h1>
              <p>Where Talent Meets Opportunity</p>
            </body>
          </html>
        `);
      }

      const fullName = profile.full_name || 'Creative Partner';
      const categoryLabel = profile.title || profile.category || 'Creative Professional';
      const bioText = profile.bio || `View ${fullName}'s creative portfolio and connect with them on Talanta Hub.`;
      
      // Determine the absolute base URL of the application dynamically
      const host = req.headers['x-forwarded-host'] || req.headers.host || 'talantahub.co.ke';
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const baseUrl = `${protocol}://${host}`;

      let absoluteAvatarUrl = 'https://ppncmiuqtqtlemhkkzrk.supabase.co/storage/v1/object/public/ulpoaded%20images/talanta%20hub%20logo.png';
      let ogImageType = 'image/png';

      if (profile.avatar_url) {
        const avatarPath = profile.avatar_url.trim();
        if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
          absoluteAvatarUrl = avatarPath;
        } else {
          // Construct absolute URL targeting our custom profile-image secure gateway
          absoluteAvatarUrl = `${baseUrl}/api/profile-image?username=${encodeURIComponent(profile.username)}`;
        }

        if (avatarPath.toLowerCase().endsWith('.png')) {
          ogImageType = 'image/png';
        } else if (avatarPath.toLowerCase().endsWith('.webp')) {
          ogImageType = 'image/webp';
        } else if (avatarPath.toLowerCase().endsWith('.gif')) {
          ogImageType = 'image/gif';
        } else {
          ogImageType = 'image/jpeg';
        }
      }

      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${fullName} | Talanta Hub</title>
            <meta name="description" content="View ${fullName}'s creative portfolio and connect with them on Talanta Hub — Where Talent Meets Opportunity.">
            
            <meta property="og:title" content="${fullName} | Talanta Hub">
            <meta property="og:description" content="View ${fullName}'s creative portfolio and connect with them on Talanta Hub — Where Talent Meets Opportunity.">
            <meta property="og:image" content="${absoluteAvatarUrl}">
            <meta property="og:image:secure_url" content="${absoluteAvatarUrl}">
            <meta property="og:image:type" content="${ogImageType}">
            <meta property="og:image:width" content="500">
            <meta property="og:image:height" content="500">
            <meta property="og:image:alt" content="${fullName}'s Profile Photo">
            <meta property="og:url" content="https://talantahub.co.ke/profile/${profile.username}">
            <meta property="og:type" content="profile">
            
            <meta name="twitter:card" content="summary_large_image">
            <meta name="twitter:title" content="${fullName} | Talanta Hub">
            <meta name="twitter:description" content="View ${fullName}'s creative portfolio and connect with them on Talanta Hub — Where Talent Meets Opportunity.">
            <meta name="twitter:image" content="${absoluteAvatarUrl}">
            
            <link rel="canonical" href="https://talantahub.co.ke/profile/${profile.username}">
          </head>
          <body>
            <h1>${fullName}</h1>
            <h2>${categoryLabel}</h2>
            <p>${bioText}</p>
          </body>
        </html>
      `);
    } catch (err) {
      console.error('Error in profile crawler handler:', err);
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Talanta Hub | Where Talent Meets Opportunity</title>
            <meta name="description" content="Discover top creative talent in Kenya. Browse portfolios, post jobs, and connect directly on Talanta Hub.">
            <meta property="og:title" content="Talanta Hub | Where Talent Meets Opportunity">
            <meta property="og:description" content="Discover top creative talent in Kenya. Browse portfolios, post jobs, and connect directly on Talanta Hub.">
            <meta property="og:image" content="https://ppncmiuqtqtlemhkkzrk.supabase.co/storage/v1/object/public/ulpoaded%20images/talanta%20hub%20logo.png">
            <meta property="og:image:secure_url" content="https://ppncmiuqtqtlemhkkzrk.supabase.co/storage/v1/object/public/ulpoaded%20images/talanta%20hub%20logo.png">
            <meta property="og:image:type" content="image/png">
            <meta property="og:image:width" content="500">
            <meta property="og:image:height" content="500">
            <meta property="og:type" content="website">
          </head>
          <body>
            <h1>Talanta Hub</h1>
            <p>Where Talent Meets Opportunity</p>
          </body>
        </html>
      `);
    }
  }

  // Normal user: redirect to SPA home with deep link query parameter
  return res.redirect(302, `/?profile=${username.toLowerCase().trim()}`);
}
