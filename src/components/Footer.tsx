"use client";

import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-text-dark text-white pt-20 pb-8 border-t border-white/10 font-sans">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
        
        {/* Brand Block */}
        <div className="flex flex-col gap-4 text-left">
          <a href="#home" className="flex items-center gap-3">
            <img
              src="/images/logo-light.png?v=3.0"
              alt="BlissfulBlinds Logo"
              className="h-[36px] w-auto object-contain"
            />
            <span className="font-nav text-lg font-bold tracking-wide">
              BlissfulBlinds
            </span>
          </a>
          <p className="text-[13px] text-white/60 leading-relaxed mt-2">
            Premium made-to-measure window blinds, wooden venetians, conservatory roof shades, and custom plantation shutters. Fitted with care and pride across the UK.
          </p>
        </div>

        {/* Quick Links */}
        <div className="text-left flex flex-col gap-4">
          <h3 className="font-nav text-[14px] font-bold text-white uppercase tracking-wider">
            Quick Links
          </h3>
          <ul className="flex flex-col gap-2.5 text-[13px] text-white/60">
            <li>
              <a href="#home" className="hover:text-brand-primary transition-colors">Home</a>
            </li>
            <li>
              <a href="#about" className="hover:text-brand-primary transition-colors">About Us</a>
            </li>
            <li>
              <a href="#blinds" className="hover:text-brand-primary transition-colors">Blinds Range</a>
            </li>
            <li>
              <a href="#services" className="hover:text-brand-primary transition-colors">Fitting Services</a>
            </li>
            <li>
              <a href="#gallery" className="hover:text-brand-primary transition-colors">Recent Work</a>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="text-left flex flex-col gap-4">
          <h3 className="font-nav text-[14px] font-bold text-white uppercase tracking-wider">
            Get In Touch
          </h3>
          <ul className="flex flex-col gap-3 text-[13px] text-white/60">
            <li className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-brand-primary shrink-0" />
              <a href="tel:+447341645339" className="hover:text-white transition-colors">
                07341 645339
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-brand-primary shrink-0" />
              <a href="mailto:info@blissfulblinds.co.uk" className="hover:text-white transition-colors">
                info@blissfulblinds.co.uk
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-brand-primary shrink-0" />
              <span>Peterborough, Leicester & Luton</span>
            </li>
          </ul>
        </div>

        {/* Trust Badges */}
        <div className="text-left flex flex-col gap-4">
          <h3 className="font-nav text-[14px] font-bold text-white uppercase tracking-wider">
            Guaranteed Quality
          </h3>
          <p className="text-[13px] text-white/60 leading-relaxed">
            All our made-to-measure products are backed by a comprehensive 1-year manufacturer guarantee and child safety lock compliance.
          </p>
          <div className="flex items-center gap-4 mt-2">
            <img
              src="/images/google-reviews-badge.png.webp"
              alt="Google reviews badge"
              className="h-10 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
            />
            <img
              src="/images/facebook-reviews-badge.png.webp"
              alt="Facebook reviews badge"
              className="h-10 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
            />
          </div>
        </div>

      </div>

      {/* Footer Bottom */}
      <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-white/40">
        <p>&copy; {currentYear} BlissfulBlinds Co. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Use</a>
          <a href="#" className="hover:text-white transition-colors">Cookie Settings</a>
        </div>
      </div>
    </footer>
  );
}
