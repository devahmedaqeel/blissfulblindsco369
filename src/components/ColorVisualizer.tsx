"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, Sparkles, Check, Home, Sliders, Shield, Sun, Eye } from "lucide-react";

interface ColorItem {
  id: string;
  name: string;
  hex: string;
  isLight: boolean;
  desc: string;
}

interface Collection {
  name: string;
  colors: ColorItem[];
}

const collections: Collection[] = [
  {
    name: "Classic Whites & Creams",
    colors: [
      { id: "white", name: "Alabaster White", hex: "#FAFAFA", isLight: true, desc: "A clean, bright white that reflects light beautifully, expanding small rooms." },
      { id: "cream", name: "Cream Butter", hex: "#F6EEDF", isLight: true, desc: "A warm, buttery cream shade that softens sunlight and creates a cozy ambiance." },
      { id: "beige", name: "Warm Beige", hex: "#E3DAC9", isLight: true, desc: "An organic beige that brings natural desert/linen tones to your living space." }
    ]
  },
  {
    name: "Modern Slate & Grey",
    colors: [
      { id: "grey", name: "Slate Grey", hex: "#7E8082", isLight: false, desc: "A neutral medium-grey that pairs perfectly with modern furniture and walls." },
      { id: "charcoal", name: "Charcoal Dark", hex: "#323335", isLight: false, desc: "A deep charcoal shade that offers excellent shading and high visual contrast." },
      { id: "black", name: "Matte Black", hex: "#1C1C1C", isLight: false, desc: "A strong blackout tone, ideal for blocking all daylight in media rooms and bedrooms." }
    ]
  },
  {
    name: "Soft Sage & Accent Tones",
    colors: [
      { id: "sage", name: "Forest Sage", hex: "#5E6D62", isLight: false, desc: "A soothing botanical green that invites the calm of nature into bedrooms." },
      { id: "blue", name: "Coastal Blue", hex: "#475B62", isLight: false, desc: "A rich ocean-slate tone that anchors light rooms with serene coastal vibes." },
      { id: "mustard", name: "Ochre Mustard", hex: "#D1A153", isLight: false, desc: "A vibrant golden-yellow accent that adds visual warmth and sunny energy." }
    ]
  }
];

