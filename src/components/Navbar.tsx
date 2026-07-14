"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Phone } from "lucide-react";

const navItems = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Blinds", href: "#blinds" },
  { label: "Services", href: "#services" },
  { label: "Gallery", href: "#gallery" },
  { label: "Reviews", href: "#reviews" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-0 left-0 w-full h-[80px] z-50 flex items-center justify-between px-6 lg:px-[120px] py-4 bg-transparent"
      >
        {/* Brand Logo */}
        <a href="#home" className="flex items-center gap-3">
          <img
            src="/images/logo.png?v=4.0"
            alt="BlissfulBlinds Logo"
            className="h-[40px] w-[40px] rounded-full object-cover border-2 border-brand-primary"
          />
          <div className="flex flex-col text-left text-white">
            <span className="font-nav text-lg font-bold leading-tight tracking-wide">
              BlissfulBlinds
            </span>
            <span className="font-btn text-[9px] uppercase tracking-widest text-white/70">
              Style. Privacy. Comfort.
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-8">
          {navItems.map((item, index) => (
            <a
              key={item.label}
              href={item.href}
              className="relative py-2 font-nav text-[14px] font-medium text-white transition-opacity hover:opacity-80"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {item.label}
              {hoveredIndex === index && (
                <motion.span
                  layoutId="navUnderline"
                  className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-primary"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </a>
          ))}
        </nav>

        {/* Action Buttons (Desktop) */}
        <div className="hidden lg:flex items-center gap-4">
          {/* Call Us Button */}
          <a
            href="tel:+447341645339"
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-[10px] text-text-dark font-nav font-semibold text-[14px] shadow-sm hover:shadow-md transition-shadow duration-300"
          >
            <Phone className="w-4 h-4 text-brand-primary" />
            Call Us
          </a>

          {/* Get Free Quote Button */}
          <motion.a
            href="#booking"
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-5 py-2.5 bg-brand-primary text-white font-nav font-semibold text-[14px] rounded-[10px] shadow-sm hover:bg-[#B91C1C] transition-colors duration-300"
          >
            Get Free Quote
          </motion.a>
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex lg:hidden text-white hover:text-brand-primary transition-colors focus:outline-none"
          aria-label="Toggle Menu"
        >
          {isOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
        </button>
      </motion.header>

      {/* Fullscreen Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 bg-black z-40 flex flex-col justify-between p-8 pt-28"
          >
            {/* Nav Items */}
            <div className="flex flex-col gap-6">
              {navItems.map((item, index) => (
                <motion.a
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="font-nav text-3xl font-bold text-white hover:text-brand-primary transition-colors"
                >
                  {item.label}
                </motion.a>
              ))}
            </div>

            {/* Bottom Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col gap-4"
            >
              <a
                href="#booking"
                onClick={() => setIsOpen(false)}
                className="w-full py-4 bg-brand-primary text-white font-nav font-semibold text-center rounded-[10px] shadow-md hover:bg-[#B91C1C] transition-colors"
              >
                Get Free Quote
              </a>
              <a
                href="tel:+447341645339"
                className="w-full py-4 bg-white/10 border border-white/20 text-white font-nav font-semibold text-center rounded-[10px] hover:bg-white/20 transition-colors"
              >
                Call Us
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
