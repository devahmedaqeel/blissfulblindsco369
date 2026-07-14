"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Mail, User, MapPin, ChevronDown, Check } from "lucide-react";

export default function BookingForm() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    postcode: "",
    address: "",
    blindsType: "",
    preferredColor: "",
    callTime: "",
    hearAboutUs: "",
    message: "",
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [fallbackNote, setFallbackNote] = useState(false);

  // Load from SessionStorage on Mount
  useEffect(() => {
    const fields = ["name", "phone", "email", "postcode", "address", "blindsType", "preferredColor", "callTime", "hearAboutUs", "message"];
    const savedData: Record<string, string> = {};
    fields.forEach((field) => {
      const stored = sessionStorage.getItem(`session_form_${field}`);
      if (stored) savedData[field] = stored;
    });
    if (Object.keys(savedData).length > 0) {
      setFormData((prev) => ({ ...prev, ...savedData }));
    }

    // Listener for Claim Offer events
    const handleClaim = (e: Event) => {
      const customEvent = e as CustomEvent<{ type: string; message: string }>;
      if (customEvent.detail) {
        setFormData((prev) => {
          const updated = {
            ...prev,
            blindsType: customEvent.detail.type,
            message: customEvent.detail.message,
          };
          // Persist the changes
          sessionStorage.setItem("session_form_blindsType", customEvent.detail.type);
          sessionStorage.setItem("session_form_message", customEvent.detail.message);
          return updated;
        });
      }
    };

    window.addEventListener("claimOffer", handleClaim);
    return () => window.removeEventListener("claimOffer", handleClaim);
  }, []);

  // Update State and SessionStorage
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    sessionStorage.setItem(`session_form_${id}`, value);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setFallbackNote(false);

    // Frontend validation
    const { name, phone, email, postcode, address, blindsType, preferredColor, callTime, hearAboutUs } = formData;
    if (!name || !phone || !email || !postcode || !address || !blindsType || !callTime || !hearAboutUs) {
      setErrorMsg("Please fill out all required fields.");
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "booking",
          name,
          email,
          phone,
          address,
          postcode,
          service: blindsType,
          preferredColor,
          appointmentTime: callTime,
          hearAboutUs,
          message: formData.message,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to send notification email.");
      }

      // Success
      setIsSubmitted(true);
      
      // Clear sessionStorage
      const fields = ["name", "phone", "email", "postcode", "address", "blindsType", "preferredColor", "callTime", "hearAboutUs", "message"];
      fields.forEach((field) => sessionStorage.removeItem(`session_form_${field}`));
    } catch (err) {
      console.error(err);
      setIsSubmitted(true); // Still transition to success status but flag the note
      setFallbackNote(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="booking" className="py-24 bg-bg-light border-b border-border-light relative">
      <div className="max-w-4xl mx-auto px-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[12px] font-btn font-bold tracking-widest text-brand-primary uppercase">
            Schedule a Visit
          </span>
          <h2 className="font-headline text-4xl sm:text-5xl text-text-dark mt-2 tracking-tight">
            Book a Home Consultation
          </h2>
          <p className="font-sans text-text-muted mt-4 text-base sm:text-lg leading-relaxed">
            Our expert designer will visit your space, showcase full fabric swatch books, measure up, and give a free, no-obligation quote.
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white border border-border-light rounded-[24px] p-8 md:p-12 shadow-sm relative">
          <AnimatePresence mode="wait">
            {!isSubmitted ? (
              <motion.form
                key="booking-form"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
                onSubmit={handleSubmit}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left"
              >
                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="name" className="font-nav text-[13px] font-semibold text-text-dark">
                    Your Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. John Smith"
                      className="w-full pl-10 pr-4 py-3 border border-border-light rounded-[10px] text-sm focus:outline-none focus:border-brand-primary/30"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="phone" className="font-nav text-[13px] font-semibold text-text-dark">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="tel"
                      id="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="e.g. 07341 645339"
                      className="w-full pl-10 pr-4 py-3 border border-border-light rounded-[10px] text-sm focus:outline-none focus:border-brand-primary/30"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="font-nav text-[13px] font-semibold text-text-dark">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="e.g. john@example.com"
                      className="w-full pl-10 pr-4 py-3 border border-border-light rounded-[10px] text-sm focus:outline-none focus:border-brand-primary/30"
                    />
                  </div>
                </div>

                {/* Postcode */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="postcode" className="font-nav text-[13px] font-semibold text-text-dark">
                    Postcode *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="text"
                      id="postcode"
                      required
                      value={formData.postcode}
                      onChange={handleChange}
                      placeholder="e.g. PE3 8DJ"
                      className="w-full pl-10 pr-4 py-3 border border-border-light rounded-[10px] text-sm focus:outline-none focus:border-brand-primary/30"
                    />
                  </div>
                </div>

                {/* Full Address */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label htmlFor="address" className="font-nav text-[13px] font-semibold text-text-dark">
                    Full Address *
                  </label>
                  <input
                    type="text"
                    id="address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="e.g. 12 Park Road, Peterborough"
                    className="w-full px-4 py-3 border border-border-light rounded-[10px] text-sm focus:outline-none focus:border-brand-primary/30"
                  />
                </div>

                {/* Blinds Type */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="blindsType" className="font-nav text-[13px] font-semibold text-text-dark">
                    Blinds / Shutters Type *
                  </label>
                  <div className="relative">
                    <select
                      id="blindsType"
                      required
                      value={formData.blindsType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-border-light rounded-[10px] text-sm focus:outline-none focus:border-brand-primary/30 appearance-none bg-white cursor-pointer text-text-dark"
                    >
                      <option value="">Select an option</option>
                      <option value="roller">Roller Blinds</option>
                      <option value="vertical">Vertical Blinds</option>
                      <option value="venetian">Venetian Blinds</option>
                      <option value="perfect-fit">Perfect Fit Blinds</option>
                      <option value="vision">Vision Blinds</option>
                      <option value="pleated">Pleated Blinds</option>
                      <option value="roman">Roman Blinds</option>
                      <option value="wooden">Wooden Blinds</option>
                      <option value="window-shutters">Window Shutters</option>
                      <option value="blackout">Blackout Blinds</option>
                      <option value="conservatory">Conservatory Blinds</option>
                      <option value="skylight">Skylight Blinds</option>
                      <option value="commercial">Commercial Blinds</option>
                      <option value="not-sure">Not Sure Yet</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                  </div>
                </div>

                {/* Preferred Color */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="preferredColor" className="font-nav text-[13px] font-semibold text-text-dark">
                    Preferred Color / Tone
                  </label>
                  <div className="relative">
                    <select
                      id="preferredColor"
                      value={formData.preferredColor}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-border-light rounded-[10px] text-sm focus:outline-none focus:border-brand-primary/30 appearance-none bg-white cursor-pointer text-text-dark"
                    >
                      <option value="">Any / Show Swatches</option>
                      <option value="white">White / Cream / Ivory</option>
                      <option value="grey">Grey / Anthracite / Charcoal</option>
                      <option value="black">Black / Dark Slate</option>
                      <option value="wood">Natural Wood / Grain Stain</option>
                      <option value="bright">Bright Colors (Red, Blue, etc.)</option>
                      <option value="pattern">Patterned / Textured Fabric</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                  </div>
                </div>

                {/* Preferred Appointment Time */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="callTime" className="font-nav text-[13px] font-semibold text-text-dark">
                    Preferred Time Slot *
                  </label>
                  <div className="relative">
                    <select
                      id="callTime"
                      required
                      value={formData.callTime}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-border-light rounded-[10px] text-sm focus:outline-none focus:border-brand-primary/30 appearance-none bg-white cursor-pointer text-text-dark"
                    >
                      <option value="">Select preferred time</option>
                      <option value="morning">Morning (9 AM - 12 PM)</option>
                      <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
                      <option value="evening">Evening (4 PM - 7 PM)</option>
                      <option value="weekend">Weekend slot (Saturday)</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                  </div>
                </div>

                {/* How Did You Hear About Us */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="hearAboutUs" className="font-nav text-[13px] font-semibold text-text-dark">
                    How Did You Hear About Us? *
                  </label>
                  <div className="relative">
                    <select
                      id="hearAboutUs"
                      required
                      value={formData.hearAboutUs}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-border-light rounded-[10px] text-sm focus:outline-none focus:border-brand-primary/30 appearance-none bg-white cursor-pointer text-text-dark"
                    >
                      <option value="">Select an option</option>
                      <option value="google">Google Search</option>
                      <option value="social">Facebook / Instagram</option>
                      <option value="recommendation">Friend / Family Recommendation</option>
                      <option value="ad">Flyer / Local Newspaper Ad</option>
                      <option value="other">Other</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                  </div>
                </div>

                {/* Optional Message */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label htmlFor="message" className="font-nav text-[13px] font-semibold text-text-dark">
                    Any Additional Info / Special Notes
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="e.g. Dimensions if known, access notes, etc."
                    className="w-full px-4 py-3 border border-border-light rounded-[10px] text-sm focus:outline-none focus:border-brand-primary/30 resize-none"
                  />
                </div>

                {/* Error Banner */}
                {errorMsg && (
                  <div className="md:col-span-2 p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold rounded-[8px]">
                    {errorMsg}
                  </div>
                )}

                {/* Submit button */}
                <div className="md:col-span-2 mt-4">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-brand-primary text-white font-nav font-bold text-center rounded-[12px] hover:bg-[#B91C1C] transition-colors shadow-sm disabled:bg-gray-400 cursor-pointer"
                  >
                    {loading ? "Sending Request..." : "Book Free Home Consultation"}
                  </motion.button>
                </div>
              </motion.form>
            ) : (
              <motion.div
                key="booking-success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12 flex flex-col items-center gap-4"
              >
                <div className="w-16 h-16 rounded-full bg-green-100 border border-green-200 text-green-600 flex items-center justify-center mb-2">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="font-headline text-3xl text-text-dark">
                  Thank You!
                </h3>
                <p className="font-sans text-text-muted text-base max-w-lg leading-relaxed">
                  Your consultation request has been successfully received. Our design advisor will contact you shortly to coordinate and finalize your date slot.
                </p>

                {fallbackNote && (
                  <p className="text-[12px] text-brand-primary/90 mt-4 leading-relaxed font-semibold max-w-md">
                    Note: If you do not hear from our team within 24 hours, please call us directly on 07341 645339 to make sure we received your request.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}
