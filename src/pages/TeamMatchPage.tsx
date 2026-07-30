import { Users2 } from "lucide-react";
import PageShell from '../components/layout/PageShell';
import SpotlightCard from '../components/reactbits/SpotlightCard';
import SkeletonCard from '../components/layout/SkeletonCard';
import { useAsyncData } from '../hooks/useAsyncData';
import { getCandidates } from '../api/candidates';
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";

const TeamMatchPage = () => {
  const { data: candidates, loading } = useAsyncData(getCandidates, []);
  const navigate = useNavigate();
  const location = useLocation();
  const alreadyInvited = location.state?.invitedMembers??[];

const [invited, setInvited] = useState<string[]>(alreadyInvited.map((m:any)=>m.id));

const MAX_MEMBERS = 4; 

  return (
    <PageShell
      eyebrow="TEAM SETUP"
      title="Invite Team Members"
      intro="Choose teammates for your competition. Invitations will be sent once you finish."
    >

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
        <>
  <div className="mb-8">
    <SpotlightCard
      className="!p-6"
      spotlightColor="rgba(255, 91, 46, 0.15)"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

        <div>
          <p className="text-xs tracking-widest text-gray-500 mb-2">
            CREATING
          </p>

          <h2 className="text-2xl font-display text-primary">
            Web Wonders 2026
          </h2>

          <p className="text-gray-500 mt-2">
            Invite teammates before creating your workspace.
          </p>
        </div>

        <div className="flex gap-8">

          <div className="text-center">
            <p className="text-3xl text-accent font-semibold">
              {invited.length + 1}
            </p>
            <p className="text-xs text-gray-500">
              Current Members
            </p>
          </div>

          <div className="text-center">
            <p className="text-3xl text-primary font-semibold">
              {MAX_MEMBERS}
            </p>
            <p className="text-xs text-gray-500">
              Maximum
            </p>
          </div>

        </div>

      </div>
    </SpotlightCard>
  </div>

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
    disabled={
        !c.available ||
        invited.includes(c.id)
        || invited.length >= MAX_MEMBERS}
          onClick={() =>
            setInvited([...invited, c.id])
          }
          className="flex items-center gap-2 text-xs bg-primary text-ink rounded-full px-4 py-2 disabled:opacity-40">
          {invited.includes(c.id) ? "Invitation Sent ✓": "Invite"}
        </button>
              </div>
            </SpotlightCard>
          ))}
        </div>

<div className="flex justify-center mt-10">
  <button
    disabled={invited.length < MAX_MEMBERS - 1}
    onClick={() => navigate("/newcompetition")}
    className="w-full md:w-96 rounded-2xl py-4 bg-primary text-ink font-semibold disabled:opacity-40"
  >
    Finish
  </button>
</div>

</>
)}
    <div className="flex justify-center mt-10">
  <button
    disabled={invited.length === 0}
    onClick={() => {
      const selected = (candidates??[]).filter(c =>
        invited.includes(c.id)
      );

      navigate("/newcompetition", {
        state: {
          invitedMembers: selected,
        },
      });
    }}
    className="bg-primary text-ink rounded-full px-8 py-3 font-medium disabled:opacity-40"
  >
    Finish
  </button>
</div>
    </PageShell>
  );
};

export default TeamMatchPage;
