/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CreativeCategory = 
  | 'photography'
  | 'videography'
  | 'design'
  | 'webdev'
  | 'fashion'
  | 'beauty'
  | 'baking'
  | 'marketing'
  | 'content'
  | 'events'
  | 'illustration'
  | 'actors'
  | 'writers'
  | 'branding'
  | 'interiordesign'
  | 'florists'
  | 'hospitality'
  | 'organizers'
  | 'decorators'
  | 'musicproducers'
  | 'fineartist';

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  category: CreativeCategory;
  imageUrl: string;
  videoUrl?: string; // Optional mock video link
  galleryUrls?: string[]; // Optional additional gallery URLs
  likes: number;
  views: number;
  date: string;
  isLive?: boolean; // Optional live status
}

export interface CategorySection {
  category: CreativeCategory;
  title: string;
  customThumbnail: string;
  description: string;
  visible: boolean;
}

export type ProfileTheme = 'slate' | 'warm' | 'cyber' | 'brutalist';

export interface LayoutSection {
  id: 'hero' | 'categories' | 'gallery' | 'analytics' | 'reviews' | 'contact' | 'offers';
  title: string;
  enabled: boolean;
}

export interface Review {
  id: string;
  authorName: string;
  authorRole: string;
  rating: number; // 1-5
  comment: string;
  date: string;
  jobId?: string;
  reviewerId?: string;
  reviewedUserId?: string;
}

export interface AnalyticsSnapshot {
  totalViews: number;
  totalInquiries: number;
  conversionRate: number;
  viewsHistory: { label: string; count: number }[];
  reachByCategory: { category: CreativeCategory; percentage: number }[];
}

export interface FeedPost {
  id: string;
  caption?: string;
  imageUrl?: string;
  likes: number;
  timestamp: string;
  isLikedByUser?: boolean;
}

export interface FreelancerProfile {
  id: string;
  username: string; // Used for "share link" (?profile=username)
  fullName: string;
  title: string;
  avatarUrl: string;
  coverUrl: string;
  bio: string;
  location: string;
  hourlyRate: number;
  category: CreativeCategory;
  skills: string[];
  theme: ProfileTheme;
  layoutOrder: ('hero' | 'categories' | 'gallery' | 'analytics' | 'reviews' | 'contact' | 'offers')[];
  categorySections: CategorySection[];
  portfolio: PortfolioItem[];
  reviews: Review[];
  analytics: AnalyticsSnapshot;
  subscribedCategories: CreativeCategory[];
  notificationCount: number;
  unreadMessagesCount: number;
  email?: string;
  phone?: string;
  whatsapp?: string;
  feedPosts?: FeedPost[];
  notableClients?: { id: string; name: string; logoUrl?: string; website?: string }[];
  requestedCalls?: CallRequest[];
  offers?: Offer[];
  avatarZoom?: number;
  walletBalanceKsh?: number;
  unlockedJobIds?: string[];
  avatarPanX?: number;
  avatarPanY?: number;
  coverZoom?: number;
  coverPanX?: number;
  coverPanY?: number;
  originalAvatarUrl?: string;
  originalCoverUrl?: string;
  isPublic?: boolean; // Optional profile public/private flag
  hasUnpublishedChanges?: boolean; // Optional flag for draft edits
  publishedVersion?: FreelancerProfile; // Optional cached last-published version
  password?: string; // Creative account security password
}

export interface CallRequest {
  id: string;
  clientName: string;
  phone: string;
  preferredTime: string;
  briefMessage?: string;
  contactMethods: ('phone' | 'whatsapp' | 'zoom')[];
  status: 'pending' | 'completed' | 'declined';
  createdAt: string;
}

export interface Offer {
  id: string;
  title: string;
  price: string;
  startDate: string;
  endDate: string;
  details: string;
  isActive?: boolean;
}

export interface Job {
  id: string;
  title: string;
  clientName: string;
  clientCompany?: string;
  category: CreativeCategory;
  budgetRange: string;
  location: string;
  description: string;
  postedDate: string;
  applicantsCount: number;
  clientEmail: string;
  clientPhone: string;
  clientWhatsapp: string;
  startDate: string;
  deliveryDeadline: string;
  status?: 'open' | 'closed';
  unlockCount?: number;
  unlockPriceKsh?: number;
  hiredCreativeId?: string;
  isCompleted?: boolean;
  userId?: string;
}

export interface Message {
  id: string;
  senderId: 'client' | string; // 'client' represents the visitor, other is freelancer.id
  senderName: string;
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  freelancerId: string;
  freelancerName: string;
  freelancerAvatar: string;
  clientName: string;
  messages: Message[];
  lastMessageText: string;
  lastMessageTime: string;
  unread: boolean;
}

export interface PlatformNotification {
  id: string;
  title: string;
  message: string;
  category?: CreativeCategory;
  timestamp: string;
  jobId?: string;
  read: boolean;
}

export interface ContactUnlock {
  id: string;
  buyerId: string;
  creativeId?: string;
  jobId?: string;
  amount: number;
  paymentStatus: string;
  createdAt: string;
}

