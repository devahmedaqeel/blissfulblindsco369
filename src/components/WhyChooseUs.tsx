"use client";

import { motion } from "framer-motion";
import { Award, Handshake, Tag, Wrench } from "lucide-react";

const cards = [
  {
    title: "Our Quality",
    desc: "Whether your style is classic or contemporary, we have something to match! We partner with industry-leading suppliers to bring you durable, premium materials and fabrics manufactured to a high standard.",
    icon: Award,
    image: "/images/why-us/quality.png"
  },
  {
    title: "Our Approach",
    desc: "Every customer is different. Our advisors take the time to understand your needs and suggest the best solution for your space, with honest advice and absolutely no pressure or pushy sales tactics.",
    icon: Handshake,
    image: "/images/why-us/approach.png"
  },
  {
    title: "Our Price",
    desc: "Our price promise means you'll always get the best deal. If you find the same blinds (size, spec, and fitting service included) at a lower price, we promise to match and try to beat it.",
    icon: Tag,
    image: "/images/why-us/price.png"
  },
  {
    title: "Our Care",
    desc: "We take the hassle out of DIY. Our experts measure your windows and install your new blinds with precision. Plus, all our blinds are backed by a comprehensive one-year product guarantee.",
    icon: Wrench,
    image: "/images/why-us/care.png"
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
} as const;

export default function WhyChooseUs() {
  return (
    <section id="about" className="py-24 bg-bg-light border-b border-border-light">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-[12px] font-btn font-bold tracking-widest text-brand-primary uppercase"
          >
            Unmatched Service
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.1 }}
            className="font-headline text-4xl sm:text-5xl text-text-dark mt-2 tracking-tight"
          >
            Why Choose Us?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.2 }}
            className="font-sans text-text-muted mt-4 text-base sm:text-lg leading-relaxed"
          >
            We make it simple, easy, and stress-free to get premium bespoke blinds tailored exactly for your home.
          </motion.p>
        </div>

        {/* Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={index}
                variants={cardVariants}
                whileHover={{ y: -6 }}
                className="group bg-white border border-border-light rounded-[20px] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col text-left"
              >
                <div className="w-full h-[160px] overflow-hidden relative border-b border-border-light">
                  <img 
                    src={card.image} 
                    alt={card.title} 
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-106"
                  />
                </div>
                <div className="p-6 flex flex-col gap-3 flex-grow">
                  <div className="w-10 h-10 rounded-[10px] bg-brand-accent flex items-center justify-center">
                    <Icon className="w-5 h-5 text-brand-primary" />
                  </div>
                  <h3 className="font-nav text-lg font-bold text-text-dark">
                    {card.title}
                  </h3>
                  <p className="font-sans text-[14px] text-text-muted leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