export default function ColorVisualizer() {
  const [selectedRoom, setSelectedRoom] = useState<"living-room" | "bedroom">("living-room");
  const [selectedStyle, setSelectedStyle] = useState<"roller" | "vertical" | "roman">("roller");
  const [selectedColor, setSelectedColor] = useState<ColorItem>(collections[0].colors[0]);
  const [blindHeight, setBlindHeight] = useState<number>(85); // 0 to 100 percentage

  const handleApplyToBooking = () => {
    // Dispatch a custom event to update the booking form
    const customEvent = new CustomEvent("claimOffer", {
      detail: {
        type: selectedStyle === "roller" ? "roller" : selectedStyle === "vertical" ? "vertical" : "roman",
        message: `I configured my blinds in the Color Visualizer! I prefer: ${selectedStyle.toUpperCase()} Blinds in "${selectedColor.name}" (Hex: ${selectedColor.hex}) set to ${blindHeight}% height.`
      }
    });
    window.dispatchEvent(customEvent);

    // Scroll to the booking section
    const bookingEl = document.getElementById("booking");
    if (bookingEl) {
      bookingEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const getStyleLabel = () => {
    switch (selectedStyle) {
      case "roller": return "Roller Blinds";
      case "vertical": return "Vertical Blinds";
      case "roman": return "Roman Blinds";
    }
  };

  return (
    <section id="visualizer" className="py-24 bg-bg-light border-b border-border-light relative">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[12px] font-btn font-bold tracking-widest text-brand-primary uppercase flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Interactive Sandbox
          </span>
          <h2 className="font-headline text-4xl sm:text-5xl text-text-dark mt-2 tracking-tight">
            Design Your Bespoke Blinds
          </h2>
          <p className="font-sans text-text-muted mt-4 text-base sm:text-lg leading-relaxed">
            See exactly how different styles and colors fit inside a real room. Select a room layout, style, and click any fabric swatch below.
          </p>
        </div>

        {/* Visualizer Workspace Grid */}
        <div className="visualizer-grid">
          
          {/* LEFT: Live Room Canvas */}
          <div className="visualizer-canvas-card">
            
            {/* Visualizer Canvas Frame */}
            <div className="visualizer-canvas-wrapper">
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedRoom}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  src={selectedRoom === "living-room" ? "/images/visualizer/living-room.png" : "/images/visualizer/bedroom.png"}
                  alt={selectedRoom === "living-room" ? "Modern living room window" : "Master bedroom window"}
                  className="visualizer-canvas-img"
                />
              </AnimatePresence>

              {/* Absolute Blinds Element */}
              <div className={`visualizer-blind-container ${selectedRoom === "bedroom" ? "room-bedroom" : ""}`}>
                {/* Metallic Headrail */}
                <div className="visualizer-headrail" />

                {/* Roll/Fabric Area */}
                <div 
                  className="visualizer-blind-fabric"
                  style={{ 
                    height: `${blindHeight}%`,
                    backgroundColor: selectedColor.hex 
                  }}
                >
                  {/* Texture creases/slats overlay */}
                  <div className={`visualizer-blind-shader style-${selectedStyle}`} />

                  {/* Metallic Bottom bar */}
                  <div className="visualizer-bottom-bar" />
                </div>
              </div>
            </div>

            {/* Canvas Foot Details */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2 text-left">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Selected Choice</span>
                <h4 className="font-nav text-lg font-bold text-text-dark">
                  {getStyleLabel()} &mdash; <span style={{ color: selectedColor.hex === "#FAFAFA" ? "#475569" : selectedColor.hex }}>{selectedColor.name}</span>
                </h4>
              </div>

              {/* Blind Height Status badge */}
              <div className="flex items-center gap-2 text-xs font-semibold text-text-muted bg-bg-light px-3.5 py-2 rounded-full border border-border-light">
                <Sliders className="w-3.5 h-3.5 text-brand-primary" /> Height: {blindHeight}%
              </div>
            </div>

          </div>

          {/* RIGHT: Control Panel Options */}
          <div className="visualizer-control-card text-left">
            
            {/* Room Toggle */}
            <div>
              <span className="visualizer-control-group-title">Select Room Layout</span>
              <div className="visualizer-tabs">
                <button
                  onClick={() => setSelectedRoom("living-room")}
                  className={`visualizer-tab-btn flex items-center justify-center gap-2 ${selectedRoom === "living-room" ? "active" : ""}`}
                >
                  <Home className="w-3.5 h-3.5" /> Living Room
                </button>
                <button
                  onClick={() => setSelectedRoom("bedroom")}
                  className={`visualizer-tab-btn flex items-center justify-center gap-2 ${selectedRoom === "bedroom" ? "active" : ""}`}
                >
                  <Maximize2 className="w-3.5 h-3.5" /> Bedroom
                </button>
              </div>
            </div>

            {/* Blind Style Toggle */}
            <div>
              <span className="visualizer-control-group-title">Select Blind Style</span>
              <div className="visualizer-tabs visualizer-tabs-3">
                <button
                  onClick={() => setSelectedStyle("roller")}
                  className={`visualizer-tab-btn ${selectedStyle === "roller" ? "active" : ""}`}
                >
                  Roller
                </button>
                <button
                  onClick={() => setSelectedStyle("vertical")}
                  className={`visualizer-tab-btn ${selectedStyle === "vertical" ? "active" : ""}`}
                >
                  Vertical
                </button>
                <button
                  onClick={() => setSelectedStyle("roman")}
                  className={`visualizer-tab-btn ${selectedStyle === "roman" ? "active" : ""}`}
                >
                  Roman
                </button>
              </div>
            </div>

            {/* Dynamic Swatches by Collection */}
            <div>
              <span className="visualizer-control-group-title">Choose Fabric Color</span>
              <div className="flex flex-col gap-6">
                {collections.map((col, cIdx) => (
                  <div key={cIdx} className="swatch-collection">
                    <span className="swatch-collection-title">{col.name}</span>
                    <div className="swatch-row">
                      {col.colors.map((color) => (
                        <button
                          key={color.id}
                          onClick={() => setSelectedColor(color)}
                          className={`swatch-item ${color.isLight ? "light-swatch" : ""} ${selectedColor.id === color.id ? "active" : ""}`}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                          aria-label={`Select color ${color.name}`}
                        >
                          <Check className="swatch-item-check w-4 h-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Height Adjustment Slider */}
            <div>
              <span className="visualizer-control-group-title">Adjust Height / Position</span>
              <div className="visualizer-slider-wrap">
                <Sun className="w-4 h-4 text-text-muted" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={blindHeight}
                  onChange={(e) => setBlindHeight(Number(e.target.value))}
                  className="visualizer-slider"
                  aria-label="Adjust Blind Height"
                />
                <Eye className="w-4 h-4 text-brand-primary" />
              </div>
            </div>

            {/* Color Description Card */}
            <div className="visualizer-material-card">
              <span className="visualizer-material-name flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full inline-block border border-black/10" style={{ backgroundColor: selectedColor.hex }} />
                {selectedColor.name} Fabric
              </span>
              <p className="visualizer-material-desc">
                {selectedColor.desc}
              </p>
              <div className="visualizer-specs">
                <div className="visualizer-spec-badge">
                  <Shield className="w-3 h-3" /> Premium Grade
                </div>
                <div className="visualizer-spec-badge">
                  <Check className="w-3 h-3" /> Flame Retardant
                </div>
              </div>
            </div>

            {/* CTA Pre-Fill Booking Button */}
            <button
              onClick={handleApplyToBooking}
              className="w-full py-4 bg-brand-primary text-white font-nav font-bold text-center rounded-[12px] hover:bg-[#B91C1C] transition-all shadow-sm hover:shadow-md cursor-pointer mt-2"
            >
              Order Consultation in this Style
            </button>

          </div>

        </div>

      </div>
    </section>
  );
}
