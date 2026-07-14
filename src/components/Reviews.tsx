"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

interface Review {
  author: string;
  text: string;
  rating: number;
}

const reviews: Review[] = [
  {
    author: "Charlotte C.",
    text: "Extremely pleased with our new vertical blinds. The advisor brought lots of fabric samples, measured carefully, and they were fitted in less than two weeks. Exceptional quality and very tidy fitting service.",
    rating: 5,
  },
  {
    author: "Claire Germain",
    text: "Fantastic prices and excellent customer care. We had quotes from other companies but Blissful Blinds beat them easily. The wooden venetians look amazing. Will definitely use them again!",
    rating: 5,
  },
  {
    author: "Irene McLaughlin",
    text: "Had our perfect fit blinds installed in the conservatory yesterday. They clip directly to the glass frame and work brilliantly. Professional and child-safe. Highly recommended.",
    rating: 5,
  },
  {
    author: "Sue Sharp",
    text: "Great service from start to finish. The booking was quick, measurement was prompt, and the installer took down my old blinds and fitted the new roller blinds beautifully. Very neat job.",
    rating: 5,
  },
];

export default function Reviews() {
  const [index, setIndex] = useState(0);

  const handlePrev = () => {
    setIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % reviews.length);
  };

  return (
    <section id="reviews" className="py-24 bg-white border-b border-border-light relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-6 text-center">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto mb-16">
          <span className="text-[12px] font-btn font-bold tracking-widest text-brand-primary uppercase">
            Testimonials
          </span>
          <h2 className="font-headline text-4xl sm:text-5xl text-text-dark mt-2 tracking-tight">
            Trusted by Our Customers
          </h2>
          <p className="font-sans text-text-muted mt-4 text-base sm:text-lg leading-relaxed">
            Read feedback from our happy clients who experienced our professional measuring, advice, and installation service.
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative min-h-[300px] flex items-center justify-center">
          {/* Navigation Prev Button */}
          <button
            onClick={handlePrev}
            className="absolute left-0 lg:-left-16 text-text-dark/60 hover:text-brand-primary bg-bg-light hover:bg-brand-accent/50 p-3 rounded-full border border-border-light shadow-sm transition-all focus:outline-none z-20 cursor-pointer"
            aria-label="Previous Review"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Review Card Slider */}
          <div className="w-full max-w-2xl overflow-hidden relative py-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="bg-bg-light border border-border-light rounded-[24px] p-8 md:p-12 shadow-sm flex flex-col items-center gap-6"
              >
                {/* Big Quote Indicator */}
                <span className="font-headline text-6xl text-brand-primary/20 leading-none h-6 block -mt-4">
                  “
                </span>

                {/* Review Text */}
                <p className="font-sans text-base md:text-lg text-text-dark/90 leading-relaxed italic">
                  {reviews[index].text}
                </p>

                {/* Rating Badge */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[...Array(reviews[index].rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="font-btn text-[11px] font-bold text-text-muted uppercase tracking-wider">
                    {reviews[index].rating.toFixed(1)} Rating
                  </span>
                </div>

                {/* Author */}
                <h3 className="font-nav text-md font-bold text-text-dark">
                  {reviews[index].author}
                </h3>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Next Button */}
          <button
            onClick={handleNext}
            className="absolute right-0 lg:-right-16 text-text-dark/60 hover:text-brand-primary bg-bg-light hover:bg-brand-accent/50 p-3 rounded-full border border-border-light shadow-sm transition-all focus:outline-none z-20 cursor-pointer"
            aria-label="Next Review"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Carousel Dots */}
        <div className="flex items-center justify-center gap-2.5 mt-8">
          {reviews.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 focus:outline-none cursor-pointer ${
                index === i ? "bg-brand-primary w-6" : "bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Go to review ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
