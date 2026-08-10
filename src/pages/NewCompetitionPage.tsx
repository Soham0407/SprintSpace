import { useState } from "react";
import SpotlightCard from "../components/reactbits/SpotlightCard";
import { createCompetition } from "../api/createCompetition";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import {
  ArrowLeft,
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
  // Restore form state from navigate state (survives round-trip through TeamMatch)
  const [competitionName, setCompetitionName] = useState(location.state?.competitionName ?? "");
  const [startDate, setStartDate] = useState(location.state?.startDate ?? "");
  const [endDate, setEndDate] = useState(location.state?.endDate ?? "");
  const [description, setDescription] = useState(location.state?.description ?? "");
  const [type, setType] = useState(location.state?.type ?? "hackathon");
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
                maxMembers: 9999,
              });

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