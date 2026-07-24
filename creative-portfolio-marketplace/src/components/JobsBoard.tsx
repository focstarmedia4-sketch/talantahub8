/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Briefcase, MapPin, DollarSign, Coins, Calendar, Users, PlusCircle, Search, ArrowRight, X, Mail, Phone, MessageSquare, ChevronDown, SlidersHorizontal, ArrowUpDown, AlertCircle, Check, Lock, Unlock, Star } from 'lucide-react';
import { Job, CreativeCategory, FreelancerProfile, Review } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { checkIfContactUnlocked, createContactUnlock, fetchUnlockedContactDetails } from '../utils/supabaseService';
import { optimizeAvatarUrl, optimizeCardUrl } from '../utils/imageUtils';

const formatBudget = (range: string) => {
  if (!range) return 'KSh. 0';
  let clean = range.trim();
  // Try to find the first sequence of digits, commas, and dots
  const match = clean.match(/(?:KSh|KSH|Ksh\.|KSh\.|USD|\$)?\s*([\d,]+)/i);
  if (match) {
    const numStr = match[1].replace(/,/g, '');
    const num = parseInt(numStr, 10);
    if (!isNaN(num)) {
      return `KSh. ${num.toLocaleString('en-US')}`;
    }
  }
  return `KSh. ${clean}`;
};

const KENYAN_COUNTIES = [
  "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo Marakwet", "Embu", "Garissa", "Homa Bay", "Isiolo", "Kajiado",
  "Kakamega", "Kericho", "Kiambu", "Kilifi", "Kirinyaga", "Kisii", "Kisumu", "Kitui", "Kwale", "Laikipia",
  "Lamu", "Machakos", "Makueni", "Mandera", "Marsabit", "Meru", "Migori", "Mombasa", "Murang'a", "Nairobi",
  "Nakuru", "Nandi", "Narok", "Nyamira", "Nyeri", "Samburu", "Siaya", "Taita Taveta", "Tana River", "Tharaka-Nithi",
  "Trans Nzoia", "Turkana", "Uasin Gishu", "Vihiga", "Wajir", "West Pokot"
];

