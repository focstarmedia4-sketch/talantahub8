/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Briefcase, 
  Users, 
  MapPin, 
  DollarSign, 
  Coins,
  Calendar, 
  Star, 
  Sparkles, 
  Compass, 
  TrendingUp,
  X,
  Mail,
  Phone,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Check,
  Lock
} from 'lucide-react';
import { FreelancerProfile, Job } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { optimizeCardUrl, optimizeAvatarUrl, optimizeHeroUrl } from '../utils/imageUtils';

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

const SLIDESHOW_IMAGES = [
  "https://ppncmiuqtqtlemhkkzrk.supabase.co/storage/v1/object/public/ulpoaded%20images/ChatGPT%20Image%20Jul%2024,%202026,%2012_22_27%20PM.png",
  "https://ppncmiuqtqtlemhkkzrk.supabase.co/storage/v1/object/public/ulpoaded%20images/ChatGPT%20Image%20Jul%2024,%202026,%2012_03_47%20PM.png",
  "https://ppncmiuqtqtlemhkkzrk.supabase.co/storage/v1/object/public/ulpoaded%20images/ChatGPT%20Image%20Jul%2024,%202026,%2012_19_06%20PM.png"
];

interface HomeProps {
  freelancers: FreelancerProfile[];
  jobs: Job[];
  onSelectFreelancer: (id: string) => void;
  onChangeTab: (tab: 'home' | 'browse' | 'jobs' | 'inbox' | 'dashboard') => void;
  isLoggedIn?: boolean;
}

