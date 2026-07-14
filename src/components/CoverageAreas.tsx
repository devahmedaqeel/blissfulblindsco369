"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Search, CheckCircle } from "lucide-react";

interface Region {
  title: string;
  prefixes: string[];
  cities: string[];
  coordinates: string;
}

const regions: Record<string, Region> = {
  peterborough: {
    title: "Peterborough Service Area",
    prefixes: ["PE"],
    cities: [
      "Peterborough City Centre",
      "Stamford",
      "Spalding",
      "Wisbech",
      "March",
      "Whittlesey",
      "Market Deeping",
      "Oundle",
      "Yaxley",
      "Crowland",
    ],
    coordinates: "52.5695° N, 0.2405° W",
  },
  leicester: {
    title: "Leicester Service Area",
    prefixes: ["LE"],
    cities: [
      "Leicester City Centre",
      "Loughborough",
      "Hinckley",
      "Wigston",
      "Coalville",
      "Melton Mowbray",
      "Market Harborough",
      "Oadby",
      "Lutterworth",
      "Ashby-de-la-Zouch",
    ],
    coordinates: "52.6369° N, 1.1398° W",
  },
  luton: {
    title: "Luton Service Area",
    prefixes: ["LU", "MK", "SG"],
    cities: [
      "Luton Town Centre",
      "Dunstable",
      "Bedford",
      "Leighton Buzzard",
      "Houghton Regis",
      "Ampthill",
      "Flitwick",
      "Sandy",
      "Biggleswade",
      "Kempston",
    ],
    coordinates: "51.8787° N, 0.4143° W",
  },
};

