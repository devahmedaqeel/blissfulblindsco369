import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import WhyChooseUs from "@/components/WhyChooseUs";
import Offers from "@/components/Offers";
import HowItWorks from "@/components/HowItWorks";
import ProductRange from "@/components/ProductRange";
import ColorVisualizer from "@/components/ColorVisualizer";
import RecentInstallations from "@/components/RecentInstallations";
import Reviews from "@/components/Reviews";
import Commercial from "@/components/Commercial";
import CoverageAreas from "@/components/CoverageAreas";
import BookingForm from "@/components/BookingForm";
import Footer from "@/components/Footer";
import WhatsAppWidget from "@/components/WhatsAppWidget";
import CookieConsent from "@/components/CookieConsent";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-white">
      {/* Absolute floating navbar */}
      <Navbar />

      {/* Main Page Layout */}
      <main>
        {/* Fullscreen Video Hero */}
        <HeroSection />

        {/* Why Choose Us */}
        <WhyChooseUs />

        {/* Special Bundle Offers */}
        <Offers />

        {/* Step-by-Step Order Process */}
        <HowItWorks />

        {/* Product Catalogue Ranges */}
        <ProductRange />

        {/* Real-time Blind Visualizer */}
        <ColorVisualizer />

        {/* installations Portfolio Gallery */}
        <RecentInstallations />

        {/* Testimonials Carousel */}
        <Reviews />

        {/* Commercial and Landlord Packages */}
        <Commercial />

        {/* Service Locations and Postcode checker */}
        <CoverageAreas />

        {/* Booking & Consultation Form */}
        <BookingForm />
      </main>

      {/* Footer Details */}
      <Footer />

      {/* Draggable Snapping WhatsApp Widget */}
      <WhatsAppWidget />

      {/* GDPR Cookie Consent banner */}
      <CookieConsent />
    </div>
  );
}
