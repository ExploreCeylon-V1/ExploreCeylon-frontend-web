import { useState, useEffect, useCallback } from 'react';

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1586183189334-1f3e3d7f0c0c?auto=format&fit=crop&w=1200&q=70';

/**
 * Reusable ImageGallery Component
 * @param {Array} images - Array of image URL strings
 * @param {string} title - Title/name of the item for alt tags
 * @param {number} maxThumbnails - Maximum number of thumbnails to show before +N overlay (default: 5)
 */
const ImageGallery = ({ images = [], title = 'ExploreCeylon', maxThumbnails = 5 }) => {
  const photos = images?.filter(Boolean)?.length ? images.filter(Boolean) : [PLACEHOLDER_IMAGE];

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Keep active photo index valid if images prop changes
  useEffect(() => {
    setActivePhotoIndex(0);
  }, [images]);

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  const handlePrevLightbox = useCallback(() => {
    setLightboxIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  }, [photos.length]);

  const handleNextLightbox = useCallback(() => {
    setLightboxIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  }, [photos.length]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        handlePrevLightbox();
      } else if (e.key === 'ArrowRight') {
        handleNextLightbox();
      } else if (e.key === 'Escape') {
        closeLightbox();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isLightboxOpen, handlePrevLightbox, handleNextLightbox]);

  const visibleThumbnails = photos.slice(0, maxThumbnails);
  const remainingCount = photos.length - maxThumbnails;

  return (
    <div className="w-full mb-6">
      {/* ══════════════════════════ HERO / FEATURED IMAGE ══════════════════════════ */}
      <div
        onClick={() => openLightbox(activePhotoIndex)}
        className="relative w-full rounded-2xl overflow-hidden aspect-[16/9] sm:aspect-[16/8] bg-slate-900 shadow-md group cursor-pointer border border-slate-200/80 transition-all hover:shadow-lg"
      >
        <img
          src={photos[activePhotoIndex]}
          alt={`${title} featured photo ${activePhotoIndex + 1}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.015]"
        />

        {/* Dark overlay gradient at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-80 group-hover:opacity-90 transition-opacity" />

        {/* Counter Badge Top Right */}
        <div className="absolute top-3 right-3 bg-black/65 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-white/10">
          <span>📷</span>
          <span>
            {activePhotoIndex + 1} / {photos.length}
          </span>
        </div>

        {/* Expand Hint Bottom Right */}
        <div className="absolute bottom-3 right-3 bg-black/65 backdrop-blur-md text-white text-xs font-semibold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-white/10 opacity-90 group-hover:opacity-100 transition-opacity">
          <span>🔍</span>
          <span>Click to view full screen</span>
        </div>

        {/* Hero Left/Right Navigation Arrows */}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActivePhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
              }}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-xs border border-white/10"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActivePhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
              }}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-xs border border-white/10"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* ══════════════════════════ UNIFORM THUMBNAIL GRID ══════════════════════════ */}
      {photos.length > 1 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 mt-3">
          {visibleThumbnails.map((photo, idx) => {
            const isSelected = idx === activePhotoIndex;
            const isLastVisibleWithOverflow =
              idx === maxThumbnails - 1 && remainingCount > 0;

            return (
              <div
                key={idx}
                className={`relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-200 border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#2D6A4F] ring-2 ring-[#2D6A4F]/30 scale-[1.02] shadow-sm'
                    : 'border-transparent opacity-85 hover:opacity-100 hover:scale-[1.01]'
                }`}
                onClick={() => {
                  if (isLastVisibleWithOverflow) {
                    openLightbox(idx);
                  } else {
                    setActivePhotoIndex(idx);
                  }
                }}
              >
                <img
                  src={photo}
                  alt={`${title} thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Overflow +N Overlay on last visible thumbnail */}
                {isLastVisibleWithOverflow && (
                  <div className="absolute inset-0 bg-black/65 backdrop-blur-xs text-white font-bold text-sm sm:text-base flex flex-col items-center justify-center text-center p-1">
                    <span>+{remainingCount + 1}</span>
                    <span className="text-3xs font-normal opacity-90 uppercase tracking-wider">
                      View All
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════ LIGHTBOX FULLSCREEN MODAL ══════════════════════════ */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 select-none animate-fadeIn"
          onClick={closeLightbox}
        >
          {/* Top Bar: Title & Close Button */}
          <div
            className="w-full max-w-6xl flex items-center justify-between text-white border-b border-white/10 pb-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-base sm:text-lg truncate max-w-xs sm:max-w-md">
                {title}
              </h3>
              <span className="text-xs bg-white/15 px-2.5 py-1 rounded-full text-slate-200">
                {lightboxIndex + 1} of {photos.length}
              </span>
            </div>

            <button
              type="button"
              onClick={closeLightbox}
              aria-label="Close photo viewer"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-lg transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Main Image Stage */}
          <div
            className="relative flex-1 w-full max-w-6xl flex items-center justify-center my-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Navigation Arrow */}
            {photos.length > 1 && (
              <button
                type="button"
                onClick={handlePrevLightbox}
                aria-label="Previous photo"
                className="absolute left-2 sm:left-4 z-10 w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 text-white font-light text-3xl flex items-center justify-center transition-all border border-white/15 shadow-xl cursor-pointer hover:scale-110"
              >
                ‹
              </button>
            )}

            {/* Uncropped Full Image */}
            <img
              src={photos[lightboxIndex]}
              alt={`${title} full photo ${lightboxIndex + 1}`}
              className="max-w-[92vw] max-h-[75vh] object-contain rounded-lg shadow-2xl transition-all duration-300"
            />

            {/* Right Navigation Arrow */}
            {photos.length > 1 && (
              <button
                type="button"
                onClick={handleNextLightbox}
                aria-label="Next photo"
                className="absolute right-2 sm:right-4 z-10 w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 text-white font-light text-3xl flex items-center justify-center transition-all border border-white/15 shadow-xl cursor-pointer hover:scale-110"
              >
                ›
              </button>
            )}
          </div>

          {/* Bottom Strip: Thumbnail Selector */}
          {photos.length > 1 && (
            <div
              className="w-full max-w-4xl flex items-center justify-center gap-2 overflow-x-auto pt-2 pb-1"
              onClick={(e) => e.stopPropagation()}
            >
              {photos.map((photo, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  className={`relative flex-shrink-0 w-14 h-10 sm:w-16 sm:h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    idx === lightboxIndex
                      ? 'border-[#2D6A4F] ring-2 ring-[#2D6A4F]/60 scale-105 opacity-100'
                      : 'border-transparent opacity-50 hover:opacity-90'
                  }`}
                >
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
