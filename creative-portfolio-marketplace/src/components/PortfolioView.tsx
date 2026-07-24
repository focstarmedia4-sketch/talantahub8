/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Share2, Star, Send, MapPin, Search,
  ExternalLink, Mail, CheckCircle, Flame, MessageSquare, Phone,
  Heart, Camera, Plus, Image as ImageIcon, Users, X, ChevronLeft, ChevronRight, Pencil, UploadCloud,
  Lock, Unlock, AlertCircle, Check, Tag, Calendar, Percent, Megaphone, PhoneCall
} from 'lucide-react';
import { FreelancerProfile, Review, CreativeCategory, PortfolioItem, FeedPost, Job } from '../types';
import { THEME_CONFIGS } from './ThemeStyles';
import { motion, AnimatePresence } from 'motion/react';
import { checkIfContactUnlocked, createContactUnlock, fetchUnlockedContactDetails } from '../utils/supabaseService';
import { NotableClients } from './NotableClients';
import { RequestCall } from './RequestCall';
import { ImageCropperModal } from './ImageCropperModal';
import { formatTimelineTime } from '../utils/time';
import { optimizeAvatarUrl, optimizeCardUrl, optimizeHeroUrl } from '../utils/imageUtils';

interface PortfolioViewProps {
  profile: FreelancerProfile;
  activeRole?: string;
  onUpdateProfile?: (updated: FreelancerProfile) => void;
  onAddReview: (freelancerId: string, review: Omit<Review, 'id' | 'date'>, specificJobId?: string) => any;
  onSendMessageFromContact: (freelancerId: string, messageText: string, clientName: string) => void;
  onBackToMarketplace: () => void;
  allFreelancers?: FreelancerProfile[];
  onSelectFreelancer?: (id: string) => void;
  isLoggedIn?: boolean;
  jobs?: Job[];
}

const limitWords = (str: string, maxWords: number = 20) => {
  if (!str) return '';
  const words = str.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return str;
  return words.slice(0, maxWords).join(' ') + '...';
};