export default function CoverageAreas() {
  const [activeTab, setActiveTab] = useState<string>("peterborough");
  const [postcode, setPostcode] = useState("");
  const [result, setResult] = useState<{ status: "success" | "error"; text: string } | null>(null);

  const checkPostcode = () => {
    const input = postcode.trim().toUpperCase();
    if (!input) {
      setResult({
        status: "error",
        text: "Please enter a postcode or postcode prefix (e.g. PE3, LE5, LU2).",
      });
      return;
    }

    const match = input.match(/^([A-Z]{1,2})/);
    if (!match) {
      setResult({
        status: "error",
        text: "Invalid postcode format. Please enter letters only (e.g. PE3).",
      });
      return;
    }

    const areaPrefix = match[1];
    let foundRegionKey: string | null = null;

    for (const [key, reg] of Object.entries(regions)) {
      if (reg.prefixes.includes(areaPrefix)) {
        foundRegionKey = key;
        break;
      }
    }

    if (foundRegionKey) {
      const matchedRegion = regions[foundRegionKey];
      setResult({
        status: "success",
        text: `✅ Great news! We cover ${input} — ${matchedRegion.title}.`,
      });
      setActiveTab(foundRegionKey);
    } else {
      setResult({
        status: "error",
        text: `❌ Sorry, ${input} is outside our current service areas. Please call us to confirm.`,
      });
    }
  };

  return (
    <section id="areas" className="py-24 bg-white border-b border-border-light">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[12px] font-btn font-bold tracking-widest text-brand-primary uppercase">
            UK Coverage
          </span>
          <h2 className="font-headline text-4xl sm:text-5xl text-text-dark mt-2 tracking-tight">
            Our Coverage Areas
          </h2>
          <p className="font-sans text-text-muted mt-4 text-base sm:text-lg leading-relaxed">
            We offer free home visits, professional measurements, and expert fittings across our service regions. Choose a region below to check coverage.
          </p>
        </div>

        {/* Coverage Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Panel: Controls & Postcode Checker */}
          <div className="lg:col-span-5 bg-bg-light border border-border-light p-8 rounded-[24px] flex flex-col justify-between shadow-sm">
            <div>
              {/* Region Tabs */}
              <div className="flex flex-col gap-2">
                {Object.entries(regions).map(([key, reg]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveTab(key);
                      setResult(null);
                    }}
                    className={`w-full py-4 px-5 rounded-[12px] border font-nav text-sm font-semibold flex items-center gap-3 transition-all duration-300 cursor-pointer ${
                      activeTab === key
                        ? "bg-white border-brand-primary/30 text-brand-primary shadow-sm"
                        : "bg-transparent border-transparent text-text-muted hover:bg-white/50"
                    }`}
                  >
                    <MapPin className={`w-4 h-4 ${activeTab === key ? "text-brand-primary" : "text-text-muted"}`} />
                    {reg.title.replace(" Service Area", "")} Area
                  </button>
                ))}
              </div>

              {/* Postcode Checker Box */}
              <div className="border border-border-light bg-white p-6 rounded-[16px] mt-8 flex flex-col gap-4">
                <h3 className="font-nav text-[14px] font-bold text-text-dark flex items-center gap-2">
                  <Search className="w-4 h-4 text-brand-primary" />
                  Check Your Postcode
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && checkPostcode()}
                    placeholder="e.g. PE3, LE5, LU2"
                    className="flex-grow px-4 py-3 border border-border-light rounded-[10px] font-sans text-sm focus:outline-none focus:border-brand-primary/30"
                  />
                  <button
                    onClick={checkPostcode}
                    className="px-5 py-3 bg-brand-primary text-white font-nav font-semibold text-sm rounded-[10px] hover:bg-[#B91C1C] transition-colors cursor-pointer"
                  >
                    Check
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {result && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className={`text-xs font-semibold p-3 rounded-[8px] leading-relaxed ${
                        result.status === "success"
                          ? "bg-green-50 text-green-700 border border-green-100"
                          : "bg-red-50 text-red-700 border border-red-100"
                      }`}
                    >
                      {result.text}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <a
              href="#booking"
              className="mt-8 py-3.5 bg-brand-primary text-white font-nav font-semibold text-center text-sm rounded-[12px] hover:bg-[#B91C1C] transition-colors shadow-sm block w-full"
            >
              Book Free Home Visit
            </a>
          </div>

          {/* Right Panel: Towns Capsule Grid & Map Graphics */}
          <div className="lg:col-span-7 bg-bg-light border border-border-light p-8 rounded-[24px] flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div>
              <span className="font-btn text-[10px] font-bold text-brand-primary uppercase tracking-widest">
                Active Region Map
              </span>
              <h3 className="font-headline text-3xl text-text-dark mt-2 tracking-tight">
                {regions[activeTab].title}
              </h3>
              <span className="font-mono text-xs text-text-muted mt-1 block">
                HQ Location: {regions[activeTab].coordinates}
              </span>

              {/* Towns Tags */}
              <div className="flex flex-wrap gap-2.5 mt-8">
                {regions[activeTab].cities.map((city, index) => (
                  <div
                    key={index}
                    className="bg-white border border-border-light px-4 py-2 rounded-full flex items-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-brand-primary" />
                    <span className="font-sans text-[13px] font-medium text-text-dark/95">
                      {city}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Styled Map Graphic element */}
            <div className="relative w-full h-[180px] bg-white border border-border-light rounded-[16px] mt-8 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-radial-gradient from-brand-accent/30 via-transparent to-transparent opacity-60" />
              
              {/* Decorative coordinates grid */}
              <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
              
              {/* Central Map Pin */}
              <div className="relative flex flex-col items-center">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center border border-brand-primary/40 relative z-10"
                >
                  <MapPin className="w-5 h-5 text-brand-primary" />
                </motion.div>
                {/* Glowing Radar Rings */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full border border-brand-primary/30 animate-ping opacity-75" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-brand-primary/10 animate-pulse" />
                
                <span className="font-btn text-[10px] font-bold text-text-dark uppercase tracking-widest mt-2 z-10">
                  {activeTab.toUpperCase()} CENTRAL HUB
                </span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
