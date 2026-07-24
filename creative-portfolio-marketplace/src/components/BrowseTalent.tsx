/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MapPin, Star, Sparkles, ArrowRight, ChevronLeft, ChevronRight, Search, SlidersHorizontal, ChevronDown, X, DollarSign, ArrowUpDown } from 'lucide-react';
import { FreelancerProfile, CreativeCategory } from '../types';
import { motion } from 'motion/react';
import { optimizeCardUrl, optimizeAvatarUrl } from '../utils/imageUtils';

interface BrowseTalentProps {
  freelancers: FreelancerProfile[];
  onSelectFreelancer: (id: string) => void;
  selectedCategory: CreativeCategory | 'all';
  setSelectedCategory: (cat: CreativeCategory | 'all') => void;
}

export default function BrowseTalent({ 
  freelancers, 
  onSelectFreelancer,
  selectedCategory,
  setSelectedCategory
}: BrowseTalentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'hourlyRateAsc' | 'hourlyRateDesc'>('rating');
  const [showFilters, setShowFilters] = useState(false);

  const categories: { id: CreativeCategory | 'all'; label: string; icon: string; count: number }[] = [
    { id: 'all', label: 'All Creatives', icon: '✨', count: freelancers.length },
    { id: 'actors', label: 'Actors And Performing Artists', icon: '🎭', count: freelancers.filter(f => f.category === 'actors').length },
    { id: 'baking', label: 'Baking & Cake Art', icon: '🎂', count: freelancers.filter(f => f.category === 'baking').length },
    { id: 'beauty', label: 'Beauty And Makeup Artists', icon: '💄', count: freelancers.filter(f => f.category === 'beauty').length },
    { id: 'branding', label: 'Branding', icon: '🏷️', count: freelancers.filter(f => f.category === 'branding').length },
    { id: 'content', label: 'Content Creation', icon: '✍️', count: freelancers.filter(f => f.category === 'content').length },
    { id: 'marketing', label: 'Digital Marketing', icon: '📈', count: freelancers.filter(f => f.category === 'marketing').length },
    { id: 'organizers', label: 'Event Organizers', icon: '📅', count: freelancers.filter(f => f.category === 'organizers').length },
    { id: 'decorators', label: 'Event Stylists And Decorators', icon: '✨', count: freelancers.filter(f => f.category === 'decorators').length },
    { id: 'hospitality', label: 'Event Ushers And Hospitality', icon: '🤝', count: freelancers.filter(f => f.category === 'hospitality').length },
    { id: 'events', label: 'Events (MCs, Decor, DJs, Sound)', icon: '🎤', count: freelancers.filter(f => f.category === 'events').length },
    { id: 'fashion', label: 'Fashion', icon: '👗', count: freelancers.filter(f => f.category === 'fashion').length },
    { id: 'fineartist', label: 'Fine Artists', icon: '🎨', count: freelancers.filter(f => f.category === 'fineartist').length },
    { id: 'florists', label: 'Florists And Floral Designers', icon: '💐', count: freelancers.filter(f => f.category === 'florists').length },
    { id: 'design', label: 'Graphic Design', icon: '🎨', count: freelancers.filter(f => f.category === 'design').length },
    { id: 'illustration', label: 'Illustration', icon: '✏️', count: freelancers.filter(f => f.category === 'illustration').length },
    { id: 'interiordesign', label: 'Interior Design', icon: '🏠', count: freelancers.filter(f => f.category === 'interiordesign').length },
    { id: 'musicproducers', label: 'Music Producers', icon: '🎹', count: freelancers.filter(f => f.category === 'musicproducers').length },
    { id: 'photography', label: 'Photography', icon: '📸', count: freelancers.filter(f => f.category === 'photography').length },
    { id: 'writers', label: 'Scripts Writers', icon: '📝', count: freelancers.filter(f => f.category === 'writers').length },
    { id: 'videography', label: 'Videography', icon: '🎥', count: freelancers.filter(f => f.category === 'videography').length },
    { id: 'webdev', label: 'Web Design & Development', icon: '💻', count: freelancers.filter(f => f.category === 'webdev').length }
  ];

  const getAverageRating = (profile: FreelancerProfile) => {
    if (!profile.reviews || profile.reviews.length === 0) return null;
    const sum = profile.reviews.reduce((acc, r) => acc + r.rating, 0);
    return Number((sum / profile.reviews.length).toFixed(1));
  };

  // Filter & Sort
  const filteredFreelancers = freelancers.filter(freelancer => {
    const matchesSearch = freelancer.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          freelancer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          freelancer.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || freelancer.category === selectedCategory;
    const matchesLocation = !locationFilter || freelancer.location.toLowerCase().includes(locationFilter.toLowerCase());

    return matchesSearch && matchesCategory && matchesLocation;
  }).sort((a, b) => {
    if (sortBy === 'rating') {
      return getAverageRating(b) - getAverageRating(a);
    }
    if (sortBy === 'hourlyRateAsc') {
      return a.hourlyRate - b.hourlyRate;
    }
    if (sortBy === 'hourlyRateDesc') {
      return b.hourlyRate - a.hourlyRate;
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Search Engine Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5 space-y-4">
        {/* Category Dropdown Selection */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-450 tracking-wide">Select Creative Category</h3>
            {selectedCategory !== 'all' && (
              <button
                onClick={() => setSelectedCategory('all')}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase cursor-pointer"
              >
                Show All Categories
              </button>
            )}
          </div>
          <div className="relative">
            <select
              id="category-dropdown"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="w-full pl-3 pr-10 py-2.5 bg-slate-50 hover:bg-slate-150/50 border border-slate-100 rounded-xl text-sm font-semibold text-slate-700 transition-all cursor-pointer appearance-none outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 tracking-wide"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="text-slate-750 font-medium bg-white">
                  {cat.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Search Input and Filter Toggle Row */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search for creatives by name, title, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-10 py-2 bg-slate-50 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white text-slate-900 text-sm font-medium transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 cursor-pointer transition-colors"
                title="Clear Search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl border transition-all font-semibold cursor-pointer text-xs w-full sm:w-auto ${
                showFilters
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-850 shadow-sm'
                  : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-500" />
              <span>Filter Engine</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Filters */}
        {showFilters && (
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Location Filter */}
            <div className="space-y-1.5 bg-slate-50/50 p-4 rounded-xl border border-slate-100/50">
              <label className="text-xs font-semibold text-slate-500 tracking-wide block">Location / County</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="e.g. Nairobi, Mombasa, Kisumu..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs text-slate-850 font-medium transition-all"
                />
                {locationFilter && (
                  <button
                    type="button"
                    onClick={() => setLocationFilter('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 rounded hover:bg-slate-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Sort Order */}
            <div className="space-y-1.5 bg-slate-50/50 p-4 rounded-xl border border-slate-100/50">
              <label className="text-xs font-semibold text-slate-500 tracking-wide block">Sort Profiles By</label>
              <button
                id="sort-by-button"
                type="button"
                onClick={() => setSortBy('rating')}
                className="w-full flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs text-slate-755 font-semibold transition-all cursor-pointer shadow-sm active:scale-98"
              >
                <ArrowUpDown className="text-slate-400 h-4 w-4" />
                <span>⭐️ Best Rating first</span>
              </button>
            </div>
          </div>
        )}

        {/* Filter Summary Row */}
        {(searchQuery || selectedCategory !== 'all' || locationFilter) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-50 text-xs">
            <span className="font-semibold text-slate-400">Active Filters:</span>
            
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold">
                Query: "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="hover:text-red-500 cursor-pointer"><X className="h-3 w-3" /></button>
              </span>
            )}

            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold capitalize">
                Category: {selectedCategory}
                <button onClick={() => setSelectedCategory('all')} className="hover:text-red-500 cursor-pointer"><X className="h-3 w-3" /></button>
              </span>
            )}

            {locationFilter && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold">
                Location: "{locationFilter}"
                <button onClick={() => setLocationFilter('')} className="hover:text-red-500 cursor-pointer"><X className="h-3 w-3" /></button>
              </span>
            )}

            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setLocationFilter('');
              }}
              className="text-[10px] font-bold uppercase text-slate-450 hover:text-red-500 transition-colors cursor-pointer px-2 py-1 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-100 ml-auto"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Grid of creatives */}
      {freelancers.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
          <p className="text-slate-400 text-lg font-semibold uppercase tracking-wider">No creatives found</p>
          <p className="text-sm text-slate-400">Be the first to register a creative profile!</p>
        </div>
      ) : filteredFreelancers.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-4">
          <p className="text-slate-400 text-lg font-medium">No creatives match your active filters.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setLocationFilter('');
            }}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredFreelancers.map((freelancer) => {
            const avgRating = getAverageRating(freelancer);
            return (
              <motion.div
                key={freelancer.id}
                layout
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                onClick={() => onSelectFreelancer(freelancer.id)}
                className="group flex flex-col bg-white rounded-2xl border border-slate-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-100/10 transition-all duration-300 overflow-hidden cursor-pointer"
              >
                {/* Banner & category badge */}
                <div className="relative h-32 md:h-36 bg-slate-100 overflow-hidden">
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

                {/* Profile brief */}
                <div className="p-5 md:p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="flex gap-4 items-start relative">
                    {/* Avatar (offset upward) */}
                    <div className="relative -mt-12 h-16 w-16 rounded-2xl border-4 border-white bg-white overflow-hidden shadow-md flex items-center justify-center font-extrabold text-sm text-indigo-700 bg-indigo-50">
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
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                          {freelancer.fullName}
                        </h2>
                        {avgRating !== null ? (
                          <div className="flex items-center gap-1 shrink-0 text-indigo-600 font-bold text-sm bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100/40">
                            <Star className="h-3.5 w-3.5 fill-indigo-600 text-indigo-600" />
                            <span>{avgRating}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium shrink-0 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">New on Talanta Hub</span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-indigo-600 truncate">{freelancer.title}</p>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>{freelancer.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bio snippet */}
                  <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                    {freelancer.bio}
                  </p>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {freelancer.skills.slice(0, 3).map((skill, index) => (
                      <span key={index} className="text-xs px-2.5 py-1 bg-slate-50 text-slate-600 rounded-lg font-medium border border-slate-100">
                        {skill}
                      </span>
                    ))}
                    {freelancer.skills.length > 3 && (
                      <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg font-bold">
                        +{freelancer.skills.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Action footer */}
                  <div className="pt-4 border-t border-slate-100/80 flex items-center justify-end">
                    <div className="flex items-center gap-1 text-sm font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
                      <span>Open Portfolio</span>
                      <ArrowRight className="h-4 w-4 text-indigo-500" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
