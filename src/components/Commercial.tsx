"use client";

import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

const listItems = [
  "Over 50 premium fire-retardant (FR) fabrics in our specialized commercial collection.",
  "Heavy-duty Vertical, Roller, Venetian, and Pleated blinds designed for high-traffic use.",
  "Full safety compliance: child-safe mechanisms and comprehensive Risk Assessments provided.",
  "Commercial client loyalty discounts on repeat installations and property developments.",
];

export default function Commercial() {
  return (
    <section id="commercial" className="py-24 bg-bg-light border-b border-border-light">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Content Column */}
          <div>
            <span className="text-[12px] font-btn font-bold tracking-widest text-brand-primary uppercase">
              B2B Services
            </span>
            <h2 className="font-headline text-4xl sm:text-5xl text-text-dark mt-2 tracking-tight">
              Commercial Blinds & Shutters
            </h2>
            <p className="font-sans text-text-muted mt-4 text-base sm:text-lg leading-relaxed">
              From boardrooms and large offices to rental properties and residential landlords, Blissful Blinds delivers commercial-grade, heavy-duty window solutions tailored to your requirements.
            </p>

            {/* Checklist */}
            <ul className="flex flex-col gap-3 mt-8">
              {listItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-text-dark/95">
                  <CheckCircle className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                  <span className="font-sans text-[14px] font-medium leading-relaxed">
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            {/* Sub-cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-10">
              <div className="bg-white border border-border-light p-6 rounded-[16px] shadow-sm">
                <h3 className="font-nav text-md font-bold text-text-dark">
                  Commercial Offices
                </h3>
                <p className="font-sans text-[13px] text-text-muted mt-2 leading-relaxed">
                  Ensure comfortable working environments, minimize glare, and control climate. Rapid, non-disruptive installation.
                </p>
              </div>

              <div className="bg-white border border-border-light p-6 rounded-[16px] shadow-sm">
                <h3 className="font-nav text-md font-bold text-text-dark">
                  Blinds for Landlords
                </h3>
                <p className="font-sans text-[13px] text-text-muted mt-2 leading-relaxed">
                  Specialized, highly durable, and affordable blinds packages direct from the manufacturer — eliminating markups.
                </p>
              </div>
            </div>

            <motion.a
              href="#booking"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-block mt-8 px-6 py-3.5 bg-brand-primary text-white font-nav font-semibold text-[14px] rounded-[10px] shadow-sm hover:bg-[#B91C1C] transition-colors"
            >
              Request Commercial Quote
            </motion.a>
          </div>

          {/* Visual Cards Column */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative aspect-[3/4] rounded-[24px] overflow-hidden bg-gray-200 border border-border-light shadow-sm"
            >
              <img
                src="https://blindsworldltd.com/wp-content/uploads/2022/03/commercial-images.jpg.webp"
                alt="Commercial Office Blinds"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                <span className="font-nav text-md font-bold text-white tracking-wide">
                  Corporate Offices
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative aspect-[3/4] rounded-[24px] overflow-hidden bg-gray-200 border border-border-light shadow-sm sm:mt-12"
            >
              <img
                src="https://blindsworldltd.com/wp-content/uploads/2022/03/landlord-images.jpg"
                alt="Blinds for Landlords"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                <span className="font-nav text-md font-bold text-white tracking-wide">
                  Landlord Packages
                </span>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
