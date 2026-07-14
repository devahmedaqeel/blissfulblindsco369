"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

interface GalleryItem {
  src: string;
  alt: string;
}

const galleryItems: GalleryItem[] = [
  { src: "/images/gallery/10-768x768.jpg.webp?v=3.0", alt: "Window Blinds installation 1" },
  { src: "/images/gallery/8-768x768.jpg.webp?v=3.0", alt: "Window Blinds installation 2" },
  { src: "/images/gallery/Venitian-Blind-3-768x768.jpg.webp?v=3.0", alt: "Window Blinds installation 3" },
  { src: "/images/gallery/20-768x768.jpg.webp?v=3.0", alt: "Window Blinds installation 4" },
  { src: "/images/gallery/13-768x768.jpg.webp?v=3.0", alt: "Window Blinds installation 5" },
  { src: "/images/gallery/Blinds-ROller-12-768x768.jpg.webp?v=3.0", alt: "Window Blinds installation 6" },
  { src: "/images/gallery/Vertical-4-768x768.jpg.webp?v=3.0", alt: "Window Blinds installation 7" },
  { src: "/images/gallery/Roller-Blinds-2-768x768.jpg.webp?v=3.0", alt: "Window Blinds installation 8" },
  { src: "/images/gallery/Roller-Blinds-Photo-768x768.jpg.webp?v=3.0", alt: "Window Blinds installation 9" },
];

export default function RecentInstallations() {
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (photoIndex !== null) {
      setPhotoIndex((photoIndex - 1 + galleryItems.length) % galleryItems.length);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (photoIndex !== null) {
      setPhotoIndex((photoIndex + 1) % galleryItems.length);
    }
  };

  return (
    <section id="gallery" className="py-24 bg-bg-light border-b border-border-light">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[12px] font-btn font-bold tracking-widest text-brand-primary uppercase">
            Our Portfolio
          </span>
          <h2 className="font-headline text-4xl sm:text-5xl text-text-dark mt-2 tracking-tight">
            Our Recent Installations
          </h2>
          <p className="font-sans text-text-muted mt-4 text-base sm:text-lg leading-relaxed">
            Real photos from window blinds installations completed by our expert fitting team across the country.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {galleryItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: (index % 3) * 0.1 }}
              onClick={() => setPhotoIndex(index)}
              className="group relative aspect-square rounded-[20px] overflow-hidden bg-gray-200 border border-border-light cursor-pointer shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Photo Image */}
              <img
                src={item.src}
                alt={item.alt}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />

              {/* Watermark Overlay Badge (Premium glass capsule) */}
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-gray-200/50 pointer-events-none">
                <img
                  src="/images/logo-dark.png"
                  alt="BB logo"
                  className="h-[14px] w-auto object-contain flex-shrink-0"
                />
                <span className="font-nav text-[9px] font-bold text-[#1e293b] uppercase tracking-wider">
                  Blissful Blinds
                </span>
              </div>

              {/* Zoom Hover Icon Overlay */}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-300">
                  <Maximize2 className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {photoIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPhotoIndex(null)}
            className="fixed inset-0 bg-black/95 z-[999] flex items-center justify-center p-4 cursor-zoom-out"
          >
            {/* Close Button */}
            <button
              onClick={() => setPhotoIndex(null)}
              className="absolute top-6 right-6 text-white hover:text-brand-primary transition-colors focus:outline-none"
              aria-label="Close Lightbox"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Previous Arrow */}
            <button
              onClick={handlePrev}
              className="absolute left-6 text-white hover:text-brand-primary transition-colors focus:outline-none bg-white/10 hover:bg-white/20 p-3 rounded-full hidden sm:block"
              aria-label="Previous Image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Image Container */}
            <motion.div
              key={photoIndex}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative max-w-full max-h-[80vh] aspect-square overflow-hidden rounded-[20px] shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={galleryItems[photoIndex].src}
                alt={galleryItems[photoIndex].alt}
                className="w-full h-full object-cover max-w-[600px] max-h-[600px]"
              />

              {/* Watermark overlay inside Lightbox too! */}
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-gray-200/50">
                <img
                  src="/images/logo-dark.png"
                  alt="BB logo"
                  className="h-[14px] w-auto object-contain flex-shrink-0"
                />
                <span className="font-nav text-[9px] font-bold text-[#1e293b] uppercase tracking-wider">
                  Blissful Blinds
                </span>
              </div>
            </motion.div>

            {/* Next Arrow */}
            <button
              onClick={handleNext}
              className="absolute right-6 text-white hover:text-brand-primary transition-colors focus:outline-none bg-white/10 hover:bg-white/20 p-3 rounded-full hidden sm:block"
              aria-label="Next Image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
