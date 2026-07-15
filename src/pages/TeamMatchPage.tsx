import { Sparkles, MessageCircle, Users2 } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import SpotlightCard from '../components/reactbits/SpotlightCard';
import StarBorder from '../components/reactbits/StarBorder';
import SkeletonCard from '../components/layout/SkeletonCard';
import { useAsyncData } from '../hooks/useAsyncData';
import { getCandidates } from '../api/candidates';

const TeamMatchPage = () => {
  const { data: candidates, loading } = useAsyncData(getCandidates, []);

  return (
    <PageShell
      eyebrow="AI TEAMMATCH"
      title="Find the team you actually need."
      intro="Matched by skills, interests, and availability — not by who happens to reply first in the group chat."
    >
      <div className="flex justify-end mb-6">
        <StarBorder as="button" color="#FF5B2E" speed="5s">
          <span className="flex items-center gap-2 bg-primary text-ink rounded-full px-5 py-2 text-sm font-medium">
            <Sparkles size={14} />
            Post your project
          </span>
        </StarBorder>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {new Array(6).fill(0).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && candidates && candidates.length === 0 && (
        <div className="text-center py-24">
          <Users2 size={28} className="text-gray-600 mx-auto mb-4" />
          <p className="text-primary/70 mb-1">No one's posted a profile yet.</p>
          <p className="text-gray-500 text-sm">Be the first — post your project above.</p>
        </div>
      )}

      {!loading && candidates && candidates.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {candidates.map((c) => (
            <SpotlightCard key={c.id} className="h-full flex flex-col" spotlightColor="rgba(255, 91, 46, 0.15)">
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-primary text-sm">
                  {c.name.split(' ').map((p) => p[0]).join('')}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${c.available ? 'bg-accent' : 'bg-gray-600'}`} />
                  <span className="text-xs text-gray-500">{c.available ? 'Available' : 'In a team'}</span>
                </div>
              </div>

              <h3 className="text-primary text-base mb-0.5">{c.name}</h3>
              <span className="text-xs text-gray-500 mb-4 block">Looking for: {c.roleWanted}</span>

              <div className="flex flex-wrap gap-1.5 mb-6 flex-1">
                {c.skills.map((s) => (
                  <span key={s} className="text-[11px] bg-white/5 border border-white/10 text-gray-400 rounded-full px-2.5 py-1">
                    {s}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-accent text-sm font-medium">{c.matchScore}% match</span>
                <button
                  disabled={!c.available}
                  className="flex items-center gap-1.5 text-xs text-primary/80 hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <MessageCircle size={13} /> Message
                </button>
              </div>
            </SpotlightCard>
          ))}
        </div>
      )}
    </PageShell>
  );
};

export default TeamMatchPage;
