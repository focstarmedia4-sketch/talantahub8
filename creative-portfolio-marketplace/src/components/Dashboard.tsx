/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Palette, Grid, Image as ImageIcon, Sparkles, Upload, 
  TrendingUp, Eye, MessageSquare, Award, CheckCircle, 
  ArrowUp, ArrowDown, BellRing, Trash, HelpCircle, Activity,
  Pen, Video, X, ChevronDown, ChevronUp, EyeOff, Globe, Lock, Unlock,
  UploadCloud, AlertCircle, Trash2, Edit2, Check, SlidersHorizontal, Filter,
  Phone, PhoneCall, Calendar, Clock, Tag, Percent, Megaphone,
  Share2, Copy
} from 'lucide-react';
import { FreelancerProfile, CreativeCategory, ProfileTheme, PortfolioItem, CategorySection } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { THEME_CONFIGS } from './ThemeStyles';
import { ImageCropperModal } from './ImageCropperModal';
import { DEFAULT_CLIENTS_MAP } from './NotableClients';
import { formatTimelineTime } from '../utils/time';

interface DashboardProps {
  profile: FreelancerProfile;
  onUpdateProfile: (updated: FreelancerProfile) => void;
  onDeleteProfile: (id: string) => void;
  allJobs: any[];
  onViewJob?: (jobId: string) => void;
  onUpdateJob?: (updatedJob: any) => void;
  allFreelancers?: FreelancerProfile[];
}

