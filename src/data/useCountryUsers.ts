import { useMemo } from 'react';
import countriesGeoJson from '../data/countries.json';

export interface CountryFeature {
  type: 'Feature';
  id?: string;
  properties: { name: string; cca2: string | null };
  geometry: unknown;
  __activeUsers: number;
}

// A handful of countries where student-hackathon activity is realistically
// concentrated get a higher random ceiling than the rest of the world, so
// the globe doesn't look like uniform noise. Swap this whole hook out for a
// real API call once you have actual signup data — the component below only
// cares that each feature ends up with a numeric `__activeUsers`.
// MOCK — deterministic per-country numbers derived from the country's own
// name (not real randomness), so they're stable across reloads. Replace the
// body of this hook with a fetch to a real "active users by country"
// endpoint once one exists — the component consuming it only cares about
// the { features, maxUsers, totalUsers } shape returned below.
const HIGH_ACTIVITY = new Set([
  'India', 'United States', 'United Kingdom', 'Germany', 'Canada',
  'Australia', 'Brazil', 'Indonesia', 'Nigeria', 'Philippines', 'Vietnam',
]);

function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return () => {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    return h / 0x7fffffff;
  };
}

export function useCountryUsers() {
  return useMemo(() => {
    const features = (
      countriesGeoJson as unknown as { features: CountryFeature[] }
    ).features.map((f) => {
      const rand = seededRandom(f.properties.name);
      const isHigh = HIGH_ACTIVITY.has(f.properties.name);
      const ceiling = isHigh ? 6000 : 900;
      const floor = isHigh ? 800 : 5;
      const activeUsers = Math.round(floor + rand() * (ceiling - floor));
      return { ...f, __activeUsers: activeUsers };
    });

    const maxUsers = Math.max(...features.map((f) => f.__activeUsers));
    const totalUsers = features.reduce((sum, f) => sum + f.__activeUsers, 0);

    return { features, maxUsers, totalUsers };
  }, []);
}
