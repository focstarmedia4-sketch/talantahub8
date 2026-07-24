import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, PhoneCall, Check, X, Calendar, Clock, AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';
import { FreelancerProfile, CallRequest } from '../types';

interface RequestCallProps {
  profile: FreelancerProfile;
  isOwner: boolean;
  onUpdateProfile?: (updated: FreelancerProfile) => void;
}

// Seeding default demo call requests for owners to play with
const DEFAULT_CALL_REQUESTS: CallRequest[] = [
  {
    id: 'req_1',
    clientName: 'Sarah Jenkins (Vogue Editorial)',
    phone: '+1 (555) 321-9876',
    preferredTime: 'Tomorrow at 3:00 PM EST',
    briefMessage: 'Discuss summer cover shoot styling schedule and moodboard review.',
    contactMethods: ['whatsapp'],
    status: 'pending',
    createdAt: 'July 1, 2026, 10:30 AM'
  },
  {
    id: 'req_2',
    clientName: 'Marcus Brodie (Blue Bottle USA)',
    phone: '+1 (415) 888-2940',
    preferredTime: 'Friday morning around 10:00 AM',
    briefMessage: 'Inquiry on commercial campaign color grading and editing budget.',
    contactMethods: ['zoom', 'phone'],
    status: 'completed',
    createdAt: 'June 30, 2026, 4:15 PM'
  }
];

