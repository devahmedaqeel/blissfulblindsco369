"use client";

import { motion } from "framer-motion";
import { MessageSquare, MapPin, Palette, Calculator, Settings, CheckCircle2 } from "lucide-react";

const steps = [
  {
    title: "Get in Touch",
    desc: "Simply call us or submit our online form. We will coordinate and schedule an in-home consultation at a date and time that fits around your schedule.",
    icon: MessageSquare,
  },
  {
    title: "We Come to You",
    desc: "We bring the showroom directly to your home. Our expert advisor will take exact, professional measurements of your windows, eliminating any worry of making mistakes.",
    icon: MapPin,
  },
  {
    title: "Choose Your Blinds",
    desc: "Browse through our catalogue featuring hundreds of styles, colors, textures, and fabrics. We will help you select options that suit your specific requirements and budget.",
    icon: Palette,
  },
  {
    title: "No-Obligation Quote",
    desc: "Receive a competitive quotation based on your measurements and fabric choices. The quote is valid for 7 days, giving you complete freedom to make your decision.",
    icon: Calculator,
  },
  {
    title: "Order Your Blinds",
    desc: "Once you confirm the quote, we place your blinds into manufacturing immediately. We use state-of-the-art techniques and aim to have your custom blinds ready in 7-14 days.",
    icon: Settings,
  },
  {
    title: "We Fit Your Blinds",
    desc: "Once manufactured, we'll schedule a fitting appointment. Our qualified professional fitter installs the blinds, conducts a quality safety check, and cleans up completely.",
    icon: CheckCircle2,
  },
];

export default function HowItWorks() {
  return (
    <section id="services" className="py-24 bg-bg-light border-b border-border-light">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="text-[12px] font-btn font-bold tracking-widest text-brand-primary uppercase">
            Simple Process
          </span>
          <h2 className="font-headline text-4xl sm:text-5xl text-text-dark mt-2 tracking-tight">
            How It Works
          </h2>
          <p className="font-sans text-text-muted mt-4 text-base sm:text-lg leading-relaxed">
            Six simple steps to perfect-fitting custom blinds for your home or workplace.
          </p>
        </div>

        {/* Timeline Layout */}
        <div className="relative max-w-4xl mx-auto flex flex-col items-center">
          {/* Vertical Connecting Line */}
          <div className="absolute left-[30px] md:left-1/2 top-4 bottom-8 w-[2px] bg-gray-200 -translate-x-1/2 z-0" />

          {steps.map((step, index) => {
            const Icon = step.icon;
            const isEven = index % 2 === 0;

            return (
              <div
                key={index}
                className={`relative w-full flex flex-col md:flex-row items-start md:items-center justify-between mb-16 last:mb-0 z-10`}
              >
                {/* Left side spacer / Card (desktop only) */}
                <div className={`hidden md:block w-[45%] ${isEven ? "text-right" : "order-last text-left"}`}>
                  {isEven && (
                    <motion.div
                      initial={{ opacity: 0, x: -30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6 }}
                      className="bg-white border border-border-light rounded-[16px] p-6 shadow-sm flex flex-col gap-3 text-left inline-block"
                    >
                      <h3 className="font-nav text-lg font-bold text-text-dark flex items-center gap-2">
                        <Icon className="w-5 h-5 text-brand-primary" />
                        {step.title}
                      </h3>
                      <p className="font-sans text-[14px] text-text-muted leading-relaxed">
                        {step.desc}
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Number Circle (Center Point) */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="w-[60px] h-[60px] rounded-full bg-brand-primary text-white flex items-center justify-center font-nav font-bold text-xl shadow-md border-4 border-white z-20 shrink-0 absolute left-0 md:left-1/2 -translate-x-[15px] md:-translate-x-1/2"
                >
                  {index + 1}
                </motion.div>

                {/* Right side spacer / Card (and all layouts on mobile) */}
                <div className={`w-full md:w-[45%] pl-[80px] md:pl-0 ${!isEven ? "text-left" : "md:invisible"}`}>
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="bg-white border border-border-light rounded-[16px] p-6 shadow-sm flex flex-col gap-3 text-left"
                  >
                    <h3 className="font-nav text-lg font-bold text-text-dark flex items-center gap-2">
                      <Icon className="w-5 h-5 text-brand-primary" />
                      {step.title}
                    </h3>
                    <p className="font-sans text-[14px] text-text-muted leading-relaxed">
                      {step.desc}
                    </p>
                  </motion.div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Timeline Bottom CTA */}
        <div className="text-center mt-16">
          <motion.a
            href="#booking"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block px-8 py-4 bg-brand-primary text-white font-nav font-semibold text-[15px] rounded-[12px] shadow-md hover:bg-[#B91C1C] transition-colors duration-300"
          >
            Book Consultation Now
          </motion.a>
        </div>
      </div>
    </section>
  );
}
