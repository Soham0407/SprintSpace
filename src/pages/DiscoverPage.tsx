import { useMemo, useState } from 'react';
import { Calendar, Trophy, Users, ArrowUpRight, Compass } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import SpotlightCard from '../components/reactbits/SpotlightCard';
import SkeletonCard from '../components/layout/SkeletonCard';
import { useAsyncData } from '../hooks/useAsyncData';
import { getCompetitions } from '../api/competitions';

function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Closing today';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

const DiscoverPage = () => {
  const { data: competitions, loading } = useAsyncData(getCompetitions, []);
  const [category, setCategory] = useState('All');

  const categories = useMemo(() => {
    if (!competitions) return ['All'];
    return ['All', ...Array.from(new Set(competitions.map((c) => c.category)))];
  }, [competitions]);

  const filtered = useMemo(() => {
    if (!competitions) return [];
    return category === 'All' ? competitions : competitions.filter((c) => c.category === category);
  }, [competitions, category]);

  return (
    <PageShell
      eyebrow="LIVE COMPETITIONS"
      title="Discover your next sprint."
      intro="Every hackathon and case competition your college network has access to, in one feed — instead of six different WhatsApp groups."
    >
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {new Array(6).fill(0).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && competitions && competitions.length === 0 && (
        <div className="text-center py-24">
          <Compass size={28} className="text-gray-600 mx-auto mb-4" />
          <p className="text-primary/70 mb-1">No competitions live right now.</p>
          <p className="text-gray-500 text-sm">Check back soon, or post one for your own team.</p>
        </div>
      )}

      {!loading && competitions && competitions.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`text-xs px-3.5 py-1.5 rounded-full border transition-colors ${
                  category === c
                    ? 'bg-primary text-ink border-primary'
                    : 'border-white/10 text-gray-400 hover:text-primary hover:border-white/30'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((comp) => (
              <SpotlightCard key={comp.id} className="h-full flex flex-col" spotlightColor="rgba(255, 91, 46, 0.15)">
                <span className="text-xs text-gray-500 mb-1">{comp.organizer}</span>
                <h3 className="text-primary text-lg mb-4">{comp.name}</h3>

                <div className="space-y-2 mb-6 flex-1 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-accent" /> {daysUntil(comp.deadline)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy size={14} className="text-accent" /> {comp.prizePool} prize pool
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-accent" /> Team of {comp.teamSize}
                  </div>
                </div>

                <button className="flex items-center gap-1 text-sm text-primary/80 hover:text-primary transition-colors self-start">
                  View details
                  <ArrowUpRight size={14} />
                </button>
              </SpotlightCard>
            ))}
          </div>
        </>
      )}
    </PageShell>
  );
};

export default DiscoverPage;
