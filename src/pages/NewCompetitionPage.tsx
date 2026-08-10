import { useState,useEffect } from "react";
import SpotlightCard from "../components/reactbits/SpotlightCard";
import { createCompetition } from "../api/createCompetition";
import { sendInvite } from "../api/invites";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import {
  ArrowLeft,
  Users,
  Calendar,
  Trophy,
  Briefcase,
  Rocket,
  FolderKanban,
} from "lucide-react";

const competitionTypes = [
  {
    id: "hackathon",
    title: "Hackathon",
    icon: Trophy,
  },
  {
    id: "college",
    title: "College Project",
    icon: Briefcase,
  },
  {
    id: "startup",
    title: "Startup",
    icon: Rocket,
  },
  {
    id: "personal",
    title: "Personal",
    icon: FolderKanban,
  },
];


export default function NewCompetitionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [ownerName, setOwnerName] = useState("You");
  useEffect(() => {
  const loadOwnerName = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single();

    if (profile?.name) {
      setOwnerName(profile.name);
    }
  };

  loadOwnerName();
}, []);
  // Restore form state from navigate state (survives round-trip through TeamMatch)
  const [competitionName, setCompetitionName] = useState(location.state?.competitionName ?? "");
  const [startDate, setStartDate] = useState(location.state?.startDate ?? "");
  const [endDate, setEndDate] = useState(location.state?.endDate ?? "");
  const [description, setDescription] = useState(location.state?.description ?? "");
  const invitedMembers = location.state?.invitedMembers ?? [];
  const [type, setType] = useState(location.state?.type ?? "hackathon");
  const [maxMembers, setMaxMembers] = useState(location.state?.maxMembers ?? 4);
  const [soloMode, setSoloMode] = useState(location.state?.soloMode ?? false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  
  return (
    <div className="min-h-screen bg-ink px-4 md:px-6 py-10">
      <div className="max-w-5xl mx-auto">

        {/* Header */}

        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <span className="text-xs tracking-widest text-gray-500">
          CREATE COMPETITION
        </span>

        <h1 className="text-primary text-4xl font-display mt-2">
          Create New Competition
        </h1>

        <p className="text-gray-500 mt-3 mb-10 max-w-xl">
          Create a workspace for your next hackathon,
          competition or college project.
        </p>

        {/* Competition Details */}

        <SpotlightCard
          className="mb-6"
          spotlightColor="rgba(255, 91, 46, 0.15)"
        >
          <h2 className="text-primary text-lg mb-6">
            Competition Details
          </h2>

          <div className="space-y-6">

            <div>
              <label className="text-sm text-gray-400 mb-2 block">
                Competition Name
              </label>

              <input
                placeholder="Web Wonders 2026"
                className="w-full rounded-xl bg-surface border border-white/10 px-4 py-3 text-primary outline-none focus:border-accent"
                value={competitionName}
                onChange={(e) => setCompetitionName(e.target.value)}
              />
            </div>

            <div>

              <label className="text-sm text-gray-400 mb-4 block">
                Competition Type
              </label>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                {competitionTypes.map((item) => {

                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setType(item.id)}
                      className={`rounded-2xl border p-5 transition-all

                      ${
                        type === item.id
                          ? "border-accent bg-accent/10"
                          : "border-white/10 bg-card hover:border-accent/50"
                      }`}
                    >
                      <Icon
                        size={22}
                        className="mx-auto text-primary mb-3"
                      />

                      <p className="text-sm text-primary">
                        {item.title}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">

              <div>

                <label className="text-sm text-gray-400 block mb-2">
                  Start Date
                </label>

                <div className="relative">

                  <Calendar
                    size={16}
                    className="absolute left-4 top-4 text-gray-500"
                  />

                  <input
                    type="date"
                    className="w-full rounded-xl bg-surface border border-white/10 py-3 pl-12 pr-4 text-primary outline-none focus:border-accent"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
              </div>

              <div>

                <label className="text-sm text-gray-400 block mb-2">
                  End Date
                </label>

                <div className="relative">

                  <Calendar
                    size={16}
                    className="absolute left-4 top-4 text-gray-500"
                  />

                  <input
                    type="date"
                    className="w-full rounded-xl bg-surface border border-white/10 py-3 pl-12 pr-4 text-primary outline-none focus:border-accent"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </SpotlightCard>

        {/* Team */}

        <SpotlightCard
          className="mb-6"
          spotlightColor="rgba(255, 91, 46, 0.15)"
        >
          <h2 className="text-primary text-lg mb-6">
            Team Setup
          </h2>

          <div className="space-y-6">

            <div>

              <label className="text-sm text-gray-400 mb-2 block">
                Maximum Members
              </label>

              <select
                value={maxMembers}
                onChange={(e) => setMaxMembers(Number(e.target.value))}
                disabled={soloMode}
                className="rounded-xl bg-surface border border-white/10 px-4 py-3 text-primary"
              >
                <option>1</option>
                <option>2</option>
                <option>3</option>
                <option>4</option>
                <option>5</option>
                <option>6</option>
              </select>
              <div className="mt-4 flex items-center gap-3">
  <input
    id="soloMode"
    type="checkbox"
    checked={soloMode}
    onChange={(e) => {
      setSoloMode(e.target.checked);

      if (e.target.checked) {
        setMaxMembers(1);
      } else {
        setMaxMembers(4);
      }
    }}
  />

  <label htmlFor="soloMode" className="text-sm text-primary">
    Solo Competition
  </label>
</div>

            </div>

            <div>

              <label className="text-sm text-gray-400 mb-3 block flex justify-between">
  <span>Members</span>

  <span className="text-accent">
    {1 + invitedMembers.length} / {maxMembers}
  </span>
</label>

              <div className="rounded-xl border border-white/10 bg-surface px-5 py-4 flex justify-between items-center">

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center font-semibold">
                    {ownerName
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>

                  <div>

                    <p className="text-primary">
                      {ownerName}
                    </p>

                    <p className="text-xs text-gray-500">
                      Owner
                    </p>

                  </div>

                </div>

              </div>

            </div>
            {!soloMode &&
  invitedMembers.map((member: any) => (
  <div
    key={member.id}
    className="rounded-xl border border-white/10 bg-surface px-5 py-4 flex justify-between items-center mt-3"
  >
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-primary">
        {member.name
          .split(" ")
          .map((n: string) => n[0])
          .join("")}
      </div>

      <div>
        <p className="text-primary">{member.name}</p>
        <p className="text-xs text-yellow-400">
          Pending Invitation
        </p>
      </div>
    </div>
    <button
  onClick={() => {
    const updated = invitedMembers.filter(
      (m: any) => m.id !== member.id
    );

    navigate("/newcompetition", {
      replace: true,
      state: {
        invitedMembers: updated,
      },
    });
  }}
  className="text-red-400 hover:text-red-300 text-sm"
>
  Cancel
</button>
  </div>
))
}

            {!soloMode && (
  <button
    disabled={1 + invitedMembers.length >= maxMembers}
    onClick={() => {
      if (1 + invitedMembers.length >= maxMembers) return;

      navigate("/teammatch", {
        state: {
          invitedMembers,
          competitionName,
          startDate,
          endDate,
          description,
          type,
          maxMembers,
          soloMode,
        },
      });
    }}
    className="w-full rounded-2xl border border-accent/30 py-4 flex items-center justify-center gap-3 text-accent hover:bg-accent/10 transition disabled:opacity-40 disabled:cursor-not-allowed"
  >
    <Users size={18} />
    {invitedMembers.length > 0
      ? "Invite More Members"
      : "Invite Team Members"}
  </button>
)}

          </div>
        </SpotlightCard>

        {/* Description */}

        <SpotlightCard
          className="mb-10"
          spotlightColor="rgba(255, 91, 46, 0.15)"
        >
          <h2 className="text-primary text-lg mb-5">
            Description (Optional)
          </h2>

          <textarea
            rows={5}
            placeholder="Briefly describe your competition..."
            className="w-full rounded-xl bg-surface border border-white/10 p-4 text-primary outline-none focus:border-accent resize-none"
            value={description}
onChange={(e)=>setDescription(e.target.value)}
          />
        </SpotlightCard>

        {createError && (
          <p className="text-red-400 text-sm mb-4 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
            {createError}
          </p>
        )}

        <button
          disabled={isCreating}
          onClick={async () => {
            setCreateError(null);
            setIsCreating(true);
            try {
              const workspaceId = await createCompetition({
  name: competitionName,
  type,
  startDate,
  endDate,
  description,
  maxMembers,
});

// Send invites sequentially (prevents race conditions on size-limit checks)
if (!soloMode && invitedMembers.length > 0) {
  for (const member of invitedMembers) {
    try {
      await sendInvite(workspaceId, member.id, competitionName, description || undefined);
    } catch (err) {
      console.error(`[sendInvite] member ${member.id} failed:`, err);
    }
  }
}

navigate(`/workspace/${workspaceId}`);
            } catch (e) {
              setCreateError((e as Error).message);
            } finally {
              setIsCreating(false);
            }
          }}
          className="w-full rounded-2xl bg-primary text-ink py-4 font-semibold hover:opacity-90 transition disabled:opacity-50"
        >
          {isCreating ? "Creating..." : "Create Workspace"}
        </button>

      </div>
    </div>
  );
}