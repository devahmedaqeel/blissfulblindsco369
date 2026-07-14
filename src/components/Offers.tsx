"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface Offer {
  title: string;
  badge: string;
  price: string;
  period: string;
  img: string;
  desc: string;
  features: string[];
  typeCode: string;
  messageCode: string;
}

const offers: Offer[] = [
  {
    title: "3 Vertical Blinds Package",
    badge: "Popular Package",
    price: "£85",
    period: "/ 3 Windows",
    img: "https://blindsworldltd.com/wp-content/uploads/2022/04/vertical-blinds-hero.jpg.webp",
    desc: "Upgrade your home glazing with three custom fitted, high-quality vertical blinds. Available in a vast choice of neutral colours and patterns.",
    features: ["Free Precision Measurement", "Professional Fitting Included", "1-Year Guarantee"],
    typeCode: "vertical",
    messageCode: "Interested in: 3 Vertical Blinds Package for £85",
  },
  {
    title: "3 Roller Blinds Package",
    badge: "Great Savings",
    price: "£115",
    period: "/ 3 Windows",
    img: "https://blindsworldltd.com/wp-content/uploads/2022/03/roller-blinds-image-1024x1024.jpg.webp",
    desc: "Get a clean, modern aesthetic with three space-efficient custom roller blinds. Choose from plain, textured, or splash-proof fabrics.",
    features: ["Free Measurement & Fitting", "High-Quality Fabrics", "Child-Safe Operations"],
    typeCode: "roller",
    messageCode: "Interested in: 3 Roller Blinds Package for £115",
  },
  {
    title: "Full House Blinds Bundle",
    badge: "Best Value",
    price: "£195",
    period: "/ Up to 6 Windows",
    img: "https://blindsworldltd.com/wp-content/uploads/2022/05/full-house-offer.jpg.webp",
    desc: "Dress your entire property for less! Cover up to six windows with vertical or roller blinds. Ideal for new build buyers and landlords.",
    features: ["Covers Up to 6 Windows", "Vertical & Roller Formats", "Free Measurement & Fitting"],
    typeCode: "roller",
    messageCode: "Interested in: Full House Blinds Bundle for £195",
  },
  {
    title: "Conservatory Blinds Package",
    badge: "Conservatory Deal",
    price: "£195",
    period: "/ Complete Fitting",
    img: "https://blindsworldltd.com/wp-content/uploads/2022/05/conservatory-offer.jpg.webp",
    desc: "Add thermal comfort and privacy to your sunroom with high-performance conservatory shades, available in pleated or vertical fabrics.",
    features: ["High Thermal Performance", "Protects Furniture from UV", "Precision Gasket Clips"],
    typeCode: "perfect-fit",
    messageCode: "Interested in: Conservatory Blinds Package for £195",
  },
  {
    title: "Selected Window Blinds",
    badge: "25% Off",
    price: "25% OFF",
    period: "/ Selected Types",
    img: "https://blindsworldltd.com/wp-content/uploads/2022/05/25-percent-offer-feat-img.jpg.webp",
    desc: "Save a massive 25% on luxury styles including Venetian Blinds, Vision Day & Night Blinds, Roman Blinds, Skylights, and Shutters.",
    features: ["Includes Venetian & Vision Blinds", "Huge Fabric Selection", "Design consultation"],
    typeCode: "vision",
    messageCode: "Interested in: 25% Off Selected Window Blinds Offer",
  },
];

export default function Offers() {
  const handleClaim = (offer: Offer) => {
    // Custom event to communicate prefill with BookingForm component
    const event = new CustomEvent("claimOffer", {
      detail: { type: offer.typeCode, message: offer.messageCode },
    });
    window.dispatchEvent(event);
    
    // Scroll smoothly to booking
    const bookingSection = document.getElementById("booking");
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <section id="offers" className="py-24 bg-white border-b border-border-light">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[12px] font-btn font-bold tracking-widest text-brand-primary uppercase">
            Unbeatable Value
          </span>
          <h2 className="font-headline text-4xl sm:text-5xl text-text-dark mt-2 tracking-tight">
            Special Window Blinds Offers
          </h2>
          <p className="font-sans text-text-muted mt-4 text-base sm:text-lg leading-relaxed">
            Take advantage of our current bundle packages and massive direct-from-manufacturer discounts. All offers include free professional measuring, supply, precision fitting, and a 1-year product warranty.
          </p>
        </div>

        {/* Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {offers.map((offer, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: index * 0.1 }}
              className="bg-bg-light border border-border-light rounded-[16px] overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              {/* Image & Badge */}
              <div className="relative h-[220px] w-full bg-gray-200 overflow-hidden">
                <img
                  src={offer.img}
                  alt={offer.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-4 left-4 bg-brand-primary text-white text-[11px] font-btn font-bold px-3 py-1 rounded-[6px] shadow-sm uppercase tracking-wider">
                  {offer.badge}
                </span>
              </div>

              {/* Offer Details */}
              <div className="p-8 flex flex-col justify-between flex-grow gap-6">
                <div>
                  {/* Price */}
                  <div className="flex items-baseline gap-1 text-brand-primary font-bold text-3xl font-nav">
                    {offer.price}
                    <span className="text-text-muted font-normal text-[14px]">
                      {offer.period}
                    </span>
                  </div>

                  <h3 className="font-nav text-lg font-bold text-text-dark mt-2">
                    {offer.title}
                  </h3>
                  <p className="font-sans text-[14px] text-text-muted mt-3 leading-relaxed">
                    {offer.desc}
                  </p>

                  {/* Checklist Features */}
                  <ul className="flex flex-col gap-2 mt-4">
                    {offer.features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-2 text-text-dark/95">
                        <Check className="w-4 h-4 text-brand-primary shrink-0" />
                        <span className="font-sans text-[13px] font-medium">
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Claim CTA Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleClaim(offer)}
                  className="w-full py-3 bg-white border border-brand-primary/30 text-brand-primary font-nav font-semibold text-[14px] rounded-[10px] hover:bg-brand-primary hover:text-white hover:border-transparent transition-all duration-300 cursor-pointer"
                >
                  Claim This Offer
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
