/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  X, 
  UserPlus, 
  Sparkles, 
  Check, 
  ChevronDown, 
  Mail, 
  Phone, 
  Lock, 
  MessageSquare 
} from 'lucide-react';
import { FreelancerProfile, CreativeCategory } from '../types';
import { motion, AnimatePresence } from 'motion/react';

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
    <div className="relative w-full" ref={containerRef}>
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

interface CreativeAuthPortalProps {
  onClose: () => void;
  onJoinAsCreative: (newCreative: {
    fullName: string;
    username: string;
    categories: CreativeCategory[];
    hourlyRate: number;
    bio: string;
    location: string;
    skills: string[];
    email?: string;
    phone?: string;
    whatsapp?: string;
    avatarUrl?: string;
    coverUrl?: string;
    password?: string;
  }) => void;
  freelancers: FreelancerProfile[];
  onChangeRole: (role: 'client' | string) => void;
  onLogin: (roleId: string) => void;
  onChangeTab: (tab: 'home' | 'browse' | 'jobs' | 'inbox' | 'dashboard') => void;
  
  // Cropper communication
  setCropperImageSrc: (src: string) => void;
  setCropperType: (type: 'avatar' | 'banner') => void;
  setCropperOpen: (open: boolean) => void;
  avatarUrl: string;
  setAvatarUrl: (url: string) => void;
  coverUrl: string;
  setCoverUrl: (url: string) => void;
  initialTab?: 'signup' | 'signin';
}

