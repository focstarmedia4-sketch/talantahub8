import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Globe, Building2, Check, X, Briefcase, AlertCircle, Edit2, Upload, Link } from 'lucide-react';
import { FreelancerProfile } from '../types';

interface NotableClientsProps {
  profile: FreelancerProfile;
  isOwner: boolean;
  onUpdateProfile?: (updated: FreelancerProfile) => void;
}

interface ClientItem {
  id: string;
  name: string;
  logoUrl?: string;
  website?: string;
}

// Tailored default notable clients based on the freelancer's identity for premium look out of the box
export const DEFAULT_CLIENTS_MAP: Record<string, ClientItem[]> = {};

export function NotableClients({ profile, isOwner, onUpdateProfile }: NotableClientsProps) {
  // Retrieve current clients from profile or use pre-seeded defaults
  const currentClients = profile.notableClients || DEFAULT_CLIENTS_MAP[profile.id] || [];

  // Manage form states
  const [isAdding, setIsAdding] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientItem | null>(null);

  const [clientName, setClientName] = useState('');
  const [clientWebsite, setClientWebsite] = useState('');
  const [clientLogoUrl, setClientLogoUrl] = useState('');
  const [formError, setFormError] = useState('');

  // Drag and drop setup
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoInputMethod, setLogoInputMethod] = useState<'upload' | 'url'>('upload');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setFormError('Invalid file type: Please upload an image file (PNG, JPG, etc.).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // High resolution reserved as original base64
        setClientLogoUrl(reader.result);
        setFormError('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      setFormError('Client brand name is required.');
      return;
    }

    const newClient: ClientItem = {
      id: `client_${Date.now()}`,
      name: clientName.trim(),
      logoUrl: clientLogoUrl.trim() || undefined,
      website: clientWebsite.trim() || undefined
    };

    const updatedClients = [...currentClients, newClient];
    saveClients(updatedClients);
    resetForm();
  };

  const startEditClient = (client: ClientItem) => {
    setEditingClient(client);
    setClientName(client.name);
    setClientWebsite(client.website || '');
    setClientLogoUrl(client.logoUrl || '');
    setLogoInputMethod(client.logoUrl?.startsWith('data:') ? 'upload' : 'url');
    setIsAdding(false);
    setFormError('');
  };

  const handleSaveEditClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      setFormError('Client brand name is required.');
      return;
    }
    if (!editingClient) return;

    const updatedClients = currentClients.map(c => {
      if (c.id === editingClient.id) {
        return {
          ...c,
          name: clientName.trim(),
          logoUrl: clientLogoUrl.trim() || undefined,
          website: clientWebsite.trim() || undefined
        };
      }
      return c;
    });

    saveClients(updatedClients);
    resetForm();
  };

  const handleDeleteClient = (clientId: string) => {
    const updatedClients = currentClients.filter(c => c.id !== clientId);
    saveClients(updatedClients);
    if (editingClient?.id === clientId) {
      resetForm();
    }
  };

  const saveClients = (clients: ClientItem[]) => {
    if (onUpdateProfile) {
      onUpdateProfile({
        ...profile,
        notableClients: clients
      });
    }
  };

  const resetForm = () => {
    setClientName('');
    setClientWebsite('');
    setClientLogoUrl('');
    setFormError('');
    setIsAdding(false);
    setEditingClient(null);
  };

  const triggerAddForm = () => {
    resetForm();
    setIsAdding(true);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-md relative overflow-hidden transition-all duration-300" id="notable-clients-segment">
      {/* Subtle background glow */}
      <div className="absolute -right-20 -top-20 w-52 h-52 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-52 h-52 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <h3 className="text-lg font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-indigo-500" />
              <span>Notable Clients & Brands</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Manage past brand collaborations, client logos, and website redirection links.
            </p>
          </div>

          {isOwner && (
            <div className="flex gap-2">
              {!isAdding && !editingClient ? (
                <button
                  onClick={triggerAddForm}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
                  title="Add a new client collaboration"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Client</span>
                </button>
              ) : (
                <button
                  onClick={resetForm}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Cancel Form</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Add / Edit Client expandable Form Workspace */}
        <AnimatePresence>
          {(isAdding || editingClient) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <form 
                onSubmit={editingClient ? handleSaveEditClient : handleAddClient} 
                className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    {editingClient ? `Editing Brand: ${editingClient.name}` : 'Create Brand Collaboration Details'}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">
                    Original Resolution Reserved
                  </span>
                </div>
                
                {formError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-lg flex items-center gap-2 font-bold">
                    <AlertCircle className="h-4 w-4" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Brand Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Client Brand Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vogue, Nike, Shopify"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100 shadow-sm"
                    />
                  </div>

                  {/* Website link */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Brand Website Link (Optional)</label>
                    <input
                      type="url"
                      placeholder="https://client-website.com"
                      value={clientWebsite}
                      onChange={(e) => setClientWebsite(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100 shadow-sm"
                    />
                  </div>
                </div>

                {/* Logo Upload Segment with Drag & Drop */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-t border-slate-200/50 dark:border-slate-800 pt-3">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Brand Logo Image</label>
                    
                    {/* Method toggler */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setLogoInputMethod('upload')}
                        className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          logoInputMethod === 'upload'
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-500'
                        }`}
                      >
                        Drag & Drop Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogoInputMethod('url')}
                        className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          logoInputMethod === 'url'
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-500'
                        }`}
                      >
                        Web URL Link
                      </button>
                    </div>
                  </div>

                  {logoInputMethod === 'upload' ? (
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-xl p-5 text-center transition-all relative flex flex-col items-center justify-center cursor-pointer ${
                        dragActive
                          ? 'border-indigo-500 bg-indigo-50/20 scale-[0.99]'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60'
                      }`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      {clientLogoUrl && clientLogoUrl.startsWith('data:') ? (
                        <div className="space-y-2">
                          <img
                            src={clientLogoUrl}
                            alt="Brand Logo Draft"
                            className="h-14 w-14 object-contain rounded-full border border-indigo-500/30 mx-auto bg-slate-50 dark:bg-slate-950 p-1"
                            referrerPolicy="no-referrer"
                          />
                          <p className="text-[10px] text-emerald-600 font-black uppercase tracking-wide">Image Selected Successfully</p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setClientLogoUrl('');
                            }}
                            className="text-[9px] font-black uppercase tracking-wider text-rose-500 hover:underline cursor-pointer"
                          >
                            Remove Logo Image
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-6 w-6 text-slate-400 mb-1 animate-pulse" />
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Drag & Drop brand logo image here</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            or click to browse original resolution files &bull; JPG, PNG, WEBP, SVG
                          </p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="url"
                          placeholder="https://images.unsplash.com/photo-... or custom logo URL"
                          value={clientLogoUrl}
                          onChange={(e) => setClientLogoUrl(e.target.value)}
                          className="w-full text-xs pl-9 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl outline-none font-semibold transition-all shadow-sm text-slate-900 dark:text-slate-100"
                        />
                      </div>
                      {clientLogoUrl && !clientLogoUrl.startsWith('data:') && (
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                          <img
                            src={clientLogoUrl}
                            alt="URL preview"
                            className="h-8 w-8 object-contain rounded-full bg-slate-100 p-0.5"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                            referrerPolicy="no-referrer"
                          />
                          <span className="text-[9px] text-slate-400 font-bold truncate flex-grow">
                            URL Logo Preview: {clientLogoUrl}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Form submit/save button */}
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/80">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4.5 py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <Check className="h-4 w-4 text-indigo-500 dark:text-indigo-600" />
                    <span>{editingClient ? 'Save Client Changes' : 'Create Collaboration'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Brand Showcase Grid */}
        {currentClients.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <Building2 className="h-8 w-8 text-slate-300 dark:text-slate-700 mx-auto mb-2 animate-pulse" />
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">No Brand Partnerships Listed Yet</p>
            {isOwner && (
              <p className="text-[10px] text-slate-500 mt-1">Click "Add Client" to populate logo assets and brand websites!</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {currentClients.map((client) => {
              const hasLogo = !!client.logoUrl;
              return (
                <div
                  key={client.id}
                  className="group relative bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 border border-slate-100 dark:border-slate-800/60 p-4 rounded-2xl flex flex-col items-center justify-center text-center transition-all duration-300 hover:border-indigo-500/40 hover:shadow-md h-32"
                >
                  {/* Operations Buttons for profile Owner */}
                  {isOwner && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => startEditClient(client)}
                        className="p-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-lg transition-all cursor-pointer border border-indigo-500/10"
                        title={`Edit ${client.name}`}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClient(client.id)}
                        className="p-1.5 bg-rose-50 dark:bg-rose-950 text-rose-500 hover:bg-rose-600 hover:text-white rounded-lg transition-all cursor-pointer border border-rose-500/10"
                        title={`Remove ${client.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Logo Viewport */}
                  <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center border border-slate-200/50 dark:border-slate-700/50 mb-2 shadow-xs group-hover:scale-105 transition-transform duration-300">
                    {hasLogo ? (
                      <img
                        src={client.logoUrl}
                        alt={`${client.name} Logo`}
                        className="w-full h-full object-contain p-1"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Building2 className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                    )}
                  </div>

                  {/* Name with Optional Website Redirect Link */}
                  <div className="space-y-0.5 w-full px-1">
                    {client.website ? (
                      <a
                        href={client.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-black text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 inline-flex items-center justify-center gap-1 group/link max-w-full"
                      >
                        <span className="truncate">{client.name}</span>
                        <Globe className="h-2.5 w-2.5 text-slate-400 group-hover/link:text-indigo-500 transition-colors shrink-0" />
                      </a>
                    ) : (
                      <span className="text-xs font-black text-slate-700 dark:text-slate-300 truncate block">
                        {client.name}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
