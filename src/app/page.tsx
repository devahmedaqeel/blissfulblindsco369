import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-white">
      {/* Absolute floating navbar */}
      <Navbar />

      {/* Main hero section */}
      <main>
        <HeroSection />
      </main>
    </div>
  );
}
