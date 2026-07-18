import { useEffect, useMemo, useRef, useState } from 'react';
import Globe, { type GlobeMethods } from 'react-globe.gl';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, MousePointer2 } from 'lucide-react';
import CountUp from '../components/reactbits/CountUp';
import { useCountryUsers, type CountryFeature } from '../data/useCountryUsers';

// Turns an ISO alpha-2 code into its flag emoji (regional indicator pair).
function flagEmoji(cca2: string | null) {
  if (!cca2 || cca2.length !== 2) return '🌐';
  const codePoints = [...cca2.toUpperCase()].map((c) => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

const BASE_ALTITUDE = 0.008;
const MAX_ALTITUDE = 0.4;

const GlobeSection = () => {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [selected, setSelected] = useState<CountryFeature | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  const { features, maxUsers, totalUsers } = useCountryUsers();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    g.pointOfView({ lat: 20, lng: 78, altitude: 2.2 }, 0);
    const controls = g.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controls.enableZoom = false;
  }, []);

  const stopAutoRotate = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      const controls = globeRef.current?.controls();
      if (controls) controls.autoRotate = false;
    }
  };

  const altitudeFor = (f: object) => {
    const feature = f as CountryFeature;
    if (selected && feature.properties.name === selected.properties.name) {
      return BASE_ALTITUDE + (feature.__activeUsers / maxUsers) * MAX_ALTITUDE;
    }
    return BASE_ALTITUDE;
  };

  const capColorFor = (f: object) => {
    const feature = f as CountryFeature;
    return selected && feature.properties.name === selected.properties.name
      ? '#FF5B2E'
      : 'rgba(222, 219, 200, 0.22)';
  };

  const strokeColorFor = (f: object) => {
    const feature = f as CountryFeature;
    return selected && feature.properties.name === selected.properties.name
      ? '#FF5B2E'
      : 'rgba(222, 219, 200, 0.35)';
  };

  const memoFeatures = useMemo(() => features, [features]);

  return (
    <section id="discover" className="relative bg-ink py-16 md:py-24 px-4 md:px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6 md:mb-10">
          <div>
            <span className="text-xs text-gray-500 tracking-wide block mb-2">LIVE NETWORK</span>
            <h2 className="font-display text-primary text-xl sm:text-2xl md:text-3xl leading-tight tracking-tight max-w-xl">
              Teams are sprinting on every continent.
            </h2>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Users size={16} className="text-accent" />
            <span className="text-primary text-lg">
              <CountUp to={totalUsers} duration={2} separator="," />
            </span>
            active builders worldwide
          </div>
        </div>

        <div
          ref={containerRef}
          className="relative w-full rounded-2xl md:rounded-[2rem] overflow-hidden bg-card border border-white/5"
          style={{ height: 'min(70vh, 640px)' }}
          onPointerDown={stopAutoRotate}
        >
          <Globe
            ref={globeRef}
            width={dimensions.width}
            height={dimensions.height}
            backgroundColor="rgba(0,0,0,0)"
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
            bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
            showAtmosphere
            atmosphereColor="#FF5B2E"
            atmosphereAltitude={0.15}
            polygonsData={memoFeatures}
            polygonAltitude={altitudeFor}
            polygonCapColor={capColorFor}
            polygonSideColor={() => 'rgba(255, 91, 46, 0.25)'}
            polygonStrokeColor={strokeColorFor}
            polygonsTransitionDuration={400}
            onPolygonClick={(f) => setSelected(f as CountryFeature)}
            polygonLabel={() => ''}
          />

          {/* Hint, shown until the person first drags/clicks */}
          <AnimatePresence>
            {!hasInteracted && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-xs text-gray-400 bg-ink/70 backdrop-blur px-3 py-1.5 rounded-full pointer-events-none"
              >
                <MousePointer2 size={12} />
                Drag to rotate · click a country
              </motion.div>
            )}
          </AnimatePresence>

          {/* Selected-country readout */}
          <AnimatePresence>
            {selected && (
              <motion.div
                key={selected.properties.name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-ink/90 backdrop-blur border border-white/10 rounded-2xl px-5 py-4 sm:px-6 sm:py-5 min-w-[200px]"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl leading-none">{flagEmoji(selected.properties.cca2)}</span>
                  <span className="text-primary text-base sm:text-lg">{selected.properties.name}</span>
                </div>
                <span className="text-3xl sm:text-4xl text-accent font-medium">
                  <CountUp to={selected.__activeUsers} duration={1.2} separator="," />
                </span>
                <p className="text-xs text-gray-500 mt-1">active SprintSpace builders</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-xs text-gray-600 mt-4">
          Sample data — wire this up to real signups whenever you've got them.
        </p>
      </div>
    </section>
  );
};

export default GlobeSection;
