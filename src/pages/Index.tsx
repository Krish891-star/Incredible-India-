import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import FeaturedStates from '@/components/FeaturedStates';
import Features from '@/components/Features';
import MapSection from '@/components/MapSection';
import Footer from '@/components/Footer';

export default function Index() {
  return (
    <>
      <Helmet>
        <title>Incredible India - Explore the Soul of India | Tourism Platform</title>
        <meta name="description" content="Discover India's rich heritage, 28 states, 700+ destinations. Plan your perfect journey with interactive maps, 360° virtual tours, and AI trip planner." />
        <meta property="og:title" content="Incredible India - Explore the Soul of India" />
        <meta property="og:description" content="Discover India's rich heritage, 28 states, 700+ destinations with interactive maps and virtual tours." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          <Hero />
          <FeaturedStates />
          <Features />
          <MapSection />
        </main>
        <Footer />
      </div>
    </>
  );
}
