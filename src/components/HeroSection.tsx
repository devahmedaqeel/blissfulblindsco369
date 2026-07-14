"use client";

import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";

const trustItems = [
  "Free Measuring",
  "Expert Installation",
  "Premium Quality",
  "5-Star Customer Service",
];

const floatingCards = [
  { label: "Roller Blinds", x: "4%", y: "22%", delay: 0 },
  { label: "Roman Blinds", x: "86%", y: "16%", delay: 1.5 },
  { label: "Venetian Blinds", x: "3%", y: "62%", delay: 0.8 },
  { label: "Wooden Blinds", x: "88%", y: "65%", delay: 2.2 },
  { label: "Motorised Blinds", x: "8%", y: "82%", delay: 1.2 },
  { label: "Vertical Blinds", x: "84%", y: "40%", delay: 0.5 },
];

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-screen overflow-hidden flex items-center justify-center bg-black">
      
      {/* Background Video */}
      <motion.div
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1.0, opacity: 0.7 }}
        transition={{ duration: 2.5, ease: "easeOut" }}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        >
          {/* Multiple local video stream fallbacks from Downloads */}
          <source src="/vedio.mp4" type="video/mp4" />
          <source src="/ddb4.mp4" type="video/mp4" />
          <source src="/video_editing.mp4" type="video/mp4" />
          <source src="/logo_graphic.mp4" type="video/mp4" />
          <source src="/logo_flyers.mp4" type="video/mp4" />
        </video>
        {/* Soft dark overlay for premium contrast and readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/70" />
      </motion.div>

      {/* Floating Glass Cards (Only visible on wide screens to prevent overlap) */}
      <div className="absolute inset-0 pointer-events-none hidden xl:block overflow-hidden z-10">
        {floatingCards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 50 }}
            animate={{ 
              opacity: 1, 
              y: [0, -15, 0],
            }}
            transition={{
              opacity: { duration: 1, delay: card.delay },
              y: {
                duration: 5,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
                delay: card.delay,
              }
            }}
            style={{ left: card.x, top: card.y }}
            className="absolute glass-card px-5 py-3 rounded-[12px] flex items-center gap-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
            <span className="font-nav text-[13px] font-semibold text-white tracking-wide">
              {card.label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="relative z-20 w-full max-w-[1100px] px-6 py-28 text-center flex flex-col items-center justify-center gap-8">
        
        {/* Premium Tagline Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="glass-badge h-[42px] px-4 flex items-center gap-3 rounded-[12px]"
        >
          <span className="h-5 px-2 bg-brand-primary text-white font-btn text-[10px] font-bold rounded-[6px] flex items-center justify-center tracking-wider">
            NEW
          </span>
          <span className="font-btn text-[13px] font-medium text-white tracking-wide">
            Premium Made-to-Measure Blinds Across the United Kingdom
          </span>
        </motion.div>

        {/* Responsive, Elegant, Non-overlapping Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          className="font-headline text-[46px] sm:text-[68px] lg:text-[88px] leading-[1.1] text-white max-w-[950px] tracking-tight"
        >
          Transform Your Home with <span className="text-brand-primary italic font-light">Beautiful Blinds</span>
          <span className="block mt-2 font-sans font-extrabold uppercase text-[26px] sm:text-[40px] lg:text-[52px] tracking-widest text-white/95">
            Designed for <span className="text-brand-primary">Comfort</span>, <span className="text-brand-primary">Privacy</span> &amp; <span className="text-brand-primary">Style</span>
          </span>
        </motion.h1>

        {/* Description Paragraph */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="font-sans text-base sm:text-lg text-white/85 max-w-[720px] leading-relaxed mt-2"
        >
          BlissfulBlinds provides premium made-to-measure Roller, Roman, Venetian, Vertical, Wooden, Perfect Fit, and Motorised Blinds. From expert consultation to professional installation, we deliver stylish window solutions that enhance every home with comfort, privacy, and elegance.
        </motion.p>

        {/* Action Buttons (CTAs) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="flex flex-col sm:flex-row items-center gap-4 mt-4 w-full sm:w-auto z-30"
        >
          {/* Primary CTA */}
          <motion.a
            href="#booking"
            whileHover={{ 
              y: -3, 
              scale: 1.02, 
              boxShadow: "0 0 20px rgba(220, 38, 38, 0.5)" 
            }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto px-8 py-4 bg-brand-primary text-white font-nav font-semibold text-[15px] rounded-[12px] text-center hover:bg-[#B91C1C] transition-colors duration-300"
          >
            Get Free Quote
          </motion.a>

          {/* Secondary CTA */}
          <motion.a
            href="#blinds"
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto px-8 py-4 bg-white text-text-dark font-nav font-semibold text-[15px] rounded-[12px] text-center hover:bg-gray-100 transition-colors duration-300"
          >
            Browse Our Collection
          </motion.a>
        </motion.div>

        {/* Trust & Features Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="flex flex-col items-center gap-4 mt-6"
        >
          {/* 5 Stars Group */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="font-nav text-[14px] font-semibold text-white tracking-wide">
              Trusted by Homeowners Across the UK
            </span>
          </div>

          {/* Features Checkmarks Grid */}
          <div className="grid grid-cols-2 md:flex items-center justify-center gap-x-6 gap-y-3 mt-1">
            {trustItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-white/90">
                <div className="w-4 h-4 rounded-full bg-brand-primary/20 flex items-center justify-center border border-brand-primary/40">
                  <Check className="w-2.5 h-2.5 text-brand-primary" />
                </div>
                <span className="font-sans text-[13px] font-medium tracking-wide">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bouncing Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
      >
        <span className="font-btn text-[9px] uppercase tracking-widest text-white/50">
          Scroll Down
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-5 h-8 rounded-full border-2 border-white/40 flex justify-center p-1"
        >
          <div className="w-1.5 h-2 bg-white rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}
