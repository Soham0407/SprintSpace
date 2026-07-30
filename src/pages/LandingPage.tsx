import { Suspense, lazy } from 'react';
import Hero from '../sections/Hero';
import About from '../sections/About';
import Features from '../sections/Features';
import Footer from '../components/layout/Footer';

const GlobeSection = lazy(() => import('../sections/GlobeSection'));

const GlobeFallback = () => (
  <section className="bg-ink py-16 md:py-24 px-4 md:px-6">
    <div
      className="max-w-6xl mx-auto rounded-2xl md:rounded-[2rem] bg-card border border-white/5 animate-pulse"
      style={{ height: 'min(70vh, 640px)' }}
    />
  </section>
);

const LandingPage = () => {
  return (
    <div className="bg-ink">
      <Hero />
      <Suspense fallback={<GlobeFallback />}>
        <GlobeSection />
      </Suspense>
      <About />
      <Features />
      <Footer />
    </div>
  );
};

export default LandingPage;