export function CreativeAuthPortal({
  onClose,
  onJoinAsCreative,
  freelancers,
  onChangeRole,
  onLogin,
  onChangeTab,
  setCropperImageSrc,
  setCropperType,
  setCropperOpen,
  avatarUrl,
  setAvatarUrl,
  coverUrl,
  setCoverUrl,
  initialTab
}: CreativeAuthPortalProps) {
  // Common error / success states
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Remember Me & Custom states
  const [activeAuthTab, setActiveAuthTab] = useState<'signup' | 'signin'>(initialTab || 'signup');
  const [rememberMe, setRememberMe] = useState(true);
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [forgotPasswordActive, setForgotPasswordActive] = useState(false);
  const [isProfileSetupStep, setIsProfileSetupStep] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveAuthTab(initialTab);
    }
  }, [initialTab]);

  // Sign In states
  const [signinEmail, setSigninEmail] = useState('');
  const [signinPassword, setSigninPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');

  // Sign Up states
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);

  const handleUsernameChange = (val: string) => {
    const cleanUsername = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(cleanUsername);
    
    if (!cleanUsername) {
      setUsernameError(null);
      setUsernameSuggestions([]);
      return;
    }
    
    const isTaken = freelancers.some(f => f.username === cleanUsername);
    if (isTaken) {
      setUsernameError("This username is already taken!");
      
      const base = cleanUsername || 'creative';
      const suffixOptions = ['pro', 'creative', 'visuals', 'studios', 'designs', '1', '2', '24', '7', 'ke'];
      const sugs: string[] = [];
      for (const opt of suffixOptions) {
        const candidate = isNaN(Number(opt)) ? `${base}_${opt}` : `${base}${opt}`;
        const isSugTaken = freelancers.some(f => f.username === candidate);
        if (!isSugTaken && !sugs.includes(candidate)) {
          sugs.push(candidate);
          if (sugs.length >= 3) break;
        }
      }
      while (sugs.length < 3) {
        const rand = Math.floor(10 + Math.random() * 90);
        const candidate = `${base}${rand}`;
        const isSugTaken = freelancers.some(f => f.username === candidate);
        if (!isSugTaken && !sugs.includes(candidate)) {
          sugs.push(candidate);
        }
      }
      setUsernameSuggestions(sugs);
    } else {
      setUsernameError(null);
      setUsernameSuggestions([]);
    }
  };
  const [creativeCategories, setCreativeCategories] = useState<CreativeCategory[]>([]);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [hourlyRate, setHourlyRate] = useState('3500');
  const [creativeLocation, setCreativeLocation] = useState('Nairobi County');
  const [creativeLocationTab, setCreativeLocationTab] = useState<'county' | 'custom'>('county');
  const [creativeCounty, setCreativeCounty] = useState('Nairobi');
  const [creativeEmail, setCreativeEmail] = useState('');
  const [creativePhone, setCreativePhone] = useState('');
  const [creativeWhatsapp, setCreativeWhatsapp] = useState('');
  const [bio, setBio] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  const AVATAR_PRESETS = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200'
  ];

  const COVER_PRESETS = [
    'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200'
  ];

  // Load remembered credentials on mount
  useEffect(() => {
    const isRemembered = localStorage.getItem('remember_me') === 'true';
    setRememberMe(isRemembered);
    if (isRemembered) {
      const email = localStorage.getItem('remembered_email') || '';
      const password = localStorage.getItem('remembered_password') || '';
      setSigninEmail(email);
      setSigninPassword(password);
    }
  }, []);

  // Check for signup success and auto-prefill signin email
  useEffect(() => {
    if (activeAuthTab === 'signin') {
      const signupEmail = sessionStorage.getItem('signup_success_email');
      const signupMsg = sessionStorage.getItem('signup_success_msg');
      if (signupEmail) {
        setSigninEmail(signupEmail);
        if (signupMsg) {
          setAuthSuccess(signupMsg);
          setAuthError(null);
        }
        // Remove so they aren't consumed repeatedly or cause state loops
        sessionStorage.removeItem('signup_success_email');
        sessionStorage.removeItem('signup_success_msg');
      }
    }
  }, [activeAuthTab]);

  const handleCreativeLocationTabChange = (tab: 'county' | 'custom') => {
    setCreativeLocationTab(tab);
    if (tab === 'county') {
      setCreativeLocation(creativeCounty + " County");
    } else {
      setCreativeLocation('');
    }
  };

  const handleCreativeCountyChange = (county: string) => {
    setCreativeCounty(county);
    setCreativeLocation(county + " County");
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!signinEmail || !signinPassword) {
      setAuthError('Please fill in all fields.');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signinEmail,
        password: signinPassword,
      });

      if (error) {
        setAuthError(error.message);
        return;
      }

      if (rememberMe) {
        localStorage.setItem('remember_me', 'true');
        localStorage.setItem('remembered_email', signinEmail);
        localStorage.setItem('remembered_password', signinPassword);
      } else {
        localStorage.setItem('remember_me', 'false');
        localStorage.removeItem('remembered_email');
        localStorage.removeItem('remembered_password');
      }

      const found = freelancers.find(f => f.email?.toLowerCase().trim() === signinEmail.toLowerCase().trim() || (data.user && f.id === data.user.id));
      if (found) {
        onChangeRole(found.id);
        onLogin(found.id);
        setSigninEmail('');
        setSigninPassword('');
        setAuthSuccess('Logged in successfully!');
        onChangeTab('dashboard');
        onClose();
      } else {
        // No creative profile found - this is the first sign in!
        setCreativeEmail(signinEmail); // pre-fill the email for the profile setup
        setIsProfileSetupStep(true);
        setAuthSuccess('Account authenticated! Please complete your creative profile to activate your dashboard.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'An unexpected error occurred during sign in.');
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!forgotEmail) {
      setAuthError('Please enter your email.');
      return;
    }

    const found = freelancers.find(f => f.email?.toLowerCase().trim() === forgotEmail.toLowerCase().trim());
    if (found) {
      setAuthSuccess(`Account details found! Your registered password is: "${found.password || 'password123'}"`);
    } else {
      setAuthError('No registered creative profile found with that email.');
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!creativeEmail || !signupPassword) {
      setAuthError("Please fill in email and password.");
      return;
    }

    if (signupPassword.length < 6) {
      setAuthError("Password must be at least 6 characters long.");
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setAuthError("Confirm password does not match password.");
      return;
    }

    if (freelancers.some(f => f.email?.toLowerCase().trim() === creativeEmail.toLowerCase().trim())) {
      setAuthError("A profile is already registered with this email. Please Sign In.");
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: creativeEmail,
        password: signupPassword,
      });

      if (error) {
        setAuthError(error.message);
        return;
      }

      // Explicitly sign out of Supabase to ensure the user is NOT auto-logged in
      await supabase.auth.signOut();

      if (rememberMe) {
        localStorage.setItem('remember_me', 'true');
        localStorage.setItem('remembered_email', creativeEmail);
        localStorage.setItem('remembered_password', signupPassword);
      } else {
        localStorage.setItem('remember_me', 'false');
        localStorage.removeItem('remembered_email');
        localStorage.removeItem('remembered_password');
      }

      // Store in sessionStorage to survive parental re-renders or unmounts/resets
      sessionStorage.setItem('signup_success_email', creativeEmail);
      sessionStorage.setItem('signup_success_msg', 'Your account has been created. Please check your email and verify your address before logging in.');

      setAuthSuccess('Your account has been created. Please check your email and verify your address before logging in.');
      setSigninEmail(creativeEmail);
      setSigninPassword('');
      setActiveAuthTab('signin');
    } catch (err: any) {
      setAuthError(err.message || 'An unexpected error occurred during signup.');
    }
  };

  const handleProfileSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!fullName || !bio || !creativeLocation || !creativeEmail || !creativePhone || !creativeWhatsapp) {
      setAuthError("Please fill in all required fields to complete your profile.");
      return;
    }

    if (creativeCategories.length === 0) {
      setAuthError("Please select at least one creative specialty field.");
      return;
    }

    let finalUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!finalUsername) {
      const emailPrefix = creativeEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_') || 'creative';
      finalUsername = emailPrefix;
      let counter = 1;
      while (freelancers.some(f => f.username === finalUsername)) {
        finalUsername = `${emailPrefix}_${counter}`;
        counter++;
      }
    } else {
      if (freelancers.some(f => f.username === finalUsername)) {
        setAuthError("Username is already taken. Please choose another or select one of the suggestions.");
        return;
      }
    }

    const skills = skillsText
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    onJoinAsCreative({
      fullName,
      username: finalUsername,
      categories: creativeCategories,
      hourlyRate: parseInt(hourlyRate) || 3500,
      bio,
      location: creativeLocation,
      skills: skills.length > 0 ? skills : ['Creative Production', 'Visuals'],
      email: creativeEmail,
      phone: creativePhone,
      whatsapp: creativeWhatsapp,
      avatarUrl,
      coverUrl,
      password: signupPassword || 'supabase_authed'
    });

    // Reset fields & close
    setFullName('');
    setUsername('');
    setBio('');
    setSkillsText('');
    setCreativeEmail('');
    setCreativePhone('');
    setCreativeWhatsapp('');
    setCreativeLocation('Nairobi County');
    setCreativeLocationTab('county');
    setCreativeCounty('Nairobi');
    setCreativeCategories([]);
    setAvatarUrl('');
    setCoverUrl('');
    setSignupPassword('');
    setSignupConfirmPassword('');
    setIsProfileSetupStep(false);
    onClose();
  };

  const handleSkipProfileSetup = () => {
    setAuthError(null);
    setAuthSuccess(null);

    if (!creativeEmail) {
      setAuthError("No authenticated email found.");
      return;
    }

    // Generate a unique username based on email
    let baseUsername = creativeEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_') || 'creative';
    let finalUsername = baseUsername;
    let counter = 1;
    while (freelancers.some(f => f.username === finalUsername)) {
      finalUsername = `${baseUsername}_${counter}`;
      counter++;
    }

    // Use email prefix as dynamic human-readable name, capitalized elegantly
    const namePart = creativeEmail.split('@')[0];
    const generatedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);

    onJoinAsCreative({
      fullName: `${generatedName} (Creative)`,
      username: finalUsername,
      categories: ['photography'],
      hourlyRate: 3500,
      bio: "Welcome! I'm a professional creative. I will update my bio, location, and specialties soon.",
      location: 'Nairobi County',
      skills: ['Creative Production', 'Visuals'],
      email: creativeEmail,
      phone: '',
      whatsapp: '',
      avatarUrl: '',
      coverUrl: '',
      password: signupPassword || 'supabase_authed'
    });

    // Reset fields & close
    setFullName('');
    setUsername('');
    setBio('');
    setSkillsText('');
    setCreativeEmail('');
    setCreativePhone('');
    setCreativeWhatsapp('');
    setCreativeLocation('Nairobi County');
    setCreativeLocationTab('county');
    setCreativeCounty('Nairobi');
    setCreativeCategories([]);
    setAvatarUrl('');
    setCoverUrl('');
    setSignupPassword('');
    setSignupConfirmPassword('');
    setIsProfileSetupStep(false);
    onClose();
  };

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setAuthSuccess(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) {
        setAuthError(error.message);
      } else {
        setAuthSuccess("Redirecting to Google for sign in...");
      }
    } catch (err: any) {
      setAuthError(err.message || "An error occurred during Google Sign-In.");
    }
  };

  const handleGoogleAccountClick = (email: string, name: string) => {
    setAuthError(null);
    setAuthSuccess(null);
    
    const found = freelancers.find(f => f.email?.toLowerCase().trim() === email.toLowerCase().trim());
    if (found) {
      onChangeRole(found.id);
      onLogin(found.id);
      onChangeTab('dashboard');
      setShowGoogleChooser(false);
      onClose();
      setAuthSuccess(`Signed in with Google as ${name}!`);
    } else {
      onJoinAsCreative({
        fullName: name,
        username: name.toLowerCase().replace(/\s+/g, '_') + '_google',
        categories: ['photography', 'videography'],
        hourlyRate: 4000,
        bio: `Securely authenticated via Google. Complete your profile to add your contact information.`,
        location: "",
        skills: [],
        email: email,
        phone: "",
        whatsapp: "",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
        coverUrl: "",
        password: "google_oauth_bypass"
      });
      
      setAuthSuccess(`Registered & signed in with Google as ${name}!`);
      setShowGoogleChooser(false);
      onClose();
    }
  };

  return (
    <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl relative max-h-[90vh] flex flex-col text-left overflow-hidden cursor-default">
      {/* Google Account Chooser Overlay */}
      <AnimatePresence>
        {showGoogleChooser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-xs z-[70] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 border border-slate-100 flex flex-col items-center text-center"
            >
              {/* Google multi-colored logo */}
              <div className="flex items-center gap-1.5 mb-4">
                <svg className="h-6 w-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61c-.29 1.5-.1.31-2.11 3.51V20.2h3.41c2-1.84 3.83-5.26 3.83-7.93z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.41-2.65c-.95.64-2.17 1.02-3.52 1.02-2.71 0-5.01-1.83-5.83-4.29H3.63v2.75C5.61 21.03 8.61 24 12 24z" />
                  <path fill="#FBBC05" d="M6.17 15.17c-.2-.6-.31-1.25-.31-1.92s.11-1.32.31-1.92V8.58H3.63C2.8 10.22 2.33 12.05 2.33 14s.47 3.78 1.3 5.42l3.41-2.75c-.82-2.46-2.52-4.29-.87-1.5z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 8.61 0 5.61 2.97 3.63 6.13l3.41 2.75c.82-2.46 3.12-4.13 5.83-4.13z" />
                </svg>
                <span className="font-semibold text-slate-700 tracking-tight text-sm">Google Account</span>
              </div>

              <h3 className="text-lg font-bold text-slate-800">Choose an account</h3>
              <p className="text-xs text-slate-400 mt-1 mb-5">to continue to <strong className="text-indigo-600">Talanta Hub</strong></p>

              <div className="w-full space-y-2.5 max-h-56 overflow-y-auto mb-5 pr-1">
                {/* 1st Account: User's real email */}
                <button
                  type="button"
                  onClick={() => handleGoogleAccountClick('focstarmedia4@gmail.com', 'Focstar Media')}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-150 hover:bg-slate-50 transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center text-xs shadow-sm">
                      FM
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">Focstar Media</div>
                      <div className="text-[10px] font-medium text-slate-400">focstarmedia4@gmail.com</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Active</span>
                </button>

                {/* 2nd Account: David Macharia */}
                <button
                  type="button"
                  onClick={() => handleGoogleAccountClick('david@macharia.io', 'David Macharia')}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-150 hover:bg-slate-50 transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-bold flex items-center justify-center text-xs">
                      DM
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">David Macharia</div>
                      <div className="text-[10px] font-medium text-slate-400">david@macharia.io</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">Google Developer</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowGoogleChooser(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all text-xs cursor-pointer"
              >
                Cancel Google Sign-In
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Single-Page Portal View */}
      <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50 flex items-center justify-end gap-4">
        <button
          onClick={onClose}
          type="button"
          className="p-2 bg-white border border-slate-150 rounded-full text-slate-400 hover:text-slate-600 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs"
          title="Close Workspace Portal"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="overflow-y-auto max-h-[80vh]">
        <div className="p-6 md:p-8 space-y-6">
          
          {/* Notifications / Errors */}
          {authError && (
            <div className="p-3.5 bg-rose-50 border border-rose-150 text-rose-600 text-xs rounded-xl flex items-center gap-2 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-150 text-emerald-700 text-xs rounded-xl flex items-center gap-2 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>{authSuccess}</span>
            </div>
          )}



          <div className="max-w-2xl mx-auto w-full">
            {isProfileSetupStep ? (
              /* THE REST IN THAT TAB (PROFILE SETUP) */
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-wider mb-1">Complete Your Profile</h3>
                  <p className="text-xs text-slate-450">Please complete the details below to activate your professional dashboard</p>
                </div>

                <form id="profile-setup-form" onSubmit={handleProfileSetupSubmit} className="space-y-6">
                  {/* Visual Customizers */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-500 block uppercase tracking-wider">Customize Profile Visuals</span>
                    <div className="relative h-28 sm:h-32 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-inner group">
                      {coverUrl ? (
                        <img 
                          src={coverUrl} 
                          alt="Banner Preview" 
                          className="w-full h-full object-cover transition-opacity duration-300" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-200" />
                      )}
                      <div className="absolute inset-0 bg-black/20" />

                      <button
                        type="button"
                        onClick={() => {
                          setCropperImageSrc(coverUrl || COVER_PRESETS[0]);
                          setCropperType('banner');
                          setCropperOpen(true);
                        }}
                        className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-white border border-white/10 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 z-10 flex items-center gap-1 px-2 text-[10px] font-bold"
                      >
                        <span>Edit Banner</span>
                      </button>

                      {/* Avatar preview */}
                      <div className="absolute left-4 bottom-3 flex items-end gap-3">
                        <div className="relative group">
                          <div className="w-14 h-14 rounded-full border-2 border-white overflow-hidden bg-slate-100 shadow-lg">
                            {avatarUrl ? (
                              <img 
                                src={avatarUrl} 
                                alt="Avatar" 
                                className="w-full h-full object-cover" 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full bg-slate-300 flex items-center justify-center text-xs font-bold text-slate-500">Preset</div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setCropperImageSrc(avatarUrl || AVATAR_PRESETS[0]);
                              setCropperType('avatar');
                              setCropperOpen(true);
                            }}
                            className="absolute -bottom-1 -right-1 p-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full border border-white cursor-pointer shadow-md"
                          >
                            <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. David Macharia"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white p-2.5 font-semibold text-slate-900"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Username</label>
                        <span className="text-[9px] text-slate-400 font-bold ml-1.5 uppercase tracking-wide italic">(Optional)</span>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. macharia_visuals"
                        value={username}
                        onChange={(e) => handleUsernameChange(e.target.value)}
                        className={`w-full text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white p-2.5 font-semibold text-slate-900 ${
                          usernameError ? 'border-rose-300 bg-rose-50/10 focus:ring-rose-500' : username ? 'border-emerald-300' : 'border-slate-150'
                        }`}
                      />
                      {usernameError ? (
                        <div className="space-y-1.5 mt-1">
                          <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                            <span>⚠️ {usernameError}</span>
                          </p>
                          {usernameSuggestions.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 items-center">
                              <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Try choosing:</span>
                              {usernameSuggestions.map((sug) => (
                                <button
                                  type="button"
                                  key={sug}
                                  onClick={() => handleUsernameChange(sug)}
                                  className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold px-2.5 py-1 rounded-full border border-indigo-150 transition-all cursor-pointer shadow-3xs"
                                >
                                  @{sug}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : username ? (
                        <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
                          <span>✓ Username is available!</span>
                        </p>
                      ) : (
                        <p className="text-[10px] font-medium text-slate-400 mt-1">
                          Leave empty to auto-generate a unique handle.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Creative category multi-selector */}
                  <div className="space-y-1.5 relative">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">Creative Fields *</label>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-150 space-y-3">
                      <div className="flex gap-1.5 flex-wrap">
                        {creativeCategories.length === 0 ? (
                          <span className="text-xs text-slate-400 font-semibold italic">No creative fields selected yet.</span>
                        ) : (
                          creativeCategories.map((catId) => (
                            <span
                              key={catId}
                              className="inline-flex items-center gap-1 py-1 px-2.5 bg-indigo-50 border border-indigo-150 text-indigo-700 text-[10px] font-bold rounded-lg uppercase tracking-wider shadow-2xs"
                            >
                              <span>{catId}</span>
                              <button
                                type="button"
                                onClick={() => setCreativeCategories(creativeCategories.filter((id) => id !== catId))}
                                className="p-0.5 rounded hover:bg-indigo-100 text-indigo-500 cursor-pointer"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))
                        )}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Search & filter creative disciplines..."
                          value={categorySearchQuery}
                          onChange={(e) => {
                            setCategorySearchQuery(e.target.value);
                            setIsCategoryDropdownOpen(true);
                          }}
                          onFocus={() => setIsCategoryDropdownOpen(true)}
                          className="flex-1 text-xs bg-white border border-slate-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 p-2 font-semibold text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                          className="px-3 bg-white border border-slate-150 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <span>Browse All</span>
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>

                      {isCategoryDropdownOpen && (
                        <div className="border border-slate-200 rounded-xl bg-white max-h-40 overflow-y-auto p-2">
                          <div className="grid grid-cols-2 gap-1.5">
                            {([
                              { id: 'actors', label: 'Actors & Performing' },
                              { id: 'baking', label: 'Baking & Cake Art' },
                              { id: 'beauty', label: 'Beauty & Makeup' },
                              { id: 'branding', label: 'Branding' },
                              { id: 'content', label: 'Content Creation' },
                              { id: 'marketing', label: 'Digital Marketing' },
                              { id: 'hospitality', label: 'Event Hospitality' },
                              { id: 'organizers', label: 'Event Organizers' },
                              { id: 'events', label: 'Events (DJs/Sound)' },
                              { id: 'fashion', label: 'Fashion' },
                              { id: 'fineartist', label: 'Fine Artists' },
                              { id: 'florists', label: 'Florists & Floral' },
                              { id: 'design', label: 'Graphic Design' },
                              { id: 'illustration', label: 'Illustration' },
                              { id: 'interiordesign', label: 'Interior Design' },
                              { id: 'musicproducers', label: 'Music Producers' },
                              { id: 'photography', label: 'Photography' },
                              { id: 'writers', label: 'Script Writers' },
                              { id: 'decorators', label: 'Stylists & Decorators' },
                              { id: 'videography', label: 'Videography' },
                              { id: 'webdev', label: 'Web Design & Dev' }
                            ] as const)
                              .filter((cat) =>
                                cat.label.toLowerCase().includes(categorySearchQuery.toLowerCase())
                              )
                              .map((cat) => {
                                const isSelected = creativeCategories.includes(cat.id);
                                return (
                                  <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => {
                                      if (isSelected) {
                                        setCreativeCategories(creativeCategories.filter((id) => id !== cat.id));
                                      } else {
                                        setCreativeCategories([...creativeCategories, cat.id]);
                                      }
                                    }}
                                    className={`py-1.5 px-2 rounded-lg border text-[10px] font-bold transition-all flex items-center justify-start gap-2 cursor-pointer ${
                                      isSelected
                                        ? 'bg-indigo-600 border-indigo-500 text-white font-black'
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                                  >
                                    {isSelected ? (
                                      <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                                    ) : (
                                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                                    )}
                                    <span className="truncate">{cat.label}</span>
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hourly Rate */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Hourly Rate (Ksh) *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 3500"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white p-2.5 font-semibold text-slate-900"
                    />
                  </div>

                  {/* Base Location Selector */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Base Location *</label>
                      <div className="flex bg-slate-100 p-0.5 rounded-lg text-[9px] font-black">
                        <button
                          type="button"
                          onClick={() => handleCreativeLocationTabChange('county')}
                          className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                            creativeLocationTab === 'county' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'
                          }`}
                        >
                          County
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCreativeLocationTabChange('custom')}
                          className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                            creativeLocationTab === 'custom' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'
                          }`}
                        >
                          Custom
                        </button>
                      </div>
                    </div>

                    {creativeLocationTab === 'county' ? (
                      <CountySelector
                        value={creativeCounty}
                        onChange={handleCreativeCountyChange}
                      />
                    ) : (
                      <input
                        type="text"
                        required
                        placeholder="e.g. Westlands, Nairobi"
                        value={creativeLocation}
                        onChange={(e) => setCreativeLocation(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white p-2.5 font-semibold text-slate-900"
                      />
                    )}
                  </div>

                  {/* Contact details */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-150 space-y-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block">Required Contact Details</span>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Email Address *</label>
                      <input
                        type="email"
                        required
                        readOnly
                        placeholder="e.g. macharia@talantahub.com"
                        value={creativeEmail}
                        className="w-full text-xs bg-slate-100 border border-slate-150 rounded-xl p-2.5 font-semibold text-slate-500 cursor-not-allowed"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Call Number *</label>
                        <input
                          type="tel"
                          required
                          placeholder="e.g. +254 712 345678"
                          value={creativePhone}
                          onChange={(e) => setCreativePhone(e.target.value)}
                          className="w-full text-xs bg-white border border-slate-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 p-2.5 font-semibold text-slate-900"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">WhatsApp *</label>
                        <input
                          type="tel"
                          required
                          placeholder="e.g. +254 712 345678"
                          value={creativeWhatsapp}
                          onChange={(e) => setCreativeWhatsapp(e.target.value)}
                          className="w-full text-xs bg-white border border-slate-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 p-2.5 font-semibold text-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bio & Skills */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Professional Bio *</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Introduce yourself to prospective clients, your experience, and artistic philosophies..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white p-2.5 font-semibold text-slate-900 resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Key Skills (Comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Portraiture, Studio Lighting, Lightroom, Logo Design"
                      value={skillsText}
                      onChange={(e) => setSkillsText(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white p-2.5 font-semibold text-slate-900"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="submit"
                      className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-sm cursor-pointer text-xs uppercase tracking-wider"
                    >
                      Activate Profile
                    </button>
                    <button
                      type="button"
                      onClick={handleSkipProfileSetup}
                      className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl font-bold transition-all shadow-xs cursor-pointer text-xs uppercase tracking-wider"
                    >
                      Skip Now
                    </button>
                  </div>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileSetupStep(false);
                        setActiveAuthTab('signin');
                        setAuthError(null);
                        setAuthSuccess(null);
                      }}
                      className="text-xs text-slate-500 hover:text-slate-800 font-bold transition-colors underline cursor-pointer"
                    >
                      Cancel & Go Back to Sign In
                    </button>
                  </div>
                </form>
              </div>
            ) : activeAuthTab === 'signup' ? (
              /* SIGN UP TAB */
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-wider mb-1">Create Account</h3>
                  <p className="text-xs text-slate-450">Join Talanta Hub as a creative professional</p>
                </div>

                <form id="join-creative-form" onSubmit={handleJoinSubmit} className="space-y-6">
                  {/* Standard OAuth-style Continue with Google button */}
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold transition-all flex items-center justify-center gap-2.5 shadow-xs cursor-pointer text-xs uppercase tracking-wider hover:border-slate-300"
                  >
                    <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61c-.29 1.5-.1.31-2.11 3.51V20.2h3.41c2-1.84 3.83-5.26 3.83-7.93z" />
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.41-2.65c-.95.64-2.17 1.02-3.52 1.02-2.71 0-5.01-1.83-5.83-4.29H3.63v2.75C5.61 21.03 8.61 24 12 24z" />
                      <path fill="#FBBC05" d="M6.17 15.17c-.2-.6-.31-1.25-.31-1.92s.11-1.32.31-1.92V8.58H3.63C2.8 10.22 2.33 12.05 2.33 14s.47 3.78 1.3 5.42l3.41-2.75c-.82-2.46-2.52-4.29-.87-1.5z" />
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 8.61 0 5.61 2.97 3.63 6.13l3.41 2.75c.82-2.46 3.12-4.13 5.83-4.13z" />
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-slate-100"></div>
                    <span className="flex-shrink mx-3 text-[10px] font-bold uppercase text-slate-400 tracking-wider">or register with email</span>
                    <div className="flex-grow border-t border-slate-100"></div>
                  </div>

                  {/* Standard Sign-Up Form with ONLY email and passwords */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. creative@domain.com"
                      value={creativeEmail}
                      onChange={(e) => setCreativeEmail(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white p-3 font-semibold text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Password *</label>
                      <input
                        type="password"
                        required
                        placeholder="Min 6 characters"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white p-3 font-semibold text-slate-900"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Confirm Password *</label>
                      <input
                        type="password"
                        required
                        placeholder="Re-enter password"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white p-3 font-semibold text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold py-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                      />
                      <span>Remember Me After Sign Up</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-sm cursor-pointer text-xs uppercase tracking-wider"
                  >
                    Create Account
                  </button>
                </form>

                <div className="text-center pt-4 border-t border-slate-150">
                  <p className="text-xs text-slate-500 font-semibold">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveAuthTab('signin');
                        setAuthError(null);
                        setAuthSuccess(null);
                        setForgotPasswordActive(false);
                      }}
                      className="text-indigo-600 hover:text-indigo-800 font-bold transition-colors underline cursor-pointer"
                    >
                      Sign In
                    </button>
                  </p>
                </div>
              </div>
            ) : (
              /* SIGN IN TAB */
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-wider mb-1">Access Your Account</h3>
                  <p className="text-xs text-slate-450">Sign in to manage your creative profile and leads</p>
                </div>

                {!forgotPasswordActive ? (
                  /* Regular Sign-In Form */
                  <form onSubmit={handleSignInSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. creative@domain.com"
                        value={signinEmail}
                        onChange={(e) => setSigninEmail(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white p-3 font-semibold text-slate-900"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Password *</label>
                      <input
                        type="password"
                        required
                        placeholder="Enter password"
                        value={signinPassword}
                        onChange={(e) => setSigninPassword(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white p-3 font-semibold text-slate-900"
                      />
                    </div>

                    {/* Remember Me and Forgot Password Container */}
                    <div className="flex items-center justify-between text-xs font-semibold py-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                        />
                        <span>Remember Me</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotPasswordActive(true);
                          setAuthError(null);
                          setAuthSuccess(null);
                        }}
                        className="text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        Forgot Password?
                      </button>
                    </div>

                    {/* Standard OAuth-style Continue with Google button */}
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold transition-all flex items-center justify-center gap-2.5 shadow-xs cursor-pointer text-xs uppercase tracking-wider hover:border-slate-300"
                    >
                      <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61c-.29 1.5-.1.31-2.11 3.51V20.2h3.41c2-1.84 3.83-5.26 3.83-7.93z" />
                        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.41-2.65c-.95.64-2.17 1.02-3.52 1.02-2.71 0-5.01-1.83-5.83-4.29H3.63v2.75C5.61 21.03 8.61 24 12 24z" />
                        <path fill="#FBBC05" d="M6.17 15.17c-.2-.6-.31-1.25-.31-1.92s.11-1.32.31-1.92V8.58H3.63C2.8 10.22 2.33 12.05 2.33 14s.47 3.78 1.3 5.42l3.41-2.75c-.82-2.46-2.52-4.29-.87-1.5z" />
                        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 8.61 0 5.61 2.97 3.63 6.13l3.41 2.75c.82-2.46 3.12-4.13 5.83-4.13z" />
                      </svg>
                      <span>Continue with Google</span>
                    </button>

                    <button
                      type="submit"
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-sm cursor-pointer text-xs uppercase tracking-wider"
                    >
                      Sign In as Creative
                    </button>
                  </form>
                ) : (
                  /* Inline Password Retrieval Form */
                  <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Registered Email *</label>
                        <button
                          type="button"
                          onClick={() => {
                            setForgotPasswordActive(false);
                            setAuthError(null);
                            setAuthSuccess(null);
                          }}
                          className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-wider"
                        >
                          Back to Sign In
                        </button>
                      </div>
                      <input
                        type="email"
                        required
                        placeholder="e.g. creative@domain.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white p-3 font-semibold text-slate-900"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-sm cursor-pointer text-xs uppercase tracking-wider"
                    >
                      Search & Retrieve Account
                    </button>
                  </form>
                )}

                <div className="text-center pt-4 border-t border-slate-150">
                  <p className="text-xs text-slate-500 font-semibold">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveAuthTab('signup');
                        setAuthError(null);
                        setAuthSuccess(null);
                        setForgotPasswordActive(false);
                      }}
                      className="text-indigo-600 hover:text-indigo-800 font-bold transition-colors underline cursor-pointer"
                    >
                      Create Account
                    </button>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
