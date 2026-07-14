"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie } from "lucide-react";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if cookie already exists
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(";").shift();
      return null;
    };

    if (!getCookie("cookie_consent_369")) {
      const timer = setTimeout(() => {
        setShow(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const setConsentCookie = (choice: "accepted" | "declined") => {
    let expires = "";
    const days = choice === "accepted" ? 365 : 30;
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = `; expires=${date.toUTCString()}`;
    
    document.cookie = `cookie_consent_369=${choice}${expires}; path=/; SameSite=Lax`;
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:max-w-md bg-white border border-border-light rounded-[20px] p-6 shadow-xl z-[98] flex flex-col gap-4 text-left"
        >
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-[10px] bg-brand-accent flex items-center justify-center shrink-0">
              <Cookie className="w-5 h-5 text-brand-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-nav text-sm font-bold text-text-dark">
                We Value Your Privacy
              </h3>
              <p className="font-sans text-[12px] text-text-muted leading-relaxed">
                We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking &quot;Accept All&quot;, you consent to our use of cookies.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-1">
            <button
              onClick={() => setConsentCookie("declined")}
              className="px-4 py-2 border border-border-light rounded-[8px] font-nav text-[12px] font-semibold text-text-muted hover:bg-bg-light transition-colors cursor-pointer"
            >
              Decline
            </button>
            <button
              onClick={() => setConsentCookie("accepted")}
              className="px-4 py-2 bg-brand-primary text-white rounded-[8px] font-nav text-[12px] font-semibold hover:bg-[#B91C1C] transition-colors cursor-pointer"
            >
              Accept All
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
