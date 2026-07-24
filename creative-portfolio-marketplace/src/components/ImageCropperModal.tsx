/*
 * Copyright 2026 Google LLC
 *
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect, useRef, PointerEvent } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Check, X, Move, UploadCloud, Image as ImageIcon, Link as LinkIcon, Trash2 } from 'lucide-react';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  cropType: 'avatar' | 'banner';
  initialZoom?: number;
  initialPan?: { x: number; y: number };
  onSave: (croppedDataUrl: string, zoom: number, pan: { x: number; y: number }, originalImageSrc: string) => void;
  onCancel: () => void;
}



export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageSrc,
  cropType,
  initialZoom,
  initialPan,
  onSave,
  onCancel,
}) => {
  const [activeImage, setActiveImage] = useState<string>('');
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [customUrl, setCustomUrl] = useState<string>('');
  
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Load correct initial image source when modal is opened
  const initRef = useRef(false);
  useEffect(() => {
    if (isOpen && !initRef.current) {
      setActiveImage(imageSrc || '');
      setCustomUrl('');
      setZoom(initialZoom !== undefined ? initialZoom : 1);
      setPan(initialPan || { x: 0, y: 0 });
      setIsDragging(false);
      initRef.current = true;
    } else if (!isOpen) {
      initRef.current = false;
    }
  }, [isOpen, imageSrc, initialZoom, initialPan]);

  // Handle source image dimensions
  useEffect(() => {
    if (activeImage) {
      const img = new Image();
      img.onload = () => {
        setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = activeImage;
    } else {
      setNaturalSize({ width: 0, height: 0 });
    }
  }, [activeImage]);

  if (!isOpen) return null;

  const isAvatar = cropType === 'avatar';
  // Scale down viewport layout for better side-by-side fitting
  const cropWidth = isAvatar ? 220 : 340;
  const cropHeight = isAvatar ? 220 : 130;

  // Calculate base display size of image (to cover the crop frame)
  const containerRatio = cropWidth / cropHeight;
  const imageRatio = naturalSize.width && naturalSize.height ? naturalSize.width / naturalSize.height : 1;

  let displayWidth = cropWidth;
  let displayHeight = cropHeight;

  if (naturalSize.width && naturalSize.height) {
    if (imageRatio > containerRatio) {
      displayHeight = cropHeight;
      displayWidth = cropHeight * imageRatio;
    } else {
      displayWidth = cropWidth;
      displayHeight = cropWidth / imageRatio;
    }
  }

  // Clamping function to keep image within crop area limits
  const getClampedPan = (x: number, y: number, currentZoom: number) => {
    const wScaled = displayWidth * currentZoom;
    const hScaled = displayHeight * currentZoom;

    let clampedX = x;
    let clampedY = y;

    if (wScaled > cropWidth) {
      const maxLimitX = (wScaled - cropWidth) / 2;
      clampedX = Math.max(-maxLimitX, Math.min(maxLimitX, x));
    } else {
      clampedX = 0;
    }

    if (hScaled > cropHeight) {
      const maxLimitY = (hScaled - cropHeight) / 2;
      clampedY = Math.max(-maxLimitY, Math.min(maxLimitY, y));
    } else {
      clampedY = 0;
    }

    return { x: clampedX, y: clampedY };
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!activeImage) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - pan.x,
      y: e.clientY - pan.y,
    };
    if (containerRef.current) {
      containerRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !activeImage) return;
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    const clamped = getClampedPan(newX, newY, zoom);
    setPan(clamped);
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    if (containerRef.current) {
      containerRef.current.releasePointerCapture(e.pointerId);
    }
  };

  const handleZoomChange = (newZoom: number) => {
    const clampedZoom = Math.max(1, Math.min(4, newZoom));
    setZoom(clampedZoom);
    const clampedPan = getClampedPan(pan.x, pan.y, clampedZoom);
    setPan(clampedPan);
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const rawBase64 = reader.result;
        setActiveImage(rawBase64);
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePasteUrl = (url: string) => {
    setCustomUrl(url);
    if (url.trim().startsWith('http://') || url.trim().startsWith('https://') || url.trim().startsWith('data:')) {
      setActiveImage(url.trim());
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  };



  const handleSave = () => {
    if (!activeImage) {
      onSave('', 1, { x: 0, y: 0 }, '');
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      
      // Determine high-resolution export dimensions based on original image size to preserve resolution
      let exportWidth = isAvatar ? 1200 : img.naturalWidth || 3000;
      if (exportWidth < 2400 && !isAvatar) {
        exportWidth = 2400; // Minimum high-resolution threshold for banners
      }
      const aspect = cropHeight / cropWidth;
      const exportHeight = isAvatar ? exportWidth : Math.round(exportWidth * aspect);

      canvas.width = exportWidth;
      canvas.height = exportHeight;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, exportWidth, exportHeight);

        const scaleFactor = exportWidth / cropWidth;
        const targetPanX = pan.x * scaleFactor;
        const targetPanY = pan.y * scaleFactor;
        const targetDisplayW = displayWidth * scaleFactor;
        const targetDisplayH = displayHeight * scaleFactor;

        ctx.translate(exportWidth / 2 + targetPanX, exportHeight / 2 + targetPanY);
        ctx.scale(zoom, zoom);

        ctx.drawImage(
          img,
          -targetDisplayW / 2,
          -targetDisplayH / 2,
          targetDisplayW,
          targetDisplayH
        );

        try {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
          onSave(dataUrl, zoom, pan, activeImage);
        } catch (e) {
          // Fallback if crossOrigin issues arise
          console.warn('Canvas export failed, passing original URL', e);
          onSave(activeImage, zoom, pan, activeImage);
        }
      }
    };
    img.src = activeImage;
  };



  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <div className="flex flex-col">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
              Configure {isAvatar ? 'Profile Photo' : 'Cover Banner'}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Upload a photo or paste a custom link, then drag & zoom in the viewport to preview the perfect crop.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Workspace Split Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
          
          {/* LEFT PANEL: Interactive Live Cropping Tool */}
          <div className="p-6 flex flex-col justify-between space-y-6 bg-slate-50 dark:bg-slate-950/40">
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest block">
                1. Preview & Positioning Viewport
              </span>
              
              <div className="flex justify-center items-center py-6 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative min-h-[220px]">
                {activeImage ? (
                  <div
                    ref={containerRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    className="relative overflow-hidden cursor-grab active:cursor-grabbing border border-indigo-200/50 dark:border-indigo-900/30 shadow-md bg-slate-100 dark:bg-slate-900 flex items-center justify-center touch-none select-none"
                    style={{
                      width: `${cropWidth}px`,
                      height: `${cropHeight}px`,
                      borderRadius: isAvatar ? '9999px' : '16px',
                    }}
                  >
                    <img
                      src={activeImage}
                      alt="Cropping View"
                      className="absolute pointer-events-none max-w-none origin-center"
                      style={{
                        width: `${displayWidth}px`,
                        height: `${displayHeight}px`,
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                      }}
                      referrerPolicy="no-referrer"
                    />

                    {/* Frame guides */}
                    <div className="absolute inset-0 pointer-events-none ring-1 ring-black/10 flex items-center justify-center">
                      <div 
                        className="w-full h-full border border-white/35 shadow-[0_0_0_999px_rgba(15,23,42,0.4)]"
                        style={{ borderRadius: isAvatar ? '9999px' : '16px' }}
                      />
                    </div>

                    <div className="absolute bottom-2.5 right-2.5 bg-slate-900/75 backdrop-blur-xs p-1 rounded-full text-white pointer-events-none">
                      <Move className="h-3 w-3" />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 p-8 text-center max-w-xs space-y-2">
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full">
                      <ImageIcon className="h-6 w-6 text-slate-400" />
                    </div>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">No Image Selected</span>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Please upload a file, paste an image link, or pick from our premium options on the right.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Slider Workspace Controls */}
            {activeImage && (
              <div className="space-y-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                    <button
                      type="button"
                      onClick={() => handleZoomChange(zoom - 0.2)}
                      className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </button>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 text-[11px]">
                      Zoom Level: {Math.round(zoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => handleZoomChange(zoom + 0.2)}
                      className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <input
                    type="range"
                    min="1"
                    max="4"
                    step="0.01"
                    value={zoom}
                    onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-400"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset Display Position
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveImage('')}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    Clear Image
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL: File Uploader, Presets, and URL Linker */}
          <div className="p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-5">
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest block">
                2. Select Image Source
              </span>

              {/* Drag and Drop Zone */}
              <div 
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${dragActive ? 'border-indigo-600 bg-indigo-50/20' : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-900/40'}`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600 mb-2">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Drag & drop files here</span>
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">or browse computer files</span>
                <span className="text-[9px] text-slate-400 mt-2">Supports high-res JPG, PNG, WEBP, GIF</span>
              </div>



              {/* Custom Link Paste Option */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Paste Custom Image Address URL
                </span>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <LinkIcon className="h-3.5 w-3.5" />
                  </div>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/... or paste image web link"
                    value={customUrl}
                    onChange={(e) => handlePasteUrl(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Modal Bottom Buttons */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <Check className="h-4 w-4" />
                Apply Changes & Save
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