export default function Dashboard({ profile, onUpdateProfile, onDeleteProfile, allJobs, onViewJob, onUpdateJob, allFreelancers = [] }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'branding' | 'portfolio' | 'timeline' | 'offers' | 'notifications' | 'password'>('branding');
  
  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    const actualPassword = profile.password || 'password123';
    if (currentPassword !== actualPassword) {
      setPasswordError('Current password is incorrect.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('Confirm password does not match new password.');
      return;
    }

    // Save/Update password
    onUpdateProfile({
      ...profile,
      password: newPassword
    });

    setPasswordSuccess('Password has been changed successfully!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
  };
  
  // Deletion and Visibility states
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [showDeleteProfileConfirm, setShowDeleteProfileConfirm] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [localToast, setLocalToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Filter States for Live Matching Feed
  const [feedSort, setFeedSort] = useState<'recent' | 'unlocks-desc' | 'unlocks-asc' | 'budget-high' | 'budget-low'>('recent');
  const [feedBudgetFilter, setFeedBudgetFilter] = useState<'any' | 'under-50k' | '50k-150k' | '150k-300k' | 'over-300k'>('any');
  const [feedCategoryFilter, setFeedCategoryFilter] = useState<string>('all');
  const [feedUnlocksFilter, setFeedUnlocksFilter] = useState<'any' | 'has-remaining' | 'highly-available' | 'low-remaining'>('any');

  const parseBudgetValues = (budgetStr: string) => {
    const cleanBudgetStr = (budgetStr || '').replace(/,/g, '');
    const numbers = cleanBudgetStr.match(/\d+/g)?.map(Number) || [];
    const maxVal = numbers.length > 0 ? Math.max(...numbers) : 0;
    const minVal = numbers.length > 0 ? Math.min(...numbers) : 0;
    return { minVal, maxVal };
  };

  const showLocalToast = (message: string, type: 'success' | 'error' = 'success') => {
    setLocalToast({ message, type });
    setTimeout(() => setLocalToast(null), 4000);
  };

  const maskEmail = (email: string) => {
    if (!email) return '***@***.com';
    const parts = email.split('@');
    if (parts.length !== 2) return '***@***.com';
    const [name, domain] = parts;
    if (!name || !domain) return '***@***.com';
    return `${name.slice(0, 3)}***@${domain}`;
  };

  const maskPhone = (phone: string) => {
    if (!phone) return '***';
    return `${phone.slice(0, 6)}******`;
  };

  const handleUnlockContacts = (e: React.MouseEvent, job: any) => {
    e.stopPropagation(); // Avoid triggering card details link
    
    const unlockPrice = job.unlockPriceKsh || 50;
    const walletBalance = profile.walletBalanceKsh ?? 2500;
    const unlockedJobIds = profile.unlockedJobIds || [];
    const isUnlocked = unlockedJobIds.includes(job.id);
    
    if (isUnlocked) {
      return;
    }
    
    if (job.status === 'closed') {
      showLocalToast('This job brief is CLOSED. Contact details cannot be unlocked.', 'error');
      return;
    }
    
    if ((job.unlockCount || 0) >= 20) {
      showLocalToast('This client contact has already reached its limit of 20 unlocks.', 'error');
      return;
    }
    
    if (walletBalance < unlockPrice) {
      showLocalToast(`Insufficient wallet balance. You need KSh ${unlockPrice} to unlock. Please Top Up!`, 'error');
      return;
    }
    
    // Perform deduct and unlock
    const updatedProfile = {
      ...profile,
      walletBalanceKsh: walletBalance - unlockPrice,
      unlockedJobIds: [...unlockedJobIds, job.id]
    };
    
    onUpdateProfile(updatedProfile);
    
    if (onUpdateJob) {
      const updatedJob = {
        ...job,
        unlockCount: (job.unlockCount || 0) + 1
      };
      onUpdateJob(updatedJob);
    }
    
    showLocalToast(`Successfully unlocked contacts for "${job.title}"!`, 'success');
  };

  // Helper to save changes as draft
  const saveProfileDraft = (updated: FreelancerProfile) => {
    onUpdateProfile({
      ...updated,
      hasUnpublishedChanges: true
    });
  };

  const handlePublishChanges = () => {
    const cleanProfileCopy = { ...profile };
    delete cleanProfileCopy.publishedVersion;
    
    onUpdateProfile({
      ...profile,
      hasUnpublishedChanges: false,
      publishedVersion: cleanProfileCopy
    });
    setPublishSuccess(true);
    setTimeout(() => setPublishSuccess(false), 4000);
  };

  const handleToggleProfileVisibility = (isPublicVal: boolean) => {
    if (profile.isPublic !== isPublicVal) {
      saveProfileDraft({
        ...profile,
        isPublic: isPublicVal
      });
    }
  };

  // Toggle portfolio item live/unlive status
  const handleTogglePortfolioLive = (itemId: string) => {
    const updatedPortfolio = profile.portfolio.map(p => {
      if (p.id === itemId) {
        return {
          ...p,
          isLive: p.isLive === false ? true : false
        };
      }
      return p;
    });

    saveProfileDraft({
      ...profile,
      portfolio: updatedPortfolio
    });
  };

  const getTimelinePosts = () => {
    if (profile.feedPosts) {
      return profile.feedPosts;
    }
    const seed: any[] = [];
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
  };

  const getWordCount = (text: string) => {
    if (!text.trim()) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const handleTimelineDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setTimelineDragActive(true);
    } else if (e.type === "dragleave") {
      setTimelineDragActive(false);
    }
  };

  const handleTimelineDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTimelineDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleTimelineFile(e.dataTransfer.files[0]);
    }
  };

  const handleTimelineFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleTimelineFile(e.target.files[0]);
    }
  };

  const handleTimelineFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setTimelineError('Invalid file type: Please select an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setTimelineImageUrl(reader.result);
        setTimelineError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddTimelinePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!timelineCaption.trim() && !timelineImageUrl.trim()) {
      setTimelineError('Please provide a caption or an image for your timeline post.');
      return;
    }

    const wordCount = getWordCount(timelineCaption);
    if (wordCount > 20) {
      setTimelineError('Caption exceeds the maximum limit of 20 words. Please shorten it.');
      return;
    }

    const posts = getTimelinePosts();
    const newPost = {
      id: `fp_${Date.now()}`,
      caption: timelineCaption.trim() || undefined,
      imageUrl: timelineImageUrl.trim() || undefined,
      likes: 0,
      timestamp: new Date().toISOString(),
      isLikedByUser: false
    };

    const updated = [newPost, ...posts];
    saveProfileDraft({
      ...profile,
      feedPosts: updated
    });

    setTimelineCaption('');
    setTimelineImageUrl('');
    setTimelineError(null);
  };

  const handleStartEditPost = (post: any) => {
    setEditingPostId(post.id);
    setTimelineCaption(post.caption || '');
    setTimelineImageUrl(post.imageUrl || '');
    setTimelineLogoMethod(post.imageUrl?.startsWith('data:') ? 'upload' : 'url');
    setTimelineError(null);
  };

  const handleSaveEditPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!timelineCaption.trim() && !timelineImageUrl.trim()) {
      setTimelineError('Please provide a caption or an image.');
      return;
    }

    const wordCount = getWordCount(timelineCaption);
    if (wordCount > 20) {
      setTimelineError('Caption exceeds the maximum limit of 20 words. Please shorten it.');
      return;
    }

    const posts = getTimelinePosts();
    const updated = posts.map(p => {
      if (p.id === editingPostId) {
        return {
          ...p,
          caption: timelineCaption.trim() || undefined,
          imageUrl: timelineImageUrl.trim() || undefined
        };
      }
      return p;
    });

    saveProfileDraft({
      ...profile,
      feedPosts: updated
    });

    setEditingPostId(null);
    setTimelineCaption('');
    setTimelineImageUrl('');
    setTimelineError(null);
  };

  const handleDeletePost = (postId: string) => {
    const posts = getTimelinePosts();
    const updated = posts.filter(p => p.id !== postId);
    saveProfileDraft({
      ...profile,
      feedPosts: updated
    });
    if (editingPostId === postId) {
      setEditingPostId(null);
      setTimelineCaption('');
      setTimelineImageUrl('');
    }
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

  const renderVideoPreview = (url: string) => {
    if (!url) return null;
    const ytEmbed = getYouTubeEmbedUrl(url);
    if (ytEmbed) {
      return (
        <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-250 bg-black shadow-xs">
          <iframe
            src={ytEmbed}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="YouTube video player"
          />
        </div>
      );
    }

    const isDirectVideo = /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
    if (isDirectVideo) {
      return (
        <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-250 bg-black shadow-xs">
          <video src={url} controls className="w-full h-full object-contain" />
        </div>
      );
    }

    return (
      <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-950 flex flex-col items-center justify-center p-4 text-center relative group shadow-xs">
        <div className="absolute inset-0 opacity-10 bg-cover bg-center bg-[url('https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600')]" />
        <div className="relative z-10 space-y-2">
          <div className="h-10 w-10 bg-white/10 group-hover:bg-indigo-600/20 text-indigo-400 group-hover:text-indigo-300 rounded-full flex items-center justify-center mx-auto transition-all duration-300 group-hover:scale-110 shadow-lg border border-white/10">
            <Video className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-300 tracking-wider">External Video Resource</p>
            <p className="text-[9px] text-slate-500 max-w-xs mx-auto truncate mt-0.5">{url}</p>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-bold shadow-md transition-all cursor-pointer"
          >
            <span>Open Link in New Tab</span>
          </a>
        </div>
      </div>
    );
  };
  
  // Image cropper state
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState('');
  const [cropperType, setCropperType] = useState<'avatar' | 'banner'>('avatar');

  const handleCropperSave = (croppedDataUrl: string, zoom: number, pan: { x: number; y: number }, originalImageSrc: string) => {
    if (cropperType === 'avatar') {
      saveProfileDraft({
        ...profile,
        avatarUrl: croppedDataUrl,
        avatarZoom: zoom,
        avatarPanX: pan.x,
        avatarPanY: pan.y,
        originalAvatarUrl: originalImageSrc || croppedDataUrl
      });
    } else {
      saveProfileDraft({
        ...profile,
        coverUrl: croppedDataUrl,
        coverZoom: zoom,
        coverPanX: pan.x,
        coverPanY: pan.y,
        originalCoverUrl: originalImageSrc || croppedDataUrl
      });
    }
    setCropperOpen(false);
  };
  
  // Brand name and logo state
  const [brandName, setBrandName] = useState(profile.fullName);
  const [brandLogoUrl, setBrandLogoUrl] = useState(profile.avatarUrl);
  const [brandDragActive, setBrandDragActive] = useState(false);
  const [brandLogoSuccess, setBrandLogoSuccess] = useState(false);

  useEffect(() => {
    setBrandName(profile.fullName);
    setBrandLogoUrl(profile.avatarUrl);
  }, [profile.fullName, profile.avatarUrl]);

  const handleBrandDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setBrandDragActive(true);
    } else if (e.type === "dragleave") {
      setBrandDragActive(false);
    }
  };

  const handleBrandDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBrandDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.type.startsWith('image/')) {
        alert('Please drop an image file');
        return;
      }
      const { dataUrl } = await compressImage(file);
      setBrandLogoUrl(dataUrl);
    }
  };

  const handleBrandFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const { dataUrl } = await compressImage(file);
      setBrandLogoUrl(dataUrl);
    }
  };

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) return;
    saveProfileDraft({
      ...profile,
      fullName: brandName.trim(),
      avatarUrl: brandLogoUrl
    });
    setBrandLogoSuccess(true);
    setTimeout(() => setBrandLogoSuccess(false), 3000);
  };
  
  // Portfolio item form state
  const [workTitle, setWorkTitle] = useState('');
  const [workDesc, setWorkDesc] = useState('');
  const [workCat, setWorkCat] = useState<CreativeCategory>(profile.category);
  const [workImg, setWorkImg] = useState('');
  const [workVideoUrl, setWorkVideoUrl] = useState('');
  const [workVideoUrls, setWorkVideoUrls] = useState<string[]>(['']);
  const [workGalleryUrls, setWorkGalleryUrls] = useState('');

  // Timeline/Feed posts form state
  const [timelineCaption, setTimelineCaption] = useState('');
  const [timelineImageUrl, setTimelineImageUrl] = useState('');
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [timelineDragActive, setTimelineDragActive] = useState(false);
  const [timelineLogoMethod, setTimelineLogoMethod] = useState<'upload' | 'url'>('upload');
  const timelineFileInputRef = React.useRef<HTMLInputElement>(null);

  // Client/Brand form states
  const [clientBrandName, setClientBrandName] = useState('');
  const [clientBrandLogo, setClientBrandLogo] = useState('');
  const [clientBrandWebsite, setClientBrandWebsite] = useState('');
  const [clientDragActive, setClientDragActive] = useState(false);
  const [clientUploadError, setClientUploadError] = useState<string | null>(null);
  const [clientLogoMethod, setClientLogoMethod] = useState<'upload' | 'url'>('upload');
  const clientFileInputRef = React.useRef<HTMLInputElement>(null);

  // Interactive local file uploads & sub-tabs
  const [uploadedCover, setUploadedCover] = useState<{ name: string; dataUrl: string; size: number } | null>(null);
  const [uploadedImages, setUploadedImages] = useState<{ name: string; dataUrl: string; size: number }[]>([]);
  const [activeMediaTab, setActiveMediaTab] = useState<'cover' | 'images' | 'video'>('cover');
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleClientDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setClientDragActive(true);
    } else if (e.type === "dragleave") {
      setClientDragActive(false);
    }
  };

  const handleClientDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setClientDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleClientFile(e.dataTransfer.files[0]);
    }
  };

  const handleClientFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleClientFile(e.target.files[0]);
    }
  };

  const handleClientFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setClientUploadError('Invalid file type: Please select an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setClientBrandLogo(reader.result);
        setClientUploadError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const compressImage = (file: File, _maxWidth = 400, _maxHeight = 400, _quality = 0.5): Promise<{ dataUrl: string; size: number }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve({ dataUrl: event.target.result as string, size: file.size });
        } else {
          resolve({ dataUrl: '', size: 0 });
        }
      };
      reader.onerror = () => {
        resolve({ dataUrl: '', size: 0 });
      };
      reader.readAsDataURL(file);
    });
  };

  const processCoverFile = async (files: FileList) => {
    setUploadError(null);
    if (files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      setUploadError(`File "${file.name}" is not an image.`);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError(`File "${file.name}" exceeds the 5MB size limit.`);
      return;
    }

    try {
      const result = await compressImage(file);
      if (result.dataUrl) {
        setUploadedCover({
          name: file.name,
          dataUrl: result.dataUrl,
          size: result.size
        });
      }
    } catch (err) {
      setUploadError('Failed to process cover image.');
    }
  };

  const handleCoverDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processCoverFile(e.dataTransfer.files);
    }
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processCoverFile(e.target.files);
    }
  };

  const removeUploadedCover = () => {
    setUploadedCover(null);
  };

  const processFiles = async (files: FileList) => {
    setUploadError(null);
    const validFiles = [...uploadedImages];
    
    if (validFiles.length + files.length > 6) {
      setUploadError('Maximum of 6 photos allowed.');
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        setUploadError(`File "${file.name}" is not an image.`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError(`File "${file.name}" exceeds the 5MB size limit.`);
        continue;
      }

      try {
        const result = await compressImage(file);
        if (result.dataUrl) {
          if (validFiles.length < 6) {
            const hasDuplicate = validFiles.some(f => f.name === file.name && f.size === result.size);
            if (!hasDuplicate) {
              validFiles.push({
                name: file.name,
                dataUrl: result.dataUrl,
                size: result.size
              });
              setUploadedImages([...validFiles]);
            }
          }
        }
      } catch (err) {
        console.error('Error compressing gallery image:', err);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFiles(e.target.files);
    }
  };

  const removeUploadedImage = (index: number) => {
    const updated = [...uploadedImages];
    updated.splice(index, 1);
    setUploadedImages(updated);
  };

  // Editing existing items' video and gallery urls
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editVideoUrl, setEditVideoUrl] = useState('');
  const [editGalleryUrls, setEditGalleryUrls] = useState('');
  const [editDesc, setEditDesc] = useState('');
  
  // Custom thumbnail edit state
  const [editingCat, setEditingCat] = useState<CreativeCategory | null>(null);
  const [catTitle, setCatTitle] = useState('');
  const [catThumbnail, setCatThumbnail] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // Special Offers State
  const [offerTitle, setOfferTitle] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [offerStartDate, setOfferStartDate] = useState('');
  const [offerEndDate, setOfferEndDate] = useState('');
  const [offerDetails, setOfferDetails] = useState('');
  const [offerFormTab, setOfferFormTab] = useState<'basic' | 'details'>('basic');
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [offerError, setOfferError] = useState<string | null>(null);
  const [offerSuccess, setOfferSuccess] = useState<string | null>(null);

  const handleAddOffer = (e: React.FormEvent) => {
    e.preventDefault();
    setOfferError(null);
    setOfferSuccess(null);

    if (!offerTitle.trim()) {
      setOfferError('Offer title is required');
      return;
    }
    if (!offerPrice.trim()) {
      setOfferError('Offer price or discount amount is required');
      return;
    }
    if (!offerStartDate) {
      setOfferError('Start date is required');
      return;
    }
    if (!offerEndDate) {
      setOfferError('End date is required');
      return;
    }
    if (!offerDetails.trim()) {
      setOfferError('Please fill out the More Details section with inclusion/terms details');
      return;
    }

    const currentOffers = profile.offers || [];

    if (editingOfferId) {
      // Edit existing offer
      const updated = currentOffers.map(o => {
        if (o.id === editingOfferId) {
          return {
            ...o,
            title: offerTitle.trim(),
            price: offerPrice.trim(),
            startDate: offerStartDate,
            endDate: offerEndDate,
            details: offerDetails.trim()
          };
        }
        return o;
      });
      saveProfileDraft({
        ...profile,
        offers: updated
      });
      setOfferSuccess('Offer updated successfully!');
      setEditingOfferId(null);
    } else {
      // Create new offer
      const newOffer = {
        id: `offer_${Date.now()}`,
        title: offerTitle.trim(),
        price: offerPrice.trim(),
        startDate: offerStartDate,
        endDate: offerEndDate,
        details: offerDetails.trim(),
        isActive: true
      };
      saveProfileDraft({
        ...profile,
        offers: [newOffer, ...currentOffers]
      });
      setOfferSuccess('New offer created successfully!');
    }

    // Reset Form
    setOfferTitle('');
    setOfferPrice('');
    setOfferStartDate('');
    setOfferEndDate('');
    setOfferDetails('');
    setOfferFormTab('basic');
  };

  const handleDeleteOffer = (id: string) => {
    const currentOffers = profile.offers || [];
    const updated = currentOffers.filter(o => o.id !== id);
    saveProfileDraft({
      ...profile,
      offers: updated
    });
    setOfferSuccess('Offer deleted successfully!');
    if (editingOfferId === id) {
      setEditingOfferId(null);
      setOfferTitle('');
      setOfferPrice('');
      setOfferStartDate('');
      setOfferEndDate('');
      setOfferDetails('');
    }
  };

  const handleStartEditOffer = (offer: any) => {
    setEditingOfferId(offer.id);
    setOfferTitle(offer.title);
    setOfferPrice(offer.price);
    setOfferStartDate(offer.startDate);
    setOfferEndDate(offer.endDate);
    setOfferDetails(offer.details);
    setOfferFormTab('basic');
    setOfferError(null);
    setOfferSuccess(null);
  };

  const handleToggleOfferActive = (id: string) => {
    const currentOffers = profile.offers || [];
    const updated = currentOffers.map(o => {
      if (o.id === id) {
        return { ...o, isActive: o.isActive === false ? true : false };
      }
      return o;
    });
    saveProfileDraft({
      ...profile,
      offers: updated
    });
  };

  // Live analytics ticker state
  const [liveImpressions, setLiveImpressions] = useState<string[]>([]);

  // Contact details editor form state
  const [profileEmail, setProfileEmail] = useState(profile.email || '');
  const [profilePhone, setProfilePhone] = useState(profile.phone || '');
  const [profileWhatsapp, setProfileWhatsapp] = useState(profile.whatsapp || '');
  const [saveContactSuccess, setSaveContactSuccess] = useState(false);

  // Name editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(profile.fullName);

  useEffect(() => {
    setTempName(profile.fullName);
  }, [profile.fullName]);

  const handleSaveName = () => {
    if (tempName.trim()) {
      saveProfileDraft({
        ...profile,
        fullName: tempName.trim()
      });
    }
    setIsEditingName(false);
  };

  // Share state
  const [copiedLink, setCopiedLink] = useState(false);

  const handleShareProfile = () => {
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

  // Username editing state
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState(profile.username || '');
  const [dashUsernameError, setDashUsernameError] = useState<string | null>(null);
  const [dashUsernameSuggestions, setDashUsernameSuggestions] = useState<string[]>([]);

  useEffect(() => {
    setTempUsername(profile.username || '');
  }, [profile.username]);

  const handleSaveUsername = () => {
    const cleanUsername = tempUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!cleanUsername) {
      setDashUsernameError("Username cannot be empty.");
      setDashUsernameSuggestions([]);
      return;
    }

    const isTaken = (allFreelancers || []).some(f => f.id !== profile.id && f.username === cleanUsername);
    if (isTaken) {
      setDashUsernameError("This username is already taken. Please choose another.");
      
      const base = cleanUsername || 'creative';
      const suffixOptions = ['pro', 'creative', 'visuals', 'studios', 'designs', '1', '2', '24', '7', 'ke'];
      const sugs: string[] = [];
      for (const opt of suffixOptions) {
        const candidate = isNaN(Number(opt)) ? `${base}_${opt}` : `${base}${opt}`;
        const isSugTaken = (allFreelancers || []).some(f => f.username === candidate);
        if (!isSugTaken && !sugs.includes(candidate)) {
          sugs.push(candidate);
          if (sugs.length >= 3) break;
        }
      }
      while (sugs.length < 3) {
        const rand = Math.floor(10 + Math.random() * 90);
        const candidate = `${base}${rand}`;
        const isSugTaken = (allFreelancers || []).some(f => f.username === candidate);
        if (!isSugTaken && !sugs.includes(candidate)) {
          sugs.push(candidate);
        }
      }
      setDashUsernameSuggestions(sugs);
      return;
    }

    saveProfileDraft({
      ...profile,
      username: cleanUsername
    });
    
    setIsEditingUsername(false);
    setDashUsernameError(null);
    setDashUsernameSuggestions([]);
  };

  // Bio editing state
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [tempBio, setTempBio] = useState(profile.bio);

  useEffect(() => {
    setTempBio(profile.bio);
  }, [profile.bio]);

  const handleSaveBio = () => {
    if (tempBio.trim()) {
      saveProfileDraft({
        ...profile,
        bio: tempBio.trim()
      });
    }
    setIsEditingBio(false);
  };

  useEffect(() => {
    setProfileEmail(profile.email || '');
    setProfilePhone(profile.phone || '');
    setProfileWhatsapp(profile.whatsapp || '');
  }, [profile.id, profile.email, profile.phone, profile.whatsapp]);

  // Keep latest profile in a ref to avoid stale closure in simulation intervals
  const profileRef = React.useRef(profile);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  // Simulate real-time tracker logs
  useEffect(() => {
    const locations = ['Berlin, DE', 'New York, US', 'London, UK', 'Tokyo, JP', 'Paris, FR', 'San Francisco, US', 'Sydney, AU'];
    const actions = [
      'viewed your videography custom thumbnail',
      'clicked your streetwear campaign campaign item',
      'left a 5-star rating on your reviews panel',
      'browsed your minimalist brand guidelines',
      'copied your unique portfolio sharing link'
    ];

    const interval = setInterval(() => {
      const loc = locations[Math.floor(Math.random() * locations.length)];
      const act = actions[Math.floor(Math.random() * actions.length)];
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      setLiveImpressions(prev => [
        `[${time}] Visitor in ${loc} ${act}`,
        ...prev.slice(0, 4)
      ]);
      
      // Bump views slowly for live feeling!
      const currentProfile = profileRef.current;
      const updated = { ...currentProfile };
      updated.analytics = {
        ...updated.analytics,
        totalViews: updated.analytics.totalViews + 1
      };
      onUpdateProfile(updated);
    }, 9000);

    // Initial logs
    setLiveImpressions([
      `[${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] Welcome back, ${profile.fullName}! Secure tracker initiated.`,
      `[${new Date(Date.now() - 40000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] Visitor in Paris, FR viewed your custom layout.`,
      `[${new Date(Date.now() - 120000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] Organic visitor clicked through from 'All Creatives'.`
    ]);

    return () => clearInterval(interval);
  }, [profile.id]);

  // Handle Theme Switch
  const handleThemeChange = (theme: ProfileTheme) => {
    const updated = { ...profile, theme };
    saveProfileDraft(updated);
  };

  // Drag and Drop (Rearrange Layout sections up/down)
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...profile.layoutOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    
    // Swap
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;
    
    saveProfileDraft({ ...profile, layoutOrder: newOrder as any });
  };

  // Toggle Category Subscription
  const toggleCategorySubscription = (cat: CreativeCategory) => {
    let subs = [...profile.subscribedCategories];
    if (subs.includes(cat)) {
      subs = subs.filter(c => c !== cat);
    } else {
      subs.push(cat);
    }
    onUpdateProfile({ ...profile, subscribedCategories: subs });
  };

  // Add work portfolio item
  const handleAddWork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workTitle) return;

    const defaultImages: Record<CreativeCategory, string> = {
      videography: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=600',
      photography: 'https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?auto=format&fit=crop&q=80&w=600',
      design: 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=600',
      webdev: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&q=80&w=600',
      fashion: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=600',
      beauty: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=600',
      baking: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=600',
      marketing: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=600',
      content: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=600',
      events: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=600',
      illustration: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=600',
      actors: 'https://images.unsplash.com/photo-1460881680858-30d872d5b530?auto=format&fit=crop&q=80&w=600',
      writers: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=600',
      branding: 'https://images.unsplash.com/photo-1522542550221-31fd19575a2d?auto=format&fit=crop&q=80&w=600',
      interiordesign: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=600',
      florists: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&q=80&w=600',
      hospitality: 'https://images.unsplash.com/photo-1560624052-449f5ddf0c31?auto=format&fit=crop&q=80&w=600',
      organizers: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=600',
      decorators: 'https://images.unsplash.com/photo-1478812954026-9c750f0e89fc?auto=format&fit=crop&q=80&w=600',
      musicproducers: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=600',
      fineartist: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=600'
    };

    let finalImage = '';
    let videoUrl: string | undefined = undefined;
    let galleryUrls: string[] | undefined = undefined;

    // Use uploaded cover photo if available
    if (uploadedCover) {
      finalImage = uploadedCover.dataUrl;
    }

    // Process album images
    if (uploadedImages.length > 0) {
      galleryUrls = uploadedImages.map(img => img.dataUrl);
      // Fallback cover if no uploaded cover is set
      if (!finalImage) {
        finalImage = uploadedImages[0].dataUrl;
      }
    }

    // Process video/external links if populated
    const validVideoUrls = workVideoUrls.map(u => u.trim()).filter(Boolean);
    if (validVideoUrls.length > 0) {
      videoUrl = validVideoUrls.join(',');
    } else if (workVideoUrl.trim()) {
      videoUrl = workVideoUrl.trim();
    }

    // Final fallback
    if (!finalImage && workImg.trim()) {
      finalImage = workImg.trim();
    }
    if (!finalImage) {
      finalImage = defaultImages[workCat];
    }

    if (editingItemId) {
      // Edit mode: update existing portfolio item
      const updatedPortfolio = profile.portfolio.map(p => {
        if (p.id === editingItemId) {
          return {
            ...p,
            title: workTitle,
            description: workDesc || 'Notable Client & Brand Partner',
            category: workCat,
            imageUrl: finalImage,
            videoUrl,
            galleryUrls: galleryUrls && galleryUrls.length > 0 ? galleryUrls : undefined
          };
        }
        return p;
      });

      saveProfileDraft({
        ...profile,
        portfolio: updatedPortfolio
      });

      setEditingItemId(null);
    } else {
      // Add mode: create new portfolio item
      const newItem: PortfolioItem = {
        id: `p_${Date.now()}`,
        title: workTitle,
        description: workDesc || 'Notable Client & Brand Partner',
        category: workCat,
        imageUrl: finalImage,
        videoUrl,
        galleryUrls,
        likes: 0,
        views: 0,
        date: new Date().toISOString().split('T')[0],
        isLive: true // Start live by default
      };

      saveProfileDraft({
        ...profile,
        portfolio: [newItem, ...profile.portfolio]
      });
    }

    // Reset Form
    setWorkTitle('');
    setWorkDesc('');
    setWorkImg('');
    setWorkVideoUrl('');
    setWorkVideoUrls(['']);
    setWorkGalleryUrls('');
    setUploadedCover(null);
    setUploadedImages([]);
    setUploadError(null);
  };

  const handleAddClientBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientBrandName.trim()) {
      setClientUploadError('Client brand name is required.');
      return;
    }

    const currentClients = profile.notableClients || DEFAULT_CLIENTS_MAP[profile.id] || [];
    const newClient = {
      id: `client_${Date.now()}`,
      name: clientBrandName.trim(),
      logoUrl: clientBrandLogo.trim() || undefined,
      website: clientBrandWebsite.trim() || undefined
    };

    const updated = [...currentClients, newClient];
    saveProfileDraft({
      ...profile,
      notableClients: updated
    });

    // Reset state
    setClientBrandName('');
    setClientBrandLogo('');
    setClientBrandWebsite('');
    setClientUploadError(null);
  };

  const handleDeleteClientBrand = (clientId: string) => {
    const currentClients = profile.notableClients || DEFAULT_CLIENTS_MAP[profile.id] || [];
    const updated = currentClients.filter(c => c.id !== clientId);
    saveProfileDraft({
      ...profile,
      notableClients: updated
    });
  };

  // Delete portfolio item
  const handleDeletePortfolioItem = (itemId: string) => {
    const filtered = profile.portfolio.filter(item => item.id !== itemId);
    saveProfileDraft({
      ...profile,
      portfolio: filtered
    });
  };

  // Customize Category Section Thumbnails
  const handleEditCategoryStart = (section: CategorySection) => {
    setEditingCat(section.category);
    setCatTitle(section.title);
    setCatThumbnail(section.customThumbnail);
    setCatDesc(section.description);
  };

  const handleSaveCategoryEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat) return;

    const updatedSections = profile.categorySections.map(sec => {
      if (sec.category === editingCat) {
        return {
          ...sec,
          title: catTitle,
          customThumbnail: catThumbnail,
          description: catDesc,
          visible: true
        };
      }
      return sec;
    });

    saveProfileDraft({
      ...profile,
      categorySections: updatedSections
    });

    setEditingCat(null);
  };

  const getSubscribedJobsCount = () => {
    return allJobs.filter(j => profile.subscribedCategories.includes(j.category)).length;
  };

  return (
    <div className="space-y-8">
      {/* Profile Photo & Cover Banner Customizer - Centered Immersive Header */}
      <div className="relative mb-12">
        {/* Dynamic Cover image banner */}
        <div className="h-48 md:h-64 bg-slate-950 rounded-3xl relative overflow-hidden group shadow-lg border border-slate-100">
          {profile.coverUrl ? (
            <img 
              src={profile.coverUrl} 
              alt={`${profile.fullName} Cover`} 
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" 
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-slate-800 to-slate-950" />
          )}
          {/* Hover dark overlay for cover banner */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-10" />
          
          {/* Floating Edit Banner Button in the bottom right */}
          <button
            type="button"
            onClick={() => {
              setCropperImageSrc(profile.originalCoverUrl || profile.coverUrl || '');
              setCropperType('banner');
              setCropperOpen(true);
            }}
            className="absolute bottom-4 right-4 flex items-center gap-1.5 px-4 py-2 bg-black/60 hover:bg-black/80 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl border border-white/20 transition-all cursor-pointer shadow-lg active:scale-95 hover:scale-105 z-20"
          >
            <Pen className="h-3.5 w-3.5 text-indigo-400" />
            <span>Edit Cover Banner</span>
          </button>
        </div>

        {/* Big centered Avatar offset */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-20">
          <div className="relative group/avatar">
            <div className="h-24 w-24 md:h-28 md:w-28 rounded-full border-4 border-white bg-slate-100 overflow-hidden shadow-xl flex items-center justify-center">
              {profile.avatarUrl ? (
                <img 
                  src={profile.avatarUrl} 
                  alt={profile.fullName} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
                  <svg className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            {/* Hover edit photo button on the avatar */}
            <button
              type="button"
              onClick={() => {
                setCropperImageSrc(profile.originalAvatarUrl || profile.avatarUrl || '');
                setCropperType('avatar');
                setCropperOpen(true);
              }}
              className="absolute -bottom-1 -right-1 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full border-2 border-white shadow-lg transition-all cursor-pointer hover:scale-110 active:scale-95 flex items-center justify-center z-30"
              title="Edit Profile Photo"
            >
              <Pen className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Identity labels under the banner structure to anchor the visual */}
      <div className="text-center pt-2 pb-6 space-y-1">
        {isEditingName ? (
          <div className="flex items-center justify-center gap-2 max-w-sm mx-auto py-1">
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName();
                if (e.key === 'Escape') {
                  setTempName(profile.fullName);
                  setIsEditingName(false);
                }
              }}
              className="text-center text-xl font-black text-slate-900 border-b-2 border-indigo-600 bg-transparent focus:outline-none w-full max-w-xs py-0.5"
              autoFocus
            />
            <button
              type="button"
              onClick={handleSaveName}
              className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Save Name"
            >
              <CheckCircle className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setTempName(profile.fullName);
                setIsEditingName(false);
              }}
              className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all cursor-pointer border border-slate-200"
              title="Cancel"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <h3 className="text-xl font-black text-slate-900 leading-none flex items-center justify-center gap-2 group/name select-none py-1">
            <span>{profile.fullName}</span>
            <button
              type="button"
              onClick={() => setIsEditingName(true)}
              className="p-1 hover:bg-slate-100 rounded-lg text-black hover:text-black cursor-pointer transition-colors"
              title="Edit Name"
            >
              <Pen className="h-3.5 w-3.5 text-black" />
            </button>
          </h3>
        )}

        {isEditingUsername ? (
          <div className="flex flex-col items-center justify-center gap-1.5 max-w-sm mx-auto py-1">
            <div className="flex items-center gap-2 w-full">
              <span className="text-sm font-bold text-slate-400">@</span>
              <input
                type="text"
                value={tempUsername}
                onChange={(e) => {
                  const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                  setTempUsername(val);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveUsername();
                  if (e.key === 'Escape') {
                    setTempUsername(profile.username || '');
                    setIsEditingUsername(false);
                    setDashUsernameError(null);
                    setDashUsernameSuggestions([]);
                  }
                }}
                className="text-center text-sm font-bold text-slate-800 border-b-2 border-indigo-600 bg-transparent focus:outline-none w-full max-w-xs py-0.5"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSaveUsername}
                className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
                title="Save Username"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setTempUsername(profile.username || '');
                  setIsEditingUsername(false);
                  setDashUsernameError(null);
                  setDashUsernameSuggestions([]);
                }}
                className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all cursor-pointer border border-slate-200 shrink-0"
                title="Cancel"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {dashUsernameError && (
              <p className="text-[11px] font-bold text-rose-600">{dashUsernameError}</p>
            )}
            {dashUsernameSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 justify-center mt-1">
                <span className="text-[10px] text-slate-400 font-semibold self-center">Try:</span>
                {dashUsernameSuggestions.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => {
                      setTempUsername(sug);
                      setDashUsernameError(null);
                      setDashUsernameSuggestions([]);
                    }}
                    className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold px-2 py-0.5 rounded-full border border-indigo-100 transition-all cursor-pointer"
                  >
                    @{sug}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1 group/username select-none py-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md">
              @{profile.username || 'username_not_set'}
            </span>
            <button
              type="button"
              onClick={() => {
                setTempUsername(profile.username || '');
                setIsEditingUsername(true);
                setDashUsernameError(null);
                setDashUsernameSuggestions([]);
              }}
              className="p-1 hover:bg-slate-100 rounded-lg text-black hover:text-black cursor-pointer transition-colors"
              title="Edit Username"
            >
              <Pen className="h-3 w-3 text-black" />
            </button>
          </div>
        )}
        {isEditingBio ? (
          <div className="flex items-start justify-center gap-2 max-w-lg mx-auto py-1">
            <textarea
              value={tempBio}
              onChange={(e) => setTempBio(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveBio();
                }
                if (e.key === 'Escape') {
                  setTempBio(profile.bio);
                  setIsEditingBio(false);
                }
              }}
              className="text-center text-sm font-semibold text-slate-600 border-2 border-indigo-600 rounded-xl bg-white focus:outline-none w-full max-w-md p-2.5 leading-relaxed"
              rows={3}
              autoFocus
            />
            <div className="flex flex-col gap-1 shrink-0">
              <button
                type="button"
                onClick={handleSaveBio}
                className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all cursor-pointer shadow-sm active:scale-95"
                title="Save Bio"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setTempBio(profile.bio);
                  setIsEditingBio(false);
                }}
                className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all cursor-pointer border border-slate-200"
                title="Cancel"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm font-medium text-slate-600 max-w-xl mx-auto leading-relaxed group/bio select-none py-1 flex items-center justify-center gap-2">
            <span>{profile.bio}</span>
            <button
              type="button"
              onClick={() => setIsEditingBio(true)}
              className="p-1 hover:bg-slate-100 rounded-lg text-black hover:text-black cursor-pointer transition-colors shrink-0"
              title="Edit Bio"
            >
              <Pen className="h-3.5 w-3.5 text-black" />
            </button>
          </p>
        )}
        {profile.skills && profile.skills.length > 0 && (
          <div className="pt-2 flex flex-wrap justify-center gap-1.5 max-w-md mx-auto">
            {profile.skills.map((skill, idx) => (
              <span key={idx} className="text-[10px] px-2.5 py-1 font-extrabold bg-indigo-50 text-indigo-600 border border-indigo-100/60 rounded-full uppercase tracking-wider">
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Share Profile Button Row */}
        <div className="pt-4 flex justify-center">
          <button
            type="button"
            onClick={handleShareProfile}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check className="h-4 w-4 text-emerald-300 animate-pulse" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4 text-indigo-200" />
                <span>Share My Public Profile</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Matching Job Alerts (Now positioned right below skills, independent & visible) */}
      <div className="max-w-6xl w-full mx-auto bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/30 dark:via-yellow-950/20 dark:to-orange-950/30 rounded-3xl border-2 border-amber-300 dark:border-amber-800 p-6 md:p-8 space-y-4 shadow-xl shadow-amber-100/50 dark:shadow-none transition-all duration-300" id="live-matching-jobs-component">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-amber-200 dark:border-amber-800/60">
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BellRing className="h-5 w-5 text-indigo-500 animate-bounce shrink-0" />
              <span>Interest-Based Job Postings Feed & Alerts</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
              Real-time job requirements matching your selected interest categories. Customize categories under the Subscriptions tab!
            </p>
          </div>


        </div>

        {/* Local Toast alerts */}
        {localToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-sm border ${
              localToast.type === 'error' 
                ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-900/40 dark:text-rose-400' 
                : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-900/40 dark:text-emerald-400'
            }`}
          >
            <AlertCircle className={`h-4 w-4 ${localToast.type === 'error' ? 'text-rose-600' : 'text-emerald-600'}`} />
            <span>{localToast.message}</span>
          </motion.div>
        )}

        {profile.subscribedCategories.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-6">
            <AlertCircle className="h-8 w-8 text-indigo-400 mx-auto mb-2 animate-pulse" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">No Interest Categories Selected</h4>
            <p className="text-[10px] text-slate-400 mt-1 max-w-sm mx-auto leading-normal">
              Please tick one or more creative sector boxes under the <strong>Subscriptions</strong> tab to start receiving live matched client proposals!
            </p>
          </div>
        ) : (
          (() => {
            // Filter and Sort Jobs Board live matching
            const filteredAndSortedJobs = allJobs
              .filter(j => profile.subscribedCategories.includes(j.category))
              // Category filter
              .filter(j => feedCategoryFilter === 'all' ? true : j.category === feedCategoryFilter)
              // Budget filter
              .filter(j => {
                if (feedBudgetFilter === 'any') return true;
                const { minVal, maxVal } = parseBudgetValues(j.budgetRange);
                if (feedBudgetFilter === 'under-50k') {
                  return maxVal <= 50000 || (maxVal === 0 && minVal <= 50000);
                }
                if (feedBudgetFilter === '50k-150k') {
                  return (minVal >= 50000 && minVal <= 150000) || (maxVal >= 50000 && maxVal <= 150000) || (minVal <= 50000 && maxVal >= 150000);
                }
                if (feedBudgetFilter === '150k-300k') {
                  return (minVal >= 150000 && minVal <= 300000) || (maxVal >= 150000 && maxVal <= 300000) || (minVal <= 150000 && maxVal >= 300000);
                }
                if (feedBudgetFilter === 'over-300k') {
                  return maxVal >= 300000 || (maxVal === 0 && minVal >= 300000);
                }
                return true;
              })
              // Unlocks Remaining filter
              .filter(j => {
                if (feedUnlocksFilter === 'any') return true;
                const remaining = 20 - (j.unlockCount || 0);
                if (feedUnlocksFilter === 'has-remaining') {
                  return remaining > 0;
                }
                if (feedUnlocksFilter === 'highly-available') {
                  return remaining >= 10;
                }
                if (feedUnlocksFilter === 'low-remaining') {
                  return remaining > 0 && remaining <= 5;
                }
                return true;
              })
              // Sorting
              .sort((a, b) => {
                if (feedSort === 'recent') {
                  return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
                }
                if (feedSort === 'unlocks-desc') {
                  return (20 - (b.unlockCount || 0)) - (20 - (a.unlockCount || 0)); // Most remaining unlocks first
                }
                if (feedSort === 'unlocks-asc') {
                  return (20 - (a.unlockCount || 0)) - (20 - (b.unlockCount || 0)); // Fewest remaining unlocks first
                }
                if (feedSort === 'budget-high') {
                  return parseBudgetValues(b.budgetRange).maxVal - parseBudgetValues(a.budgetRange).maxVal;
                }
                if (feedSort === 'budget-low') {
                  return parseBudgetValues(a.budgetRange).minVal - parseBudgetValues(b.budgetRange).minVal;
                }
                return 0;
              });

            if (filteredAndSortedJobs.length === 0) {
              return (
                <div className="space-y-4">
                  {/* FILTERS & SORTS BAR */}
                  <div className="bg-white/85 dark:bg-slate-900/90 backdrop-blur-xs border border-amber-200/80 dark:border-amber-900/40 p-4 rounded-2xl shadow-xs space-y-3.5">
                    <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800/60">
                      <SlidersHorizontal className="h-4 w-4 text-indigo-500 shrink-0" />
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        Filter & Sort Live Matches
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {/* Category Filter */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Category
                        </label>
                        <div className="relative">
                          <select
                            value={feedCategoryFilter}
                            onChange={(e) => setFeedCategoryFilter(e.target.value)}
                            className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 py-1.5 pl-2.5 pr-8 rounded-xl appearance-none focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all cursor-pointer"
                          >
                            <option value="all">All Matched ({profile.subscribedCategories.length})</option>
                            {profile.subscribedCategories.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat.toUpperCase()}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      {/* Budget Filter */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Budget
                        </label>
                        <div className="relative">
                          <select
                            value={feedBudgetFilter}
                            onChange={(e) => setFeedBudgetFilter(e.target.value as any)}
                            className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 py-1.5 pl-2.5 pr-8 rounded-xl appearance-none focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all cursor-pointer"
                          >
                            <option value="any">Any Budget</option>
                            <option value="under-50k">Under KSh 50,000</option>
                            <option value="50k-150k">KSh 50,000 - 150,000</option>
                            <option value="150k-300k">KSh 150,000 - 300,000</option>
                            <option value="over-300k">Over KSh 300,000</option>
                          </select>
                          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      {/* Unlocks Filter */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Unlocks Remaining
                        </label>
                        <div className="relative">
                          <select
                            value={feedUnlocksFilter}
                            onChange={(e) => setFeedUnlocksFilter(e.target.value as any)}
                            className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 py-1.5 pl-2.5 pr-8 rounded-xl appearance-none focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all cursor-pointer"
                          >
                            <option value="any">Any slots</option>
                            <option value="has-remaining">Has spots left (&lt; 20 claimed)</option>
                            <option value="highly-available">Highly Available (&gt;= 10 spots left)</option>
                            <option value="low-remaining">Hot Deals (1-5 spots left)</option>
                          </select>
                          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      {/* Sort Filter */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Sort Order
                        </label>
                        <div className="relative">
                          <select
                            value={feedSort}
                            onChange={(e) => setFeedSort(e.target.value as any)}
                            className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 py-1.5 pl-2.5 pr-8 rounded-xl appearance-none focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all cursor-pointer"
                          >
                            <option value="recent">📅 Date Posted: Recent First</option>
                            <option value="unlocks-desc">🔓 Unlocks Remaining: High to Low</option>
                            <option value="unlocks-asc">🔥 Unlocks Remaining: Low to High</option>
                            <option value="budget-high">💰 Budget: High to Low</option>
                            <option value="budget-low">🪙 Budget: Low to High</option>
                          </select>
                          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* Active Filters Clear Button */}
                    {(feedCategoryFilter !== 'all' || feedBudgetFilter !== 'any' || feedUnlocksFilter !== 'any' || feedSort !== 'recent') && (
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                          <span>Active criteria:</span>
                          {feedCategoryFilter !== 'all' && (
                            <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-md font-bold">
                              Category: {feedCategoryFilter.toUpperCase()}
                            </span>
                          )}
                          {feedBudgetFilter !== 'any' && (
                            <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-md font-bold">
                              Budget: {feedBudgetFilter}
                            </span>
                          )}
                          {feedUnlocksFilter !== 'any' && (
                            <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-md font-bold">
                              Unlocks: {feedUnlocksFilter}
                            </span>
                          )}
                          {feedSort !== 'recent' && (
                            <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-md font-bold">
                              Sorted
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFeedCategoryFilter('all');
                            setFeedBudgetFilter('any');
                            setFeedUnlocksFilter('any');
                            setFeedSort('recent');
                          }}
                          className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                          <span>Reset Filters</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                    <Activity className="h-8 w-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">No Matches for Filter Criteria</h4>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-sm mx-auto leading-normal">
                      Try resetting your budget, unlocks remaining, or category filter to discover more job alerts!
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {/* FILTERS & SORTS BAR */}
                <div className="bg-white/85 dark:bg-slate-900/90 backdrop-blur-xs border border-amber-200/80 dark:border-amber-900/40 p-4 rounded-2xl shadow-xs space-y-3.5">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800/60">
                    <SlidersHorizontal className="h-4 w-4 text-indigo-500 shrink-0" />
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Filter & Sort Live Matches
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Category Filter */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Category
                      </label>
                      <div className="relative">
                        <select
                          value={feedCategoryFilter}
                          onChange={(e) => setFeedCategoryFilter(e.target.value)}
                          className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 py-1.5 pl-2.5 pr-8 rounded-xl appearance-none focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all cursor-pointer"
                        >
                          <option value="all">All Matched ({profile.subscribedCategories.length})</option>
                          {profile.subscribedCategories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat.toUpperCase()}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Budget Filter */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Budget
                      </label>
                      <div className="relative">
                        <select
                          value={feedBudgetFilter}
                          onChange={(e) => setFeedBudgetFilter(e.target.value as any)}
                          className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 py-1.5 pl-2.5 pr-8 rounded-xl appearance-none focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all cursor-pointer"
                        >
                          <option value="any">Any Budget</option>
                          <option value="under-50k">Under KSh 50,000</option>
                          <option value="50k-150k">KSh 50,000 - 150,000</option>
                          <option value="150k-300k">KSh 150,000 - 300,000</option>
                          <option value="over-300k">Over KSh 300,000</option>
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Unlocks Filter */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Unlocks Remaining
                      </label>
                      <div className="relative">
                        <select
                          value={feedUnlocksFilter}
                          onChange={(e) => setFeedUnlocksFilter(e.target.value as any)}
                          className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 py-1.5 pl-2.5 pr-8 rounded-xl appearance-none focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all cursor-pointer"
                        >
                          <option value="any">Any slots</option>
                          <option value="has-remaining">Has spots left (&lt; 20 claimed)</option>
                          <option value="highly-available">Highly Available (&gt;= 10 spots left)</option>
                          <option value="low-remaining">Hot Deals (1-5 spots left)</option>
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Sort Filter */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Sort Order
                      </label>
                      <div className="relative">
                        <select
                          value={feedSort}
                          onChange={(e) => setFeedSort(e.target.value as any)}
                          className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 py-1.5 pl-2.5 pr-8 rounded-xl appearance-none focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all cursor-pointer"
                        >
                          <option value="recent">📅 Date Posted: Recent First</option>
                          <option value="unlocks-desc">🔓 Unlocks Remaining: High to Low</option>
                          <option value="unlocks-asc">🔥 Unlocks Remaining: Low to High</option>
                          <option value="budget-high">💰 Budget: High to Low</option>
                          <option value="budget-low">🪙 Budget: Low to High</option>
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Active Filters Clear Button */}
                  {(feedCategoryFilter !== 'all' || feedBudgetFilter !== 'any' || feedUnlocksFilter !== 'any' || feedSort !== 'recent') && (
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                        <span>Active criteria:</span>
                        {feedCategoryFilter !== 'all' && (
                          <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-md font-bold">
                            Category: {feedCategoryFilter.toUpperCase()}
                          </span>
                        )}
                        {feedBudgetFilter !== 'any' && (
                          <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-md font-bold">
                            Budget: {feedBudgetFilter}
                          </span>
                        )}
                        {feedUnlocksFilter !== 'any' && (
                          <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-md font-bold">
                            Unlocks: {feedUnlocksFilter}
                          </span>
                        )}
                        {feedSort !== 'recent' && (
                          <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-md font-bold">
                            Sorted
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFeedCategoryFilter('all');
                          setFeedBudgetFilter('any');
                          setFeedUnlocksFilter('any');
                          setFeedSort('recent');
                        }}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                        <span>Reset Filters</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[700px] overflow-y-auto pr-1">
                  {filteredAndSortedJobs.map((job) => {
                    const isUnlocked = (profile.unlockedJobIds || []).includes(job.id);
                    const isClosed = job.status === 'closed';

                    return (
                      <div
                        key={job.id}
                        onClick={() => onViewJob && onViewJob(job.id)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs hover:shadow-md hover:border-indigo-400 hover:ring-2 hover:ring-indigo-100 dark:hover:ring-indigo-950/40 transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer group/card"
                      >
                        <span className="absolute top-0 right-0 bg-indigo-500 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-bl-lg shadow-xs">
                          LIVE MATCH
                        </span>

                        <div className="space-y-2.5">
                          {/* Match indicator label */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-400 text-[8px] font-black uppercase tracking-wider rounded-md">
                              {job.category.toUpperCase()}
                            </span>
                            {/* STATUS BADGE */}
                            <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${
                              isClosed 
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50' 
                                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50'
                            }`}>
                              {isClosed ? 'CLOSED' : 'OPEN'}
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold">
                              {job.postedDate}
                            </span>
                          </div>

                          {/* Title & Client */}
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-950 dark:text-slate-100 group-hover/card:text-indigo-600 dark:group-hover/card:text-indigo-400 transition-colors line-clamp-1">{job.title}</h4>
                          </div>

                          {/* Description */}
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-semibold line-clamp-3">
                            {job.description}
                          </p>

                          {/* Budget, Location */}
                          <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800/60">
                            <div>
                              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[8px]">Budget</span>
                              <span className="text-slate-800 dark:text-slate-200 font-black">{job.budgetRange}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[8px]">Location</span>
                              <span className="text-slate-800 dark:text-slate-200 font-extrabold truncate block">{job.location}</span>
                            </div>
                          </div>
                        </div>

                        {/* Contact Details Panel */}
                        <div className="mt-4 pt-3 border-t border-slate-150 dark:border-slate-800/80 space-y-2">
                          {isUnlocked ? (
                            <>
                              <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-wider">
                                <span className="text-slate-400">Verified Contacts:</span>
                                <span className="text-emerald-600 flex items-center gap-0.5 font-black">
                                  <Check className="h-2.5 w-2.5" /> Unlocked
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 text-[9px] font-bold">
                                <a 
                                  href={`mailto:${job.clientEmail}`} 
                                  onClick={(e) => e.stopPropagation()}
                                  className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 transition-colors"
                                >
                                  📧 {job.clientEmail}
                                </a>
                                {job.clientPhone && (
                                  <a
                                    href={`tel:${job.clientPhone}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 transition-colors"
                                  >
                                    📞 {job.clientPhone}
                                  </a>
                                )}
                                {job.clientWhatsapp && (
                                  <a 
                                    href={`https://wa.me/${job.clientWhatsapp}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    onClick={(e) => e.stopPropagation()}
                                    className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 rounded transition-colors"
                                  >
                                    💬 WhatsApp
                                  </a>
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-wider">
                                <span className="text-slate-400">Verified Contacts:</span>
                                <span className="text-amber-600 flex items-center gap-0.5 font-black">
                                  <Lock className="h-2.5 w-2.5" /> Locked
                                </span>
                              </div>
                              {/* Masked display of contacts so they are technically visible but protected from access */}
                              <div className="flex flex-wrap gap-1.5 text-[9px] font-bold opacity-60 filter blur-[1px] select-none pointer-events-none">
                                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300">
                                  📧 {maskEmail(job.clientEmail)}
                                </span>
                                {job.clientPhone && (
                                  <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300">
                                    📞 {maskPhone(job.clientPhone)}
                                  </span>
                                )}
                              </div>

                              {/* Unlock Button */}
                              <div className="pt-1">
                                {isClosed ? (
                                  <div className="w-full text-center py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-[9px] font-black uppercase border border-slate-200 dark:border-slate-700">
                                    Job Brief Closed
                                  </div>
                                ) : (job.unlockCount || 0) >= 20 ? (
                                  <div className="w-full text-center py-2 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl text-[9px] font-black uppercase border border-rose-100 dark:border-rose-900/50">
                                    Unlock Limit Reached (20/20)
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => handleUnlockContacts(e, job)}
                                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-xs"
                                  >
                                    <Unlock className="h-3 w-3 shrink-0" />
                                    <span>Unlock — KSh {job.unlockPriceKsh || 50}</span>
                                    <span className="text-[8px] font-medium opacity-85">({job.unlockCount || 0}/20 claimed)</span>
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()
        )}
      </div>

      {/* PROFILE PUBLISHING & CONTROLS DASHBOARD HEADER BLOCK */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 md:p-6 shadow-xs max-w-4xl mx-auto space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-black uppercase text-slate-800 tracking-wider">Profile Controls</h2>
              {/* Draft Status badge */}
              {profile.hasUnpublishedChanges ? (
                <span className="inline-flex items-center gap-1.5 text-[9px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200/60 px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                  <AlertCircle className="h-3 w-3" />
                  <span>Unpublished Draft Changes</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  <CheckCircle className="h-3 w-3" />
                  <span>All Changes Published Live</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Manage your live portfolio presence, publish recent styling changes to clients, or permanently remove your freelancer account.
            </p>
          </div>

          {/* Quick Visibility Switch */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-150 rounded-2xl p-2 md:p-3 self-start md:self-auto">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider pl-1">Visibility:</span>
            <div className="flex gap-1 bg-slate-200/60 p-0.5 rounded-xl">
              <button
                type="button"
                onClick={() => handleToggleProfileVisibility(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  profile.isPublic !== false
                    ? 'bg-white text-emerald-600 shadow-xs border border-slate-100'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Globe className="h-3.5 w-3.5" />
                <span>Public (Live)</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleProfileVisibility(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  profile.isPublic === false
                    ? 'bg-rose-600 text-white shadow-xs border border-rose-500'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Private (Offline)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Buttons Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            {/* Publish Changes button */}
            <button
              type="button"
              disabled={!profile.hasUnpublishedChanges}
              onClick={handlePublishChanges}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-md ${
                profile.hasUnpublishedChanges
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
              }`}
            >
              <UploadCloud className="h-4 w-4" />
              <span>Publish Changes</span>
            </button>
          </div>

          {/* Delete Profile button */}
          <button
            type="button"
            onClick={() => setShowDeleteProfileConfirm(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 text-xs font-bold rounded-2xl border border-rose-100 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Profile</span>
          </button>
        </div>

        {/* Toast Notification Success banner */}
        {publishSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200/50 p-3 rounded-2xl text-xs font-semibold mt-2 shadow-xs"
          >
            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>All draft updates have been compiled, synced, and published live to your marketplace website!</span>
          </motion.div>
        )}
      </div>

      {/* Dashboard Sub-navigation - Spanned across the screen looking like the top navigation bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 bg-[#87cefa] border border-[#72bbf0] p-1.5 rounded-2xl max-w-5xl w-full mx-auto shadow-sm">
        {[
          { id: 'branding', label: 'Albums & Branding', icon: Palette },
          { id: 'portfolio', label: 'Clients & Brands', icon: ImageIcon },
          { id: 'timeline', label: 'Timeline Posts', icon: Activity },
          { id: 'offers', label: 'Offers & Promos', icon: Tag },
          { id: 'notifications', label: 'Bookings & Alerts', icon: BellRing },
          { id: 'password', label: 'Change Password', icon: Lock }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 px-2 py-3 rounded-xl text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border text-center ${
                isActive 
                  ? 'bg-indigo-950 text-white border-indigo-950 shadow-sm' 
                  : 'bg-white/65 hover:bg-white text-indigo-950 hover:text-indigo-950 border-indigo-900/5'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="whitespace-normal text-center leading-tight break-words max-w-full">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Workspace Area */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8">
        <AnimatePresence mode="wait">
          
          {/* PERSONAL BRANDING TAB */}
          {activeTab === 'branding' && (
            <motion.div
              key="branding"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >

              {/* Upload & Manage Albums */}
              <div className="space-y-6">
                <div className="space-y-1 pb-4 border-b border-slate-100">
                  <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <Palette className="h-5 w-5 text-indigo-600" />
                    <span>Upload & Manage Creative Albums</span>
                  </h2>
                  <p className="text-sm text-slate-500">
                    Add new creative works, write about your design process, upload showcase videos or gallery slides, and edit existing albums.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                  {/* Left Column: Create or Edit Album Form */}
                  <div className="bg-slate-50 border border-slate-150/60 rounded-2xl p-5 md:p-6 space-y-4">
                    <div className="space-y-1" id="album-form-heading">
                      <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Palette className="h-4 w-4 text-indigo-500" />
                        <span>{editingItemId ? 'Edit Portfolio Album' : 'Create New Album'}</span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        {editingItemId ? 'Update details of your existing album work.' : 'Publish a new rich album with multiple slides, cover photos, or video links.'}
                      </p>
                    </div>

                    {editingItemId && (
                      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2.5 rounded-xl text-[10.5px] font-semibold flex items-center justify-between gap-1.5 animate-pulse">
                        <div className="flex items-center gap-1.5">
                          <Pen className="h-3.5 w-3.5 text-amber-600" />
                          <span>Editing Mode Active: Updating Album details.</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItemId(null);
                            setWorkTitle('');
                            setWorkDesc('');
                            setWorkImg('');
                            setWorkVideoUrl('');
                            setWorkVideoUrls(['']);
                            setUploadedCover(null);
                            setUploadedImages([]);
                          }}
                          className="text-[9px] font-extrabold uppercase hover:underline text-amber-700 cursor-pointer"
                        >
                          Cancel Edit
                        </button>
                      </div>
                    )}

                    <form onSubmit={handleAddWork} className="space-y-4">
                      {/* Project Title */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Project Title *</label>
                        <input
                          type="text"
                          required
                          value={workTitle}
                          onChange={(e) => setWorkTitle(e.target.value)}
                          placeholder="e.g. Summer Solstice Portrait Film"
                          className="w-full text-xs bg-white border border-slate-200 focus:border-indigo-500 p-2.5 rounded-xl outline-none font-semibold transition-all shadow-xs text-slate-900"
                        />
                      </div>

                      {/* Creative Category */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Category *</label>
                        <select
                          value={workCat}
                          onChange={(e: any) => setWorkCat(e.target.value)}
                          className="w-full text-xs bg-white border border-slate-200 focus:border-indigo-500 p-2.5 rounded-xl outline-none font-semibold transition-all shadow-xs text-slate-900"
                        >
                          {[
                            { id: 'actors', label: 'Actors And Performing Artists' },
                            { id: 'baking', label: 'Baking & Cake Art' },
                            { id: 'beauty', label: 'Beauty And Makeup Artists' },
                            { id: 'branding', label: 'Branding' },
                            { id: 'content', label: 'Content Creation' },
                            { id: 'marketing', label: 'Digital Marketing' },
                            { id: 'organizers', label: 'Event Organizers' },
                            { id: 'decorators', label: 'Event Stylists And Decorators' },
                            { id: 'hospitality', label: 'Event Ushers And Hospitality' },
                            { id: 'events', label: 'Events (MCs, Decor, DJs, Sound)' },
                            { id: 'fashion', label: 'Fashion' },
                            { id: 'fineartist', label: 'Fine Artists' },
                            { id: 'florists', label: 'Florists And Floral Designers' },
                            { id: 'design', label: 'Graphic Design' },
                            { id: 'illustration', label: 'Illustration' },
                            { id: 'interiordesign', label: 'Interior Design' },
                            { id: 'musicproducers', label: 'Music Producers' },
                            { id: 'photography', label: 'Photography' },
                            { id: 'writers', label: 'Scripts Writers' },
                            { id: 'videography', label: 'Videography' },
                            { id: 'webdev', label: 'Web Design & Development' }
                          ].map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Description */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Description *</label>
                        <textarea
                          required
                          rows={3}
                          value={workDesc}
                          onChange={(e) => setWorkDesc(e.target.value)}
                          placeholder="Describe your creative process, equipment used, techniques..."
                          className="w-full text-xs bg-white border border-slate-200 focus:border-indigo-500 p-2.5 rounded-xl outline-none font-semibold transition-all shadow-xs text-slate-900 resize-none"
                        />
                      </div>

                      {/* Album Media Resources Sub-tabs */}
                      <div className="space-y-2 border-t border-slate-200/60 pt-3">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">Album Media Resources</label>
                        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                          {(['cover', 'images', 'video'] as const).map((tab) => (
                            <button
                              key={tab}
                              type="button"
                              onClick={() => setActiveMediaTab(tab)}
                              className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all capitalize cursor-pointer ${
                                activeMediaTab === tab
                                  ? 'bg-white text-slate-900 shadow-xs'
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              {tab === 'cover' ? 'Cover Photo' : tab === 'images' ? 'Gallery (Slides)' : 'Showcase Videos'}
                            </button>
                          ))}
                        </div>

                        {/* Sub-tab content area */}
                        <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-200/50 min-h-[140px] flex flex-col justify-center">
                          {activeMediaTab === 'cover' && (
                            <div className="space-y-3">
                              {uploadedCover ? (
                                <div className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-video max-w-xs mx-auto bg-slate-100 shadow-sm group">
                                  <img src={uploadedCover.dataUrl} alt="Cover preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                      type="button"
                                      onClick={removeUploadedCover}
                                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer transition-all flex items-center gap-1"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                      <span>Remove</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div
                                    onDragEnter={handleDrag}
                                    onDragOver={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDrop={handleCoverDrop}
                                    className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all relative flex flex-col items-center justify-center cursor-pointer ${
                                      dragActive ? 'border-indigo-500 bg-indigo-50/40' : 'border-slate-300 hover:border-slate-400 bg-white'
                                    }`}
                                    onClick={() => document.getElementById('cover-image-upload-input')?.click()}
                                  >
                                    <input id="cover-image-upload-input" type="file" accept="image/*" onChange={handleCoverFileChange} className="hidden" />
                                    <Upload className="h-5 w-5 text-indigo-500 mb-1.5 animate-bounce" />
                                    <p className="text-xs font-bold text-slate-700">Drag & Drop Cover Image here</p>
                                    <p className="text-[9px] text-slate-400 mt-0.5">or click to browse &bull; Max 5MB</p>
                                  </div>
                                  
                                  <div className="relative flex py-1 items-center">
                                    <div className="flex-grow border-t border-slate-200"></div>
                                    <span className="flex-shrink mx-3 text-[9px] font-bold text-slate-400 uppercase">or paste cover image URL</span>
                                    <div className="flex-grow border-t border-slate-200"></div>
                                  </div>

                                  <input
                                    type="url"
                                    value={workImg}
                                    onChange={(e) => setWorkImg(e.target.value)}
                                    placeholder="https://images.unsplash.com/photo-..."
                                    className="w-full text-xs bg-white border border-slate-200 focus:border-indigo-500 p-2.5 rounded-xl outline-none font-semibold transition-all shadow-xs text-slate-900"
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {activeMediaTab === 'images' && (
                            <div className="space-y-3">
                              {uploadedImages.length > 0 && (
                                <div className="grid grid-cols-3 gap-2">
                                  {uploadedImages.map((img, idx) => (
                                    <div key={idx} className="aspect-video rounded-xl overflow-hidden border border-slate-200 relative group bg-slate-50">
                                      <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                      <button
                                        type="button"
                                        onClick={() => removeUploadedImage(idx)}
                                        className="absolute top-1 right-1 p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer transition-colors"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {uploadedImages.length < 6 ? (
                                <div
                                  onDragEnter={handleDrag}
                                  onDragOver={handleDrag}
                                  onDragLeave={handleDrag}
                                  onDrop={handleDrop}
                                  className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all relative flex flex-col items-center justify-center cursor-pointer ${
                                    dragActive ? 'border-indigo-500 bg-indigo-50/40' : 'border-slate-300 hover:border-slate-400 bg-white'
                                  }`}
                                  onClick={() => document.getElementById('gallery-images-upload-input')?.click()}
                                >
                                  <input id="gallery-images-upload-input" type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
                                  <Upload className="h-5 w-5 text-indigo-500 mb-1.5 animate-bounce" />
                                  <p className="text-xs font-bold text-slate-700">Drag & Drop gallery photos ({uploadedImages.length}/6)</p>
                                  <p className="text-[9px] text-slate-400 mt-0.5">or click to upload multiples &bull; Max 5MB each</p>
                                </div>
                              ) : (
                                <p className="text-[10px] text-emerald-600 font-bold text-center">✓ Reached maximum of 6 gallery photos.</p>
                              )}
                            </div>
                          )}

                          {activeMediaTab === 'video' && (
                            <div className="space-y-2">
                              <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">Showcase Video Links</span>
                              <div className="space-y-2">
                                {workVideoUrls.map((url, idx) => (
                                  <div key={idx} className="flex gap-2">
                                    <input
                                      type="url"
                                      value={url}
                                      onChange={(e) => {
                                        const updated = [...workVideoUrls];
                                        updated[idx] = e.target.value;
                                        setWorkVideoUrls(updated);
                                      }}
                                      placeholder="e.g. https://www.youtube.com/watch?v=..."
                                      className="flex-1 text-xs bg-white border border-slate-200 focus:border-indigo-500 p-2 rounded-xl outline-none font-semibold transition-all shadow-xs text-slate-900"
                                    />
                                    {workVideoUrls.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = [...workVideoUrls];
                                          updated.splice(idx, 1);
                                          setWorkVideoUrls(updated);
                                        }}
                                        className="p-2 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl border border-slate-200 cursor-pointer transition-colors shrink-0"
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                                {workVideoUrls.length < 5 && (
                                  <button
                                    type="button"
                                    onClick={() => setWorkVideoUrls([...workVideoUrls, ''])}
                                    className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                                  >
                                    <span>+ Add another video URL</span>
                                  </button>
                                )}
                              </div>
                              <p className="text-[9px] text-slate-400">Add YouTube links or direct mp4 videos to embed a responsive video showcase inside your portfolio slide expansion.</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                        >
                          {editingItemId ? 'Update & Save Album' : 'Publish Album & Add to List'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Right Column: Manage Existing Items */}
                  <div className="bg-sky-50/60 border border-[#1e90ff] rounded-2xl p-5 md:p-6 h-full flex flex-col gap-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 flex flex-wrap items-center gap-2">
                        <span>Manage Existing Albums</span>
                        <span className="px-2 py-0.5 text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-150/50 rounded-full font-black">
                          {profile.portfolio.filter(p => p.isLive !== false).length} Live / {profile.portfolio.length} Total
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400">Review, update details, add showcase videos, attach gallery slides, or remove existing works.</p>
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[520px] pr-1 custom-scrollbar">
                      {profile.portfolio.map((item) => {
                        const isEditing = editingItemId === item.id;
                        const isExpanded = expandedItemId === item.id;
                        return (
                          <div
                            key={item.id}
                            onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                            className={`bg-white border rounded-xl p-4 transition-all duration-300 shadow-2xs hover:shadow-xs cursor-pointer select-none ${
                              isEditing 
                                ? 'border-indigo-500 bg-indigo-50/10 shadow-xs ring-1 ring-indigo-500/20' 
                                : isExpanded 
                                  ? 'border-indigo-400 bg-indigo-50/5 shadow-xs ring-1 ring-indigo-100/30' 
                                  : 'border-slate-150 hover:border-slate-250 hover:bg-slate-50/30'
                            }`}
                          >
                            {/* Top Header Row with Cover image and basic details */}
                            <div className="flex gap-3.5 items-start">
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-16 h-16 rounded-xl object-cover border border-slate-100 shrink-0 transition-transform duration-300"
                                referrerPolicy="no-referrer"
                              />
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="text-xs font-extrabold text-slate-900 truncate flex items-center gap-1.5">
                                    <span>{item.title}</span>
                                    {isExpanded ? (
                                      <ChevronUp className="h-3 w-3 text-indigo-500 shrink-0" />
                                    ) : (
                                      <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
                                    )}
                                  </h4>
                                  <div className="flex gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      onClick={() => {
                                        // Load the entire album details into the "ADD NEW ALBUM" form
                                        setEditingItemId(item.id);
                                        setWorkTitle(item.title);
                                        setWorkCat(item.category);
                                        setWorkDesc(item.description);
                                        setWorkVideoUrl(item.videoUrl || '');
                                        setWorkVideoUrls(item.videoUrl ? item.videoUrl.split(',') : ['']);
                                        
                                        // Load cover
                                        if (item.imageUrl) {
                                          setUploadedCover({ name: 'Cover Photo', dataUrl: item.imageUrl, size: 0 });
                                          if (!item.imageUrl.startsWith('data:')) {
                                            setWorkImg(item.imageUrl);
                                          } else {
                                            setWorkImg('');
                                          }
                                        } else {
                                          setUploadedCover(null);
                                          setWorkImg('');
                                        }

                                        // Load gallery images
                                        if (item.galleryUrls && item.galleryUrls.length > 0) {
                                          setUploadedImages(item.galleryUrls.map((url, idx) => ({
                                            name: `Photo ${idx + 1}`,
                                            dataUrl: url,
                                            size: 0
                                          })));
                                        } else {
                                          setUploadedImages([]);
                                        }

                                        // Select correct media tab
                                        setActiveMediaTab('cover');

                                        // Provide feedback/UX cue by smoothly scrolling to the form
                                        const formEl = document.getElementById('album-form-heading');
                                        if (formEl) {
                                          formEl.scrollIntoView({ behavior: 'smooth' });
                                        } else {
                                          window.scrollTo({ top: 350, behavior: 'smooth' });
                                        }
                                      }}
                                      className={`p-1 rounded-lg border cursor-pointer transition-colors ${
                                        isEditing 
                                          ? 'bg-indigo-600 border-indigo-600 text-white' 
                                          : 'bg-slate-50 border-slate-100 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600'
                                      }`}
                                      title="Edit details in main form"
                                    >
                                      <Pen className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setDeletingItemId(item.id)}
                                      className="p-1 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg border border-slate-100 cursor-pointer transition-colors"
                                      title="Delete item"
                                    >
                                      <Trash className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                  <span className="inline-block text-[9px] font-black uppercase text-indigo-600 bg-indigo-50/70 px-1.5 py-0.5 rounded">
                                    {item.category}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => handleTogglePortfolioLive(item.id)}
                                    className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border cursor-pointer transition-all duration-300 ${
                                      item.isLive !== false
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 hover:bg-emerald-100'
                                        : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                    }`}
                                    title={item.isLive !== false ? "Click to set Offline (unlive)" : "Click to set Online (live)"}
                                  >
                                    <span className={`h-1.5 w-1.5 rounded-full ${item.isLive !== false ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                    <span>{item.isLive !== false ? 'Live' : 'Unlive (Hidden)'}</span>
                                  </button>
                                </div>
                                <p className={`text-[10.5px] text-slate-500 font-medium ${isExpanded ? '' : 'line-clamp-2'}`}>
                                  {item.description}
                                </p>
                              </div>
                            </div>

                            {/* Full-width Expanded Media & Stats Details (aligned directly with outer card edges) */}
                            {isExpanded ? (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="space-y-3 pt-3 text-slate-600 border-t border-slate-100 mt-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {/* Large cover preview inside expansion */}
                                <div className="space-y-1">
                                  <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Cover Image Preview</span>
                                  <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="w-full h-32 rounded-xl object-cover border border-slate-200"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>

                                {item.videoUrl && (
                                  <div className="space-y-3">
                                    <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                                      <Video className="h-3 w-3 text-indigo-500" />
                                      <span>Showcase Video Links & Live Previews</span>
                                    </span>
                                    <div className="space-y-2.5">
                                      {item.videoUrl.split(',').map((url, uIdx) => {
                                        const trimmed = url.trim();
                                        if (!trimmed) return null;
                                        return (
                                          <div key={uIdx} className="space-y-1.5 bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                                            {renderVideoPreview(trimmed)}
                                            <a 
                                              href={trimmed} 
                                              target="_blank" 
                                              rel="noreferrer" 
                                              className="text-[10.5px] text-indigo-600 font-semibold hover:underline break-all block bg-white p-2 rounded-lg border border-slate-100/80"
                                            >
                                              {trimmed}
                                            </a>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {item.galleryUrls && item.galleryUrls.length > 0 && (
                                  <div className="space-y-1.5">
                                    <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">
                                      Gallery Images ({item.galleryUrls.length})
                                    </span>
                                    <div className="grid grid-cols-3 gap-2">
                                      {item.galleryUrls.map((url, index) => (
                                        <div key={index} className="aspect-video rounded-lg overflow-hidden border border-slate-100 bg-slate-50 relative group">
                                          <img
                                            src={url}
                                            alt={`Slide ${index + 1}`}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                            referrerPolicy="no-referrer"
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                <div className="text-[9px] text-slate-400 font-mono flex items-center gap-3">
                                  <span>Date: {item.date}</span>
                                  <span>Likes: {item.likes}</span>
                                  <span>Views: {item.views}</span>
                                </div>
                              </motion.div>
                            ) : (
                              /* Standard tags only visible in collapsed state */
                              <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100/50 pt-2">
                                {item.videoUrl ? (
                                  <span className="text-[8px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
                                    🎥 SHOWCASE VIDEO ACTIVE
                                  </span>
                                ) : (
                                  <span className="text-[8px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-dashed border-slate-200">
                                    No Showcase Video
                                  </span>
                                )}
                                {item.galleryUrls && item.galleryUrls.length > 0 ? (
                                  <span className="text-[8px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                    🖼️ {item.galleryUrls.length} GALLERY IMAGES
                                  </span>
                                ) : (
                                  <span className="text-[8px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-dashed border-slate-200">
                                    No Extra Slides
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Update Contact details */}
              <div className="space-y-4 border-t border-slate-100 pt-6">
                <div className="space-y-1">
                  <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-600" />
                    <span>Manage Professional Contact Details (Required)</span>
                  </h2>
                  <p className="text-sm text-slate-400">Keep your required contact details up-to-date so clients can reach you directly through your portfolio.</p>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  saveProfileDraft({
                    ...profile,
                    email: profileEmail,
                    phone: profilePhone,
                    whatsapp: profileWhatsapp
                  });
                  setSaveContactSuccess(true);
                  setTimeout(() => setSaveContactSuccess(false), 3000);
                }} className="space-y-4 max-w-xl bg-slate-50 border border-slate-150 p-5 rounded-2xl">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. macharia@talantahub.com"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">Call Number *</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +254 712 345678"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">WhatsApp Number *</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +254 712 345678"
                        value={profileWhatsapp}
                        onChange={(e) => setProfileWhatsapp(e.target.value)}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-4">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
                    >
                      Save Contact Info
                    </button>

                    <AnimatePresence>
                      {saveContactSuccess && (
                        <motion.span
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -5 }}
                          className="text-xs font-bold text-emerald-600 flex items-center gap-1"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>Contact information updated!</span>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* RECENT WORKS & CATEGORY THUMBNAILS TAB */}
          {activeTab === 'portfolio' && (
            <motion.div
              key="portfolio"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Upload work item */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-indigo-600" />
                    <span>Notable Clients & Brands</span>
                  </h2>
                  <p className="text-sm text-slate-400">Post details of a new client or brand partner. It will appear instantly on your custom portfolio page.</p>
                </div>

                {clientUploadError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-xl flex items-center gap-2 font-bold">
                    <AlertCircle className="h-4 w-4" />
                    <span>{clientUploadError}</span>
                  </div>
                )}

                <form onSubmit={handleAddClientBrand} className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-150">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Client / Brand Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Nike, Google, Coca-Cola"
                      value={clientBrandName}
                      onChange={(e) => setClientBrandName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-900"
                    />
                  </div>

                  {/* Logo selection tab */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-t border-slate-200/50 pt-3">
                      <label className="text-xs font-bold text-slate-700">Brand Logo / Image *</label>
                      
                      <div className="flex bg-slate-200/60 p-0.5 rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setClientLogoMethod('upload')}
                          className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                            clientLogoMethod === 'upload'
                              ? 'bg-white text-indigo-600 shadow-sm'
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          Drag & Drop / Browse
                        </button>
                        <button
                          type="button"
                          onClick={() => setClientLogoMethod('url')}
                          className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                            clientLogoMethod === 'url'
                              ? 'bg-white text-indigo-600 shadow-sm'
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          Image URL
                        </button>
                      </div>
                    </div>

                    {clientLogoMethod === 'upload' ? (
                      <div
                        onDragEnter={handleClientDrag}
                        onDragOver={handleClientDrag}
                        onDragLeave={handleClientDrag}
                        onDrop={handleClientDrop}
                        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all relative flex flex-col items-center justify-center cursor-pointer min-h-[140px] ${
                          clientDragActive
                            ? 'border-indigo-500 bg-indigo-50/20'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                        onClick={() => clientFileInputRef.current?.click()}
                      >
                        <input
                          ref={clientFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleClientFileChange}
                          className="hidden"
                        />
                        {clientBrandLogo ? (
                          <div className="space-y-2">
                            <img
                              src={clientBrandLogo}
                              alt="Brand Logo Preview"
                              className="h-20 max-w-[200px] object-contain mx-auto rounded-lg border border-slate-200 bg-slate-50 p-1"
                              referrerPolicy="no-referrer"
                            />
                            <p className="text-[10px] text-emerald-600 font-bold uppercase">Logo Loaded Successfully</p>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setClientBrandLogo('');
                              }}
                              className="text-[10px] font-black uppercase text-rose-500 hover:underline cursor-pointer"
                            >
                              Remove Image
                            </button>
                          </div>
                        ) : (
                          <>
                            <UploadCloud className="h-8 w-8 text-slate-400 mb-1.5" />
                            <p className="text-xs font-bold text-slate-700">Drag & Drop brand logo here</p>
                            <p className="text-[10px] text-slate-400">or click to browse image files</p>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <input
                          type="url"
                          placeholder="e.g. https://images.unsplash.com/photo-..."
                          value={clientBrandLogo}
                          onChange={(e) => setClientBrandLogo(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-900"
                        />
                        {clientBrandLogo && (
                          <div className="flex gap-2 items-center bg-white p-2 rounded-xl border border-slate-200">
                            <img 
                              src={clientBrandLogo} 
                              alt="Brand Logo Preview" 
                              className="h-10 w-10 object-contain rounded bg-slate-50 p-1" 
                              onError={(e) => (e.target as HTMLElement).style.display = 'none'} 
                              referrerPolicy="no-referrer" 
                            />
                            <span className="text-[10px] text-slate-400 font-bold truncate flex-grow">URL Preview: {clientBrandLogo}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                    >
                      Publish Client / Brand
                    </button>
                  </div>
                </form>
              </div>

              {/* Client brand list to manage and delete */}
              <div className="space-y-4 border-t border-slate-100 pt-6">
                <h3 className="text-lg font-bold text-slate-900">Manage Client Brands</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {(profile.notableClients || DEFAULT_CLIENTS_MAP[profile.id] || []).map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border border-slate-150 rounded-xl overflow-hidden group relative flex flex-col justify-between p-4 shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClientBrand(item.id);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-lg transition-colors cursor-pointer z-10 opacity-0 group-hover:opacity-100"
                        title="Delete brand"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </button>

                      <div className="h-16 w-full flex items-center justify-center bg-slate-50/50 rounded-lg p-2 mb-2 border border-slate-100">
                        {item.logoUrl ? (
                          <img 
                            src={item.logoUrl} 
                            alt={item.name} 
                            className="max-h-full max-w-full object-contain" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-xl font-extrabold text-slate-400 select-none">
                            {item.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="text-center min-w-0 mt-1">
                        <h4 className="text-xs font-bold text-slate-950 truncate" title={item.name}>{item.name}</h4>
                        {item.website ? (
                          <a 
                            href={item.website} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[10px] text-indigo-500 hover:text-indigo-600 font-semibold truncate block mt-0.5"
                          >
                            Visit Website
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium block mt-0.5">No link</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* MY TIMELINE UPDATES TAB */}
          {activeTab === 'timeline' && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="space-y-1 pb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-indigo-600 animate-pulse" />
                  <span>Update My Professional Timeline</span>
                </h2>
                <p className="text-sm text-slate-500">
                  Share status updates, creative milestones, and design thoughts on your public profile. Each update text has a strict maximum length of 20 words.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Add/Edit Timeline Form */}
                <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 p-6 rounded-2xl space-y-4 shadow-xs">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Pen className="h-4 w-4 text-indigo-500" />
                      <span>{editingPostId ? 'Edit Timeline Post' : 'Post New Timeline Update'}</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Write a brief caption (20 words max) and optionally drop or link an image attachment.
                    </p>
                  </div>

                  {timelineError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-xl flex items-center gap-2 font-bold">
                      <AlertCircle className="h-4 w-4" />
                      <span>{timelineError}</span>
                    </div>
                  )}

                  <form onSubmit={editingPostId ? handleSaveEditPost : handleAddTimelinePost} className="space-y-4">
                    {/* Caption area with strict 20-word validation indicator */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Update Message (Max 20 Words) *</label>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          getWordCount(timelineCaption) > 20 
                            ? 'bg-rose-100 text-rose-600 font-black animate-pulse' 
                            : 'bg-indigo-50 text-indigo-600'
                        }`}>
                          Words: {getWordCount(timelineCaption)} / 20
                        </span>
                      </div>
                      <textarea
                        required
                        placeholder="Write something professional... (e.g. Completed photo shoot with Vogue today!)"
                        value={timelineCaption}
                        onChange={(e) => {
                          setTimelineCaption(e.target.value);
                          if (getWordCount(e.target.value) <= 20) {
                            setTimelineError(null);
                          } else {
                            setTimelineError("Limit of 20 words reached. Please shorten your caption.");
                          }
                        }}
                        rows={3}
                        className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl outline-none font-semibold text-slate-900 dark:text-slate-100 shadow-sm focus:border-indigo-500"
                      />
                    </div>

                    {/* Image option for timeline with Drag & Drop or URL */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between border-t border-slate-200/50 dark:border-slate-800 pt-3">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Image Attachment (Optional)</label>
                        
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700">
                          <button
                            type="button"
                            onClick={() => setTimelineLogoMethod('upload')}
                            className={`px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                              timelineLogoMethod === 'upload'
                                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                                : 'text-slate-500'
                            }`}
                          >
                            Drag & Drop
                          </button>
                          <button
                            type="button"
                            onClick={() => setTimelineLogoMethod('url')}
                            className={`px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                              timelineLogoMethod === 'url'
                                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                                : 'text-slate-500'
                            }`}
                          >
                            Web Link
                          </button>
                        </div>
                      </div>

                      {timelineLogoMethod === 'upload' ? (
                        <div
                          onDragEnter={handleTimelineDrag}
                          onDragOver={handleTimelineDrag}
                          onDragLeave={handleTimelineDrag}
                          onDrop={handleTimelineDrop}
                          className={`border-2 border-dashed rounded-xl p-4 text-center transition-all relative flex flex-col items-center justify-center cursor-pointer ${
                            timelineDragActive
                              ? 'border-indigo-500 bg-indigo-50/20'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60'
                          }`}
                          onClick={() => timelineFileInputRef.current?.click()}
                        >
                          <input
                            ref={timelineFileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleTimelineFileChange}
                            className="hidden"
                          />
                          {timelineImageUrl && timelineImageUrl.startsWith('data:') ? (
                            <div className="space-y-1.5 w-full">
                              <img
                                src={timelineImageUrl}
                                alt="Post Attachment draft"
                                className="h-32 w-full object-cover rounded-lg border border-slate-200 dark:border-slate-800"
                                referrerPolicy="no-referrer"
                              />
                              <p className="text-[9px] text-emerald-600 font-bold uppercase">Image Attachment Selected Successfully</p>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTimelineImageUrl('');
                                }}
                                className="text-[9px] font-black uppercase text-rose-500 hover:underline cursor-pointer"
                              >
                                Remove Attachment
                              </button>
                            </div>
                          ) : (
                            <>
                              <Upload className="h-5 w-5 text-slate-400 mb-1" />
                              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Drag & Drop attachment image here</p>
                              <p className="text-[9px] text-slate-400">or click to browse original resolution files</p>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <input
                            type="url"
                            placeholder="https://images.unsplash.com/photo-..."
                            value={timelineImageUrl}
                            onChange={(e) => setTimelineImageUrl(e.target.value)}
                            className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl outline-none font-semibold transition-all shadow-sm text-slate-900 dark:text-slate-100"
                          />
                          {timelineImageUrl && !timelineImageUrl.startsWith('data:') && (
                            <div className="flex gap-2 items-center bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                              <img src={timelineImageUrl} alt="Attachment url preview" className="h-8 w-8 object-cover rounded" onError={(e) => (e.target as HTMLElement).style.display = 'none'} referrerPolicy="no-referrer" />
                              <span className="text-[8px] text-slate-400 font-bold truncate flex-grow">URL Logo Preview: {timelineImageUrl}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Submit operations buttons */}
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                      {editingPostId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPostId(null);
                            setTimelineCaption('');
                            setTimelineImageUrl('');
                            setTimelineError(null);
                          }}
                          className="px-3.5 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                        >
                          Cancel Edit
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={getWordCount(timelineCaption) > 20}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:dark:bg-slate-800 disabled:cursor-not-allowed active:scale-95 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
                      >
                        <Check className="h-4 w-4" />
                        <span>{editingPostId ? 'Save Timeline Changes' : 'Publish Timeline Update'}</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Live Timeline Posts List */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">Live Timeline Updates ({getTimelinePosts().length})</h3>
                  
                  {getTimelinePosts().length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">No updates found on your timeline</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                      {getTimelinePosts().map((post) => (
                        <div key={post.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs space-y-3 relative group">
                          {/* Operations */}
                          <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              type="button"
                              onClick={() => handleStartEditPost(post)}
                              className="p-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-lg cursor-pointer border border-indigo-500/10"
                              title="Edit timeline post"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePost(post.id)}
                              className="p-1.5 bg-rose-50 dark:bg-rose-950 text-rose-500 hover:bg-rose-600 hover:text-white rounded-lg cursor-pointer border border-rose-500/10"
                              title="Delete timeline post"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>

                          {/* Post Header */}
                          <div className="flex gap-2 items-center">
                            {profile.avatarUrl ? (
                              <img src={profile.avatarUrl} alt={profile.fullName} className="h-7 w-7 rounded-full object-cover border border-slate-200 dark:border-slate-800" />
                            ) : (
                              <div className="h-7 w-7 rounded-full bg-indigo-50 border border-slate-200 dark:border-slate-800 text-indigo-700 flex items-center justify-center font-extrabold text-[10px] uppercase animate-pulse">
                                {profile.fullName[0]?.toUpperCase()}
                              </div>
                            )}
                            <div>
                              <span className="text-xs font-black text-slate-900 dark:text-slate-100 block leading-tight">{profile.fullName}</span>
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">{formatTimelineTime(post.timestamp)}</span>
                            </div>
                          </div>

                          {/* Image Attachment preview */}
                          {post.imageUrl && (
                            <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 max-h-40 flex items-center justify-center">
                              <img src={post.imageUrl} alt="Timeline post attachment" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                          )}

                          {/* Caption */}
                          {post.caption && (
                            <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-semibold whitespace-pre-wrap">
                              {post.caption}
                            </p>
                          )}

                          {/* Likes count */}
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-extrabold border-t border-slate-100 dark:border-slate-800 pt-2 mt-1">
                            <span>❤️ {post.likes} Likes received</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* SPECIAL OFFERS MANAGER */}
          {activeTab === 'offers' && (
            <motion.div
              key="offers"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8 text-left"
            >
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Tag className="h-5 w-5 text-indigo-600" />
                  <span>Special Promotional Offers & Deals</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Create and manage tailored deals to attract clients visiting your profile (e.g., 50% discount offers, seasonal packages, or flat rate consultations).
                </p>
              </div>

              {/* Grid: Create/Edit Form (Left) & Existing Offers List (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Creation Form Column */}
                <div className="lg:col-span-5 bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Megaphone className="h-4 w-4 text-indigo-500" />
                      <span>{editingOfferId ? 'Edit Promo Offer' : 'Create New Offer'}</span>
                    </h3>
                    <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      Draft Mode
                    </span>
                  </div>

                  {offerError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs rounded-xl flex items-center gap-2 font-bold animate-pulse">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{offerError}</span>
                    </div>
                  )}

                  {offerSuccess && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs rounded-xl flex items-center gap-2 font-bold">
                      <CheckCircle className="h-4 w-4 shrink-0" />
                      <span>{offerSuccess}</span>
                    </div>
                  )}

                  {/* Form Tabs: Basic Info & More Details */}
                  <div className="flex bg-slate-200/60 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setOfferFormTab('basic')}
                      className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        offerFormTab === 'basic'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Step 1: Basic Info
                    </button>
                    <button
                      type="button"
                      onClick={() => setOfferFormTab('details')}
                      className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        offerFormTab === 'details'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Step 2: More Details
                    </button>
                  </div>

                  <form onSubmit={handleAddOffer} className="space-y-4">
                    {offerFormTab === 'basic' ? (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        {/* Title */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-500 block">Offer Title *</label>
                          <input
                            type="text"
                            placeholder="e.g. 50% Off Professional Cake Baking"
                            value={offerTitle}
                            onChange={(e) => setOfferTitle(e.target.value)}
                            className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl outline-none font-semibold transition-all shadow-sm text-slate-950"
                          />
                        </div>

                        {/* Price / Discount */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-500 block">Promo Value / Discount / Price *</label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">🏷️</span>
                            <input
                              type="text"
                              placeholder="e.g. 50% Off, or KSh 12,500 flat"
                              value={offerPrice}
                              onChange={(e) => setOfferPrice(e.target.value)}
                              className="w-full text-xs pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl outline-none font-semibold transition-all shadow-sm text-slate-950"
                            />
                          </div>
                        </div>

                        {/* Dates Row */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-500 block">Start Date *</label>
                            <input
                              type="date"
                              value={offerStartDate}
                              onChange={(e) => setOfferStartDate(e.target.value)}
                              className="w-full text-xs px-3 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl outline-none font-semibold transition-all shadow-sm text-slate-950"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-500 block">End Date *</label>
                            <input
                              type="date"
                              value={offerEndDate}
                              onChange={(e) => setOfferEndDate(e.target.value)}
                              className="w-full text-xs px-3 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl outline-none font-semibold transition-all shadow-sm text-slate-950"
                            />
                          </div>
                        </div>

                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => setOfferFormTab('details')}
                            className="w-full py-2.5 bg-slate-900 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all hover:bg-slate-800 cursor-pointer"
                          >
                            Next: Type More Details →
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        {/* More Details Tab */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-500 block">Full Offer Inclusions & Details *</label>
                          <textarea
                            rows={6}
                            placeholder="Type comprehensive details here... (e.g. What is included, size, flavor options, free delivery, terms & conditions, etc.)"
                            value={offerDetails}
                            onChange={(e) => setOfferDetails(e.target.value)}
                            className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl outline-none font-semibold transition-all shadow-sm text-slate-950 resize-none"
                          />
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setOfferFormTab('basic')}
                            className="flex-1 py-2.5 bg-white text-slate-700 border border-slate-250 text-xs font-black uppercase tracking-wider rounded-xl transition-all hover:bg-slate-50 cursor-pointer"
                          >
                            ← Back to Basic
                          </button>
                          <button
                            type="submit"
                            className="flex-1 py-2.5 bg-indigo-600 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all hover:bg-indigo-700 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Check className="h-4 w-4" />
                            <span>{editingOfferId ? 'Update Offer' : 'Publish Offer'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </form>
                </div>

                {/* List Column */}
                <div className="lg:col-span-7 space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">
                    Live Active Offers ({ (profile.offers || []).length })
                  </h3>

                  { (!profile.offers || profile.offers.length === 0) ? (
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                      <Tag className="h-8 w-8 text-slate-400 mx-auto mb-2 animate-bounce" />
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">No offers created yet</p>
                      <p className="text-[10px] text-slate-500 mt-1 max-w-xs mx-auto">
                        Fill out the form on the left to publish your first special promotional discount deal. It will show up immediately on your profile!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                      {profile.offers.map((offer) => (
                        <div
                          key={offer.id}
                          className={`p-4 rounded-xl border transition-all ${
                            offer.isActive === false
                              ? 'bg-slate-50 border-slate-200 opacity-60'
                              : 'bg-white border-slate-200 hover:border-slate-350 shadow-xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1.5 flex-grow">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100">
                                  {offer.price}
                                </span>
                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                                  offer.isActive !== false
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                    : 'bg-slate-200 text-slate-500 border border-slate-300'
                                }`}>
                                  {offer.isActive !== false ? 'Live' : 'Paused'}
                                </span>
                              </div>

                              <h4 className="text-sm font-extrabold text-slate-950 leading-tight">
                                {offer.title}
                              </h4>

                              <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-slate-400" />
                                  <span>{offer.startDate} to {offer.endDate}</span>
                                </span>
                              </div>

                              <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1 italic line-clamp-3">
                                "{offer.details}"
                              </p>
                            </div>

                            {/* Actions buttons */}
                            <div className="flex flex-col gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleToggleOfferActive(offer.id)}
                                className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg border transition-colors cursor-pointer text-center ${
                                  offer.isActive !== false
                                    ? 'bg-slate-100 text-slate-700 border-slate-250 hover:bg-slate-200'
                                    : 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-700'
                                }`}
                              >
                                {offer.isActive !== false ? 'Pause' : 'Activate'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStartEditOffer(offer)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-250 cursor-pointer flex items-center justify-center"
                                title="Edit Offer"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteOffer(offer.id)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 rounded-lg border border-rose-100 cursor-pointer flex items-center justify-center"
                                title="Delete Offer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          )}

          {/* NOTIFICATION SUBSCRIPTIONS */}
          {activeTab === 'notifications' && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8 text-left"
            >
              {/* SECTION 1: CALL BOOKINGS NOTIFICATION BOARD */}
              <div className="bg-slate-900 text-white p-6 md:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6 relative overflow-hidden">
                <div className="absolute -right-16 -top-16 w-44 h-44 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-black uppercase tracking-widest border border-indigo-500/10">
                      LIVE Notification Board
                    </span>
                    <h3 className="text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
                      <PhoneCall className="h-5 w-5 text-indigo-400 animate-pulse" />
                      <span>Inbound Call Bookings</span>
                    </h3>
                  </div>
                  <div className="shrink-0">
                    <span className="text-[10px] font-black uppercase bg-white/5 border border-white/10 px-3 py-1.5 text-slate-300 rounded-xl">
                      { (profile.requestedCalls || []).filter(r => r.status === 'pending').length } Pending Callback Requests
                    </span>
                  </div>
                </div>

                { (!profile.requestedCalls || profile.requestedCalls.length === 0) ? (
                  <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl bg-white/5 relative z-10">
                    <Phone className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">No call bookings yet</p>
                    <p className="text-[10px] text-slate-500 mt-1">When prospective clients request a callback on your profile, they will appear here in real time.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 relative z-10">
                    {profile.requestedCalls.map((req) => (
                      <div
                        key={req.id}
                        className={`p-4 rounded-2xl border ${
                          req.status === 'completed'
                            ? 'bg-slate-950/20 border-white/5 opacity-60'
                            : req.status === 'declined'
                            ? 'bg-slate-950/10 border-white/5 opacity-50 line-through'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        } transition-all`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-black text-slate-100">{req.clientName}</span>
                              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                                req.status === 'pending'
                                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20 animate-pulse'
                                  : req.status === 'completed'
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-slate-500/15 text-slate-400 border border-white/5'
                              }`}>
                                {req.status}
                              </span>
                              <div className="flex gap-1 flex-wrap">
                                {req.contactMethods.map((method) => (
                                  <span key={method} className="text-[9px] font-black px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 uppercase tracking-widest border border-indigo-500/10">
                                    {method}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-400">
                              <span className="flex items-center gap-1 text-slate-300">
                                <Phone className="h-3 w-3 text-indigo-400" />
                                {req.phone}
                              </span>
                              <span className="flex items-center gap-1 text-slate-300">
                                <Calendar className="h-3 w-3 text-indigo-400" />
                                {req.preferredTime}
                              </span>
                            </div>

                            {req.briefMessage && (
                              <p className="text-xs text-slate-300 italic bg-black/40 p-2.5 rounded-lg border border-white/5 mt-1.5">
                                "{req.briefMessage}"
                              </p>
                            )}

                            <p className="text-[8px] text-slate-500 uppercase tracking-wide">
                              Received on {req.createdAt}
                            </p>
                          </div>

                          {/* Action Controls for Call Request */}
                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                            {req.status === 'pending' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = profile.requestedCalls?.map(r => r.id === req.id ? { ...r, status: 'completed' as const } : r);
                                    saveProfileDraft({ ...profile, requestedCalls: updated });
                                  }}
                                  className="p-1.5 bg-emerald-500/10 hover:bg-emerald-600 hover:text-white text-emerald-400 rounded-lg transition-all cursor-pointer border border-emerald-500/10"
                                  title="Mark as Completed"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = profile.requestedCalls?.map(r => r.id === req.id ? { ...r, status: 'declined' as const } : r);
                                    saveProfileDraft({ ...profile, requestedCalls: updated });
                                  }}
                                  className="p-1.5 bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-400 rounded-lg transition-all cursor-pointer border border-rose-500/10"
                                  title="Decline Request"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const updated = profile.requestedCalls?.filter(r => r.id !== req.id);
                                saveProfileDraft({ ...profile, requestedCalls: updated });
                              }}
                              className="p-1.5 bg-white/5 hover:bg-rose-600 hover:text-white text-slate-400 rounded-lg transition-all cursor-pointer border border-white/5"
                              title="Delete Booking Record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Existing Categories configuration block */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <BellRing className="h-5 w-5 text-indigo-600" />
                    <span>Configure Category Notifications</span>
                  </h2>
                  <p className="text-xs text-slate-400">Opt in to the creative categories you specialize in. When a prospective client posts a project brief in these sectors, we will broadcast a secure live alert straight to your profile logs.</p>
                </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-2xl">
                {[
                  { id: 'actors', label: 'Actors And Performing Artists', icon: '🎭' },
                  { id: 'baking', label: 'Baking & Cake Art', icon: '🎂' },
                  { id: 'beauty', label: 'Beauty And Makeup Artists', icon: '💄' },
                  { id: 'branding', label: 'Branding', icon: '🏷️' },
                  { id: 'content', label: 'Content Creation', icon: '✍️' },
                  { id: 'marketing', label: 'Digital Marketing', icon: '📈' },
                  { id: 'organizers', label: 'Event Organizers', icon: '📅' },
                  { id: 'decorators', label: 'Event Stylists And Decorators', icon: '✨' },
                  { id: 'hospitality', label: 'Event Ushers And Hospitality', icon: '🤝' },
                  { id: 'events', label: 'Events (MCs, Decor, DJs, Sound)', icon: '🎤' },
                  { id: 'fashion', label: 'Fashion', icon: '👗' },
                  { id: 'fineartist', label: 'Fine Artists', icon: '🎨' },
                  { id: 'florists', label: 'Florists And Floral Designers', icon: '💐' },
                  { id: 'design', label: 'Graphic Design', icon: '🎨' },
                  { id: 'illustration', label: 'Illustration', icon: '✏️' },
                  { id: 'interiordesign', label: 'Interior Design', icon: '🏠' },
                  { id: 'musicproducers', label: 'Music Producers', icon: '🎹' },
                  { id: 'photography', label: 'Photography', icon: '📸' },
                  { id: 'writers', label: 'Scripts Writers', icon: '📝' },
                  { id: 'videography', label: 'Videography', icon: '🎥' },
                  { id: 'webdev', label: 'Web Design & Development', icon: '💻' }
                ].map(cat => {
                  const isSubscribed = profile.subscribedCategories.includes(cat.id as CreativeCategory);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategorySubscription(cat.id as CreativeCategory)}
                      className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-4 h-28 ${
                        isSubscribed 
                          ? 'border-indigo-600 bg-white shadow-sm' 
                          : 'border-slate-200/60 bg-slate-50 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-2xl">{cat.icon}</span>
                        <span className={`h-5 w-5 rounded-full border flex items-center justify-center text-xs font-bold ${
                          isSubscribed ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                        }`}>
                          {isSubscribed ? '✓' : ''}
                        </span>
                      </div>
                      <span className={`text-sm font-extrabold ${isSubscribed ? 'text-indigo-950' : 'text-slate-600'}`}>
                        {cat.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

              {/* Real-time jobs stats matching notifications */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl flex items-center justify-between gap-4 border border-indigo-100/50 dark:border-indigo-900/30">
                <div className="flex gap-2 items-center">
                  <Activity className="h-5 w-5 text-indigo-500 animate-pulse" />
                  <span className="text-sm text-slate-700 dark:text-slate-300 font-bold">
                    Currently Subscribed Opportunities Available: <span className="text-indigo-600 dark:text-indigo-400">{getSubscribedJobsCount()} Active Briefs</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-semibold italic">Broadcasting live category matches in background...</p>
              </div>

            </motion.div>
          )}

          {/* CHANGE PASSWORD TAB */}
          {activeTab === 'password' && (
            <motion.div
              key="password"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 max-w-md mx-auto py-4 text-left animate-in fade-in"
            >
              <div className="space-y-1 pb-4 border-b border-slate-100">
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-indigo-600" />
                  <span>Change Password</span>
                </h2>
                <p className="text-sm text-slate-500">
                  Update your security credentials. Your default initial password is <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-bold">password123</code>.
                </p>
              </div>

              {passwordError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl flex items-center gap-2 font-bold">
                  <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2 font-bold">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Current Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 focus:border-indigo-500 p-2.5 rounded-xl outline-none font-semibold transition-all shadow-xs text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">New Password (Min 6 Characters) *</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 focus:border-indigo-500 p-2.5 rounded-xl outline-none font-semibold transition-all shadow-xs text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Confirm New Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Confirm new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 focus:border-indigo-500 p-2.5 rounded-xl outline-none font-semibold transition-all shadow-xs text-slate-900"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-indigo-600/10 active:scale-98 cursor-pointer"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          </AnimatePresence>
        </div>

      <ImageCropperModal
        isOpen={cropperOpen}
        imageSrc={cropperImageSrc}
        cropType={cropperType}
        initialZoom={cropperType === 'avatar' ? profile.avatarZoom : profile.coverZoom}
        initialPan={
          cropperType === 'avatar'
            ? (profile.avatarPanX !== undefined ? { x: profile.avatarPanX, y: profile.avatarPanY || 0 } : undefined)
            : (profile.coverPanX !== undefined ? { x: profile.coverPanX, y: profile.coverPanY || 0 } : undefined)
        }
        onSave={handleCropperSave}
        onCancel={() => setCropperOpen(false)}
      />

      {/* PORTFOLIO ALBUM DELETION CONFIRMATION DIALOG */}
      {deletingItemId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 max-w-sm w-full text-center space-y-4">
            <div className="h-12 w-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-100">
              <Trash2 className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider">Delete Album?</h3>
              <p className="text-xs text-slate-500 font-medium">Are you sure you want to delete this showcase work? Clients won't be able to view this work and its gallery photos anymore.</p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setDeletingItemId(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-all cursor-pointer border border-slate-200 active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDeletePortfolioItem(deletingItemId);
                  setDeletingItemId(null);
                }}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition-all cursor-pointer shadow-md active:scale-95"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATIVE PROFILE DELETION CONFIRMATION DIALOG */}
      {showDeleteProfileConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 max-w-sm w-full text-center space-y-4">
            <div className="h-12 w-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-200 animate-pulse">
              <Trash2 className="h-5.5 w-5.5 animate-bounce" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black uppercase text-slate-950 tracking-wider">Delete Creative Profile?</h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">This will permanently delete your agency profile, all published albums, customizations, and received client reviews. This action is <strong>completely irreversible</strong>.</p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowDeleteProfileConfirm(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-all cursor-pointer border border-slate-200 active:scale-95"
              >
                Keep Profile
              </button>
              <button
                onClick={() => {
                  onDeleteProfile(profile.id);
                  setShowDeleteProfileConfirm(false);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition-all cursor-pointer shadow-md active:scale-95"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
