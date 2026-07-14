"use client";

import { motion } from "framer-motion";

interface RangeItem {
  title: string;
  desc: string;
  img: string;
  link: string;
}

const ranges: RangeItem[] = [
  {
    title: "Roller Blinds",
    desc: "Sleek and space-saving blinds with a vast choice of plain, textured, or water-resistant fabrics.",
    img: "/images/products/portrait-roller-aztec-driftwood.jpg.webp",
    link: "old-static-html/roller-blinds/index.html",
  },
  {
    title: "Vertical Blinds",
    desc: "Superb light control for larger windows and patio doors. Available in fabrics, patterns, and wipeable PVC.",
    img: "https://blindsworldltd.com/wp-content/uploads/2022/04/vertical-blinds-hero.jpg.webp",
    link: "old-static-html/vertical-blinds/index.html",
  },
  {
    title: "Venetian Blinds",
    desc: "Classic, versatile, and adjustable horizontal slats in light-controlling aluminum or wood-effect finishes.",
    img: "https://blindsworldltd.com/wp-content/uploads/2022/03/venetian-blinds-image-1024x1024.jpg.webp",
    link: "old-static-html/venetian-blinds/index.html",
  },
  {
    title: "Perfect Fit Blinds",
    desc: "Clips directly onto uPVC window frames without drilling. Seamless integration for doors and conservatory glazing.",
    img: "/images/products/perfect-fit-roller-blinds-image.jpg.webp",
    link: "old-static-html/perfect-fit-blinds/index.html",
  },
  {
    title: "Vision Blinds",
    desc: "Day & night double-layer fabrics filter soft light or create complete privacy with sliding horizontal stripes.",
    img: "https://blindsworldltd.com/wp-content/uploads/2022/04/vision-day-night-blinds-main.jpg.webp",
    link: "old-static-html/vision-blinds/index.html",
  },
  {
    title: "Pleated Blinds",
    desc: "Neat, accordion-folding shades that block glare and reduce heat. Ideal for modern concertina doors.",
    img: "/images/products/pleated-blinds-image.jpg.webp",
    link: "old-static-html/pleated-blinds/index.html",
  },
  {
    title: "Roman Blinds",
    desc: "Elegant cascade-folds in premium interior drapery fabrics. Fully lined for warmth and blackout control.",
    img: "/images/products/roman-blinds-image.jpg.webp",
    link: "old-static-html/roman-blinds/index.html",
  },
  {
    title: "Wooden Blinds",
    desc: "Warm, natural wood-grain horizontal slats with coordinating ladder cords or premium tape borders.",
    img: "https://blindsworldltd.com/wp-content/uploads/2022/03/wooden-blinds-image-1024x1024.jpg.webp",
    link: "old-static-html/wooden-blinds/index.html",
  },
  {
    title: "Window Shutters",
    desc: "Luxury wooden interior plantation shutters. Elegant privacy controls and lifetime home enhancements.",
    img: "https://blindsworldltd.com/wp-content/uploads/2022/03/shutters-image-1024x1024.jpg.webp",
    link: "old-static-html/window-shutters/index.html",
  },
  {
    title: "Blackout Blinds",
    desc: "Specialized opaque light-blocking fabrics. Indispensable for bedrooms, home theaters, and nurseries.",
    img: "/images/products/blackout-blinds-image.jpg.webp",
    link: "old-static-html/blackout-blinds/index.html",
  },
  {
    title: "Conservatory Blinds",
    desc: "Specially tailored thermal fabrics for sunroom glass walls and roofs, maximizing seasonal utility.",
    img: "https://blindsworldltd.com/wp-content/uploads/2022/05/conservatory-offer.jpg.webp",
    link: "old-static-html/conservatory-blinds/index.html",
  },
  {
    title: "Skylight Blinds",
    desc: "Precision-fitting frames for Velux, Keylite, and Fakro roof windows. Easy manual or remote controls.",
    img: "/images/products/skylight-blinds-image.jpg.webp",
    link: "old-static-html/skylight-blinds/index.html",
  },
];

export default function ProductRange() {
  return (
    <section id="blinds" className="py-24 bg-white border-b border-border-light">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[12px] font-btn font-bold tracking-widest text-brand-primary uppercase">
            Bespoke Collection
          </span>
          <h2 className="font-headline text-4xl sm:text-5xl text-text-dark mt-2 tracking-tight">
            Our Window Blinds Range
          </h2>
          <p className="font-sans text-text-muted mt-4 text-base sm:text-lg leading-relaxed">
            From classic woods to motorized rollers, explore our extensive, high-quality, made-to-measure range.
          </p>
        </div>

        {/* Range Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {ranges.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: (index % 4) * 0.08 }}
              className="group bg-white border border-border-light rounded-[16px] overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md hover:border-brand-primary/30 transition-all duration-300"
            >
              {/* Product Image */}
              <div className="relative h-[200px] w-full bg-gray-100 overflow-hidden">
                <img
                  src={item.img}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Product Content */}
              <div className="p-6 flex flex-col justify-between flex-grow gap-4 text-left">
                <div>
                  <h3 className="font-nav text-lg font-bold text-text-dark group-hover:text-brand-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="font-sans text-[13px] text-text-muted mt-2 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                {/* Learn More Link */}
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-nav text-[13px] font-semibold text-brand-primary flex items-center gap-1 hover:underline mt-2 self-start"
                >
                  Explore Features &rarr;
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