function CountySelector({
  value,
  onChange
}: {
  value: string;
  onChange: (county: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm cursor-pointer text-left"
      >
        <span className="text-slate-700 font-medium">{value} County</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-[70] flex flex-col overflow-hidden animate-in fade-in-50 slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-150 sticky top-0 z-10">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Kenyan Counties</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Close Dropdown"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          
          <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
            {KENYAN_COUNTIES.map((county) => (
              <button
                key={county}
                type="button"
                onClick={() => {
                  onChange(county);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2 text-xs hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer block ${
                  value === county 
                    ? 'bg-indigo-50/70 font-extrabold text-indigo-600' 
                    : 'text-slate-700'
                }`}
              >
                {county} County
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface JobReviewFormProps {
  reviewerName: string;
  reviewerRole: string;
  reviewedUserId: string;
  jobId: string;
  onPostReview: (rating: number, comment: string) => Promise<any>;
}

function JobReviewForm({
  reviewerName,
  reviewerRole,
  reviewedUserId,
  jobId,
  onPostReview
}: JobReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await onPostReview(rating, comment);
      if (res && res.success === false) {
        setError(res.error || 'Duplicate review detected.');
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="p-4 bg-emerald-50 text-emerald-950 border border-emerald-150 rounded-xl text-xs font-bold text-center space-y-1">
        <span>Review posted successfully!</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white border border-slate-150 rounded-xl space-y-3.5 text-left">
      <div className="space-y-1">
        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">Leave a Trusted Review</h4>
        <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
          Your review will be permanently calculated into their rating score.
        </p>
      </div>

      <div className="space-y-1">
        <span className="text-[10px] font-black uppercase text-slate-500 block">Rating Score *</span>
        <div className="flex gap-1 text-amber-500">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              onClick={() => setRating(star)}
              className="p-0.5 hover:scale-110 transition-transform cursor-pointer"
            >
              <Star className={`h-5 w-5 ${star <= rating ? 'fill-amber-500' : 'text-slate-200'}`} />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-slate-500 block">Review Comment *</label>
        <textarea
          required
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Describe your collaboration, communication quality, final deliverables..."
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-medium resize-none"
        />
      </div>

      {error && (
        <p className="text-[10px] text-rose-600 font-bold">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-2 bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-black uppercase tracking-wider rounded transition-all cursor-pointer shadow-sm text-center disabled:opacity-50"
      >
        {submitting ? 'Submitting...' : 'Post Trusted Review'}
      </button>
    </form>
  );
}

interface JobsBoardProps {
  jobs: Job[];
  onPostJob: (newJob: Omit<Job, 'id' | 'postedDate' | 'applicantsCount'>) => void;
  currentRole: 'visitor' | 'client' | string; // string represents freelancer.id
  initialJobId?: string | null;
  onClearInitialJobId?: () => void;
  freelancers?: FreelancerProfile[];
  onUpdateFreelancer?: (updated: FreelancerProfile) => void;
  onUpdateJob?: (updatedJob: Job) => void;
  isLoggedIn?: boolean;
  onAddReview?: (freelancerId: string, review: Omit<Review, 'id' | 'date'>, specificJobId?: string) => any;
}

export default function JobsBoard({ 
  jobs, 
  onPostJob, 
  currentRole, 
  initialJobId, 
  onClearInitialJobId,
  freelancers = [],
  onUpdateFreelancer,
  onUpdateJob,
  isLoggedIn = true,
  onAddReview
}: JobsBoardProps) {
  // Active Filter States (the ones applied when clicking "Search")
  const [activeCategories, setActiveCategories] = useState<CreativeCategory[]>([]);
  const [activeCounties, setActiveCounties] = useState<string[]>([]);
  const [activeMinBudget, setActiveMinBudget] = useState('');
  const [activeMaxBudget, setActiveMaxBudget] = useState('');
  const [activeStartDate, setActiveStartDate] = useState('');
  const [activeDeadline, setActiveDeadline] = useState('');
  const [activeLocation, setActiveLocation] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');

  // Checklist search filter states
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [countySearchQuery, setCountySearchQuery] = useState('');

  // Draft/UI States (the ones the user modifies before hitting Search)
  const [draftCategories, setDraftCategories] = useState<CreativeCategory[]>([]);
  const [draftCounties, setDraftCounties] = useState<string[]>([]);
  const [draftMinBudget, setDraftMinBudget] = useState('');
  const [draftMaxBudget, setDraftMaxBudget] = useState('');
  const [draftStartDate, setDraftStartDate] = useState('');
  const [draftDeadline, setDraftDeadline] = useState('');
  const [draftLocation, setDraftLocation] = useState('');
  const [draftSearchQuery, setDraftSearchQuery] = useState('');

  const [localToast, setLocalToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Secure Job Unlocks Tracking States
  const [unlockedJobIds, setUnlockedJobIds] = useState<string[]>([]);
  const [unlockedJobContacts, setUnlockedJobContacts] = useState<Record<string, { email?: string; phone?: string; whatsapp?: string }>>({});
  const [checkingJobUnlocks, setCheckingJobUnlocks] = useState(false);

  // Pesapal Payment States inside JobsBoard
  const [showPesapalModal, setShowPesapalModal] = useState(false);
  const [targetJobToUnlock, setTargetJobToUnlock] = useState<Job | null>(null);
  const [pesapalPhone, setPesapalPhone] = useState('');
  const [pesapalEmail, setPesapalEmail] = useState('');
  const [pesapalMethod, setPesapalMethod] = useState<'mpesa' | 'card' | 'secure_online'>('secure_online');
  const [mpesaPin, setMpesaPin] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

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
    async function loadUnlockedJobs() {
      if (!currentRole || currentRole === 'visitor' || currentRole === 'client') {
        setUnlockedJobIds([]);
        setUnlockedJobContacts({});
        return;
      }

      setCheckingJobUnlocks(true);
      
      const unlockedIds: string[] = [];
      const unlockedContactsMap: Record<string, { email?: string; phone?: string; whatsapp?: string }> = {};

      for (const j of jobs) {
        if (j.userId === currentRole) {
          unlockedIds.push(j.id);
          unlockedContactsMap[j.id] = {
            email: j.clientEmail || '',
            phone: j.clientPhone || '',
            whatsapp: j.clientWhatsapp || ''
          };
          continue;
        }

        const isUnlocked = await checkIfContactUnlocked(currentRole, undefined, j.id);
        if (isUnlocked) {
          unlockedIds.push(j.id);
          const details = await fetchUnlockedContactDetails(currentRole, undefined, j.id);
          if (details) {
            unlockedContactsMap[j.id] = details;
          }
        }
      }

      setUnlockedJobIds(unlockedIds);
      setUnlockedJobContacts(unlockedContactsMap);
      setCheckingJobUnlocks(false);
    }

    loadUnlockedJobs();
  }, [currentRole, jobs]);

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

  const handleUnlockContacts = (e: React.MouseEvent, job: Job) => {
    e.stopPropagation();
    
    if (currentRole === 'visitor' || currentRole === 'client') {
      showLocalToast('Please select a Freelancer persona on the top bar to unlock contacts!', 'error');
      return;
    }
    
    const activeFreelancer = freelancers.find(f => f.id === currentRole);
    if (!activeFreelancer) {
      showLocalToast('Creative profile not found. Please select a freelancer role to unlock.', 'error');
      return;
    }
    
    const isAlreadyUnlocked = unlockedJobIds.includes(job.id);
    if (isAlreadyUnlocked) {
      return;
    }
    
    if (job.status === 'closed') {
      showLocalToast('This job is CLOSED. Contacts cannot be unlocked.', 'error');
      return;
    }
    
    if ((job.unlockCount || 0) >= 20) {
      showLocalToast('This client contact has already reached its limit of 20 unlocks.', 'error');
      return;
    }
    
    // Set target job and open Pesapal simulator modal!
    setTargetJobToUnlock(job);
    setPesapalEmail(activeFreelancer.email || '');
    setPaymentError(null);
    setPaymentSuccess(false);
    setMpesaPin('');
    setShowPesapalModal(true);
  };

  const handlePesapalPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRole) {
      setPaymentError("You must be logged in to make a payment.");
      return;
    }
    if (!targetJobToUnlock) {
      setPaymentError("No job targeted for unlock.");
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
          buyerId: currentRole,
          jobId: targetJobToUnlock.id,
          amount: targetJobToUnlock.unlockPriceKsh || 50,
          paymentStatus: 'completed'
        });

        if (res.success) {
          setPaymentSuccess(true);
          
          // Add to local state
          const newUnlockedIds = [...unlockedJobIds, targetJobToUnlock.id];
          setUnlockedJobIds(newUnlockedIds);
          
          const details = await fetchUnlockedContactDetails(currentRole, undefined, targetJobToUnlock.id);
          setUnlockedJobContacts(prev => ({
            ...prev,
            [targetJobToUnlock.id]: details || {
              email: targetJobToUnlock.clientEmail,
              phone: targetJobToUnlock.clientPhone,
              whatsapp: targetJobToUnlock.clientWhatsapp
            }
          }));

          showLocalToast("Job contact unlocked successfully!", "success");

          setTimeout(() => {
            setShowPesapalModal(false);
            setPaymentSuccess(false);
            setTargetJobToUnlock(null);
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

  // Dropdown panel toggle
  const [isSearchEngineOpen, setIsSearchEngineOpen] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [viewingJob, setViewingJob] = useState<Job | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'budget-high' | 'budget-low'>('recent');
  const [showCategoryBreakdown, setShowCategoryBreakdown] = useState(false);
  const [selectedBreakdownCategories, setSelectedBreakdownCategories] = useState<CreativeCategory[]>([]);

  useEffect(() => {
    setSelectedBreakdownCategories(activeCategories);
  }, [activeCategories]);

  useEffect(() => {
    if (initialJobId) {
      const foundJob = jobs.find(j => j.id === initialJobId);
      if (foundJob) {
        setViewingJob(foundJob);
      }
      if (onClearInitialJobId) {
        onClearInitialJobId();
      }
    }
  }, [initialJobId, jobs, onClearInitialJobId]);

  const handleTriggerSearch = () => {
    setActiveCategories(draftCategories);
    setActiveCounties(draftCounties);
    setActiveMinBudget(draftMinBudget);
    setActiveMaxBudget(draftMaxBudget);
    setActiveStartDate(draftStartDate);
    setActiveDeadline(draftDeadline);
    setActiveLocation(draftLocation);
    setActiveSearchQuery(draftSearchQuery);
  };

  const handleResetSearch = () => {
    setDraftCategories([]);
    setDraftCounties([]);
    setDraftMinBudget('');
    setDraftMaxBudget('');
    setDraftStartDate('');
    setDraftDeadline('');
    setDraftLocation('');
    setDraftSearchQuery('');
    setCategorySearchQuery('');
    setCountySearchQuery('');

    setActiveCategories([]);
    setActiveCounties([]);
    setActiveMinBudget('');
    setActiveMaxBudget('');
    setActiveStartDate('');
    setActiveDeadline('');
    setActiveLocation('');
    setActiveSearchQuery('');
    setShowCategoryBreakdown(false);
  };

  const handleClearSingleFilter = (type: string) => {
    if (type === 'query') {
      setDraftSearchQuery('');
      setActiveSearchQuery('');
    } else if (type === 'categories') {
      setDraftCategories([]);
      setActiveCategories([]);
      setShowCategoryBreakdown(false);
    } else if (type === 'counties') {
      setDraftCounties([]);
      setActiveCounties([]);
    } else if (type === 'budget') {
      setDraftMinBudget('');
      setDraftMaxBudget('');
      setActiveMinBudget('');
      setActiveMaxBudget('');
    } else if (type === 'startDate') {
      setDraftStartDate('');
      setActiveStartDate('');
    } else if (type === 'deadline') {
      setDraftDeadline('');
      setActiveDeadline('');
    } else if (type === 'location') {
      setDraftLocation('');
      setActiveLocation('');
    }
  };

  const hasActiveFilters = activeCategories.length > 0 ||
                           activeCounties.length > 0 ||
                           activeMinBudget !== '' ||
                           activeMaxBudget !== '' ||
                           activeStartDate !== '' ||
                           activeDeadline !== '' ||
                           activeLocation !== '' ||
                           activeSearchQuery !== '';

  // Form State
  const [title, setTitle] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [category, setCategory] = useState<CreativeCategory>('videography');
  const [budgetRange, setBudgetRange] = useState('');
  const [location, setLocation] = useState('Nairobi County');
  const [locationTab, setLocationTab] = useState<'county' | 'custom'>('county');
  const [selectedCounty, setSelectedCounty] = useState('Nairobi');

  const handleLocationTabChange = (tab: 'county' | 'custom') => {
    setLocationTab(tab);
    if (tab === 'county') {
      setLocation(selectedCounty + " County");
    } else {
      setLocation('');
    }
  };

  const handleCountyChange = (county: string) => {
    setSelectedCounty(county);
    setLocation(county + " County");
  };
  const [description, setDescription] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientWhatsapp, setClientWhatsapp] = useState('');
  const [startDate, setStartDate] = useState('');
  const [deliveryDeadline, setDeliveryDeadline] = useState('');

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !budgetRange || !location || !clientName || !clientEmail || !clientPhone || !clientWhatsapp || !startDate || !deliveryDeadline) return;

    onPostJob({
      title,
      clientName,
      clientCompany: clientCompany || undefined,
      category,
      budgetRange,
      location,
      description,
      clientEmail,
      clientPhone,
      clientWhatsapp,
      startDate,
      deliveryDeadline
    });

    // Reset Form
    setTitle('');
    setClientCompany('');
    setCategory('videography');
    setBudgetRange('');
    setLocation('Nairobi County');
    setLocationTab('county');
    setSelectedCounty('Nairobi');
    setDescription('');
    setClientName('');
    setClientEmail('');
    setClientPhone('');
    setClientWhatsapp('');
    setStartDate('');
    setDeliveryDeadline('');
    setShowPostModal(false);
  };

  const categories: { id: CreativeCategory | 'all'; label: string; icon: string }[] = [
    { id: 'all', label: 'All Fields', icon: '💼' },
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
  ];

  // Pre-computed filtered lists for checklist search engines
  const filteredCategoriesToSelect = categories.filter(cat => 
    cat.id !== 'all' && 
    cat.label.toLowerCase().includes(categorySearchQuery.toLowerCase())
  );

  const filteredCountiesToSelect = KENYAN_COUNTIES.filter(county => 
    county.toLowerCase().includes(countySearchQuery.toLowerCase())
  );

  // Filtered jobs using ACTIVE search engine states
  const filteredJobs = jobs.filter(job => {
    // 1. Search query match
    const matchesSearch = !activeSearchQuery || 
                          job.title.toLowerCase().includes(activeSearchQuery.toLowerCase()) ||
                          job.description.toLowerCase().includes(activeSearchQuery.toLowerCase()) ||
                          (job.clientCompany && job.clientCompany.toLowerCase().includes(activeSearchQuery.toLowerCase()));

    // 2. Custom Location text match
    const matchesLocation = !activeLocation || 
                            job.location.toLowerCase().includes(activeLocation.toLowerCase());

    // 3. Ticked Categories match
    const matchesCategories = selectedBreakdownCategories.length === 0 || 
                              selectedBreakdownCategories.includes(job.category);

    // 4. Ticked Counties match
    const matchesCounties = activeCounties.length === 0 || 
                            activeCounties.some(county => job.location.toLowerCase().includes(county.toLowerCase()));

    // Parse the job's budget values for budget checks
    const cleanBudgetStr = job.budgetRange.replace(/,/g, '');
    const numbers = cleanBudgetStr.match(/\d+/g)?.map(Number) || [];
    const jobMaxBudget = numbers.length > 0 ? Math.max(...numbers) : 0;
    const jobMinBudget = numbers.length > 0 ? Math.min(...numbers) : 0;

    // 5. Min Budget
    let matchesMinBudget = true;
    if (activeMinBudget) {
      const minVal = parseFloat(activeMinBudget);
      if (!isNaN(minVal)) {
        matchesMinBudget = (jobMaxBudget > 0 ? jobMaxBudget : jobMinBudget) >= minVal;
      }
    }

    // 6. Max Budget
    let matchesMaxBudget = true;
    if (activeMaxBudget) {
      const maxVal = parseFloat(activeMaxBudget);
      if (!isNaN(maxVal)) {
        matchesMaxBudget = jobMinBudget <= maxVal;
      }
    }

    // 7. Start date filter (starts after/on)
    let matchesStartDate = true;
    if (activeStartDate && job.startDate) {
      matchesStartDate = new Date(job.startDate) >= new Date(activeStartDate);
    }

    // 8. Delivery deadline filter (delivery before/on)
    let matchesDeadline = true;
    if (activeDeadline && job.deliveryDeadline) {
      matchesDeadline = new Date(job.deliveryDeadline) <= new Date(activeDeadline);
    }

    return matchesSearch && matchesLocation && matchesCategories && matchesCounties && matchesMinBudget && matchesMaxBudget && matchesStartDate && matchesDeadline;
  });

  // Sort the final results
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (sortBy === 'recent') {
      const dateA = new Date(a.postedDate).getTime();
      const dateB = new Date(b.postedDate).getTime();
      if (dateA !== dateB) return dateB - dateA;
      return b.id.localeCompare(a.id);
    }
    if (sortBy === 'budget-high') {
      const parseBudget = (jobRange: string) => {
        const numbers = jobRange.replace(/,/g, '').match(/\d+/g)?.map(Number) || [];
        return numbers.length > 0 ? Math.max(...numbers) : 0;
      };
      return parseBudget(b.budgetRange) - parseBudget(a.budgetRange);
    }
    if (sortBy === 'budget-low') {
      const parseBudget = (jobRange: string) => {
        const numbers = jobRange.replace(/,/g, '').match(/\d+/g)?.map(Number) || [];
        return numbers.length > 0 ? Math.min(...numbers) : 0;
      };
      return parseBudget(a.budgetRange) - parseBudget(b.budgetRange);
    }
    return 0;
  });

  const handleToggleBreakdownCategory = (catId: CreativeCategory) => {
    const isAllSelected = selectedBreakdownCategories.length === activeCategories.length;
    
    if (isAllSelected) {
      setSelectedBreakdownCategories([catId]);
    } else {
      if (selectedBreakdownCategories.includes(catId)) {
        const next = selectedBreakdownCategories.filter(c => c !== catId);
        if (next.length === 0) {
          setSelectedBreakdownCategories(activeCategories);
        } else {
          setSelectedBreakdownCategories(next);
        }
      } else {
        setSelectedBreakdownCategories([...selectedBreakdownCategories, catId]);
      }
    }
  };

  const handleRemoveSingleCategory = (catId: CreativeCategory) => {
    const updatedDraft = draftCategories.filter(c => c !== catId);
    const updatedActive = activeCategories.filter(c => c !== catId);
    setDraftCategories(updatedDraft);
    setActiveCategories(updatedActive);
  };

  const getCategoryCount = (catId: string) => {
    return jobs.filter(job => {
      const matchesSearch = !activeSearchQuery || 
                            job.title.toLowerCase().includes(activeSearchQuery.toLowerCase()) ||
                            job.description.toLowerCase().includes(activeSearchQuery.toLowerCase()) ||
                            (job.clientCompany && job.clientCompany.toLowerCase().includes(activeSearchQuery.toLowerCase()));

      const matchesLocation = !activeLocation || 
                              job.location.toLowerCase().includes(activeLocation.toLowerCase());

      const matchesCounties = activeCounties.length === 0 || 
                              activeCounties.some(county => job.location.toLowerCase().includes(county.toLowerCase()));

      const cleanBudgetStr = job.budgetRange.replace(/,/g, '');
      const numbers = cleanBudgetStr.match(/\d+/g)?.map(Number) || [];
      const jobMaxBudget = numbers.length > 0 ? Math.max(...numbers) : 0;
      const jobMinBudget = numbers.length > 0 ? Math.min(...numbers) : 0;

      let matchesMinBudget = true;
      if (activeMinBudget) {
        const minVal = parseFloat(activeMinBudget);
        if (!isNaN(minVal)) {
          matchesMinBudget = (jobMaxBudget > 0 ? jobMaxBudget : jobMinBudget) >= minVal;
        }
      }

      let matchesMaxBudget = true;
      if (activeMaxBudget) {
        const maxVal = parseFloat(activeMaxBudget);
        if (!isNaN(maxVal)) {
          matchesMaxBudget = jobMinBudget <= maxVal;
        }
      }

      let matchesStartDate = true;
      if (activeStartDate && job.startDate) {
        matchesStartDate = new Date(job.startDate) >= new Date(activeStartDate);
      }

      let matchesDeadline = true;
      if (activeDeadline && job.deliveryDeadline) {
        matchesDeadline = new Date(job.deliveryDeadline) <= new Date(activeDeadline);
      }

      const matchesCategory = job.category === catId;

      return matchesSearch && matchesLocation && matchesCategory && matchesCounties && matchesMinBudget && matchesMaxBudget && matchesStartDate && matchesDeadline;
    }).length;
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white rounded-3xl p-6 md:p-8 relative overflow-hidden">
        {/* Subtle background glows */}
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-indigo-500 rounded-full blur-3xl opacity-20" />
        <div className="absolute left-1/3 -top-12 w-48 h-48 bg-violet-500 rounded-full blur-3xl opacity-20" />

        <div className="space-y-2 relative z-10 max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Find Your Next <span className="text-indigo-400">Creative Opportunity</span>
          </h1>
          <p className="text-slate-300 text-sm md:text-base">
            Browse real projects posted by clients across Kenya. Premium creatives receive instant notifications whenever new opportunities match their skills and categories.
          </p>
        </div>

        <button
          onClick={() => setShowPostModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold transition-all shrink-0 shadow-lg shadow-indigo-600/20 hover:-translate-y-0.5 cursor-pointer"
        >
          <PlusCircle className="h-5 w-5" />
          <span>Post a Job Brief</span>
        </button>
      </div>

      {/* Dynamic Search Engine */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-6 space-y-4">
        {/* Core Search Engine bar */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by keyword, role, description, or company..."
              value={draftSearchQuery}
              onChange={(e) => setDraftSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleTriggerSearch();
                }
              }}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900 font-medium transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsSearchEngineOpen(!isSearchEngineOpen)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all font-semibold ${
                isSearchEngineOpen
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-800 shadow-sm'
                  : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal className="h-5 w-5 text-indigo-500" />
              <span>Filter Engine</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isSearchEngineOpen ? 'rotate-180' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handleTriggerSearch}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-150 active:scale-98 shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <Search className="h-4 w-4" />
              <span>Search</span>
            </button>
          </div>
        </div>

        {/* Collapsible Panel of checklists, dates, and budget */}
        {isSearchEngineOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="pt-5 border-t border-slate-100 space-y-6 overflow-hidden"
          >
            {/* Multi-Select Checkboxes Grid for Categories & Counties */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Categories Checklist */}
              <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/70">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Tick Categories</h3>
                    <p className="text-xs text-slate-400">Filter jobs by creative category</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDraftCategories(categories.filter(c => c.id !== 'all').map(c => c.id as CreativeCategory))}
                      className="text-[10px] font-extrabold uppercase text-indigo-600 hover:text-indigo-700 bg-white px-2 py-1 rounded-md border border-slate-200 cursor-pointer"
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setDraftCategories([])}
                      className="text-[10px] font-extrabold uppercase text-slate-500 hover:text-slate-600 bg-white px-2 py-1 rounded-md border border-slate-200 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Inline Categories search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={categorySearchQuery}
                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-1.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs text-slate-800 font-medium transition-all"
                  />
                  {categorySearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCategorySearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {filteredCategoriesToSelect.length > 0 ? (
                    filteredCategoriesToSelect.map((cat) => {
                      const isChecked = draftCategories.includes(cat.id as CreativeCategory);
                      return (
                        <label
                          key={cat.id}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer select-none transition-all ${
                            isChecked
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-xs'
                              : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-100/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setDraftCategories(draftCategories.filter(c => c !== cat.id));
                              } else {
                                setDraftCategories([...draftCategories, cat.id as CreativeCategory]);
                              }
                            }}
                            className="accent-indigo-600 h-4 w-4 rounded border-slate-300"
                          />
                          <span>{cat.label}</span>
                        </label>
                      );
                    })
                  ) : (
                    <div className="col-span-full py-4 text-center text-xs text-slate-400 font-medium">
                      No matching categories found.
                    </div>
                  )}
                </div>
              </div>

              {/* Counties Checklist */}
              <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/70">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Tick Counties</h3>
                    <p className="text-xs text-slate-400">Filter jobs by Kenyan county</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDraftCounties([...KENYAN_COUNTIES])}
                      className="text-[10px] font-extrabold uppercase text-indigo-600 hover:text-indigo-700 bg-white px-2 py-1 rounded-md border border-slate-200 cursor-pointer"
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setDraftCounties([])}
                      className="text-[10px] font-extrabold uppercase text-slate-500 hover:text-slate-600 bg-white px-2 py-1 rounded-md border border-slate-200 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Inline Counties search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
                  <input
                    type="text"
                    placeholder="Search counties..."
                    value={countySearchQuery}
                    onChange={(e) => setCountySearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-1.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs text-slate-800 font-medium transition-all"
                  />
                  {countySearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCountySearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {filteredCountiesToSelect.length > 0 ? (
                    filteredCountiesToSelect.map((county) => {
                      const isChecked = draftCounties.includes(county);
                      return (
                        <label
                          key={county}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer select-none transition-all ${
                            isChecked
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-xs'
                              : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-100/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setDraftCounties(draftCounties.filter(c => c !== county));
                              } else {
                                setDraftCounties([...draftCounties, county]);
                              }
                            }}
                            className="accent-indigo-600 h-4 w-4 rounded border-slate-300"
                          />
                          <span>{county}</span>
                        </label>
                      );
                    })
                  ) : (
                    <div className="col-span-full py-4 text-center text-xs text-slate-400 font-medium">
                      No matching counties found.
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Custom inputs: Budget, Location & Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              
              {/* Budget constraints */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">BUDGET (KSH)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    placeholder="Min"
                    value={draftMinBudget}
                    onChange={(e) => setDraftMinBudget(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs text-slate-850 font-semibold"
                  />
                  <span className="text-slate-400 text-xs">to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={draftMaxBudget}
                    onChange={(e) => setDraftMaxBudget(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs text-slate-855 font-semibold"
                  />
                </div>
              </div>

              {/* Delivery / Project Start Date */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Delivery Start Date</label>
                <input
                  type="date"
                  value={draftStartDate}
                  onChange={(e) => setDraftStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs text-slate-850 font-semibold cursor-pointer"
                />
              </div>

              {/* Deadline Date */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Project Deadline</label>
                <input
                  type="date"
                  value={draftDeadline}
                  onChange={(e) => setDraftDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs text-slate-850 font-semibold cursor-pointer"
                />
              </div>

            </div>

            {/* Custom Location Text Field */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 items-end">
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Specific Location / Venue details</label>
                <input
                  type="text"
                  placeholder="e.g. Remote, Westlands, Naivasha Resort, Kilimani..."
                  value={draftLocation}
                  onChange={(e) => setDraftLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs text-slate-850 font-semibold"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleResetSearch}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                >
                  Reset Form
                </button>
                <button
                  type="button"
                  onClick={handleTriggerSearch}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-150 cursor-pointer text-center"
                >
                  Apply Search
                </button>
              </div>
            </div>

          </motion.div>
        )}

        {/* Active Filters Summary Indicators */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-slate-50">
            {activeSearchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold">
                Query: "{activeSearchQuery}"
                <button type="button" onClick={() => handleClearSingleFilter('query')} className="hover:text-red-500 cursor-pointer"><X className="h-3 w-3" /></button>
              </span>
            )}

            {activeCategories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryBreakdown(!showCategoryBreakdown)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    showCategoryBreakdown
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  }`}
                  title="Click to toggle category matches"
                >
                  <span>Results ({activeCategories.length})</span>
                  <ChevronDown className={`h-3 w-3 transition-transform ${showCategoryBreakdown ? 'rotate-180' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => handleClearSingleFilter('categories')}
                  className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                  title="Clear all categories"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                {showCategoryBreakdown && (
                  <div className="flex flex-wrap gap-1.5 items-center p-0.5 bg-slate-100/50 border border-slate-200 rounded-lg">
                    {activeCategories.map((catId) => {
                      const catObj = categories.find(c => c.id === catId);
                      const count = getCategoryCount(catId);
                      const displayName = catObj ? catObj.label : catId;
                      const displayIcon = catObj ? catObj.icon : '💼';
                      const isSelected = selectedBreakdownCategories.includes(catId as CreativeCategory);
                      return (
                        <span
                          key={catId}
                          className={`inline-flex items-center gap-1.5 pl-2 pr-1.5 py-0.5 rounded-md border text-[10px] font-bold shadow-2xs transition-all ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                              : 'bg-white border-slate-200 text-slate-400 opacity-60 hover:opacity-100 hover:text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleBreakdownCategory(catId as CreativeCategory)}
                            className="flex items-center gap-1 cursor-pointer uppercase tracking-wider text-[10px] font-bold outline-none"
                            title={`Click to toggle filtering for ${displayName} (${count})`}
                          >
                            <span>{displayIcon}</span>
                            <span>{displayName} ({count})</span>
                          </button>
                          <span className={`w-px h-3 mx-0.5 ${isSelected ? 'bg-indigo-200' : 'bg-slate-200'}`} />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveSingleCategory(catId as CreativeCategory);
                            }}
                            className={`p-0.5 cursor-pointer rounded transition-colors ${
                              isSelected
                                ? 'text-indigo-400 hover:text-red-500 hover:bg-indigo-100/50'
                                : 'text-slate-300 hover:text-red-500 hover:bg-slate-100'
                            }`}
                            title={`Remove ${displayName} filter`}
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeCounties.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold">
                Counties ({activeCounties.length})
                <button type="button" onClick={() => handleClearSingleFilter('counties')} className="hover:text-red-500 cursor-pointer"><X className="h-3 w-3" /></button>
              </span>
            )}

            {(activeMinBudget || activeMaxBudget) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold">
                Budget: {activeMinBudget ? `KSH ${activeMinBudget}` : 'KSH 0'} - {activeMaxBudget ? `KSH ${activeMaxBudget}` : 'Any'}
                <button type="button" onClick={() => handleClearSingleFilter('budget')} className="hover:text-red-500 cursor-pointer"><X className="h-3 w-3" /></button>
              </span>
            )}

            {activeStartDate && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold">
                From: {activeStartDate}
                <button type="button" onClick={() => handleClearSingleFilter('startDate')} className="hover:text-red-500 cursor-pointer"><X className="h-3 w-3" /></button>
              </span>
            )}

            {activeDeadline && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold">
                Deadline: {activeDeadline}
                <button type="button" onClick={() => handleClearSingleFilter('deadline')} className="hover:text-red-500 cursor-pointer"><X className="h-3 w-3" /></button>
              </span>
            )}

            {activeLocation && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold">
                Venue: "{activeLocation}"
                <button type="button" onClick={() => handleClearSingleFilter('location')} className="hover:text-red-500 cursor-pointer"><X className="h-3 w-3" /></button>
              </span>
            )}

            <button
              type="button"
              onClick={handleResetSearch}
              className="text-xs font-extrabold text-red-500 hover:text-red-600 hover:underline ml-auto cursor-pointer"
            >
              Reset All
            </button>
          </div>
        )}
      </div>

      {/* List Header with Sorting options */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 pb-2">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <span>Available Opportunities</span>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            {sortedJobs.length} {sortedJobs.length === 1 ? 'brief' : 'briefs'}
          </span>
        </h2>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <ArrowUpDown className="h-3.5 w-3.5" />
            Sort By:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'budget-high' | 'budget-low')}
            className="bg-white border border-slate-200 text-xs font-bold text-slate-700 py-1.5 pl-2.5 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer appearance-none relative bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.25em] bg-[right_0.5rem_center] bg-no-repeat"
          >
            <option value="recent">Recently Posted</option>
            <option value="budget-high">Highest Budget</option>
            <option value="budget-low">Lowest Budget</option>
          </select>
        </div>
      </div>

      {/* Local Toast alerts */}
      {localToast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-sm border ${
            localToast.type === 'error' 
              ? 'bg-rose-50 border-rose-200 text-rose-800' 
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <AlertCircle className={`h-4 w-4 ${localToast.type === 'error' ? 'text-rose-600' : 'text-emerald-600'}`} />
          <span>{localToast.message}</span>
        </motion.div>
      )}

      {/* Job list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {sortedJobs.map((job) => {
            const activeFreelancer = freelancers.find(f => f.id === currentRole);
            const isUnlocked = currentRole === 'client' || (activeFreelancer && (activeFreelancer.unlockedJobIds || []).includes(job.id));
            const isClosed = job.status === 'closed';

            return (
              <motion.div
                key={job.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => setViewingJob(job)}
                className="group bg-white rounded-2xl border border-slate-100 hover:border-indigo-100 p-5 md:p-6 flex flex-col justify-between hover:shadow-xl hover:shadow-indigo-100/5 transition-all duration-300 cursor-pointer relative"
              >
                {/* Top tag and title */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg ${
                        job.category === 'videography' ? 'bg-rose-50 text-rose-600' :
                        job.category === 'photography' ? 'bg-indigo-50 text-indigo-600' :
                        job.category === 'design' ? 'bg-sky-50 text-sky-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {job.category}
                      </span>
                      {/* STATUS BADGE */}
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        isClosed 
                          ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}>
                        {isClosed ? 'CLOSED' : 'OPEN'}
                      </span>
                      {/* UNLOCK BADGE */}
                      {isUnlocked ? (
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-250 px-2 py-0.5 rounded-md flex items-center gap-0.5 shadow-2xs">
                          <Check className="h-3 w-3" /> Unlocked
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-250 px-2 py-0.5 rounded-md flex items-center gap-0.5 shadow-2xs">
                          <Lock className="h-3 w-3" /> Locked ({job.unlockCount || 0}/20)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                      <Calendar className="h-3 w-3" />
                      <span>Posted {job.postedDate}</span>
                    </div>
                  </div>

                <h2 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {job.title}
                </h2>

                <div className="flex items-center gap-1 text-sm font-semibold text-slate-600">
                  <span>{job.clientName}</span>
                  {job.clientCompany && (
                    <span className="text-slate-400 font-medium">@ {job.clientCompany}</span>
                  )}
                </div>

                <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">
                  {job.description}
                </p>

                <div className="flex flex-wrap gap-2.5 pt-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50/80 border border-slate-100 px-2.5 py-1 rounded-lg">
                    <span className="font-extrabold text-[10px] text-indigo-600 uppercase tracking-wider">Project Date:</span>
                    <span className="font-bold text-slate-850">{job.startDate || 'Flexible'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50/80 border border-slate-100 px-2.5 py-1 rounded-lg">
                    <span className="font-extrabold text-[10px] text-rose-600 uppercase tracking-wider">Deadline:</span>
                    <span className="font-bold text-slate-850">{job.deliveryDeadline || 'Flexible'}</span>
                  </div>
                </div>
              </div>

              {/* Bottom specs */}
              <div className="pt-5 mt-4 border-t border-slate-50 flex flex-wrap gap-4 items-center justify-between text-slate-500 text-xs font-semibold">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg text-slate-700">
                    <Coins className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>{formatBudget(job.budgetRange)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg text-slate-700">
                    <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                    <span className="truncate max-w-[120px]">{job.location}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-indigo-600 font-bold group-hover:translate-x-1 transition-all">
                  <span>View Details</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </motion.div>
          );
        })}
        </AnimatePresence>

        {jobs.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-400 text-lg font-semibold uppercase tracking-wider">No jobs available</p>
            <p className="text-sm text-slate-400 mt-1">Be the first to post a job brief!</p>
          </div>
        ) : sortedJobs.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-400 text-lg font-medium">No job briefs match your query.</p>
          </div>
        ) : null}
      </div>

      {/* Viewing Details Modal */}
      <AnimatePresence>
        {viewingJob && (
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setViewingJob(null)}
          >
            {/* Shouting close button outside the modal card */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setViewingJob(null);
              }}
              className="fixed top-4 right-4 md:top-8 md:right-8 p-3.5 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer z-[60] flex items-center justify-center border-2 border-white group"
              title="Close"
            >
              <X className="h-7 w-7 stroke-[2.5]" />
            </button>

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-xl w-full shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden text-left cursor-default"
            >
              <div className="overflow-y-auto p-6 md:p-8 space-y-6 flex-1 pr-12 md:pr-14">
                <div className="space-y-4">
                <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-lg ${
                  viewingJob.category === 'videography' ? 'bg-rose-50 text-rose-600' :
                  viewingJob.category === 'photography' ? 'bg-indigo-50 text-indigo-600' :
                  viewingJob.category === 'design' ? 'bg-sky-50 text-sky-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {viewingJob.category}
                </span>

                <h2 className="text-2xl font-bold text-slate-900 leading-tight pr-8">
                  {viewingJob.title}
                </h2>

                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm uppercase">
                    {viewingJob.clientName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{viewingJob.clientName}</p>
                    <p className="text-xs text-slate-400">{viewingJob.clientCompany || 'Independent Client'}</p>
                  </div>
                </div>
              </div>

              {/* Grid metadata */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl">
                <div>
                  <span className="text-xs text-slate-400 block font-semibold mb-1">Budget Allocation</span>
                  <div className="flex items-center gap-1 text-slate-900 font-extrabold text-[13px]">
                    <Coins className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{formatBudget(viewingJob.budgetRange)}</span>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-semibold mb-1">Location / Zone</span>
                  <div className="flex items-center gap-1 text-slate-900 font-bold text-[13px]">
                    <MapPin className="h-4 w-4 text-indigo-600 shrink-0" />
                    <span className="truncate">{viewingJob.location}</span>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-semibold mb-1">Project Execution</span>
                  <div className="flex items-center gap-1 text-slate-900 font-bold text-[13px]">
                    <Calendar className="h-4 w-4 text-indigo-600 shrink-0" />
                    <span>{viewingJob.startDate || 'Flexible'}</span>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-semibold mb-1">Delivery Deadline</span>
                  <div className="flex items-center gap-1 text-slate-900 font-bold text-[13px]">
                    <Calendar className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>{viewingJob.deliveryDeadline || 'Flexible'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-extrabold text-slate-900">Project Specifications</h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {viewingJob.description}
                </p>
              </div>

              {/* Client Toggle Controls / Status Info */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-150">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Brief Status</span>
                  <span className={`text-xs font-black uppercase tracking-wider ${viewingJob.status === 'closed' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {viewingJob.status === 'closed' ? '🔴 CLOSED' : '🟢 OPEN'}
                  </span>
                </div>
                {currentRole === 'client' ? (
                  <button
                    type="button"
                    onClick={() => {
                      const newStatus = viewingJob.status === 'closed' ? 'open' : 'closed';
                      const updated = { ...viewingJob, status: newStatus };
                      setViewingJob(updated);
                      if (onUpdateJob) onUpdateJob(updated);
                      showLocalToast(`Brief status updated to ${newStatus.toUpperCase()}!`, 'success');
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all ${
                      viewingJob.status === 'closed'
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-rose-600 text-white hover:bg-rose-700'
                    }`}
                  >
                    {viewingJob.status === 'closed' ? 'Open Job Post' : 'Close Job Post'}
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400 font-medium">
                    {viewingJob.status === 'closed' ? 'This post is no longer accepting new proposals.' : 'Accepting pitches and active requests.'}
                  </span>
                )}
              </div>

              {/* Client Contact Info */}
              {(() => {
                if (!isLoggedIn) {
                  return (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block">Mandatory Client Contact Details</span>
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 flex items-center gap-0.5">
                          <Lock className="h-3 w-3" /> Locked
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 opacity-50 filter blur-[1px] select-none pointer-events-none">
                        <div className="flex items-center gap-2 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-400 text-xs font-semibold">
                          <Mail className="h-4 w-4 shrink-0" />
                          <div>
                            <span className="text-[10px] block font-normal leading-none mb-0.5">Email Client</span>
                            <span className="truncate block font-bold text-[11px] leading-tight">{maskEmail(viewingJob.clientEmail)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-400 text-xs font-semibold">
                          <Phone className="h-4 w-4 shrink-0" />
                          <div>
                            <span className="text-[10px] block font-normal leading-none mb-0.5">Call Line</span>
                            <span className="truncate block font-bold text-[11px] leading-tight">{maskPhone(viewingJob.clientPhone)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Sign in locked card */}
                      <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-xl text-center space-y-3">
                        <div className="h-10 w-10 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-500/20">
                          <Lock className="h-4 w-4" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide">Contacts Locked from Visibility</h4>
                          <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                            Please sign up / sign in to view and unlock client contacts for job briefs!
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }

                const activeFreelancer = freelancers.find(f => f.id === currentRole);
                const isUnlocked = currentRole === 'client' || (activeFreelancer && (activeFreelancer.unlockedJobIds || []).includes(viewingJob.id));
                const isClosed = viewingJob.status === 'closed';

                if (isUnlocked) {
                  return (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">Mandatory Client Contact Details</span>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 flex items-center gap-0.5">
                          <Check className="h-3 w-3" /> Unlocked
                        </span>
                      </div>
                      <div className="flex flex-col gap-2.5">
                        {viewingJob.clientPhone && (
                          <a
                            href={`tel:${viewingJob.clientPhone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all group cursor-pointer"
                          >
                            <Phone className="h-4 w-4 text-indigo-500 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] text-slate-400 block font-normal leading-none mb-0.5">Call Line</span>
                              <span className="break-all block font-bold text-[11px] leading-tight text-slate-950 select-all selection:bg-indigo-100">{viewingJob.clientPhone}</span>
                            </div>
                          </a>
                        )}

                        {viewingJob.clientWhatsapp ? (
                          <a
                            href={`https://wa.me/${viewingJob.clientWhatsapp.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all group cursor-pointer"
                          >
                            <MessageSquare className="h-4 w-4 text-emerald-500 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] text-slate-400 block font-normal leading-none mb-0.5">WhatsApp Chat</span>
                              <span className="break-all block font-bold text-[11px] leading-tight text-slate-950 select-all selection:bg-emerald-100">{viewingJob.clientWhatsapp}</span>
                            </div>
                          </a>
                        ) : (
                          <div className="flex items-center gap-2 bg-slate-100/50 px-3.5 py-2.5 rounded-xl border border-slate-150 text-slate-400 text-xs font-semibold cursor-not-allowed">
                            <MessageSquare className="h-4 w-4 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] text-slate-400 block font-normal leading-none mb-0.5">WhatsApp Chat</span>
                              <span className="break-all block font-bold text-[11px] leading-tight">Not Provided</span>
                            </div>
                          </div>
                        )}

                        <a
                          href={`mailto:${viewingJob.clientEmail}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all group cursor-pointer"
                        >
                          <Mail className="h-4 w-4 text-indigo-500 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] text-slate-400 block font-normal leading-none mb-0.5">Email Client</span>
                            <span className="break-all block font-bold text-[11px] leading-tight text-slate-950 select-all selection:bg-indigo-100">{viewingJob.clientEmail}</span>
                          </div>
                        </a>
                      </div>
                    </div>
                  );
                }

                // If Locked:
                return (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block">Mandatory Client Contact Details</span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 flex items-center gap-0.5">
                        <Lock className="h-3 w-3" /> Locked
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 opacity-50 filter blur-[1px] select-none pointer-events-none">
                      <div className="flex items-center gap-2 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-400 text-xs font-semibold">
                        <Mail className="h-4 w-4 shrink-0" />
                        <div>
                          <span className="text-[10px] block font-normal leading-none mb-0.5">Email Client</span>
                          <span className="truncate block font-bold text-[11px] leading-tight">{maskEmail(viewingJob.clientEmail)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-400 text-xs font-semibold">
                        <Phone className="h-4 w-4 shrink-0" />
                        <div>
                          <span className="text-[10px] block font-normal leading-none mb-0.5">Call Line</span>
                          <span className="truncate block font-bold text-[11px] leading-tight">{maskPhone(viewingJob.clientPhone)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Unlock action panel */}
                    <div className="bg-amber-50/60 border border-amber-200 p-3.5 rounded-xl space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-wide">Contacts Locked from Visibility</h4>
                          <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                            Each job contact allows only 20 unlocks. Unlock this brief to pitch directly via WhatsApp/Call/Email!
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">Unlock Price</span>
                          <span className="text-sm font-black text-slate-900">KSh {viewingJob.unlockPriceKsh || 50}</span>
                        </div>
                      </div>

                      {isClosed ? (
                        <div className="w-full text-center py-2.5 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold uppercase border border-slate-200">
                          This job brief is CLOSED. Contact details cannot be unlocked.
                        </div>
                      ) : (viewingJob.unlockCount || 0) >= 20 ? (
                        <div className="w-full text-center py-2.5 bg-rose-100 text-rose-600 rounded-xl text-xs font-bold uppercase border border-rose-200">
                          Unlock Limit Reached (20/20)
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleUnlockContacts(e, viewingJob)}
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-sm"
                          >
                            <Unlock className="h-4 w-4 shrink-0" />
                            <span>Unlock Client Contacts — KSh {viewingJob.unlockPriceKsh || 50}</span>
                            <span className="text-[10px] font-medium opacity-80">({viewingJob.unlockCount || 0}/20 claimed)</span>
                          </button>

                          {/* Quick Wallet Top Up trigger in modal details */}
                          {activeFreelancer && activeFreelancer.walletBalanceKsh < (viewingJob.unlockPriceKsh || 50) && (
                            <div className="flex items-center justify-between p-2 bg-rose-50 border border-rose-100 rounded-lg text-[10px] text-rose-800 font-bold">
                              <span>Your Balance: KSh {activeFreelancer.walletBalanceKsh} (Insufficient)</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = {
                                    ...activeFreelancer,
                                    walletBalanceKsh: (activeFreelancer.walletBalanceKsh || 0) + 500
                                  };
                                  if (onUpdateFreelancer) onUpdateFreelancer(updated);
                                  showLocalToast('Added KSh 500 to wallet!', 'success');
                                }}
                                className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-md font-black uppercase transition-all shrink-0 cursor-pointer shadow-sm"
                              >
                                Top Up + KSh 500
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Hiring & Contract Management Section */}
              {(() => {
                const isClient = currentRole === 'client';
                const hiredCreative = freelancers.find(f => f.id === viewingJob.hiredCreativeId);
                const isHiredCreative = currentRole === viewingJob.hiredCreativeId;

                // Candidates who unlocked contacts for this job post
                const candidates = freelancers.filter(f => (f.unlockedJobIds || []).includes(viewingJob.id));

                return (
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block">Hiring & Contract Management</span>
                      {viewingJob.hiredCreativeId ? (
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${viewingJob.isCompleted ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                          {viewingJob.isCompleted ? '🎉 Completed' : '💼 Active Project'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          Vacant
                        </span>
                      )}
                    </div>

                    {!viewingJob.hiredCreativeId ? (
                      <div className="space-y-3">
                        {isClient ? (
                          <>
                            <h4 className="text-xs font-black uppercase text-slate-700">Interested Candidates ({candidates.length})</h4>
                            {candidates.length === 0 ? (
                              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                                No applications/unlocks yet. Interested creatives will appear here as soon as they unlock your contact details.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {candidates.map(candidate => (
                                  <div key={candidate.id} className="flex items-center justify-between gap-2 p-2.5 bg-white rounded-xl border border-slate-150">
                                    <div className="flex items-center gap-2">
                                      <img
                                        src={optimizeAvatarUrl(candidate.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200')}
                                        alt={candidate.fullName}
                                        className="h-8 w-8 rounded-full object-cover"
                                        loading="lazy"
                                        decoding="async"
                                        referrerPolicy="no-referrer"
                                      />
                                      <div>
                                        <span className="text-xs font-bold block leading-tight">{candidate.fullName}</span>
                                        <span className="text-[10px] text-slate-400 block font-semibold">{candidate.title}</span>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => {
                                        const updated = { ...viewingJob, hiredCreativeId: candidate.id, status: 'closed' as const };
                                        setViewingJob(updated);
                                        if (onUpdateJob) onUpdateJob(updated);
                                        showLocalToast(`Successfully hired ${candidate.fullName}! Project is now Active.`, 'success');
                                      }}
                                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-750 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                                    >
                                      Hire
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-xs text-slate-400 font-semibold italic leading-relaxed">
                            This project is open for pitches. Unlock client contacts above to apply!
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-slate-150">
                          <img
                            src={hiredCreative?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                            alt={hiredCreative?.fullName || 'Hired Creative'}
                            className="h-10 w-10 rounded-full object-cover shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] uppercase font-black tracking-widest text-indigo-600 block">Hired Expert</span>
                            <span className="text-sm font-black text-slate-900 block truncate">{hiredCreative?.fullName || 'Talented Creative'}</span>
                            <span className="text-xs font-semibold text-slate-400 block truncate">{hiredCreative?.title || 'Creative Specialist'}</span>
                          </div>
                        </div>

                        {!viewingJob.isCompleted ? (
                          <div className="space-y-2">
                            {isClient ? (
                              <button
                                onClick={() => {
                                  const updated = { ...viewingJob, isCompleted: true };
                                  setViewingJob(updated);
                                  if (onUpdateJob) onUpdateJob(updated);
                                  showLocalToast(`Project completed successfully! Reviews are now open.`, 'success');
                                }}
                                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm text-center"
                              >
                                Mark Project as Completed
                              </button>
                            ) : isHiredCreative ? (
                              <div className="p-3 bg-blue-50 text-blue-950 border border-blue-150 rounded-xl text-xs font-semibold leading-relaxed">
                                You are hired for this project! Work on deliverables and coordinate with the client. Once finished, the client will mark this project as completed so both of you can leave mutual reviews!
                              </div>
                            ) : (
                              <div className="p-3 bg-slate-50 text-slate-500 border border-slate-150 rounded-xl text-xs font-medium">
                                This job has already been assigned to another creative.
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-4 pt-2 border-t border-slate-200">
                            <div className="p-3 bg-emerald-50 text-emerald-950 border border-emerald-150 rounded-xl text-xs font-bold text-center">
                              🎉 Project has been successfully completed!
                            </div>

                            {/* Job reviews inside JobsBoard */}
                            {(() => {
                              if (isClient) {
                                const clientReview = hiredCreative?.reviews?.find(r => r.jobId === viewingJob.id);
                                if (clientReview) {
                                  return (
                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                                      <span className="font-black text-slate-700 block uppercase tracking-wide text-[10px]">Your Posted Review:</span>
                                      <div className="flex gap-1 text-amber-500 mb-1">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                          <Star key={i} className={`h-3 w-3 ${i < clientReview.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-300'}`} />
                                        ))}
                                      </div>
                                      <p className="italic font-medium text-slate-600">"{clientReview.comment}"</p>
                                    </div>
                                  );
                                }

                                return (
                                  <JobReviewForm
                                    reviewerName={viewingJob.clientName}
                                    reviewerRole={viewingJob.clientCompany || 'Client Partner'}
                                    reviewedUserId={viewingJob.hiredCreativeId!}
                                    jobId={viewingJob.id}
                                    onPostReview={async (ratingValue, commentValue) => {
                                      if (onAddReview) {
                                        return await onAddReview(viewingJob.hiredCreativeId!, {
                                          authorName: viewingJob.clientName,
                                          authorRole: viewingJob.clientCompany || 'Client Partner',
                                          rating: ratingValue,
                                          comment: commentValue
                                        }, viewingJob.id);
                                      }
                                    }}
                                  />
                                );
                              } else if (isHiredCreative) {
                                // For creative reviewing the client
                                const creativeReview = (hiredCreative?.reviews || []).find(r => r.jobId === viewingJob.id && r.reviewerId === currentRole);
                                if (creativeReview) {
                                  return (
                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                                      <span className="font-black text-slate-700 block uppercase tracking-wide text-[10px]">Your Review for Client:</span>
                                      <div className="flex gap-1 text-amber-500 mb-1">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                          <Star key={i} className={`h-3 w-3 ${i < creativeReview.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-300'}`} />
                                        ))}
                                      </div>
                                      <p className="italic font-medium text-slate-600">"{creativeReview.comment}"</p>
                                    </div>
                                  );
                                }

                                return (
                                  <JobReviewForm
                                    reviewerName={hiredCreative?.fullName || 'Hired Creative'}
                                    reviewerRole={hiredCreative?.title || 'Freelance Specialist'}
                                    reviewedUserId={viewingJob.userId || 'client'}
                                    jobId={viewingJob.id}
                                    onPostReview={async (ratingValue, commentValue) => {
                                      if (onAddReview) {
                                        return await onAddReview(viewingJob.userId || 'client', {
                                          authorName: hiredCreative?.fullName || 'Hired Creative',
                                          authorRole: hiredCreative?.title || 'Freelance Specialist',
                                          rating: ratingValue,
                                          comment: commentValue
                                        }, viewingJob.id);
                                      }
                                    }}
                                  />
                                );
                              }
                              return null;
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Apply action button */}
              <div className="pt-4 flex gap-3">
                {(() => {
                  const isClosed = viewingJob.status === 'closed';

                  if (isClosed) {
                    return (
                      <div className="flex-1 py-3.5 bg-slate-100 text-slate-400 rounded-xl font-extrabold text-center border border-slate-200">
                        This Brief is Closed
                      </div>
                    );
                  }

                  return null;
                })()}
                
                <button
                  onClick={() => setViewingJob(null)}
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all cursor-pointer text-center"
                >
                  Close
                </button>
              </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Post a Brief Modal */}
      <AnimatePresence>
        {showPostModal && (
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setShowPostModal(false)}
          >
            {/* Shouting close button outside the modal card */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPostModal(false);
              }}
              className="fixed top-4 right-4 md:top-8 md:right-8 p-3.5 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer z-[60] flex items-center justify-center border-2 border-white group"
              title="Close"
            >
              <X className="h-7 w-7 stroke-[2.5]" />
            </button>

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-lg w-full shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden text-left cursor-default"
            >
              <div className="overflow-y-auto p-6 md:p-8 space-y-6 flex-1 pr-12 md:pr-14">
                <div className="space-y-1">
                <h2 className="text-2xl font-extrabold text-slate-900">Post a Creative Project Brief</h2>
                <p className="text-sm text-slate-400">Provide detail so freelancers can send high-quality relevant proposals.</p>
              </div>

              <form onSubmit={handlePostSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Your Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jane Foster"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Company / Agency</label>
                    <input
                      type="text"
                      placeholder="e.g. Apex Studio (Optional)"
                      value={clientCompany}
                      onChange={(e) => setClientCompany(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Project Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Graphic Designer for Packaging Rebrand"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Core Category *</label>
                    <select
                      value={category}
                      onChange={(e: any) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm"
                    >
                      {categories.filter(cat => cat.id !== 'all').map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Budget Range *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. KSh 30,000 - 50,000"
                      value={budgetRange}
                      onChange={(e) => setBudgetRange(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">Location Requirements *</label>
                    {/* Location selector tabs */}
                    <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => handleLocationTabChange('county')}
                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                          locationTab === 'county'
                            ? 'bg-white text-indigo-600 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Select County
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLocationTabChange('custom')}
                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                          locationTab === 'custom'
                            ? 'bg-white text-indigo-600 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Custom Location
                      </button>
                    </div>
                  </div>

                  {locationTab === 'county' ? (
                    <CountySelector
                      value={selectedCounty}
                      onChange={handleCountyChange}
                    />
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="e.g. Remote / Nairobi / Westlands"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm"
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-bold text-slate-700 block">Project Execution Date *</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-bold text-slate-700 block">Delivery Deadline *</label>
                    <input
                      type="date"
                      required
                      value={deliveryDeadline}
                      onChange={(e) => setDeliveryDeadline(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Detailed Project Scope *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe deliverables, style guides, deadlines, and requirements..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm resize-none"
                  />
                </div>

                {/* Required Contact Details */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-3 text-left">
                  <div className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block font-bold">Required Contact Details</div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. j.foster@agency.com"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">Call Number *</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +254 712 345678"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">WhatsApp Number *</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +254 712 345678"
                        value={clientWhatsapp}
                        onChange={(e) => setClientWhatsapp(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold transition-all shadow-lg shadow-indigo-600/15 cursor-pointer"
                  >
                    Publish Brief & Notify Candidates
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPostModal(false)}
                    className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pesapal Secure Payment Simulator Modal */}
      {showPesapalModal && targetJobToUnlock && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
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
                Unlock official client contact info for <strong className="text-white">{targetJobToUnlock.title}</strong>
              </p>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Due:</span>
              <span className="text-xl font-black text-emerald-400">KSh {targetJobToUnlock.unlockPriceKsh || 50}.00</span>
            </div>

            {paymentSuccess ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center space-y-2">
                <Check className="h-8 w-8 text-emerald-400 mx-auto animate-bounce" />
                <p className="text-xs font-black uppercase tracking-wider text-emerald-400">Payment Successful!</p>
                <p className="text-[11px] text-slate-400">Client contact details unlocked permanently.</p>
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
