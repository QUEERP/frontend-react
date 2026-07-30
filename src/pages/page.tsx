import Navbar from '@/components/navbar';
import Hero from '@/components/hero';
import SocialProof from '@/components/social-proof';
import Features from '@/components/features';
import Security from '@/components/security';
import HowItWorks from '@/components/how-it-works';
import ProductShowcase from '@/components/product-showcase';
import Pricing from '@/components/pricing';
import Testimonials from '@/components/testimonials';
import FinalCTA from '@/components/final-cta';
import Footer from '@/components/footer';

export default function Home() {
  return (
    <main className="bg-white">
      <Navbar />
      <Hero />
      <SocialProof />
      <Features />
      <Security />
      <HowItWorks />
      <ProductShowcase />
      <Pricing />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </main>
  );
}