export function RequestCall({ profile, isOwner, onUpdateProfile }: RequestCallProps) {
  // Retrieve call requests or use seeded defaults
  const requests = profile.requestedCalls || DEFAULT_CALL_REQUESTS;

  // Form toggling & states
  const [isOpen, setIsOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [briefMessage, setBriefMessage] = useState('');
  const [contactMethods, setContactMethods] = useState<('phone' | 'whatsapp' | 'zoom')[]>(['phone']);
  
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);

  const handleToggleMethod = (method: 'phone' | 'whatsapp' | 'zoom') => {
    if (contactMethods.includes(method)) {
      if (contactMethods.length > 1) {
        setContactMethods(contactMethods.filter(m => m !== method));
      }
    } else {
      setContactMethods([...contactMethods, method]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      setFormError('Please enter your name.');
      return;
    }
    if (!phone.trim()) {
      setFormError('Please enter your phone number or contact ID.');
      return;
    }
    if (!preferredTime.trim()) {
      setFormError('Please suggest a preferred date & time.');
      return;
    }

    const newRequest: CallRequest = {
      id: `req_${Date.now()}`,
      clientName: clientName.trim(),
      phone: phone.trim(),
      preferredTime: preferredTime.trim(),
      briefMessage: briefMessage.trim() || undefined,
      contactMethods,
      status: 'pending',
      createdAt: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    };

    const updatedRequests = [newRequest, ...requests];
    saveRequests(updatedRequests);

    // Reset Form & Show Success state
    setClientName('');
    setPhone('');
    setPreferredTime('');
    setBriefMessage('');
    setContactMethods(['phone']);
    setFormError('');
    setSuccessMsg(true);

    setTimeout(() => {
      setSuccessMsg(false);
      setIsOpen(false);
    }, 2800);
  };

  const handleUpdateStatus = (reqId: string, newStatus: 'completed' | 'declined') => {
    const updatedRequests = requests.map(req => 
      req.id === reqId ? { ...req, status: newStatus } : req
    );
    saveRequests(updatedRequests);
  };

  const handleDeleteRequest = (reqId: string) => {
    const updatedRequests = requests.filter(req => req.id !== reqId);
    saveRequests(updatedRequests);
  };

  const saveRequests = (updatedList: CallRequest[]) => {
    if (onUpdateProfile) {
      onUpdateProfile({
        ...profile,
        requestedCalls: updatedList
      });
    }
  };

  const pendingRequestsCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="w-full">
      {/* Trigger CTA Card */}
      <div className="bg-slate-900 text-white rounded-3xl border border-slate-800 p-6 md:p-8 shadow-xl relative overflow-hidden transition-all duration-300">
        <div className="absolute -right-16 -top-16 w-44 h-44 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-44 h-44 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-black uppercase tracking-widest border border-indigo-500/10">
              Direct Access
            </span>
            <h3 className="text-xl font-black uppercase tracking-wider text-white flex items-center gap-2">
              <PhoneCall className="h-5 w-5 text-indigo-400 animate-pulse" />
              <span>Let's Discuss Your Project</span>
            </h3>
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              Skip the long back-and-forth emails. Schedule a direct callback, WhatsApp, or Zoom session directly with {profile.fullName} to coordinate concepts, budgets, or schedule timelines.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {isOwner && (
              <span className="text-[10px] font-black uppercase bg-white/5 border border-white/10 px-3 py-2 text-slate-400 rounded-xl text-center">
                {pendingRequestsCount} Pending Call Requests
              </span>
            )}

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="px-6 py-3 bg-white hover:bg-slate-100 active:scale-95 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              <Phone className="h-4 w-4 text-indigo-600" />
              <span>{isOpen ? 'Close Panel' : 'Request Call'}</span>
            </button>
          </div>
        </div>

        {/* Expandable Workspace (Interactive client form or owner list) */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-6 pt-6 border-t border-white/10"
            >
              {isOwner ? (
                /* OWNER CONSOLE view of inbounds call requests */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Inbound Calls & Booking Inquiries
                    </h4>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      Manager Console
                    </span>
                  </div>

                  {requests.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-white/10 rounded-2xl bg-white/5">
                      <Phone className="h-6 w-6 text-slate-500 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">No call requests yet</p>
                      <p className="text-[9px] text-slate-500 mt-1">When prospective clients request a callback, they will appear here.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                      {requests.map((req) => (
                        <div
                          key={req.id}
                          className={`p-4 rounded-2xl border ${
                            req.status === 'completed'
                              ? 'bg-slate-950/20 border-white/5 opacity-60'
                              : req.status === 'declined'
                              ? 'bg-slate-950/10 border-white/5 opacity-50 line-through'
                              : 'bg-white/5 border-white/10 hover:border-white/20'
                          } transition-all relative group`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-slate-100">{req.clientName}</span>
                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                                  req.status === 'pending'
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                                    : req.status === 'completed'
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-slate-500/10 text-slate-400'
                                }`}>
                                  {req.status}
                                </span>
                                <div className="flex gap-1 flex-wrap">
                                  {(req.contactMethods || [((req as any).contactMethod || 'phone')]).map((method) => (
                                    <span key={method} className="text-[9px] font-black px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 uppercase tracking-widest">
                                      {method}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-400">
                                <span className="flex items-center gap-1 text-slate-300">
                                  <Phone className="h-3 w-3 text-slate-500" />
                                  {req.phone}
                                </span>
                                <span className="flex items-center gap-1 text-slate-300">
                                  <Calendar className="h-3 w-3 text-slate-500" />
                                  {req.preferredTime}
                                </span>
                              </div>

                              {req.briefMessage && (
                                <p className="text-xs text-slate-300 italic bg-black/40 p-2.5 rounded-lg border border-white/5 mt-2">
                                  "{req.briefMessage}"
                                </p>
                              )}

                              <p className="text-[8px] text-slate-500 uppercase tracking-wide pt-1">
                                Requested on {req.createdAt}
                              </p>
                            </div>

                            {/* Control Actions */}
                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                              {req.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleUpdateStatus(req.id, 'completed')}
                                    className="p-1.5 bg-emerald-500/10 hover:bg-emerald-600 hover:text-white text-emerald-400 rounded-lg transition-all cursor-pointer border border-emerald-500/10"
                                    title="Mark as Completed"
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleUpdateStatus(req.id, 'declined')}
                                    className="p-1.5 bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-400 rounded-lg transition-all cursor-pointer border border-rose-500/10"
                                    title="Decline Request"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleDeleteRequest(req.id)}
                                className="p-1.5 bg-white/5 hover:bg-rose-600 hover:text-white text-slate-400 rounded-lg transition-all cursor-pointer border border-white/5"
                                title="Delete Record"
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
              ) : (
                /* CLIENT INQUIRY FORM */
                <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-5 md:p-6 space-y-4">
                  {successMsg ? (
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center py-10 space-y-3"
                    >
                      <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto animate-bounce" />
                      <h4 className="text-sm font-black uppercase tracking-wider text-slate-100">
                        Call Request Submitted!
                      </h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                        Your request has been placed onto {profile.fullName}'s schedule coordinator list. They will review it and call/message you shortly.
                      </p>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-white/5">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                          Callback & Consultation Details
                        </h4>
                        <span className="text-[9px] text-slate-500 font-bold uppercase">
                          All fields required *
                        </span>
                      </div>

                      {formError && (
                        <div className="p-3 bg-rose-500/15 border border-rose-500/10 text-rose-400 text-xs rounded-xl flex items-center gap-2 font-bold">
                          <AlertCircle className="h-4 w-4" />
                          <span>{formError}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400">Your Full Name *</label>
                          <input
                            type="text"
                            placeholder="e.g. Amanda Cole (Product Director)"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 text-slate-100 placeholder-slate-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400">Phone Number / ID *</label>
                          <input
                            type="text"
                            placeholder="e.g. +1 (555) 019-2834"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 text-slate-100 placeholder-slate-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400">Preferred Call Method(s) (Select any)</label>
                          <div className="grid grid-cols-3 gap-2">
                            {(['phone', 'whatsapp', 'zoom'] as const).map((method) => {
                              const isSelected = contactMethods.includes(method);
                              return (
                                <button
                                  key={method}
                                  type="button"
                                  onClick={() => handleToggleMethod(method)}
                                  className={`py-2 px-1 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                    isSelected
                                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                                      : 'bg-slate-900 text-slate-400 border-white/10 hover:border-white/20'
                                  }`}
                                >
                                  {isSelected && <Check className="h-3 w-3 shrink-0" />}
                                  <span>{method}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400">Suggested Date & Time *</label>
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                            <input
                              type="text"
                              placeholder="e.g. Mon at 2 PM, or July 4, 11:00 AM"
                              value={preferredTime}
                              onChange={(e) => setPreferredTime(e.target.value)}
                              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 text-slate-100 placeholder-slate-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400">Inquiry Topic / Message (Optional)</label>
                        <textarea
                          rows={2}
                          placeholder="Briefly detail what you would like to discuss (shoot, editing, contract terms...)"
                          value={briefMessage}
                          onChange={(e) => setBriefMessage(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 text-slate-100 placeholder-slate-500 resize-none"
                        />
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                        >
                          <Check className="h-4 w-4 text-indigo-600" />
                          <span>Confirm Booking</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
