"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useAnimation, PanInfo } from "framer-motion";
import { MessageCircle } from "lucide-react";

export default function WhatsAppWidget() {
  const controls = useAnimation();
  const widgetRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Load position from localStorage
    const saved = localStorage.getItem("bb_wa_widget_pos_next");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          controls.set({ x: parsed.x, y: parsed.y });
        }
      } catch (err) {
        console.error(err);
      }
    }
  }, [controls]);

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (!widgetRef.current) return;

    const screenWidth = window.innerWidth;
    const widgetWidth = widgetRef.current.offsetWidth;
    const padding = 24;

    const currentY = info.offset.y;

    const rect = widgetRef.current.getBoundingClientRect();
    const isLeft = rect.left + rect.width / 2 < screenWidth / 2;

    const snapX = isLeft 
      ? -(screenWidth - widgetWidth - padding * 2) 
      : 0;

    controls.start({
      x: snapX,
      y: currentY,
      transition: { type: "spring", stiffness: 300, damping: 25 }
    });

    // Save position
    localStorage.setItem(
      "bb_wa_widget_pos_next",
      JSON.stringify({ x: snapX, y: currentY })
    );
  };

  if (!isMounted) return null;

  return (
    <motion.div
      ref={widgetRef}
      drag
      dragMomentum={false}
      dragElastic={0.1}
      animate={controls}
      onDragEnd={handleDragEnd}
      className="fixed bottom-6 right-6 z-[99] cursor-grab active:cursor-grabbing flex items-center justify-center pointer-events-auto"
      style={{ touchAction: "none" }}
    >
      <a
        href="https://wa.me/447341645339"
        target="_blank"
        rel="noopener noreferrer"
        className="w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-shadow duration-300 relative group pointer-events-auto"
      >
        <MessageCircle className="w-7 h-7 fill-white" />
        
        {/* Tooltip */}
        <span className="absolute right-16 top-1/2 -translate-y-1/2 bg-text-dark text-white text-[11px] font-nav font-semibold px-3 py-1.5 rounded-[8px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-md">
          Chat on WhatsApp
        </span>
      </a>
    </motion.div>
  );
}