export default function Home({ 
  freelancers, 
  jobs, 
  onSelectFreelancer, 
  onChangeTab,
  isLoggedIn = true
}: HomeProps) {
  const [viewingJob, setViewingJob] = useState<Job | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeWorksTab, setActiveWorksTab] = useState<'buyers' | 'creatives'>('buyers');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDESHOW_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + SLIDESHOW_IMAGES.length) % SLIDESHOW_IMAGES.length);
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % SLIDESHOW_IMAGES.length);
  };

  // Get average rating helper
  const getAverageRating = (profile: FreelancerProfile) => {
    if (!profile.reviews || profile.reviews.length === 0) return null;
    const sum = profile.reviews.reduce((acc, r) => acc + r.rating, 0);
    return parseFloat((sum / profile.reviews.length).toFixed(1));
  };

  // Get top 8 rated freelancers as featured
  const featuredTalents = [...freelancers]
    .sort((a, b) => getAverageRating(b) - getAverageRating(a))
    .slice(0, 8);

  // Get 4 most recent jobs
  const recentJobs = [...jobs]
    .sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime())
    .slice(0, 4);

  // Stats calculation
  const totalCreatives = freelancers.length;
  const totalJobs = jobs.length;

  return (
    <div className="w-full space-y-0">
      
      {/* 1. HERO BANNER WITH DYNAMIC SLIDESHOW BACKGROUND */}
      <section className="relative overflow-hidden w-full bg-transparent group">
        {/* Natural sizing image establishes the exact uncropped height of the hero banner with zero scaled zoom and zero wasted space */}
        <img
          src={optimizeHeroUrl(SLIDESHOW_IMAGES[0])}
          alt=""
          className="w-full h-auto object-contain opacity-0 pointer-events-none select-none block"
          aria-hidden="true"
        />

        {/* Background Slideshow Layer */}
        <div className="absolute inset-0 z-0 w-full h-full">
          {SLIDESHOW_IMAGES.map((img, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: currentSlide === idx ? 1 : 0 }}
              transition={{ duration: 1.0, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden"
              style={{ pointerEvents: currentSlide === idx ? 'auto' : 'none' }}
            >
              {/* 100% Uncropped Image at its original natural proportions */}
              <img
                src={optimizeHeroUrl(img)}
                alt={`Slideshow ${idx + 1}`}
                className="w-full h-full object-contain select-none pointer-events-none"
                loading={idx === 0 ? "eager" : "lazy"}
                decoding="async"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          ))}
        </div>



        {/* Navigation Arrows & Dot Indicators */}
        {SLIDESHOW_IMAGES.length > 1 && (
          <>
            <button
              onClick={handlePrevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950/50 hover:bg-slate-950 text-white flex items-center justify-center border border-white/10 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer z-20 hover:scale-105 active:scale-95"
              title="Previous Slide"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={handleNextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950/50 hover:bg-slate-950 text-white flex items-center justify-center border border-white/10 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer z-20 hover:scale-105 active:scale-95"
              title="Next Slide"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="absolute bottom-6 landscape:bottom-3 right-8 landscape:right-4 flex items-center gap-1.5 z-20">
              {SLIDESHOW_IMAGES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    currentSlide === idx 
                      ? 'w-6 bg-white' 
                      : 'w-1.5 bg-white/40 hover:bg-white/80'
                  }`}
                  title={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* LOWER CONTENT SECTIONS CONTAINER */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

      {/* 2. PLATFORM QUICK STATS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-xs">
          <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[8px] sm:text-[9px] lg:text-xs font-medium text-slate-400 block">Trusted By</span>
            <span className="text-xs sm:text-sm lg:text-xl font-bold text-slate-800">10,000+ Creatives</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-xs">
          <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[8px] sm:text-[9px] lg:text-xs font-medium text-slate-400 block">County Coverage</span>
            <span className="text-xs sm:text-sm lg:text-xl font-bold text-slate-800">47 Counties</span>
          </div>
        </div>
      </section>

      {/* 3. EXPLORE TALENTS SECTION */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-[8px] sm:text-[9px] lg:text-xs font-semibold text-indigo-600 uppercase tracking-wider">
              <Compass className="h-3.5 w-3.5" />
              <span>Explore Talents</span>
            </div>
            <h2 className="text-xs sm:text-base lg:text-2xl font-bold text-slate-900 tracking-tight">
              Featured Kenyan Creatives
            </h2>
            <p className="text-[9px] sm:text-xs lg:text-sm text-slate-500">
              Hire top rated specialists matching your visual and digital production standards.
            </p>
          </div>
          <button
            onClick={() => onChangeTab('browse')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider transition-colors cursor-pointer group"
          >
            <span>View All Talents</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Talent Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredTalents.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-slate-400 text-xs sm:text-sm lg:text-lg font-medium">No creatives found</p>
            </div>
          ) : featuredTalents.map((freelancer) => {
            const avgRating = getAverageRating(freelancer);
            return (
              <div
                key={freelancer.id}
                onClick={() => onSelectFreelancer(freelancer.id)}
                className="group flex flex-col bg-white rounded-2xl border border-slate-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-100/10 transition-all duration-300 overflow-hidden cursor-pointer"
              >
                {/* Cover Banner */}
                <div className="relative h-28 bg-slate-100 overflow-hidden">
                  {freelancer.coverUrl ? (
                    <img
                      src={optimizeCardUrl(freelancer.coverUrl)}
                      alt={`${freelancer.fullName} Cover`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-slate-700 to-slate-800" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>

                {/* Card Info */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
                  <div className="flex gap-3 items-start relative">
                    <div className="relative -mt-9 h-12 w-12 rounded-xl border-2 border-white bg-white overflow-hidden shadow-sm shrink-0 flex items-center justify-center font-extrabold text-xs text-indigo-700 bg-indigo-50">
                      {freelancer.avatarUrl ? (
                        <img
                          src={optimizeAvatarUrl(freelancer.avatarUrl)}
                          alt={freelancer.fullName}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        freelancer.fullName[0]?.toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="text-[10px] sm:text-xs lg:text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                          {freelancer.fullName}
                        </h3>
                        {avgRating !== null ? (
                          <div className="flex items-center gap-0.5 shrink-0 text-indigo-600 font-bold text-[7px] sm:text-[8px] lg:text-[10px] bg-indigo-50 px-1.5 py-0.5 rounded">
                            <Star className="h-3 w-3 fill-indigo-600 text-indigo-600" />
                            <span>{avgRating}</span>
                          </div>
                        ) : (
                          <span className="text-[7px] sm:text-[8px] lg:text-[10px] text-slate-400 font-medium shrink-0 bg-slate-50 px-1.5 py-0.5 rounded">New on Talanta Hub</span>
                        )}
                      </div>
                      <p className="text-[8px] sm:text-[9px] lg:text-[11px] font-semibold text-indigo-600 truncate">{freelancer.title}</p>
                      <div className="flex items-center gap-1 text-[7px] sm:text-[8px] lg:text-[10px] text-slate-400 mt-0.5">
                        <MapPin className="h-2.5 w-2.5" />
                        <span className="truncate">{freelancer.location}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[8px] sm:text-[9px] lg:text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {freelancer.bio}
                  </p>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                    <div className="flex items-center gap-0.5 text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                      <span>Explore Portfolio</span>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. JOB MARKET SECTION */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-[8px] sm:text-[9px] lg:text-xs font-semibold text-rose-600 uppercase tracking-wider">
              <Briefcase className="h-3.5 w-3.5" />
              <span>Job Market</span>
            </div>
            <h2 className="text-xs sm:text-base lg:text-2xl font-bold text-slate-900 tracking-tight">
              Recently Posted Jobs
            </h2>
            <p className="text-[9px] sm:text-xs lg:text-sm text-slate-500">
              Browse projects commissioned by active businesses and clients looking for creative production.
            </p>
          </div>
          <button
            onClick={() => onChangeTab('jobs')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider transition-colors cursor-pointer group"
          >
            <span>View Job Market</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Jobs List Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {recentJobs.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-slate-400 text-xs sm:text-sm lg:text-lg font-medium">No jobs available</p>
            </div>
          ) : recentJobs.map((job) => (
            <div
              key={job.id}
              onClick={() => setViewingJob(job)}
              className="group bg-white rounded-2xl border border-slate-100 hover:border-indigo-100 p-5 flex flex-col justify-between hover:shadow-md hover:shadow-indigo-100/10 transition-all duration-300 cursor-pointer"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[7px] sm:text-[8px] lg:text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-600">
                    {job.category}
                  </span>
                  <div className="flex items-center gap-1 text-[7px] sm:text-[8px] lg:text-[10px] text-slate-400">
                    <Calendar className="h-3 w-3" />
                    <span>Posted {job.postedDate}</span>
                  </div>
                </div>

                <h3 className="text-[11px] sm:text-xs lg:text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {job.title}
                </h3>

                <p className="text-[8px] sm:text-[9px] lg:text-xs text-slate-400">
                  {job.clientName} {job.clientCompany && `@ ${job.clientCompany}`}
                </p>

                <p className="text-[8px] sm:text-[9px] lg:text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {job.description}
                </p>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded text-slate-700 text-[8px] sm:text-[9px] lg:text-xs">
                    <Coins className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>{formatBudget(job.budgetRange)}</span>
                  </span>
                  <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded text-slate-700 text-[8px] sm:text-[9px] lg:text-xs">
                    <MapPin className="h-3 w-3 text-indigo-500" />
                    <span className="truncate max-w-[100px]">{job.location}</span>
                  </span>
                </div>
                <div className="flex items-center gap-0.5 text-indigo-600 font-semibold group-hover:translate-x-0.5 transition-transform text-xs">
                  <span>View Details</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PARALLAX LANDSCAPE BANNER SECTION */}
      <section 
        className="relative my-6 sm:my-8 overflow-hidden rounded-2xl sm:rounded-3xl shadow-xl border border-slate-200/50 bg-fixed bg-cover bg-center flex items-center justify-center min-h-[180px] sm:min-h-[220px] md:min-h-[280px]"
        style={{
          backgroundImage: `url("https://ppncmiuqtqtlemhkkzrk.supabase.co/storage/v1/object/public/ulpoaded%20images/ChatGPT%20Image%20Jul%2024,%202026,%2012_34_08%20PM.png")`
        }}
      >
        {/* Dark Overlay for Text Readability */}
        <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px]" />

        {/* Compact Overlay Content */}
        <div className="relative z-10 text-center px-4 py-4 sm:py-6 flex flex-col items-center justify-center space-y-1.5 sm:space-y-2 max-w-lg mx-auto">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/15 text-indigo-100 border border-white/20 backdrop-blur-md text-[7px] sm:text-[8px] lg:text-xs font-bold uppercase tracking-wider rounded-lg shadow-xs">
            <Sparkles className="h-3 w-3 text-amber-400 shrink-0" />
            <span>Empowering Creative Excellence</span>
          </div>
          <h3 className="text-[10px] sm:text-xs md:text-sm lg:text-xl font-extrabold text-white tracking-tight uppercase leading-tight drop-shadow-sm">
            Unleash Your Creative Potential
          </h3>
          <p className="text-[7px] sm:text-[8px] lg:text-xs text-slate-200 font-medium max-w-md mx-auto leading-normal drop-shadow-xs">
            Connect with leading brands and agencies across East Africa. Bring extraordinary ideas to life.
          </p>
        </div>
      </section>

      {/* HOW TALANTA HUB WORKS */}
      <section className="space-y-6 pt-6 border-t border-slate-100">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 text-[8px] sm:text-[9px] lg:text-xs font-semibold text-indigo-600 uppercase tracking-wider justify-center">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Process</span>
          </div>
          <h2 className="text-xs sm:text-base lg:text-2xl font-bold text-slate-900 tracking-tight">
            How Talanta Hub Works
          </h2>
          <p className="text-[9px] sm:text-xs lg:text-sm text-slate-500">
            A simple, fast, and secure way to connect clients with Kenya's elite creative talents.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center">
          <div className="bg-slate-100 p-1 rounded-2xl inline-flex gap-1.5 border border-slate-200/60 shadow-inner">
            <button
              onClick={() => setActiveWorksTab('buyers')}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeWorksTab === 'buyers'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
              For Buyers
            </button>
            <button
              onClick={() => setActiveWorksTab('creatives')}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeWorksTab === 'creatives'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
              For Creatives
            </button>
          </div>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {activeWorksTab === 'buyers' ? (
            <>
              {/* Step 1 */}
              <div className="relative group bg-white border border-slate-100 hover:border-indigo-100 rounded-3xl p-6 md:p-8 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
                <div className="absolute top-6 right-6 text-6xl font-black font-mono text-indigo-500/5 group-hover:text-indigo-500/10 transition-colors pointer-events-none select-none">
                  01
                </div>
                <div className="h-11 w-11 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-extrabold text-lg mb-6 shadow-xs border border-indigo-100/30">
                  1
                </div>
                <h3 className="text-xs sm:text-sm lg:text-lg font-extrabold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  Post a request
                </h3>
                <p className="text-[9px] sm:text-xs lg:text-sm text-slate-500 leading-relaxed font-medium">
                  Tell us what you need, budget, and location.
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative group bg-white border border-slate-100 hover:border-indigo-100 rounded-3xl p-6 md:p-8 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
                <div className="absolute top-6 right-6 text-6xl font-black font-mono text-indigo-500/5 group-hover:text-indigo-500/10 transition-colors pointer-events-none select-none">
                  02
                </div>
                <div className="h-11 w-11 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-extrabold text-lg mb-6 shadow-xs border border-indigo-100/30">
                  2
                </div>
                <h3 className="text-xs sm:text-sm lg:text-lg font-extrabold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  Sellers unlock
                </h3>
                <p className="text-[9px] sm:text-xs lg:text-sm text-slate-500 leading-relaxed font-medium">
                  Only 20 creatives can unlock your contact details and reach you via call, WhatsApp, or email. Once the limit is reached, the job closes automatically. You can reopen it anytime to allow another 20 creatives to apply.
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative group bg-white border border-slate-100 hover:border-indigo-100 rounded-3xl p-6 md:p-8 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
                <div className="absolute top-6 right-6 text-6xl font-black font-mono text-indigo-500/5 group-hover:text-indigo-500/10 transition-colors pointer-events-none select-none">
                  03
                </div>
                <div className="h-11 w-11 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-extrabold text-lg mb-6 shadow-xs border border-indigo-100/30">
                  3
                </div>
                <h3 className="text-xs sm:text-sm lg:text-lg font-extrabold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  Compare & choose
                </h3>
                <p className="text-[9px] sm:text-xs lg:text-sm text-slate-500 leading-relaxed font-medium">
                  Negotiate and get the job done.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Step 1 */}
              <div className="relative group bg-white border border-slate-100 hover:border-indigo-100 rounded-3xl p-6 md:p-8 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
                <div className="absolute top-6 right-6 text-6xl font-black font-mono text-indigo-500/5 group-hover:text-indigo-500/10 transition-colors pointer-events-none select-none">
                  01
                </div>
                <div className="h-11 w-11 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-extrabold text-lg mb-6 shadow-xs border border-indigo-100/30">
                  1
                </div>
                <h3 className="text-xs sm:text-sm lg:text-lg font-extrabold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  Browse Opportunities
                </h3>
                <p className="text-[9px] sm:text-xs lg:text-sm text-slate-500 leading-relaxed font-medium">
                  Explore client requests by category, location, budget, and project type.
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative group bg-white border border-slate-100 hover:border-indigo-100 rounded-3xl p-6 md:p-8 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
                <div className="absolute top-6 right-6 text-6xl font-black font-mono text-indigo-500/5 group-hover:text-indigo-500/10 transition-colors pointer-events-none select-none">
                  02
                </div>
                <div className="h-11 w-11 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-extrabold text-lg mb-6 shadow-xs border border-indigo-100/30">
                  2
                </div>
                <h3 className="text-xs sm:text-sm lg:text-lg font-extrabold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  Unlock Client Contacts
                </h3>
                <p className="text-[9px] sm:text-xs lg:text-sm text-slate-500 leading-relaxed font-medium">
                  Pay KSh 50 to reveal the client's contact details.
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative group bg-white border border-slate-100 hover:border-indigo-100 rounded-3xl p-6 md:p-8 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
                <div className="absolute top-6 right-6 text-6xl font-black font-mono text-indigo-500/5 group-hover:text-indigo-500/10 transition-colors pointer-events-none select-none">
                  03
                </div>
                <div className="h-11 w-11 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-extrabold text-lg mb-6 shadow-xs border border-indigo-100/30">
                  3
                </div>
                <h3 className="text-xs sm:text-sm lg:text-lg font-extrabold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  Connect Directly
                </h3>
                <p className="text-[9px] sm:text-xs lg:text-sm text-slate-500 leading-relaxed font-medium">
                  Call, email, or start chatting instantly via WhatsApp to discuss the project.
                </p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* WHY OUR PLATFORM WORKS FOR EVERYONE */}
      <section className="space-y-6 pt-6 border-t border-slate-100">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 text-[8px] sm:text-[9px] lg:text-xs font-extrabold text-indigo-600 uppercase tracking-widest justify-center">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Benefits</span>
          </div>
          <h2 className="text-sm sm:text-lg lg:text-3xl font-display font-black text-slate-900 uppercase tracking-tight">
            WHY OUR PLATFORM WORKS FOR EVERYONE
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          {/* For Clients Card */}
          <div className="bg-white border border-slate-150/80 rounded-3xl p-6 md:p-8 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Briefcase className="h-6 w-6" />
                </div>
                <h3 className="text-xs sm:text-base lg:text-xl font-extrabold text-slate-900 uppercase tracking-tight">
                  For Clients
                </h3>
              </div>
              <ul className="space-y-4">
                {[
                  "Post projects for free",
                  "Receive interest from serious creatives only",
                  "Maximum 20 creatives can unlock your contact details per job",
                  "Reopen your project anytime if you need more applicants",
                  "Browse verified portfolios before making your choice"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-[9px] sm:text-xs lg:text-sm text-slate-600 font-medium">
                    <Check className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                    <span>
                      {item.includes("20 creatives") ? (
                        <>
                          Maximum <strong className="text-slate-950 font-bold">20 creatives</strong> can unlock your contact details per job
                        </>
                      ) : item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* For Creatives Card */}
          <div className="bg-white border border-slate-150/80 rounded-3xl p-6 md:p-8 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-xs sm:text-base lg:text-xl font-extrabold text-slate-900 uppercase tracking-tight">
                  For Creatives
                </h3>
              </div>
              <ul className="space-y-4">
                {[
                  "Discover real projects from clients across Kenya",
                  "Filter opportunities by category, location, and budget",
                  "Pay KSh 50 to unlock a client's contact details (Premium members unlock for free)",
                  "Connect directly via phone, WhatsApp, or email—no middleman",
                  "Build your reputation through your portfolio and client reviews",
                  "Receive instant notifications for projects matching your skills"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-[9px] sm:text-xs lg:text-sm text-slate-600 font-medium">
                    <Check className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                    <span>
                      {item.includes("KSh 50") ? (
                        <>
                          Pay <strong className="text-slate-950 font-bold">KSh 50</strong> to unlock a client's contact details (Premium members unlock for free)
                        </>
                      ) : item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. JOB DETAILS MODAL */}
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
              <X className="h-5 w-5 shrink-0" />
            </button>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] cursor-default"
            >
              {/* Modal Header */}
              <div className="bg-slate-900 text-white p-6 md:p-8 relative">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-indigo-600 text-white rounded-lg">
                    {viewingJob.category}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">Posted {viewingJob.postedDate}</span>
                </div>
                <h3 className="text-xl md:text-2xl font-display font-black uppercase tracking-tight">{viewingJob.title}</h3>
                <p className="text-sm text-indigo-200 mt-2 font-bold">
                  Commissioned by {viewingJob.clientName} {viewingJob.clientCompany && `@ ${viewingJob.clientCompany}`}
                </p>
              </div>

              {/* Scrollable Modal Content */}
              <div className="p-6 md:p-8 space-y-6 overflow-y-auto max-h-[50vh]">
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Brief Overview & Scope</h4>
                  <p className="text-sm text-slate-600 leading-relaxed font-semibold whitespace-pre-wrap">{viewingJob.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div>
                    <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">Project Budget</h5>
                    <div className="flex items-center gap-1.5 text-slate-800 font-extrabold text-sm">
                      <Coins className="h-4 w-4 text-emerald-600" />
                      <span>{formatBudget(viewingJob.budgetRange)}</span>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">Project County Venue</h5>
                    <div className="flex items-center gap-1.5 text-slate-800 font-extrabold text-sm">
                      <MapPin className="h-4 w-4 text-indigo-600" />
                      <span>{viewingJob.location}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div>
                    <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">Proposed Start Date</h5>
                    <div className="flex items-center gap-1.5 text-slate-800 font-extrabold text-sm">
                      <Calendar className="h-4 w-4 text-indigo-600" />
                      <span>{viewingJob.startDate || 'Flexible timeline'}</span>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">Final Submission Deadline</h5>
                    <div className="flex items-center gap-1.5 text-slate-800 font-extrabold text-sm">
                      <Calendar className="h-4 w-4 text-rose-600" />
                      <span>{viewingJob.deliveryDeadline || 'Flexible deadline'}</span>
                    </div>
                  </div>
                </div>

                {/* Secure Contact channels */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3.5">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500">Instant Application Contacts</h4>
                  {!isLoggedIn ? (
                    <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-5 text-center space-y-3">
                      <div className="h-10 w-10 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-500/20">
                        <Lock className="h-4 w-4" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide">Contact Details Locked</h4>
                        <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                          Please sign up / sign in to Talanta Hub to access direct client contact channels!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        This creative opportunity is active! Reach out to the client partner directly using their verified contact handles. Mention <strong className="text-indigo-600">Talanta Hub</strong> during commission talks!
                      </p>
                      
                      <div className="flex flex-wrap gap-2.5 pt-1">
                        <a
                          href={`mailto:${viewingJob.clientEmail}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          <span>Email Client</span>
                        </a>
                        <a
                          href={`tel:${viewingJob.clientPhone}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-300 transition-colors"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          <span>Call Direct</span>
                        </a>
                        <a
                          href={`https://wa.me/${viewingJob.clientWhatsapp}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>WhatsApp Brief</span>
                        </a>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Modal footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setViewingJob(null)}
                  className="px-5 py-2.5 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Close Brief
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      </div>
    </div>
  );
}