const PROJECT_GALLERIES: Record<string, { type: 'photo' | 'video'; items: string[] }> = {
  p1_1: {
    type: 'video',
    items: [
      'https://assets.mixkit.co/videos/preview/mixkit-neon-light-from-a-street-sign-41851-large.mp4',
      'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  p1_2: {
    type: 'video',
    items: [
      'https://assets.mixkit.co/videos/preview/mixkit-coffee-being-poured-into-a-cup-34441-large.mp4',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  p1_3: {
    type: 'video',
    items: [
      'https://assets.mixkit.co/videos/preview/mixkit-car-driving-on-a-highway-at-sunset-34358-large.mp4',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  p1_4: {
    type: 'photo',
    items: [
      'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  p2_1: {
    type: 'photo',
    items: [
      'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  p2_2: {
    type: 'photo',
    items: [
      'https://images.unsplash.com/photo-1554080353-a576cf803bda?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1504198453319-5ce911bafcde?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  p2_3: {
    type: 'photo',
    items: [
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1494972308805-463bc619d34e?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1471180625745-944903837c22?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  p2_4: {
    type: 'photo',
    items: [
      'https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  p3_1: {
    type: 'photo',
    items: [
      'https://images.unsplash.com/photo-1608248597481-496100c80836?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  p3_2: {
    type: 'photo',
    items: [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  p3_3: {
    type: 'photo',
    items: [
      'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  p3_4: {
    type: 'photo',
    items: [
      'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  p4_1: {
    type: 'photo',
    items: [
      'https://images.unsplash.com/photo-1501472312651-726afd116ff1?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  p4_2: {
    type: 'photo',
    items: [
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  p4_3: {
    type: 'photo',
    items: [
      'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  p4_4: {
    type: 'photo',
    items: [
      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1200'
    ]
  }
};

const getSpecialization = (item: PortfolioItem) => {
  const titleLower = item.title.toLowerCase();
  const descLower = item.description.toLowerCase();

  if (item.category === 'photography') {
    if (titleLower.includes('wedding') || descLower.includes('wedding')) return 'Wedding Photography';
    if (titleLower.includes('portrait') || descLower.includes('portrait') || titleLower.includes('reflections')) return 'Portrait Photography';
    if (titleLower.includes('editorial') || descLower.includes('editorial')) return 'Editorial Photography';
    if (titleLower.includes('landscape') || titleLower.includes('desert') || titleLower.includes('silence')) return 'Fine Art & Landscape Photography';
    if (titleLower.includes('street') || descLower.includes('street') || titleLower.includes('nostalgia') || titleLower.includes('paris')) return 'Street & Lifestyle Photography';
    if (titleLower.includes('behind') || titleLower.includes('bts') || titleLower.includes('nocturnal')) return 'Behind-The-Scenes Photography';
    return 'Wedding & Event Photography';
  }

  if (item.category === 'videography') {
    if (titleLower.includes('campaign') || titleLower.includes('streetwear') || titleLower.includes('ethereal')) return 'Fashion Video Campaign';
    if (titleLower.includes('documentary') || titleLower.includes('coffee') || titleLower.includes('origins')) return 'Documentary Brand Promo';
    if (titleLower.includes('automotive') || titleLower.includes('ev') || titleLower.includes('velocity')) return 'Automotive Commercial Video';
    if (titleLower.includes('reel') || titleLower.includes('promo')) return 'Cinematic Promotional Reel';
    return 'Cinematic Videography';
  }

  if (item.category === 'design' || item.category === 'branding' || item.category === 'webdev') {
    if (titleLower.includes('identity') || titleLower.includes('branding') || titleLower.includes('kanso')) return 'Brand Identity Design';
    if (titleLower.includes('editorial') || titleLower.includes('publication') || titleLower.includes('layout') || titleLower.includes('book') || titleLower.includes('symmetry')) return 'Editorial & Print Layout';
    if (titleLower.includes('typeface') || titleLower.includes('font') || titleLower.includes('bauhaus')) return 'Custom Typeface Design';
    return 'Graphic & Visual Design';
  }

  if (item.category === 'illustration') {
    if (titleLower.includes('ecosystem') || titleLower.includes('roots') || titleLower.includes('woodland')) return 'Editorial Woodland Illustration';
    if (titleLower.includes('label') || titleLower.includes('package') || titleLower.includes('kombucha') || titleLower.includes('botanical')) return 'Botanical Package Illustration';
    if (titleLower.includes('cover') || titleLower.includes('children') || titleLower.includes('voyager')) return 'Children\'s Book Cover Art';
    if (titleLower.includes('pattern') || titleLower.includes('seamless') || titleLower.includes('botany')) return 'Seamless Pattern Design';
    return 'Digital & Fine Art Illustration';
  }

  // Fallback
  return `Specialized ${item.category.charAt(0).toUpperCase() + item.category.slice(1)}`;
};

const checkContactViolation = (text: string) => {
  if (!text) return null;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;
  // Check for sequences that look like phone numbers
  const cleanedDigits = text.replace(/[^0-9]/g, '');
  const phoneRegex = /(\+?\d[\s-()?]?){7,15}/;
  const urlRegex = /(https?:\/\/|www\.)[^\s]+/i;
  const domainRegex = /\b[a-zA-Z0-9-]+\.(com|net|org|edu|gov|io|co|ke|me|info|biz|uk|ca|us)\b/i;

  if (emailRegex.test(text)) {
    return "Email sharing is not allowed on this timeline for safety.";
  }
  if (phoneRegex.test(text) && cleanedDigits.length >= 7) {
    return "Phone number sharing is not allowed on this timeline for safety.";
  }
  if (urlRegex.test(text) || domainRegex.test(text)) {
    return "External link sharing is not allowed on this timeline for safety.";
  }
  return null;
};

export default function PortfolioView({ 
  profile, 
  activeRole,
  onUpdateProfile,
  onAddReview, 
  onSendMessageFromContact, 
  onBackToMarketplace,
  allFreelancers = [],
  onSelectFreelancer,
  isLoggedIn = true,
  jobs = []
}: PortfolioViewProps) {
  const theme = THEME_CONFIGS.slate;

  // Scroll to top on profile change/mount
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [profile.id]);

  // Is current viewer the owner of this profile?
  const isOwner = activeRole === profile.id;

  // Secure Contact Unlocks States
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockedContacts, setUnlockedContacts] = useState<{ email?: string; phone?: string; whatsapp?: string } | null>(null);
  const [checkingUnlock, setCheckingUnlock] = useState(false);

  // Pesapal Payment States inside PortfolioView
  const [showPesapalModal, setShowPesapalModal] = useState(false);
  const [pesapalPhone, setPesapalPhone] = useState('');
  const [pesapalEmail, setPesapalEmail] = useState('');
  const [pesapalMethod, setPesapalMethod] = useState<'mpesa' | 'card' | 'secure_online'>('secure_online');
  const [mpesaPin, setMpesaPin] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [expandedOfferId, setExpandedOfferId] = useState<string | null>(null);

  const handleOpenSecureTab = () => {
    try {
      const newTab = window.open();
      if (newTab) {
        newTab.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Secure Online Checkout | Talanta Hub</title>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <script src="https://cdn.tailwindcss.com"></script>
              <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
              <style>
                body {
                  font-family: 'Space Grotesk', sans-serif;
                }
                .mono {
                  font-family: 'JetBrains Mono', monospace;
                }
              </style>
            </head>
            <body class="bg-slate-950 text-white flex items-center justify-center min-h-screen p-4 overflow-hidden">
              <!-- Radial Glow Effect -->
              <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15),transparent_60%)] pointer-events-none"></div>

              <div class="relative bg-slate-900/60 border border-indigo-500/20 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl backdrop-blur-xl">
                <!-- Lock Icon with Glow -->
                <div class="relative inline-flex p-5 bg-gradient-to-tr from-indigo-500/20 to-rose-500/20 text-indigo-400 rounded-full border border-indigo-500/30 shadow-indigo-500/10 shadow-lg">
                  <svg class="h-10 w-10 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>

                <div class="space-y-2">
                  <span class="inline-block px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-500/20">
                    Talanta Hub Checkout
                  </span>
                  <h1 class="text-2xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-rose-200 to-indigo-200">
                    SECURE ONLINE COMING SOON
                  </h1>
                  <p class="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                    Our developers are currently integrating direct automated payment channels including M-Pesa API push notifications and card settlements.
                  </p>
                </div>

                <div class="p-4 bg-slate-950/80 rounded-2xl border border-white/5 space-y-1">
                  <div class="flex justify-between items-center text-xs">
                    <span class="font-bold uppercase tracking-wider text-slate-500">Gateway Status:</span>
                    <span class="font-bold text-rose-400 flex items-center gap-1.5 animate-pulse">
                      <span class="h-2 w-2 rounded-full bg-rose-500"></span>
                      INTEGRATING
                    </span>
                  </div>
                </div>

                <div class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  🔒 Encrypted Payment Security &bull; Talanta Hub 2026
                </div>
              </div>
            </body>
          </html>
        `);
        newTab.document.close();
      }
    } catch (e) {
      console.warn("Could not open external tab:", e);
    }
  };

  useEffect(() => {
    async function checkAndLoadContacts() {
      if (isOwner) {
        setIsUnlocked(true);
        setUnlockedContacts({
          email: profile.email || '',
          phone: profile.phone || '',
          whatsapp: profile.whatsapp || ''
        });
        return;
      }

      if (!isLoggedIn || !activeRole || activeRole === 'visitor' || activeRole === 'client') {
        setIsUnlocked(false);
        setUnlockedContacts(null);
        return;
      }

      setCheckingUnlock(true);
      const hasUnlocked = await checkIfContactUnlocked(activeRole, profile.id);
      setIsUnlocked(hasUnlocked);

      if (hasUnlocked) {
        const details = await fetchUnlockedContactDetails(activeRole, profile.id);
        setUnlockedContacts(details);
      } else {
        setUnlockedContacts(null);
      }
      setCheckingUnlock(false);
    }

    checkAndLoadContacts();
  }, [profile.id, activeRole, isLoggedIn, isOwner, profile.email, profile.phone, profile.whatsapp]);

  const completedEngagements = (jobs || []).filter(job => 
    job.isCompleted && (
      (job.userId === activeRole && job.hiredCreativeId === profile.id) ||
      (job.userId === profile.id && job.hiredCreativeId === activeRole)
    )
  );

  // Local state for creative feed posts
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>(() => {
    if (profile.feedPosts) {
      return profile.feedPosts;
    }
    // Generate lovely, tailored seed feed posts based on the freelancer's identity
    const seed: FeedPost[] = [];
    if (profile.portfolio && profile.portfolio.length > 0) {
      seed.push({
        id: `${profile.id}_seed_1`,
        caption: `Just published a major piece in my portfolio: "${profile.portfolio[0].title}". So excited to share this update!`,
        imageUrl: profile.portfolio[0].imageUrl,
        likes: 0,
        timestamp: profile.portfolio[0].date || '2026-05-12',
      });
    } else {
      seed.push({
        id: `${profile.id}_seed_1`,
        caption: `Welcome to my brand-new live workspace on Talanta Hub! Stay tuned as I share design updates.`,
        likes: 0,
        timestamp: '2026-07-08',
      });
    }

    seed.push({
      id: `${profile.id}_seed_2`,
      caption: `Morning coffee thoughts: Craftsmanship lies in executing the request with absolute precision. Always design with intention!`,
      likes: 0,
      timestamp: '2026-07-08',
    });

    return seed;
  });

  // Synchronize local feed posts with parent profile when it updates
  React.useEffect(() => {
    if (profile.feedPosts) {
      setFeedPosts(profile.feedPosts);
    }
  }, [profile.feedPosts]);

  // State for creating new posts
  const [newPostCaption, setNewPostCaption] = useState('');
  const [newPostImage, setNewPostImage] = useState('');
  const [newPostSuccess, setNewPostSuccess] = useState(false);
  const [postValidationError, setPostValidationError] = useState<string | null>(null);

  // States for live avatar and cover photo updates
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState('');
  const [cropperType, setCropperType] = useState<'avatar' | 'banner'>('avatar');

  const handleCropperSave = (croppedDataUrl: string) => {
    if (onUpdateProfile) {
      if (cropperType === 'avatar') {
        onUpdateProfile({
          ...profile,
          avatarUrl: croppedDataUrl
        });
      } else {
        onUpdateProfile({
          ...profile,
          coverUrl: croppedDataUrl
        });
      }
    }
    setCropperOpen(false);
  };

  // Synchronize local changes back to App state if needed
  const syncFeedPosts = (updatedPosts: FeedPost[]) => {
    setFeedPosts(updatedPosts);
    if (onUpdateProfile) {
      onUpdateProfile({
        ...profile,
        feedPosts: updatedPosts
      });
    }
  };

  const handleLikePost = (postId: string) => {
    const updated = feedPosts.map(post => {
      if (post.id === postId) {
        const isLiked = !post.isLikedByUser;
        return {
          ...post,
          likes: isLiked ? post.likes + 1 : Math.max(0, post.likes - 1),
          isLikedByUser: isLiked
        };
      }
      return post;
    });
    syncFeedPosts(updated);
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostCaption && !newPostImage) return;

    // Run contact check and word count check on the caption text
    const violation = checkContactViolation(newPostCaption);
    if (violation) {
      setPostValidationError(violation);
      return;
    }

    setPostValidationError(null);

    const newPost: FeedPost = {
      id: `fp_${Date.now()}`,
      caption: newPostCaption || undefined,
      imageUrl: newPostImage || undefined,
      likes: 0,
      timestamp: new Date().toISOString(),
      isLikedByUser: false
    };

    const updated = [newPost, ...feedPosts];
    syncFeedPosts(updated);

    // Reset Form
    setNewPostCaption('');
    setNewPostImage('');
    setNewPostSuccess(true);
    setTimeout(() => setNewPostSuccess(false), 3000);
  };
  
  // Tab/filter for portfolio gallery
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<CreativeCategory | 'all'>('all');
  const [gallerySearchQuery, setGallerySearchQuery] = useState('');
  const [selectedGalleryItem, setSelectedGalleryItem] = useState<PortfolioItem | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isFullscreenLightboxOpen, setIsFullscreenLightboxOpen] = useState(false);
  const [modalMediaTab, setModalMediaTab] = useState<'all' | 'photos' | 'videos'>('all');
  
  // Review form state
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewRole, setReviewRole] = useState('');
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [selectedJobToReview, setSelectedJobToReview] = useState('');

  // Prepopulate review author name and role if logged in
  React.useEffect(() => {
    if (isLoggedIn && activeRole) {
      if (activeRole === 'client') {
        if (!reviewAuthor) setReviewAuthor('Client Partner');
        if (!reviewRole) setReviewRole('Client Partner');
      } else {
        const matchingProfile = allFreelancers.find(f => f.id === activeRole);
        if (matchingProfile) {
          if (!reviewAuthor) setReviewAuthor(matchingProfile.fullName);
          if (!reviewRole) setReviewRole(matchingProfile.title || 'Freelancer Partner');
        }
      }
    }
  }, [isLoggedIn, activeRole, allFreelancers]);

  // Reviews view limit state
  const [reviewsLimit, setReviewsLimit] = useState(3);

  // Compute related creatives with similar category or skills
  const getRelatedCreatives = () => {
    const list = allFreelancers || [];
    const sourceList = list;
    
    // Filter out current profile
    const candidates = sourceList.filter(f => f.id !== profile.id);
    
    // Score them based on similarity of categories and skills
    const scored = candidates.map(f => {
      let score = 0;
      if (f.category === profile.category) {
        score += 10;
      }
      if (f.subscribedCategories && profile.subscribedCategories) {
        const commonCats = f.subscribedCategories.filter(cat => profile.subscribedCategories?.includes(cat));
        score += commonCats.length * 3;
      }
      if (f.skills && profile.skills) {
        const commonSkills = f.skills.filter(sk => profile.skills.includes(sk));
        score += commonSkills.length * 2;
      }
      return { freelancer: f, score };
    });
    
    // Sort descending by score, and pick top 3
    const sorted = scored
      .sort((a, b) => b.score - a.score)
      .map(item => item.freelancer);

    return sorted.slice(0, 3);
  };

  // Inquiry form state
  const [inquirerName, setInquirerName] = useState('');
  const [inquirerMessage, setInquirerMessage] = useState('');
  const [inquirySuccess, setInquirySuccess] = useState(false);

  // Copied alert state
  const [copiedLink, setCopiedLink] = useState(false);

  const handleShareLink = () => {
    const shareUrl = `${window.location.origin}/profile/${profile.username}`;
    const shareData = {
      title: `${profile.fullName} | Talanta Hub`,
      text: `View ${profile.fullName}'s creative portfolio and connect with them on Talanta Hub — Where Talent Meets Opportunity.`,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      navigator.share(shareData)
        .then(() => {
          setCopiedLink(true);
          setTimeout(() => setCopiedLink(false), 3000);
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            console.error('Error sharing:', err);
          }
          // Fallback to clipboard
          navigator.clipboard.writeText(shareUrl).then(() => {
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 3000);
          });
        });
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 3000);
      });
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewAuthor || !reviewComment) return;

    const res = await onAddReview(profile.id, {
      authorName: reviewAuthor,
      authorRole: reviewRole || 'Visitor',
      rating: reviewRating,
      comment: reviewComment
    }, selectedJobToReview);

    // Only clear on success if returned
    if (res && res.success === false) return;

    setReviewAuthor('');
    setReviewRole('');
    setReviewRating(5);
    setReviewComment('');
    setSelectedJobToReview('');
    setReviewSuccess(true);
    setTimeout(() => setReviewSuccess(false), 4000);
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquirerName || !inquirerMessage) return;

    onSendMessageFromContact(profile.id, inquirerMessage, inquirerName);
    
    setInquirerName('');
    setInquirerMessage('');
    setInquirySuccess(true);
    setTimeout(() => setInquirySuccess(false), 4000);
  };

  const getYouTubeEmbedUrl = (url: string) => {
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      if (match && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}`;
      }
    } catch (e) {}
    return null;
  };

  // Filter portfolio works based on tags and search keywords
  const filteredWorks = profile.portfolio.filter(item => {
    const isItemLive = item.isLive !== false;
    const matchesCategory = activeCategoryFilter === 'all' || item.category === activeCategoryFilter;
    const matchesSearch = gallerySearchQuery.trim() === '' || 
      item.title.toLowerCase().includes(gallerySearchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(gallerySearchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(gallerySearchQuery.toLowerCase());
    return isItemLive && matchesCategory && matchesSearch;
  });

  const getAverageRating = () => {
    if (!profile.reviews || profile.reviews.length === 0) return null;
    const sum = profile.reviews.reduce((acc, r) => acc + r.rating, 0);
    return Number((sum / profile.reviews.length).toFixed(1));
  };

  // Generate sections based on custom layoutOrder
  const renderSection = (sectionId: string, limitPosts: boolean = false) => {
    switch (sectionId) {
      case 'hero':
        return (
          <section key="hero" id="hero" className="space-y-6">
            {/* Header / Bio */}
            <div className={`${theme.cardBg} border-2 border-blue-500 ${theme.cardRadius} ${theme.glowEffect} p-6 md:p-8 space-y-6 relative overflow-hidden`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl md:text-4.5xl font-black tracking-tight leading-none">
                      {profile.fullName}
                    </h1>
                  </div>
                  <p className="text-slate-500 font-extrabold text-sm uppercase tracking-wide">{profile.title}</p>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{profile.location}</span>
                  </div>
                </div>

                {/* Star review overlay */}
                {getAverageRating() !== null ? (
                  <div className="flex items-center gap-1 bg-indigo-600 text-white px-3.5 py-1.5 rounded-full font-black text-sm shadow-sm select-none">
                    <Star className="h-4 w-4 fill-white" />
                    <span>{getAverageRating()} Rating</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 bg-slate-100 border border-slate-250 text-slate-500 px-3.5 py-1.5 rounded-full font-bold text-xs select-none">
                    New on Talanta Hub
                  </div>
                )}
              </div>

              {/* Bio block */}
              <div className="space-y-3 pt-4 border-t border-black/5">
                <h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-400">ABOUT ME</h3>
                <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap font-medium">
                  {profile.bio}
                </p>
              </div>

              {/* Skills badges */}
              <div className="space-y-3 pt-4 border-t border-black/5">
                <h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-400">SKILLS</h3>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((skill, idx) => (
                    <span key={idx} className="text-xs px-3 py-1 font-bold bg-blue-600 text-white rounded-md">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        );

      case 'categories':
        return (
          <section key="categories" id="categories" className="space-y-6">
            <div className="space-y-1">
              <h2 className="font-hugh text-3xl md:text-4xl text-slate-900 dark:text-white tracking-normal normal-case">
                interact with me
              </h2>
            </div>

            {/* Owner Posting Form */}
            {isOwner && (
              <div className={`${theme.cardBg} ${theme.cardBorder} ${theme.cardRadius} p-5 space-y-4`}>
                <div className="flex items-center gap-2 pb-3 border-b border-black/5">
                  <div className="h-8 w-8 rounded-full overflow-hidden border border-black/5 bg-slate-100 flex items-center justify-center font-extrabold text-xs text-indigo-700 bg-indigo-50">
                    {profile.avatarUrl ? (
                      <img src={profile.avatarUrl} alt={profile.fullName} className="w-full h-full object-cover" />
                    ) : (
                      profile.fullName[0]?.toUpperCase()
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Post an update to your live timeline</span>
                    <span className="text-[10px] text-indigo-600 font-semibold uppercase tracking-wider">Logged in as Owner</span>
                  </div>
                </div>

                <form onSubmit={handleCreatePost} className="space-y-3">
                  <div className="relative">
                    <textarea
                      rows={3}
                      placeholder="What's cooking in your workspace? Write a thoughts snippet or caption..."
                      value={newPostCaption}
                      onChange={(e) => {
                        setNewPostCaption(e.target.value);
                        setPostValidationError(checkContactViolation(e.target.value));
                      }}
                      className={`w-full px-4 py-3 bg-slate-50 border ${
                        postValidationError ? 'border-rose-500 focus:border-rose-500 bg-rose-50/10' : 'border-slate-200 focus:border-indigo-500'
                      } focus:bg-white rounded-xl focus:outline-none transition-all text-sm font-medium resize-none text-slate-900`}
                    />
                    <div className="absolute bottom-2 right-3 flex items-center gap-2">
                      <span className={`text-[10px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded ${
                        newPostCaption.trim().split(/\s+/).filter(Boolean).length > 20 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {newPostCaption.trim().split(/\s+/).filter(Boolean).length}/20 words
                      </span>
                    </div>
                  </div>

                  {postValidationError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-800 text-[11px] font-semibold">
                      <span className="text-sm">⚠️</span>
                      <p>{postValidationError}</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
                    <div className="relative flex-1">
                      <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="url"
                        placeholder="Attach image link (optional)"
                        value={newPostImage}
                        onChange={(e) => setNewPostImage(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl focus:outline-none transition-all text-xs font-semibold text-slate-900"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={(!newPostCaption.trim() && !newPostImage.trim()) || !!postValidationError}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Publish Post</span>
                    </button>
                  </div>
                </form>

                <AnimatePresence>
                  {newPostSuccess && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-xs font-semibold text-emerald-600 flex items-center gap-1 mt-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Post published to your live timeline successfully!</span>
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Timeline Feed Posts */}
            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2 custom-scrollbar">
              {feedPosts.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <p className="text-sm font-semibold text-slate-400">No updates posted yet on this creative feed.</p>
                  {isOwner && (
                    <p className="text-xs text-indigo-500 font-medium mt-1">Use the form above to share your first update!</p>
                  )}
                </div>
              ) : (
                (limitPosts ? feedPosts.slice(0, 5) : feedPosts).map((post) => (
                  <motion.div
                    key={post.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`${theme.cardBg} ${theme.cardBorder} ${theme.cardRadius} p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow`}
                  >
                    {/* Post Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-full overflow-hidden border border-black/5 bg-indigo-50 flex items-center justify-center font-extrabold text-sm text-indigo-700">
                          {profile.avatarUrl ? (
                            <img src={profile.avatarUrl} alt={profile.fullName} className="w-full h-full object-cover" />
                          ) : (
                            profile.fullName[0]?.toUpperCase()
                          )}
                        </div>
                        <div>
                          <span className="text-sm font-black text-slate-950 block leading-tight">{profile.fullName}</span>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide">{formatTimelineTime(post.timestamp)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Post Image */}
                    {post.imageUrl && (
                      <div className="rounded-xl overflow-hidden border border-black/5 bg-slate-50 max-h-[360px] flex items-center justify-center relative">
                        <img
                          src={post.imageUrl}
                          alt="Feed update attachment"
                          className="w-full h-full object-cover max-h-[360px]"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    {/* Post Caption (placed below photo with 20-word limit) */}
                    {post.caption && (
                      <p className="text-sm leading-relaxed font-medium whitespace-pre-wrap text-slate-800">
                        {limitWords(post.caption, 20)}
                      </p>
                    )}

                    {/* Interactive Actions - ONLY LIKES ALLOWED */}
                    <div className="flex items-center justify-between pt-3 border-t border-black/5">
                      <div className="flex items-center gap-1.5">
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={() => handleLikePost(post.id)}
                          className={`flex items-center justify-center h-8 w-8 rounded-full border transition-colors cursor-pointer ${
                            post.isLikedByUser
                              ? 'bg-rose-50 border-rose-100 text-rose-500 hover:bg-rose-100/50'
                              : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                          }`}
                        >
                          <Heart className={`h-4.5 w-4.5 ${post.isLikedByUser ? 'fill-rose-500' : ''}`} />
                        </motion.button>
                        <span className="text-xs font-bold text-slate-600">
                          {post.likes} {post.likes === 1 ? 'like' : 'likes'}
                        </span>
                      </div>

                      {/* Subtle status tag */}
                      <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                        Timeline Entry
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </section>
        );

      case 'gallery': {
        const gallerySectionBg = theme.id === 'cyber'
          ? 'border border-zinc-800/80 p-5 md:p-6 rounded-none shadow-[0_0_15px_rgba(34,197,94,0.05)]'
          : theme.id === 'warm'
          ? 'border border-[#e5dac3] p-5 md:p-6 rounded-lg'
          : theme.id === 'brutalist'
          ? 'border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-5 md:p-6 rounded-none'
          : 'border border-slate-200/60 dark:border-slate-800/20 p-5 md:p-6 rounded-3xl shadow-sm';

        return (
          <section key="gallery" id="gallery" className={`${gallerySectionBg} space-y-4`} style={{ backgroundColor: '#B4E0E7' }}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="space-y-1">
                <h2 className="text-lg md:text-xl font-black tracking-tight uppercase text-slate-950">FEATURED PROJECTS</h2>
                <p className="text-[11px] tracking-wider text-slate-700" style={{ fontVariant: 'small-caps', fontFamily: '"General Sans", sans-serif', fontWeight: 600 }}>
                  a curated selection of prominent creations
                </p>
              </div>

              {/* Filter sub-chips */}
              <div className="flex gap-1 flex-wrap">
                {['all', ...Array.from(new Set(profile.portfolio.map(p => p.category)))].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategoryFilter(cat as any)}
                    className={`px-2.5 py-1 text-[10px] font-black capitalize transition-all cursor-pointer ${
                      activeCategoryFilter === cat
                        ? `${theme.accentBg} text-white`
                        : `bg-black/5 hover:bg-black/10`
                    }`}
                  >
                    {cat === 'all' ? 'View All' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input & Button Bar */}
            <div className="flex items-center gap-2 w-full bg-white/20 p-1.5 rounded-xl border border-black/5">
              <div className="relative flex-grow">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-3.5 w-3.5 text-slate-600" />
                </span>
                <input
                  type="text"
                  placeholder="Search projects by keyword..."
                  value={gallerySearchQuery}
                  onChange={(e) => setGallerySearchQuery(e.target.value)}
                  className="w-full pl-9 pr-14 py-1.5 text-xs bg-white/90 border border-black/10 focus:border-black/30 text-slate-950 placeholder-slate-500 rounded-lg outline-hidden font-semibold transition-all shadow-2xs"
                />
                {gallerySearchQuery && (
                  <button
                    onClick={() => setGallerySearchQuery('')}
                    className="absolute inset-y-0 right-3 flex items-center text-[9px] font-extrabold text-slate-500 hover:text-slate-800"
                  >
                    CLEAR
                  </button>
                )}
              </div>
              <button 
                className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-white rounded-lg font-black text-xs flex items-center gap-1 shrink-0 cursor-pointer transition-all shadow-xs"
                onClick={() => {
                  // Filters reactively already; can be used to re-trigger or focus
                }}
              >
                <Search className="h-3 w-3" />
                <span>Search</span>
              </button>
            </div>

            {/* Gallery grid */}
            <div className="max-h-[460px] overflow-y-auto pr-2 custom-scrollbar">
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${profile.layoutOrder.includes('categories') ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-3.5`}>
                <AnimatePresence mode="popLayout">
                  {filteredWorks.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => {
                        setSelectedGalleryItem(item);
                        setActiveSlideIndex(0);
                        setModalMediaTab('all');
                      }}
                      className={`${theme.cardBg} ${theme.cardBorder} ${theme.cardRadius} ${theme.glowEffect} overflow-hidden group flex flex-col justify-between shadow-xs cursor-pointer hover:border-indigo-500/40 hover:shadow-md transition-all duration-300`}
                    >
                      <div className="h-32 bg-slate-100 overflow-hidden relative">
                        <img 
                          src={optimizeCardUrl(item.imageUrl)} 
                          alt={item.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                        />
                        {item.videoUrl && (
                          <div className="absolute top-2 left-2 bg-indigo-600/90 backdrop-blur-xs text-white p-1 rounded-full shadow-md" title="Has Showcase Video">
                            <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        )}
                        {item.galleryUrls && item.galleryUrls.length > 0 && (
                          <div className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-xs text-white text-[8px] font-bold px-1.5 py-0.5 rounded" title="Has Multi-image Gallery">
                            📁 {item.galleryUrls.length + 1} PHOTOS
                          </div>
                        )}
                        <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-bold text-white uppercase tracking-wider">
                          {profile.category}
                        </div>
                      </div>
                      <div className="p-3 flex-1 flex flex-col justify-between space-y-1.5">
                        <div className="space-y-1">
                          <h4 className="text-xs font-black truncate group-hover:text-indigo-600 transition-colors">{item.title}</h4>
                          <div className="space-y-0.5">
                            <p className="text-[10.5px] leading-normal line-clamp-1 font-medium text-slate-500 dark:text-slate-400">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {filteredWorks.length === 0 && (
              <div className="text-center py-8 bg-black/5 rounded-xl text-xs font-bold">
                No items matching category selection.
              </div>
            )}
          </section>
        );
      }

      case 'analytics':
        return renderSection('contact');

      case 'reviews': {
        const related = getRelatedCreatives();
        const displayedReviews = profile.reviews.slice(0, reviewsLimit);
        
        return (
          <section key="reviews" id="reviews" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Reviews & Testimonials */}
              <div className="lg:col-span-7 space-y-6 lg:pt-5">
                <div className="space-y-1">
                  <h2 className="text-xl md:text-2xl font-black tracking-tight uppercase">reviews and testimonials</h2>
                </div>

                {/* Existing Reviews List */}
                <div className="space-y-4">
                  {displayedReviews.map((rev) => (
                    <div 
                      key={rev.id}
                      className={`${theme.cardBg} ${theme.cardBorder} ${theme.cardRadius} ${theme.glowEffect} p-5 space-y-3 relative`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-0.5">
                          <h4 className="font-black text-sm">{rev.authorName}</h4>
                          <p className="text-[10px] font-semibold text-slate-400">{rev.authorRole}</p>
                        </div>

                        {/* Stars */}
                        <div className="flex gap-0.5 text-indigo-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-3.5 w-3.5 ${i < rev.rating ? 'fill-indigo-500 text-indigo-500' : 'text-slate-300'}`} 
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs md:text-sm leading-relaxed font-medium">
                        "{rev.comment}"
                      </p>

                      <span className="text-[9px] font-semibold text-slate-400 absolute bottom-3 right-4">
                        Reviewed {rev.date}
                      </span>
                    </div>
                  ))}

                  {profile.reviews.length === 0 && (
                    <div className="text-center py-8 bg-black/5 rounded-xl text-xs font-bold">
                      No reviews posted yet. Be the first to leave one below!
                    </div>
                  )}

                  {/* Load More / Show Less Controls */}
                  {profile.reviews.length > 3 && (
                    <div className="flex justify-center pt-2">
                      {reviewsLimit === 3 ? (
                        <button
                          onClick={() => setReviewsLimit(profile.reviews.length)}
                          className="px-4 py-2 border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                        >
                          See More Reviews ({profile.reviews.length - 3} more)
                        </button>
                      ) : (
                        <button
                          onClick={() => setReviewsLimit(3)}
                          className="px-4 py-2 border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                        >
                          Show Less
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Leave a review Form */}
                <div className={`${theme.cardBg} ${theme.cardBorder} ${theme.cardRadius} ${theme.glowEffect} p-5 md:p-6 space-y-4`}>
                  <h3 className="text-sm font-black uppercase tracking-wider">Leave a Star Review</h3>
                  
                  {!isLoggedIn ? (
                    <div className="space-y-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 text-center">
                      <p className="text-xs font-bold text-indigo-950 leading-relaxed">
                        Please sign in or sign up to leave a star review.
                      </p>
                    </div>
                  ) : isOwner ? (
                    <div className="text-center py-6 bg-slate-50 rounded-xl text-xs font-bold text-slate-500">
                      You cannot review your own profile.
                    </div>
                  ) : (
                    <form onSubmit={handleReviewSubmit} className="space-y-4">
                      {/* Select Project to Review (Optional, shown only if completed engagements exist) */}
                      {completedEngagements.length > 0 && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase block text-indigo-600">Select Completed Project (Optional)</label>
                          <select
                            value={selectedJobToReview}
                            onChange={(e) => setSelectedJobToReview(e.target.value)}
                            className="w-full px-3 py-2 bg-indigo-50/50 border border-indigo-100 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
                          >
                            <option value="">-- Choose project --</option>
                            {completedEngagements.map(job => (
                              <option key={job.id} value={job.id}>
                                {job.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase block">Your Full Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Liam Sterling"
                            value={reviewAuthor}
                            onChange={(e) => setReviewAuthor(e.target.value)}
                            className="w-full px-3 py-2 bg-black/5 border border-black/10 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase block">Your Role / Designation</label>
                          <input
                            type="text"
                            placeholder="e.g. Creative Lead at Vogue"
                            value={reviewRole}
                            onChange={(e) => setReviewRole(e.target.value)}
                            className="w-full px-3 py-2 bg-black/5 border border-black/10 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
                          />
                        </div>
                      </div>

                    {/* Stars selector */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase block">Star Rating *</span>
                      <div className="flex gap-1.5 text-indigo-500 pt-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setReviewRating(star)}
                            className="p-0.5 hover:scale-110 transition-transform cursor-pointer"
                          >
                            <Star className={`h-6 w-6 ${star <= reviewRating ? 'fill-indigo-500 text-indigo-500' : 'text-slate-300'}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase block">Detailed Comment *</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Describe your freelance collaboration experience, professionalism, response rates, and final delivery quality..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="w-full px-3 py-2 bg-black/5 border border-black/10 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-medium resize-none"
                      />
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded transition-colors cursor-pointer"
                      >
                        post
                      </button>
                      <AnimatePresence>
                        {reviewSuccess && (
                          <motion.span 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            className="text-[10px] text-emerald-600 font-bold flex items-center gap-1"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Posted! Freelancers cannot edit or remove review.</span>
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </form>
                  )}
                </div>
              </div>

              {/* Right Column: Related Creatives */}
              <div className="lg:col-span-5 space-y-4 bg-slate-50/80 border border-slate-100 p-5 rounded-2xl">
                <div className="space-y-1">
                  <h3 className="text-lg md:text-xl font-black tracking-tight uppercase flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-500" />
                    <span>related creatives</span>
                  </h3>
                </div>

                <div className="space-y-3 pt-2">
                  {related.map((c) => (
                    <div 
                      key={c.id}
                      onClick={() => onSelectFreelancer && onSelectFreelancer(c.id)}
                      className={`${theme.cardBg} ${theme.cardBorder} ${theme.cardRadius} ${theme.glowEffect} flex flex-col transition-all duration-300 hover:scale-[1.01] hover:border-indigo-500/20 cursor-pointer overflow-hidden group`}
                    >
                      {/* Mini cover banner */}
                      <div className="relative h-20 bg-slate-100 overflow-hidden">
                        {c.coverUrl ? (
                          <img 
                            src={optimizeCardUrl(c.coverUrl)} 
                            alt={`${c.fullName} Cover`}
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-slate-700 to-slate-800" />
                        )}
                        <div className="absolute inset-0 bg-black/25" />
                      </div>

                      {/* Content with negative margin avatar offset */}
                      <div className="p-4 pt-0 flex flex-col gap-3 relative">
                        <div className="flex items-end gap-3 -mt-6 relative z-10">
                          {c.avatarUrl ? (
                            <img 
                              src={optimizeAvatarUrl(c.avatarUrl)} 
                              alt={c.fullName}
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                              className="h-12 w-12 rounded-full object-cover shrink-0 border-2 border-white shadow-md bg-white"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full border-2 border-white shadow-md bg-indigo-50 text-indigo-700 flex items-center justify-center font-extrabold text-xs shrink-0">
                              {c.fullName[0]?.toUpperCase()}
                            </div>
                          )}
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <h4 className="font-black text-sm text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{c.fullName}</h4>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mt-1">
                          {c.bio}
                        </p>

                        {onSelectFreelancer && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectFreelancer(c.id);
                            }}
                            className="w-full py-2 bg-slate-900 hover:bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1 shadow-sm mt-1"
                          >
                            <span>View Profile</span>
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {related.length === 0 && (
                    <div className="text-center py-8 bg-black/5 rounded-xl text-xs font-bold text-slate-500">
                      No matching related creatives found.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </section>
        );
      }

      case 'offers': {
        const activeOffers = (profile.offers || []).filter(o => o.isActive !== false);
        if (activeOffers.length === 0) return null;

        return (
          <section key="offers" id="offers" className="space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-indigo-600 animate-pulse" />
                <h2 className="text-xl md:text-2xl font-black tracking-tight uppercase text-slate-900">
                  Active Promotions & Custom Offers
                </h2>
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Exclusive direct discounts, service packages, and promotional deals offered by {profile.fullName}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeOffers.map((offer) => {
                const isExpanded = expandedOfferId === offer.id;
                return (
                  <div
                    key={offer.id}
                    className="bg-white border-2 border-indigo-600/20 hover:border-indigo-600 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 relative overflow-hidden group"
                  >
                    {/* Glowing Accent */}
                    <div className="absolute -right-8 -top-8 w-20 h-20 bg-indigo-100 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-200/50 transition-colors" />

                    <div className="space-y-3 relative z-10">
                      {/* Badge / Price Row */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider bg-indigo-50 text-indigo-600 px-3 py-1 rounded-xl border border-indigo-100 shadow-2xs">
                          <Percent className="h-3.5 w-3.5" />
                          <span>{offer.price}</span>
                        </span>
                        
                        <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          Active Promo
                        </span>
                      </div>

                      {/* Offer Title */}
                      <h3 className="text-md font-black text-slate-900 leading-tight">
                        {offer.title}
                      </h3>

                      {/* Validity Dates */}
                      <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>Valid: {offer.startDate} to {offer.endDate}</span>
                      </div>

                      {/* Interactive Inclusions Expander */}
                      {isExpanded ? (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pt-2"
                        >
                          <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 border border-slate-100 p-3.5 rounded-2xl italic whitespace-pre-wrap">
                            {offer.details}
                          </div>
                        </motion.div>
                      ) : null}
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3 mt-1 relative z-10">
                      <button
                        type="button"
                        onClick={() => setExpandedOfferId(isExpanded ? null : offer.id)}
                        className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        {isExpanded ? 'Hide Offer Inclusions' : 'View Offer Inclusions'}
                        <span className="text-[11px]">{isExpanded ? '▲' : '▼'}</span>
                      </button>

                      {/* Callback Prompt */}
                      <a
                        href="#request-call"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-950 hover:bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm hover:scale-102 active:scale-98"
                      >
                        <PhoneCall className="h-3 w-3" />
                        <span>Claim Offer</span>
                      </a>
                    </div>

                  </div>
                );
              })}
            </div>
          </section>
        );
      }

      case 'contact': {
        const hasEmail = isUnlocked && unlockedContacts?.email;
        const hasPhone = isUnlocked && unlockedContacts?.phone;
        const hasWhatsapp = isUnlocked && unlockedContacts?.whatsapp;
        const hasAnyContact = hasEmail || hasPhone || hasWhatsapp;
        const showBlurred = !isUnlocked;

        return (
          <section key="contact" id="contact" className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl md:text-2xl font-black tracking-tight uppercase">Direct Contact details</h2>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Instantly connect with {profile.fullName} via email, phone call, or WhatsApp chat</p>
            </div>

            {checkingUnlock ? (
              <div className="text-center py-12 bg-black/5 rounded-xl text-xs font-bold text-slate-500 animate-pulse">
                Verifying secure contact lock...
              </div>
            ) : showBlurred ? (
              // Locked / Blurred State
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
                  {/* Email Card (Blurred) */}
                  <div className={`${theme.cardBg} ${theme.cardBorder} ${theme.cardRadius} p-5 flex flex-col justify-between items-start gap-4 shadow-sm border relative overflow-hidden group`}>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                          Official Email <Lock className="h-3 w-3 text-rose-450" />
                        </h4>
                        <p className="text-xs font-bold break-all select-none blur-[4.5px] opacity-40">
                          {profile.email || `${profile.username}@talantahub.com`}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        if (!isLoggedIn) {
                          alert('Please sign in or join as a creative to unlock contacts!');
                          return;
                        }
                        if (activeRole === 'visitor' || activeRole === 'client') {
                          alert('Please select a Freelancer persona on the top bar to unlock contacts!');
                          return;
                        }
                        setPesapalEmail(profile.email || '');
                        setPaymentError(null);
                        setPaymentSuccess(false);
                        setMpesaPin('');
                        setShowPesapalModal(true);
                      }}
                      className="w-full text-center py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      <span>Unlock to Reveal</span>
                    </button>
                  </div>

                  {/* Phone Card (Blurred) */}
                  <div className={`${theme.cardBg} ${theme.cardBorder} ${theme.cardRadius} p-5 flex flex-col justify-between items-start gap-4 shadow-sm border relative overflow-hidden group`}>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                          Call Number <Lock className="h-3 w-3 text-indigo-450" />
                        </h4>
                        <p className="text-xs font-bold break-all select-none blur-[4.5px] opacity-40">
                          {profile.phone || '+254 712 345678'}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        if (!isLoggedIn) {
                          alert('Please sign in or join as a creative to unlock contacts!');
                          return;
                        }
                        if (activeRole === 'visitor' || activeRole === 'client') {
                          alert('Please select a Freelancer persona on the top bar to unlock contacts!');
                          return;
                        }
                        setPesapalEmail(profile.email || '');
                        setPaymentError(null);
                        setPaymentSuccess(false);
                        setMpesaPin('');
                        setShowPesapalModal(true);
                      }}
                      className="w-full text-center py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      <span>Unlock to Reveal</span>
                    </button>
                  </div>

                  {/* WhatsApp Card (Blurred) */}
                  <div className={`${theme.cardBg} ${theme.cardBorder} ${theme.cardRadius} p-5 flex flex-col justify-between items-start gap-4 shadow-sm border relative overflow-hidden group`}>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                          WhatsApp Link <Lock className="h-3 w-3 text-emerald-450" />
                        </h4>
                        <p className="text-xs font-bold break-all select-none blur-[4.5px] opacity-40">
                          {profile.whatsapp || '+254 712 345678'}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        if (!isLoggedIn) {
                          alert('Please sign in or join as a creative to unlock contacts!');
                          return;
                        }
                        if (activeRole === 'visitor' || activeRole === 'client') {
                          alert('Please select a Freelancer persona on the top bar to unlock contacts!');
                          return;
                        }
                        setPesapalEmail(profile.email || '');
                        setPaymentError(null);
                        setPaymentSuccess(false);
                        setMpesaPin('');
                        setShowPesapalModal(true);
                      }}
                      className="w-full text-center py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      <span>Unlock to Reveal</span>
                    </button>
                  </div>
                </div>

                {/* Secure Callout Banner below the blurred cards */}
                {!isLoggedIn ? (
                  <div className={`${theme.cardBg} ${theme.cardBorder} ${theme.cardRadius} p-6 text-center space-y-4 shadow-xl border relative overflow-hidden flex flex-col items-center justify-center max-w-2xl mx-auto`}>
                    <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/5 via-transparent to-indigo-500/5 pointer-events-none" />
                    <div className="space-y-1">
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Contact Information Locked</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-bold max-w-md mx-auto">
                        Please sign in or join as a creative to see and securely unlock {profile.fullName}'s official phone, email and direct WhatsApp connections.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className={`${theme.cardBg} ${theme.cardBorder} ${theme.cardRadius} p-6 text-center space-y-4 shadow-xl border relative overflow-hidden flex flex-col items-center justify-center max-w-2xl mx-auto`}>
                    <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/5 via-transparent to-indigo-500/5 pointer-events-none" />
                    <div className="space-y-1">
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Unlock verified direct lines</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-bold max-w-md mx-auto">
                        To connect directly with {profile.fullName}, click below to securely unlock their official contact details (including phone, WhatsApp and email) for KSh 50.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (activeRole === 'visitor' || activeRole === 'client') {
                          alert('Please select a Freelancer persona on the top bar to unlock contacts!');
                          return;
                        }
                        setPesapalEmail(profile.email || '');
                        setPaymentError(null);
                        setPaymentSuccess(false);
                        setMpesaPin('');
                        setShowPesapalModal(true);
                      }}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
                    >
                      <Unlock className="h-4 w-4" />
                      <span>Unlock Contacts (KSh 50)</span>
                    </button>
                  </div>
                )}
              </div>
            ) : !hasAnyContact ? (
              <div className={`${theme.cardBg} ${theme.cardBorder} ${theme.cardRadius} p-8 text-center space-y-4 shadow-xl border relative overflow-hidden flex flex-col items-center justify-center max-w-2xl mx-auto`}>
                <div className="h-14 w-14 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">No Contacts Available</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                    Contact information not provided.
                  </p>
                  {isOwner && (
                    <p className="text-xs text-indigo-600 font-extrabold mt-2">
                      Complete your profile to add your contact information.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Email Card */}
                {unlockedContacts?.email && (
                  <div className={`${theme.cardBg} ${theme.cardBorder} ${theme.cardRadius} p-5 flex flex-col justify-between items-start gap-4 shadow-sm border`}>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Official Email</h4>
                        <p className="text-xs font-bold break-all select-all">{unlockedContacts.email}</p>
                      </div>
                    </div>
                    <a 
                      href={`mailto:${unlockedContacts.email}`}
                      className="w-full text-center py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
                    >
                      Send Email
                    </a>
                  </div>
                )}

                {/* Phone Card */}
                {unlockedContacts?.phone && (
                  <div className={`${theme.cardBg} ${theme.cardBorder} ${theme.cardRadius} p-5 flex flex-col justify-between items-start gap-4 shadow-sm border`}>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Call Number</h4>
                        <p className="text-xs font-bold break-all select-all">{unlockedContacts.phone}</p>
                      </div>
                    </div>
                    <a 
                      href={`tel:${unlockedContacts.phone.replace(/\s+/g, '')}`}
                      className="w-full text-center py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
                    >
                      Call Now
                    </a>
                  </div>
                )}

                {/* WhatsApp Card */}
                {unlockedContacts?.whatsapp && (
                  <div className={`${theme.cardBg} ${theme.cardBorder} ${theme.cardRadius} p-5 flex flex-col justify-between items-start gap-4 shadow-sm border`}>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">WhatsApp Link</h4>
                        <p className="text-xs font-bold break-all select-all">{unlockedContacts.whatsapp}</p>
                      </div>
                    </div>
                    <a 
                      href={`https://wa.me/${unlockedContacts.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-center py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1"
                    >
                      <span>WhatsApp Chat</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </section>
        );
      }

      default:
        return null;
    }
  };

  const handlePesapalPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRole) {
      setPaymentError("You must be logged in to make a payment.");
      return;
    }
    
    if (pesapalMethod === 'mpesa') {
      if (!pesapalPhone.trim()) {
        setPaymentError("Please enter your M-Pesa mobile number.");
        return;
      }
      if (!mpesaPin.trim() || mpesaPin.length < 4) {
        setPaymentError("Please enter a valid 4-digit M-Pesa PIN simulation.");
        return;
      }
    } else {
      if (!pesapalEmail.trim()) {
        setPaymentError("Please enter your email address.");
        return;
      }
    }

    setPaying(true);
    setPaymentError(null);

    // Simulated Pesapal transaction latency
    setTimeout(async () => {
      try {
        const res = await createContactUnlock({
          buyerId: activeRole,
          creativeId: profile.id,
          amount: 50,
          paymentStatus: 'completed'
        });

        if (res.success) {
          setPaymentSuccess(true);
          setIsUnlocked(true);
          const details = await fetchUnlockedContactDetails(activeRole, profile.id);
          setUnlockedContacts(details);
          setTimeout(() => {
            setShowPesapalModal(false);
            setPaymentSuccess(false);
          }, 2000);
        } else {
          setPaymentError(res.error || "Payment processing failed in Supabase.");
        }
      } catch (err: any) {
        setPaymentError(err.message || "An unexpected error occurred.");
      } finally {
        setPaying(false);
      }
    }, 1500);
  };

  return (
    <div className={`min-h-screen ${theme.bgClass} ${theme.textClass} ${theme.fontFamilyClass} pb-16 transition-colors duration-300`}>
      
      {/* Immersive Header with Banner & Avatar Offset */}
      <div className="relative">
        {/* Dynamic Cover image banner */}
        <div className="h-48 md:h-64 bg-slate-900 relative overflow-hidden">
          {profile.coverUrl ? (
            <img 
              src={optimizeHeroUrl(profile.coverUrl)} 
              alt={`${profile.fullName} Cover`} 
              className="w-full h-full object-cover" 
              loading="eager"
              decoding="async"
              fetchPriority="high"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-slate-800 to-slate-900" />
          )}
          {/* Subtle gradient overlay at the top to ensure float navigation stays legible while keeping the banner 100% sharp and clear */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />

          {isOwner && (
            <button
              onClick={() => {
                setCropperImageSrc(profile.coverUrl || '');
                setCropperType('banner');
                setCropperOpen(true);
              }}
              className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white text-xs font-bold rounded-xl border border-white/10 transition-all cursor-pointer shadow-lg active:scale-95 z-10"
            >
              <Pencil className="h-3.5 w-3.5 text-indigo-400" />
              <span>Edit Cover</span>
            </button>
          )}

          {/* Floating Custom Return Nav */}
          <div className="absolute top-4 inset-x-4 max-w-5xl mx-auto flex justify-between items-center px-4">
            <button
              onClick={onBackToMarketplace}
              className="flex items-center gap-2 px-3.5 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-md text-white text-xs font-extrabold tracking-wide uppercase rounded-xl transition-all cursor-pointer border border-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Marketplace</span>
            </button>

            <div className="flex gap-2">
              <button
                onClick={handleShareLink}
                className="flex items-center gap-2 px-3.5 py-2 bg-white text-black text-xs font-extrabold tracking-wide uppercase rounded-xl transition-all cursor-pointer border border-white shadow-sm"
              >
                <Share2 className="h-4 w-4 text-indigo-500" />
                <span>{copiedLink ? 'Copied Link!' : 'Share Profile'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Big centered Avatar offset */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 z-20">
          <div className="relative group/avatar">
            <div className="h-24 w-24 md:h-28 md:w-28 rounded-full border-4 border-white bg-slate-100 overflow-hidden shadow-xl flex items-center justify-center">
              {profile.avatarUrl ? (
                <img 
                  src={optimizeAvatarUrl(profile.avatarUrl)} 
                  alt={profile.fullName} 
                  className="w-full h-full object-cover"
                  loading="eager"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
                  <svg className="h-10 w-10 md:h-12 md:w-12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            {isOwner && (
              <button
                onClick={() => {
                  setCropperImageSrc(profile.avatarUrl || '');
                  setCropperType('avatar');
                  setCropperOpen(true);
                }}
                className="absolute -bottom-1 -right-1 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full border-2 border-white shadow-lg transition-all cursor-pointer hover:scale-110 active:scale-95 flex items-center justify-center z-10"
                title="Edit Profile Photo"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main website layouts context */}
      <div className="max-w-5xl mx-auto px-4 mt-16 space-y-12 pt-4">
        {(() => {
          const layoutSections = profile.layoutOrder.includes('offers')
            ? profile.layoutOrder
            : (profile.offers && profile.offers.filter(o => o.isActive !== false).length > 0
                ? [...profile.layoutOrder, 'offers']
                : profile.layoutOrder);
          return layoutSections.map((sectionId) => {
            // If the section is 'categories', check if 'gallery' is also present in layoutOrder.
            // If 'gallery' is present, we render them together in a 2-column grid layout!
            if (sectionId === 'categories') {
              const hasGallery = profile.layoutOrder.includes('gallery');
              if (hasGallery) {
                return (
                  <React.Fragment key="feed-and-projects-with-clients">
                    <div 
                      key="feed-and-projects" 
                      className="p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md relative overflow-hidden transition-all duration-300"
                      style={{ backgroundColor: '#ffffff' }}
                    >
                      {/* Subtle ambient light reflections to enrich layout depth */}
                      <div className="absolute -right-20 -top-20 w-52 h-52 bg-white/20 rounded-full blur-2xl pointer-events-none" />
                      <div className="absolute -left-20 -bottom-20 w-52 h-52 bg-black/5 rounded-full blur-2xl pointer-events-none" />

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
                        {/* Left Column: Creative Feed (smaller column) */}
                        <div className="lg:col-span-5 space-y-6">
                          {renderSection('categories', true)}
                        </div>
                        {/* Right Column: Featured Projects */}
                        <div className="lg:col-span-7 space-y-6">
                          {renderSection('gallery')}
                        </div>
                      </div>
                    </div>

                    <NotableClients 
                      profile={profile} 
                      isOwner={isOwner} 
                      onUpdateProfile={onUpdateProfile} 
                    />

                    <RequestCall 
                      profile={profile} 
                      isOwner={isOwner} 
                      onUpdateProfile={onUpdateProfile} 
                    />
                  </React.Fragment>
                );
              }
            }
            
            // If the section is 'gallery' and we already rendered it side-by-side with 'categories', skip it.
            if (sectionId === 'gallery' && profile.layoutOrder.includes('categories')) {
              return null;
            }

            // If the section is 'contact' and 'analytics' is present, skip 'contact' to avoid duplication
            if (sectionId === 'contact' && profile.layoutOrder.includes('analytics')) {
              return null;
            }

            return renderSection(sectionId);
          });
        })()}
      </div>

      {/* Dynamic Gallery Lightbox Modal */}
      <AnimatePresence>
        {selectedGalleryItem && (() => {
          const videoUrls = selectedGalleryItem.videoUrl ? selectedGalleryItem.videoUrl.split(',').map(u => u.trim()).filter(Boolean) : [];
          
          let allPhotos: string[] = [];
          let allVideos: string[] = [];

          const hasCustomMedia = videoUrls.length > 0 || (selectedGalleryItem.galleryUrls && selectedGalleryItem.galleryUrls.length > 0);
          let rawMedia: string[] = [];
          if (hasCustomMedia) {
            if (selectedGalleryItem.imageUrl) {
              rawMedia.push(selectedGalleryItem.imageUrl);
            }
            if (selectedGalleryItem.galleryUrls) {
              rawMedia = [...rawMedia, ...selectedGalleryItem.galleryUrls];
            }
            if (videoUrls.length > 0) {
              rawMedia = [...rawMedia, ...videoUrls];
            }
          } else {
            const galleryData = PROJECT_GALLERIES[selectedGalleryItem.id] || {
              type: selectedGalleryItem.videoUrl ? 'video' : 'photo',
              items: [selectedGalleryItem.imageUrl]
            };
            rawMedia = galleryData.items;
          }

          rawMedia.forEach(url => {
            const isVideo = url.endsWith('.mp4') || url.includes('mixkit.co/videos') || !!getYouTubeEmbedUrl(url);
            if (isVideo) {
              if (!allVideos.includes(url)) allVideos.push(url);
            } else {
              if (!allPhotos.includes(url)) allPhotos.push(url);
            }
          });

          if (allPhotos.length === 0 && allVideos.length === 0 && selectedGalleryItem.imageUrl) {
            allPhotos.push(selectedGalleryItem.imageUrl);
          }

          const slides = [...allPhotos, ...allVideos];
          const displayedSlides = modalMediaTab === 'photos' 
            ? allPhotos 
            : modalMediaTab === 'videos' 
              ? allVideos 
              : slides;

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md"
              onClick={() => setSelectedGalleryItem(null)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Left/Top Column: Media Viewer & Gallery */}
                <div className="flex-1 bg-slate-950 flex flex-col overflow-y-auto max-h-[60vh] md:max-h-[90vh] relative scrollbar-thin scrollbar-thumb-slate-800">
                  {/* Close button for mobile */}
                  <button
                    onClick={() => setSelectedGalleryItem(null)}
                    className="absolute top-4 right-4 z-20 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all cursor-pointer border border-white/10 md:hidden"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  {/* Project Gallery List (arranged in gallery form) */}
                  <div className="p-6 md:p-8 space-y-6">
                    <div className="flex flex-col gap-4 border-b border-white/5 pb-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-black uppercase tracking-wider text-slate-300">Project Gallery</h4>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                          Browse photos and videos &bull; Click to view in full size
                        </p>
                      </div>

                      {/* Photo and Video Filter Navigation */}
                      <div className="flex flex-wrap gap-1.5 p-1 bg-white/5 rounded-xl border border-white/10 w-fit">
                        <button
                          onClick={() => setModalMediaTab('all')}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            modalMediaTab === 'all'
                              ? 'bg-indigo-600 text-white shadow-md scale-102'
                              : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          All ({slides.length})
                        </button>
                        <button
                          onClick={() => setModalMediaTab('photos')}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            modalMediaTab === 'photos'
                              ? 'bg-indigo-600 text-white shadow-md scale-102'
                              : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          Photos ({allPhotos.length})
                        </button>
                        <button
                          onClick={() => setModalMediaTab('videos')}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            modalMediaTab === 'videos'
                              ? 'bg-indigo-600 text-white shadow-md scale-102'
                              : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          Videos ({allVideos.length})
                        </button>
                      </div>
                    </div>

                    {displayedSlides.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 text-xs font-bold">
                        No {modalMediaTab} available for this project.
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {displayedSlides.map((slide, sIdx) => {
                          const isSlideVideo = allVideos.includes(slide);
                          const masterIdx = slides.indexOf(slide);

                          return (
                            <div
                              key={sIdx}
                              onClick={() => {
                                setActiveSlideIndex(masterIdx >= 0 ? masterIdx : 0);
                                setIsFullscreenLightboxOpen(true);
                              }}
                              className="relative aspect-square rounded-xl overflow-hidden border border-white/10 cursor-pointer bg-slate-900 flex items-center justify-center group shadow-md hover:border-indigo-500 hover:scale-105 active:scale-95 transition-all duration-300"
                              title={isSlideVideo ? "Click to play Video" : "Click to view Photo"}
                            >
                              {isSlideVideo ? (
                                <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center relative">
                                  <video
                                    src={slide}
                                    className="w-full h-full object-cover opacity-60 group-hover:opacity-85 transition-opacity"
                                    muted
                                    playsInline
                                  />
                                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 flex flex-col items-center justify-center transition-colors">
                                    <div className="bg-indigo-600/90 text-white p-1.5 rounded-full shadow-lg transform group-hover:scale-110 transition-transform">
                                      <svg className="h-3.5 w-3.5 fill-current ml-0.5" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center relative">
                                  <img
                                    src={slide}
                                    alt={`Gallery item ${sIdx + 1}`}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-300" />
                                </div>
                              )}

                              {/* Badge icon for type */}
                              <div className="absolute bottom-1 right-1 bg-black/75 backdrop-blur-xs text-[7px] font-black px-1 py-0.5 rounded text-white tracking-widest scale-90">
                                {isSlideVideo ? 'VIDEO' : 'PHOTO'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right/Bottom Column: Sidebar Details */}
                <div className="w-full md:w-80 bg-white dark:bg-slate-900 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 p-5 flex flex-col justify-between overflow-y-auto max-h-[40vh] md:max-h-none">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                        {profile.category}
                      </span>
                      <button
                        onClick={() => setSelectedGalleryItem(null)}
                        className="hidden md:flex p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer text-slate-400 hover:text-slate-700"
                      >
                        <X className="h-4.5 w-4.5" />
                      </button>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                        {selectedGalleryItem.title}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      {selectedGalleryItem.description}
                    </p>


                  </div>

                  <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                    <button
                      onClick={() => {
                        setSelectedGalleryItem(null);
                        const contactSec = document.getElementById('contact');
                        if (contactSec) {
                          contactSec.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="w-full py-2.5 bg-slate-950 hover:bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      <span>Contact Me</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Immersive Fullscreen Lightbox Overlay */}
      <AnimatePresence>
        {isFullscreenLightboxOpen && selectedGalleryItem && (() => {
          const videoUrls = selectedGalleryItem.videoUrl ? selectedGalleryItem.videoUrl.split(',').map(u => u.trim()).filter(Boolean) : [];
          
          let allPhotos: string[] = [];
          let allVideos: string[] = [];

          const hasCustomMedia = videoUrls.length > 0 || (selectedGalleryItem.galleryUrls && selectedGalleryItem.galleryUrls.length > 0);
          let rawMedia: string[] = [];
          if (hasCustomMedia) {
            if (selectedGalleryItem.imageUrl) {
              rawMedia.push(selectedGalleryItem.imageUrl);
            }
            if (selectedGalleryItem.galleryUrls) {
              rawMedia = [...rawMedia, ...selectedGalleryItem.galleryUrls];
            }
            if (videoUrls.length > 0) {
              rawMedia = [...rawMedia, ...videoUrls];
            }
          } else {
            const galleryData = PROJECT_GALLERIES[selectedGalleryItem.id] || {
              type: selectedGalleryItem.videoUrl ? 'video' : 'photo',
              items: [selectedGalleryItem.imageUrl]
            };
            rawMedia = galleryData.items;
          }

          rawMedia.forEach(url => {
            const isVideo = url.endsWith('.mp4') || url.includes('mixkit.co/videos') || !!getYouTubeEmbedUrl(url);
            if (isVideo) {
              if (!allVideos.includes(url)) allVideos.push(url);
            } else {
              if (!allPhotos.includes(url)) allPhotos.push(url);
            }
          });

          if (allPhotos.length === 0 && allVideos.length === 0 && selectedGalleryItem.imageUrl) {
            allPhotos.push(selectedGalleryItem.imageUrl);
          }

          const slides = [...allPhotos, ...allVideos];
          const activeSlideUrl = slides[activeSlideIndex] || selectedGalleryItem.imageUrl;

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex flex-col justify-between bg-slate-950/98 backdrop-blur-lg"
              onClick={() => setIsFullscreenLightboxOpen(false)}
            >
              {/* Header section with category and close button */}
              <div className="p-4 md:p-6 flex items-center justify-between border-b border-white/5 bg-slate-950/50 backdrop-blur-md z-10" onClick={(e) => e.stopPropagation()}>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">
                    {profile.category} &bull; {selectedGalleryItem.title}
                  </span>
                  <p className="text-xs text-slate-300 font-bold truncate max-w-md">
                    Viewing item {activeSlideIndex + 1} of {slides.length}
                  </p>
                </div>

                <button
                  onClick={() => setIsFullscreenLightboxOpen(false)}
                  className="p-2.5 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all border border-white/10 hover:rotate-90 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Central Media Viewer */}
              <div className="flex-1 flex items-center justify-center relative p-4 md:p-8" onClick={(e) => e.stopPropagation()}>
                {/* Previous Button */}
                {slides.length > 1 && (
                  <button
                    onClick={() => setActiveSlideIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1))}
                    className="absolute left-4 md:left-8 z-10 p-3 bg-black/60 hover:bg-black/90 hover:scale-105 active:scale-95 text-white rounded-full transition-all cursor-pointer border border-white/10 shadow-xl"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                )}

                {/* Main Media Visual */}
                <div className="w-full h-full max-h-[70vh] flex items-center justify-center">
                  {(() => {
                    const ytEmbedUrl = getYouTubeEmbedUrl(activeSlideUrl);
                    if (ytEmbedUrl) {
                      return (
                        <div className="w-full h-full max-h-[70vh] aspect-video rounded-xl overflow-hidden shadow-2xl bg-black border border-white/10">
                          <iframe
                            src={ytEmbedUrl}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title="YouTube video player"
                          />
                        </div>
                      );
                    }
                    if (videoUrls.includes(activeSlideUrl) || activeSlideUrl.endsWith('.mp4')) {
                      return (
                        <video
                          key={activeSlideUrl}
                          src={activeSlideUrl}
                          controls
                          autoPlay
                          loop
                          className="w-full h-full max-h-[70vh] object-contain rounded-xl shadow-2xl"
                        />
                      );
                    }
                    return (
                      <img
                        src={activeSlideUrl}
                        alt="Enlarged Showcase View"
                        className="w-full h-full max-h-[70vh] object-contain rounded-xl shadow-2xl select-none"
                        referrerPolicy="no-referrer"
                      />
                    );
                  })()}
                </div>

                {/* Next Button */}
                {slides.length > 1 && (
                  <button
                    onClick={() => setActiveSlideIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1))}
                    className="absolute right-4 md:right-8 z-10 p-3 bg-black/60 hover:bg-black/90 hover:scale-105 active:scale-95 text-white rounded-full transition-all cursor-pointer border border-white/10 shadow-xl"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                )}
              </div>

              {/* Footer strip of slide thumbnails */}
              <div className="p-4 md:p-6 border-t border-white/5 bg-slate-950/50 backdrop-blur-md flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
                {slides.length > 1 && (
                  <div className="flex gap-2.5 justify-center overflow-x-auto py-1 max-w-full">
                    {slides.map((slide, sIdx) => {
                      const isSlideVideo = videoUrls.includes(slide) || slide.endsWith('.mp4');
                      return (
                        <button
                          key={sIdx}
                          onClick={() => setActiveSlideIndex(sIdx)}
                          className={`h-12 w-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all duration-300 ${
                            activeSlideIndex === sIdx ? 'border-indigo-500 scale-105 ring-4 ring-indigo-500/20' : 'border-transparent opacity-50 hover:opacity-100'
                          }`}
                        >
                          {isSlideVideo ? (
                            <div className="w-full h-full bg-slate-900 flex items-center justify-center relative">
                              <span className="text-[7.5px] text-white font-extrabold bg-indigo-600 px-1.5 py-0.5 rounded uppercase tracking-wide">VIDEO</span>
                            </div>
                          ) : (
                            <img
                              src={slide}
                              alt="Thumbnail indicator"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Press left/right to browse &bull; Click outside or X to close
                </p>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Aesthetic pairing branding footnote */}
      <div className="text-center mt-16 text-[10px] uppercase font-black tracking-widest text-slate-400">
        Branded with &bull; {theme.name} &bull; Powered by Talanta Hub
      </div>

      <ImageCropperModal
        isOpen={cropperOpen}
        imageSrc={cropperImageSrc}
        cropType={cropperType}
        onSave={handleCropperSave}
        onCancel={() => setCropperOpen(false)}
      />

      {/* Pesapal Secure Payment Simulator Modal */}
      {showPesapalModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-indigo-500/30 rounded-3xl max-w-md w-full p-6 text-white space-y-6 shadow-2xl relative">
            <button 
              onClick={() => setShowPesapalModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center space-y-2">
              <div className="inline-flex p-3 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                <Unlock className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-wider text-white">Pesapal Secure Checkout</h3>
              <p className="text-xs text-slate-400">
                Unlock official contact information for <strong className="text-white">{profile.fullName}</strong>
              </p>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Due:</span>
              <span className="text-xl font-black text-emerald-400">KSh 50.00</span>
            </div>

            {paymentSuccess ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center space-y-2">
                <Check className="h-8 w-8 text-emerald-400 mx-auto animate-bounce" />
                <p className="text-xs font-black uppercase tracking-wider text-emerald-400">Payment Successful!</p>
                <p className="text-[11px] text-slate-400">Contact details unlocked permanently.</p>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); handleOpenSecureTab(); }} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Select Payment Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPesapalMethod('secure_online');
                        handleOpenSecureTab();
                      }}
                      className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        pesapalMethod === 'mpesa'
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg'
                          : 'bg-slate-800/50 border-white/5 text-slate-450 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <span>M-PESA</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPesapalMethod('secure_online');
                        handleOpenSecureTab();
                      }}
                      className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        pesapalMethod === 'card'
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                          : 'bg-slate-800/50 border-white/5 text-slate-450 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <span>Credit Card</span>
                    </button>
                  </div>
                </div>

                <div className="py-8 px-4 text-center space-y-4 bg-slate-950/50 rounded-2xl border border-white/5">
                  <div className="inline-flex p-3 bg-indigo-500/15 text-indigo-400 rounded-full border border-indigo-500/25 shadow-lg shadow-indigo-500/5">
                    <Lock className="h-6 w-6 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-black uppercase tracking-widest text-indigo-300">
                      SECURE ONLINE COMING SOON
                    </h4>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                      We are currently integrating with secure payment processing partners to enable instant, direct, and automated online checkout.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenSecureTab}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    <span>Launch Checkout Info Tab</span>
                  </button>
                </div>

                {paymentError && (
                  <p className="text-[11px] text-rose-500 font-bold bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 text-center">
                    {paymentError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Unlock className="h-4 w-4" />
                  <span>SECURE ONLINE COMING SOON</span>
                </button>
              </form>
            )}

            <p className="text-[10px] text-slate-500 text-center font-bold uppercase tracking-wider">
              🔒 Encrypted Secure Transaction via Pesapal APIs
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
