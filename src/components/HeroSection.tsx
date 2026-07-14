"use client";

import { motion } from "framer-motion";
import { Check, Star, ArrowRight } from "lucide-react";

const trustItems = [
  "Free Measuring",
  "Expert Installation",
  "Premium Quality",
  "5-Star Fitting",
];

const showcaseImages = [
  {
    src: "/images/gallery/10-768x768.jpg.webp",
    title: "Vertical Blinds Installation",
    desc: "Precision fit for floor-to-ceiling windows",
    rotate: -4,
    x: -30,
    y: -20,
    badge: "Peterborough",
  },
  {
    src: "/images/gallery/Venitian-Blind-3-768x768.jpg.webp",
    title: "Venetian Wood Slats",
    desc: "Warm organic texture & privacy controls",
    rotate: 4,
    x: 40,
    y: 10,
    badge: "Leicester",
  },
  {
    src: "/images/gallery/Blinds-ROller-12-768x768.jpg.webp",
    title: "Premium Roller Blinds",
    desc: "Minimalist kitchen installation",
    rotate: -2,
    x: -10,
    y: 80,
    badge: "Luton",
  },
];

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-screen overflow-hidden flex items-center justify-center bg-[#090D16] pt-24 pb-16 lg:py-0">
      
      {/* Background Cinematic Video Layer (Subtle motion background) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-20">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/vedio.mp4" type="video/mp4" />
          <source src="/ddb4.mp4" type="video/mp4" />
          <source src="/video_editing.mp4" type="video/mp4" />
        </video>
        {/* Dark radial fade to keep focus on text and visual cards */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#090D16]/50 to-[#090D16]" />
      </div>

      {/* Main Grid Container */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 items-center">
        
        {/* Left Side: Copy, Badges, CTAs, Trust Checkmarks */}
        <div className="lg:col-span-6 flex flex-col items-start text-left gap-8">
          
          {/* Trust Rating Badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="glass-badge px-4 py-2 rounded-full flex items-center gap-2.5"
          >
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="font-nav text-[12px] font-bold text-white uppercase tracking-wider">
              5-Star Rated Service
            </span>
          </motion.div>

          {/* Premium Headline */}
          <div className="flex flex-col gap-3">
            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="font-headline text-5xl sm:text-6xl xl:text-7xl text-white leading-[1.08] tracking-tight"
            >
              Transform Your Home with <br />
              <span className="text-brand-primary italic font-light">Beautiful Blinds</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="font-nav text-brand-primary uppercase font-extrabold text-[15px] sm:text-[18px] tracking-widest mt-1"
            >
              Designed for Comfort, Privacy &amp; Style
            </motion.p>
          </div>

          {/* Body Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="font-sans text-white/70 text-sm sm:text-base leading-relaxed max-w-lg"
          >
            BlissfulBlinds offers premium made-to-measure shutters and window coverings fitted with absolute pride. We bring hundreds of custom swatches straight to your door for a perfect fit, every time.
          </motion.p>

          {/* Trust Checkmarks Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-2 gap-x-6 gap-y-3.5 w-full max-w-md border-t border-white/10 pt-6"
          >
            {trustItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-white/90">
                <div className="w-5 h-5 rounded-full bg-brand-primary/20 flex items-center justify-center border border-brand-primary/40 shrink-0">
                  <Check className="w-3 h-3 text-brand-primary" />
                </div>
                <span className="font-sans text-[13px] font-medium tracking-wide">
                  {item}
                </span>
              </div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            <motion.a
              href="#booking"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full sm:w-auto px-8 py-4 bg-brand-primary text-white font-nav font-semibold text-[14px] rounded-[12px] text-center hover:bg-[#B91C1C] transition-colors shadow-lg hover:shadow-brand-primary/20"
            >
              Book Free Measurement
            </motion.a>

            <motion.a
              href="#blinds"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/15 font-nav font-semibold text-[14px] rounded-[12px] text-center transition-all flex items-center justify-center gap-2"
            >
              Browse Blinds
              <ArrowRight className="w-4 h-4" />
            </motion.a>
          </motion.div>

        </div>

        {/* Right Side: Animated Flex/Grid stack of REAL blinds fitting projects */}
        <div className="lg:col-span-6 relative w-full h-[520px] flex items-center justify-center mt-8 lg:mt-0">
          
          {/* Overlapping Project Cards Stack */}
          {showcaseImages.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9, rotate: 0, x: 0, y: 50 }}
              animate={{ opacity: 1, scale: 1, rotate: img.rotate, x: img.x, y: img.y }}
              transition={{ duration: 0.8, delay: 0.3 + i * 0.15, ease: "easeOut" }}
              whileHover={{
                scale: 1.05,
                rotate: 0,
                x: img.x,
                y: img.y - 15,
                zIndex: 40,
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
              }}
              className="absolute w-[260px] sm:w-[300px] aspect-[4/5] bg-white border border-white/10 rounded-[20px] overflow-hidden shadow-2xl transition-all duration-300 group cursor-pointer z-10 origin-center"
            >
              {/* Image element */}
              <div className="w-full h-full relative overflow-hidden bg-gray-900">
                <img
                  src={img.src}
                  alt={img.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                />
                
                {/* Dark gradient mask */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-90 group-hover:opacity-95 transition-opacity" />

                {/* Location Badge */}
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 shadow-sm border border-gray-200">
                  <span className="font-btn text-[9px] font-bold text-text-dark tracking-wide uppercase">
                    {img.badge} Fitting
                  </span>
                </div>

                {/* Project Details */}
                <div className="absolute bottom-5 left-5 right-5 text-left flex flex-col gap-1">
                  <h3 className="font-nav text-[14px] sm:text-[16px] font-bold text-white leading-tight">
                    {img.title}
                  </h3>
                  <p className="font-sans text-[11px] sm:text-[12px] text-white/70 leading-normal">
                    {img.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Underlay glow element */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-brand-primary/10 rounded-full blur-[100px] pointer-events-none -z-10" />

        </div>

      </div>

    </section>
  );
}
