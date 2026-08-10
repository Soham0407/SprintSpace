import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  X,
  Minus,
  ArrowRight,
  Loader2,
  RotateCcw,
} from "lucide-react";
import {
  generateRoadmap,
  generateRoadmapDoc,
  type PlannerResponse,
} from "../../api/planner";
import { saveRoadmap } from "../../api/workspace";
import {
  createResource,
  uploadResourceFile,
} from "../../api/resources";
import { FileText } from "lucide-react";

type Props = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;

  projectIdea: string;
  setProjectIdea: Dispatch<SetStateAction<string>>;

  memberSkills: Record<string, string>;
  setMemberSkills: Dispatch<SetStateAction<Record<string, string>>>;

  currentStep: number;
  setCurrentStep: Dispatch<SetStateAction<number>>;

  selectedResources: string[];
  setSelectedResources: Dispatch<SetStateAction<string[]>>;

  aiInstructions: string;
  setAiInstructions: Dispatch<SetStateAction<string>>;

  team: {
    id: string;
    name: string;
    role: string;
  }[];

  pendingInvites: {
    id: string;
    name: string;
    status: string;
  }[];

  deadline: string;
  competitionName: string;
  workspaceId: string;

  refreshWorkspace: () => Promise<void>;
};

export default function AskAIWidget({
  open,
  setOpen,
  projectIdea,
  setProjectIdea,
  memberSkills,
  setMemberSkills,
  currentStep,
  setCurrentStep,
  selectedResources,
  setSelectedResources,
  aiInstructions,
  setAiInstructions,
  team,
  pendingInvites,
  deadline,
  competitionName,
  workspaceId,
  refreshWorkspace,
}: Props) {
  /*
   * ------------------------------------------------------------
   * STORAGE KEYS
   * ------------------------------------------------------------
   */

  const plannerStorageKey = `planner_state_${workspaceId}`;
  const plannerIntroKey = `planner_intro_seen_${workspaceId}`;

  /*
   * ------------------------------------------------------------
   * STATE
   * ------------------------------------------------------------
   */

  const [showPlannerIntro, setShowPlannerIntro] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);

  const [generateError, setGenerateError] =
    useState<string | null>(null);

  const [roadmap, setRoadmap] =
    useState<PlannerResponse | null>(null);

  const [isPlannerHydrated, setIsPlannerHydrated] =
    useState(false);

  const [isExtracting, setIsExtracting] = useState(false);

  const [extractError, setExtractError] =
    useState<string | null>(null);

  const [extractDone, setExtractDone] = useState(false);

  /*
   * ------------------------------------------------------------
   * TEAM / INVITATION STATE
   * ------------------------------------------------------------
   *
   * team includes the workspace owner.
   *
   * Therefore:
   * team.length === 1
   * means only the owner is currently in the workspace.
   */

  const hasTeammates = team.length > 1;

  const hasPendingInvites = pendingInvites.length > 0;

  const teamReady = !hasPendingInvites;

  /*
   * ------------------------------------------------------------
   * RESTORE PLANNER STATE
   * ------------------------------------------------------------
   */

  useEffect(() => {
    if (!workspaceId) return;

    const saved = localStorage.getItem(plannerStorageKey);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        if (parsed.projectIdea !== undefined) {
          setProjectIdea(parsed.projectIdea);
        }

        if (parsed.memberSkills !== undefined) {
          setMemberSkills(parsed.memberSkills);
        }

        if (parsed.selectedResources !== undefined) {
          setSelectedResources(parsed.selectedResources);
        }

        if (parsed.aiInstructions !== undefined) {
          setAiInstructions(parsed.aiInstructions);
        }

        if (parsed.currentStep !== undefined) {
          setCurrentStep(parsed.currentStep);
        }

        if (parsed.roadmap !== undefined) {
          setRoadmap(parsed.roadmap);
        }
      } catch (error) {
        console.error(
          "Failed to restore planner state:",
          error
        );
      }
    }

    /*
     * IMPORTANT:
     * Do not allow the save effect below to overwrite
     * restored state before restoration has completed.
     */

    setIsPlannerHydrated(true);
  }, [
    workspaceId,
    plannerStorageKey,
    setProjectIdea,
    setMemberSkills,
    setSelectedResources,
    setAiInstructions,
    setCurrentStep,
  ]);

  /*
   * ------------------------------------------------------------
   * FIRST-TIME PLANNER INTRO
   * ------------------------------------------------------------
   *
   * Every time the Planner opens:
   *
   * intro_seen = false
   *      ↓
   * show onboarding screen
   *
   * intro_seen = true
   *      ↓
   * show normal 5-step planner
   */

  useEffect(() => {
    if (!workspaceId || !open) return;

    const introSeen = localStorage.getItem(
      plannerIntroKey
    );

    if (!introSeen) {
      setShowPlannerIntro(true);
    } else {
      setShowPlannerIntro(false);
    }
  }, [
    workspaceId,
    open,
    plannerIntroKey,
  ]);

  /*
   * ------------------------------------------------------------
   * SAVE PLANNER STATE
   * ------------------------------------------------------------
   */

  useEffect(() => {
    if (!workspaceId || !isPlannerHydrated) return;

    const plannerState = {
      projectIdea,
      memberSkills,
      selectedResources,
      aiInstructions,
      currentStep,
      roadmap,
    };

    localStorage.setItem(
      plannerStorageKey,
      JSON.stringify(plannerState)
    );
  }, [
    workspaceId,
    plannerStorageKey,
    isPlannerHydrated,
    projectIdea,
    memberSkills,
    selectedResources,
    aiInstructions,
    currentStep,
    roadmap,
  ]);

  /*
   * ------------------------------------------------------------
   * START PLANNING
   * ------------------------------------------------------------
   */

  const handleStartPlanning = () => {
    localStorage.setItem(
      plannerIntroKey,
      "true"
    );

    setShowPlannerIntro(false);

    /*
     * Always begin the actual Planner at Step 1.
     *
     * This applies to both:
     * - Solo users
     * - Teams
     */

    setCurrentStep(1);
  };

  /*
   * ------------------------------------------------------------
   * FINISH SETUP
   * ------------------------------------------------------------
   */

  const handleFinishSetup = () => {
    localStorage.setItem(
      plannerIntroKey,
      "true"
    );

    setShowPlannerIntro(false);

    setOpen(false);
  };

  /*
   * ------------------------------------------------------------
   * GENERATE ROADMAP
   * ------------------------------------------------------------
   */

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerateError(null);

    try {
      const result = await generateRoadmap({
        competition: competitionName,
        projectIdea,
        deadline,
        aiInstructions,
        team: team.map((m) => ({
          name: m.name,
          skills: memberSkills[m.id]
            ? [memberSkills[m.id]]
            : [],
        })),
      });

      setRoadmap(result);
      setCurrentStep(5);
    } catch (e) {
      setGenerateError(
        (e as Error).message
      );
    } finally {
      setIsGenerating(false);
    }
  };

  /*
   * ------------------------------------------------------------
   * EXTRACT ROADMAP
   * ------------------------------------------------------------
   */

  const handleExtractRoadmap = async () => {
    if (!roadmap) return;

    setIsExtracting(true);
    setExtractError(null);
    setExtractDone(false);

    try {
      const { content } =
        await generateRoadmapDoc({
          competition: competitionName,
          projectIdea,
          deadline,
          phases: roadmap.phases,
        });

      const file = new File(
        [content],
        `${competitionName || "Project"} Roadmap.md`,
        {
          type: "text/markdown",
        }
      );

      const url =
        await uploadResourceFile(file);

      await createResource({
        workspaceId,
        title: `${competitionName || "Project"} Roadmap`,
        description:
          "AI-generated project roadmap document.",
        url,
        category: "Roadmap",
        tags: [
          "roadmap",
          "ai-generated",
        ],
      });

      setExtractDone(true);
    } catch (e) {
      setExtractError(
        (e as Error).message
      );
    } finally {
      setIsExtracting(false);
    }
  };

  /*
   * ------------------------------------------------------------
   * ACCEPT ROADMAP
   * ------------------------------------------------------------
   */

  const handleAcceptRoadmap = async () => {
    if (!roadmap) return;

    try {
      await saveRoadmap(
        workspaceId,
        roadmap
      );

      /*
       * Remember that this workspace has completed
       * AI Planner setup.
       */

      localStorage.setItem(
        `planner_completed_${workspaceId}`,
        "true"
      );

      await refreshWorkspace();

      setOpen(false);
    } catch (err) {
      console.error(err);

      alert(
        "Failed to save roadmap."
      );
    }
  };

  /*
   * ------------------------------------------------------------
   * RENDER
   * ------------------------------------------------------------
   */

  return createPortal(
    <>
      <AnimatePresence>
        {open && isPlannerHydrated && (
          <>
            {/* ==================================================
                BLUR BACKGROUND
            ================================================== */}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-md z-[9998]"
            />

            {/* ==================================================
                MODAL
            ================================================== */}

            <motion.div
              initial={{
                opacity: 0,
                scale: 0.92,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 0.92,
              }}
              transition={{
                duration: 0.25,
              }}
              className="fixed inset-0 z-[10000] flex items-center justify-center p-6"
            >
              <div className="w-full max-w-4xl h-[82vh] rounded-3xl bg-card border border-white/10 shadow-2xl overflow-hidden flex flex-col">

                {/* ==================================================
                    HEADER
                ================================================== */}

                <div className="px-8 py-5 border-b border-white/10 flex justify-between items-center">

                  <div className="flex items-center gap-3">

                    <Sparkles
                      size={18}
                      className="text-accent"
                    />

                    <div>

                      <h2 className="text-primary font-semibold text-lg">
                        AI Planner
                      </h2>

                      <p className="text-gray-500 text-sm">
                        Setup your project once. We'll manage the rest.
                      </p>

                    </div>

                  </div>

                  <div className="flex gap-3">

                    <button
                      onClick={() =>
                        setOpen(false)
                      }
                      className="text-gray-400 hover:text-primary"
                    >
                      <Minus size={18} />
                    </button>

                    <button
                      onClick={() =>
                        setOpen(false)
                      }
                      className="text-gray-400 hover:text-red-400"
                    >
                      <X size={18} />
                    </button>

                  </div>

                </div>

                {/* ==================================================
                    BODY
                ================================================== */}

                <div className="flex-1 overflow-y-auto p-8">

                  {/* ==================================================
                      FIRST-TIME INTRO
                  ================================================== */}

                  {showPlannerIntro ? (

                    <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto">

                      {/* ==================================================
                          CASE 1 + 3:
                          PENDING INVITATIONS
                      ================================================== */}

                      {hasPendingInvites ? (

                        <>
                          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-6">

                            <span className="text-2xl">
                              🟠
                            </span>

                          </div>

                          <h2 className="text-primary text-2xl font-semibold mb-3">
                            Waiting for your team
                          </h2>

                          <p className="text-gray-500 max-w-lg mb-8">
                            Some teammates haven't accepted their invitations yet.
                            Please wait until everyone joins before creating the AI roadmap.
                          </p>

                          <div className="w-full max-w-md space-y-3 mb-8">

                            {pendingInvites.map(
                              (invite) => (
                                <div
                                  key={invite.id}
                                  className="flex items-center gap-3 rounded-xl bg-surface border border-white/10 px-4 py-3 text-left"
                                >

                                  <span className="text-orange-400">
                                    🟠
                                  </span>

                                  <span className="text-primary text-sm">
                                    {invite.name}
                                  </span>

                                  <span className="ml-auto text-xs text-orange-400">
                                    Invitation pending
                                  </span>

                                </div>
                              )
                            )}

                          </div>

                          <button
                            onClick={
                              handleFinishSetup
                            }
                            className="px-8 py-3 rounded-xl bg-primary text-ink font-semibold"
                          >
                            Finish Setup
                          </button>
                        </>

                      ) : hasTeammates && teamReady ? (

                        /* ==================================================
                           CASE 2:
                           TEAM EXISTS + ALL ACCEPTED
                        ================================================== */

                        <>
                          <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">

                            <span className="text-2xl">
                              🚀
                            </span>

                          </div>

                          <h2 className="text-primary text-2xl font-semibold mb-3">
                            Your team is ready 🚀
                          </h2>

                          <p className="text-gray-500 max-w-lg mb-8">
                            Everyone has joined the workspace.
                            AI can now create tasks and assign them
                            to the right members.
                          </p>

                          <button
                            onClick={
                              handleStartPlanning
                            }
                            className="px-8 py-3 rounded-xl bg-primary text-ink font-semibold flex items-center gap-2"
                          >
                            Start Planning

                            <ArrowRight
                              size={18}
                            />
                          </button>
                        </>

                      ) : (

                        /* ==================================================
                           CASE 1:
                           SOLO / OWNER ONLY
                        ================================================== */

                        <>
                          <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">

                            <Sparkles
                              size={24}
                              className="text-accent"
                            />

                          </div>

                          <h2 className="text-primary text-2xl font-semibold mb-3">
                            Ready to set up your AI roadmap?
                          </h2>

                          <p className="text-gray-500 max-w-lg mb-8">
                            Before planning, make sure your team is ready.
                            If you're working solo, you can start planning right away.
                          </p>

                          <div className="flex gap-3">

                            <button
                              onClick={
                                handleStartPlanning
                              }
                              className="px-8 py-3 rounded-xl bg-primary text-ink font-semibold flex items-center gap-2"
                            >
                              Start Planning

                              <ArrowRight
                                size={18}
                              />
                            </button>

                            <button
                              onClick={
                                handleFinishSetup
                              }
                              className="px-8 py-3 rounded-xl border border-white/10 text-primary hover:bg-white/5 transition"
                            >
                              Finish Setup
                            </button>

                          </div>
                        </>

                      )}

                    </div>

                  ) : (

                    /* ==================================================
                       NORMAL 5-STEP PLANNER
                    ================================================== */

                    <>

                      {/* ==================================================
                          PROGRESS
                      ================================================== */}

                      <div className="flex gap-3 mb-10">

                        {[1, 2, 3, 4, 5].map(
                          (step) => (
                            <div
                              key={step}
                              className={`flex-1 h-2 rounded-full ${
                                step <= currentStep
                                  ? "bg-accent"
                                  : "bg-white/10"
                              }`}
                            />
                          )
                        )}

                      </div>

                      <div className="grid grid-cols-5 gap-2 mt-3 text-[11px] text-center">

                        <p
                          className={
                            currentStep === 1
                              ? "text-accent"
                              : "text-gray-500"
                          }
                        >
                          Project
                        </p>

                        <p
                          className={
                            currentStep === 2
                              ? "text-accent"
                              : "text-gray-500"
                          }
                        >
                          Resources
                        </p>

                        <p
                          className={
                            currentStep === 3
                              ? "text-accent"
                              : "text-gray-500"
                          }
                        >
                          Team
                        </p>

                        <p
                          className={
                            currentStep === 4
                              ? "text-accent"
                              : "text-gray-500"
                          }
                        >
                          Instructions
                        </p>

                        <p
                          className={
                            currentStep === 5
                              ? "text-accent"
                              : "text-gray-500"
                          }
                        >
                          Generate
                        </p>

                      </div>

                      {/* ==================================================
                          STEP 1
                      ================================================== */}

                      {currentStep === 1 && (

                        <div className="space-y-8">

                          <div>

                            <h3 className="text-primary text-xl font-semibold">
                              Tell us about your project
                            </h3>

                            <p className="text-gray-500 mt-2">
                              The better your description, the better the roadmap.
                            </p>

                          </div>

                          <div>

                            <label className="text-sm text-gray-400 block mb-2">
                              Project Idea
                            </label>

                            <textarea
                              rows={8}
                              value={projectIdea}
                              onChange={(e) =>
                                setProjectIdea(
                                  e.target.value
                                )
                              }
                              placeholder="Describe your project..."
                              className="w-full rounded-2xl bg-surface border border-white/10 p-5 resize-none text-primary outline-none focus:border-accent"
                            />

                          </div>

                          <div className="flex justify-end">

                            <button
                              onClick={() =>
                                setCurrentStep(2)
                              }
                              className="px-6 py-3 rounded-xl bg-primary text-ink font-semibold flex items-center gap-2"
                            >
                              Next

                              <ArrowRight
                                size={18}
                              />

                            </button>

                          </div>

                        </div>

                      )}

                      {/* ==================================================
                          STEP 2
                      ================================================== */}

                      {currentStep === 2 && (

                        <div className="space-y-6">

                          <h2 className="text-xl font-semibold text-primary">
                            Competition Resources
                          </h2>

                          <p className="text-sm text-gray-400">
                            Upload anything that can help the AI understand your competition.
                          </p>

                          <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center">

                            <p className="text-primary font-medium">
                              Drop files here
                            </p>

                            <p className="text-sm text-gray-500 mt-2">
                              Rulebook • PPT • PDF • Docs • Problem Statement
                            </p>

                            <input
                              type="file"
                              multiple
                              hidden
                              id="planner-files"
                            />

                            <label
                              htmlFor="planner-files"
                              className="inline-block mt-5 px-5 py-2 rounded-xl bg-accent text-black font-medium cursor-pointer"
                            >
                              Choose Files
                            </label>

                          </div>

                          <div>

                            <h3 className="text-primary mb-3">
                              Selected Resources
                            </h3>

                            <div className="space-y-2">

                              {selectedResources.length === 0 && (

                                <p className="text-sm text-gray-500">
                                  No resources selected.
                                  You can continue without uploading anything.
                                </p>

                              )}

                              {selectedResources.map(
                                (file) => (

                                  <div
                                    key={file}
                                    className="rounded-xl bg-card px-4 py-3 flex justify-between items-center"
                                  >

                                    <span>
                                      {file}
                                    </span>

                                    <button
                                      onClick={() =>
                                        setSelectedResources(
                                          selectedResources.filter(
                                            (f) =>
                                              f !== file
                                          )
                                        )
                                      }
                                      className="text-red-400"
                                    >
                                      Remove
                                    </button>

                                  </div>

                                )
                              )}

                            </div>

                          </div>

                          <div className="flex justify-between pt-8">

                            <button
                              onClick={() =>
                                setCurrentStep(1)
                              }
                              className="px-5 py-3 rounded-xl border border-white/10"
                            >
                              Back
                            </button>

                            <div className="flex gap-3">

                              <button
                                onClick={() =>
                                  setCurrentStep(3)
                                }
                                className="px-5 py-3 rounded-xl border border-white/10 text-gray-300 hover:border-accent hover:text-primary transition"
                              >
                                Skip for Now
                              </button>

                              <button
                                onClick={() =>
                                  setCurrentStep(3)
                                }
                                className="px-6 py-3 rounded-xl bg-primary text-ink font-semibold"
                              >
                                Continue
                              </button>

                            </div>

                          </div>

                        </div>

                      )}

                      {/* ==================================================
                          STEP 3
                      ================================================== */}

                      {currentStep === 3 && (

                        <div className="space-y-6">

                          <h3 className="text-primary text-xl font-semibold">
                            Assign Skills
                          </h3>

                          <p className="text-gray-500">
                            Tell AI what each member is best at.
                          </p>

                          {team.map(
                            (member) => (

                              <div
                                key={member.id}
                                className="flex items-center justify-between rounded-2xl bg-surface border border-white/10 p-4"
                              >

                                <span className="text-primary">
                                  {member.name}
                                </span>

                                <select
                                  value={
                                    memberSkills[
                                      member.id
                                    ] || ""
                                  }
                                  onChange={(e) =>
                                    setMemberSkills(
                                      (prev) => ({
                                        ...prev,
                                        [member.id]:
                                          e.target.value,
                                      })
                                    )
                                  }
                                  className="bg-card rounded-xl border border-white/10 px-3 py-2"
                                >

                                  <option value="">
                                    Select
                                  </option>

                                  <option>
                                    Frontend
                                  </option>

                                  <option>
                                    Backend
                                  </option>

                                  <option>
                                    UI/UX
                                  </option>

                                  <option>
                                    AI/ML
                                  </option>

                                  <option>
                                    Testing
                                  </option>

                                  <option>
                                    Documentation
                                  </option>

                                </select>

                              </div>

                            )
                          )}

                          <div className="flex justify-between">

                            <button
                              onClick={() =>
                                setCurrentStep(2)
                              }
                              className="px-5 py-3 rounded-xl border border-white/10"
                            >
                              Back
                            </button>

                            <button
                              onClick={() =>
                                setCurrentStep(4)
                              }
                              className="px-6 py-3 rounded-xl bg-primary text-ink font-semibold"
                            >
                              Next
                            </button>

                          </div>

                        </div>

                      )}

                      {/* ==================================================
                          STEP 4
                      ================================================== */}

                      {currentStep === 4 && (

                        <div className="space-y-8">

                          <div>

                            <h2 className="text-primary text-xl font-semibold">
                              Additional AI Instructions
                            </h2>

                            <p className="text-gray-500 mt-2">
                              Tell AI any preferences before generating the roadmap.
                            </p>

                          </div>

                          <div>

                            <label className="text-sm text-gray-400 block mb-2">
                              Instructions
                            </label>

                            <textarea
                              rows={8}
                              value={aiInstructions}
                              onChange={(e) =>
                                setAiInstructions(
                                  e.target.value
                                )
                              }
                              placeholder={`Examples:

• Prioritize Backend first

• Keep weekends light

• Finish frontend before AI

• Don't overload beginners

• Documentation only after testing`}
                              className="w-full rounded-2xl bg-surface border border-white/10 p-5 resize-none text-primary outline-none focus:border-accent"
                            />

                          </div>

                          <div className="flex justify-between">

                            <button
                              onClick={() =>
                                setCurrentStep(3)
                              }
                              className="px-6 py-3 rounded-xl border border-white/10"
                            >
                              Back
                            </button>

                            <button
                              onClick={() =>
                                setCurrentStep(5)
                              }
                              className="px-6 py-3 rounded-xl bg-primary text-ink font-semibold"
                            >
                              Next
                            </button>

                          </div>

                        </div>

                      )}

                      {/* ==================================================
                          STEP 5 — GENERATE
                      ================================================== */}

                      {currentStep === 5 &&
                        !roadmap && (

                          <div className="h-full flex flex-col items-center justify-center text-center">

                            <Sparkles
                              size={44}
                              className={
                                isGenerating
                                  ? "text-accent mb-6 animate-pulse"
                                  : "text-accent mb-6"
                              }
                            />

                            <h2 className="text-primary text-2xl font-semibold mb-3">
                              {isGenerating
                                ? "Generating your roadmap..."
                                : "Ready to Generate"}
                            </h2>

                            {!isGenerating && (

                              <p className="text-gray-500 max-w-lg mb-8">

                                AI will create:

                                <br />

                                - Project Phases

                                <br />

                                - Daily subtasks

                                <br />

                                - Member-wise task assignments

                                <br />

                                - Kanban columns

                                <br />

                                - Smart roadmap

                              </p>

                            )}

                            {isGenerating && (

                              <p className="text-gray-500 max-w-lg mb-8">
                                This usually takes a few seconds.
                              </p>

                            )}

                            {generateError && (

                              <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 mb-6 max-w-lg">
                                {generateError}
                              </p>

                            )}

                            <div className="flex gap-4">

                              <button
                                disabled={
                                  isGenerating
                                }
                                onClick={() =>
                                  setCurrentStep(4)
                                }
                                className="px-6 py-3 rounded-xl border border-white/10 disabled:opacity-40"
                              >
                                Back
                              </button>

                              <button
                                disabled={
                                  isGenerating
                                }
                                onClick={
                                  handleGenerate
                                }
                                className="px-8 py-4 rounded-2xl bg-primary text-ink font-semibold flex items-center gap-2 disabled:opacity-60"
                              >

                                {isGenerating ? (

                                  <>
                                    <Loader2
                                      size={18}
                                      className="animate-spin"
                                    />

                                    Generating...
                                  </>

                                ) : (

                                  "Generate AI Roadmap"

                                )}

                              </button>

                            </div>

                          </div>

                        )}

                      {/* ==================================================
                          STEP 5 — REVIEW ROADMAP
                      ================================================== */}

                      {currentStep === 5 &&
                        roadmap && (

                          <div className="space-y-6">

                            <div className="flex items-center justify-between">

                              <div>

                                <h2 className="text-primary text-xl font-semibold">
                                  Review Your Roadmap
                                </h2>

                                <p className="text-gray-500 text-sm mt-1">
                                  Check the plan below. Saving to your workspace comes next.
                                </p>

                              </div>

                              <button
                                onClick={() =>
                                  setRoadmap(null)
                                }
                                className="flex items-center gap-2 text-sm text-gray-400 hover:text-primary px-4 py-2 rounded-xl border border-white/10"
                              >

                                <RotateCcw
                                  size={14}
                                />

                                Regenerate

                              </button>

                            </div>

                            <div className="space-y-4">

                              {roadmap.phases.map(
                                (
                                  phase,
                                  pIdx
                                ) => (

                                  <div
                                    key={pIdx}
                                    className="rounded-2xl bg-surface border border-white/10 p-5"
                                  >

                                    {/* PHASE TITLE */}

                                    <input
                                      value={
                                        phase.title
                                      }
                                      onChange={(e) => {

                                        if (
                                          !roadmap
                                        )
                                          return;

                                        const updated =
                                          structuredClone(
                                            roadmap
                                          );

                                        updated.phases[
                                          pIdx
                                        ].title =
                                          e.target.value;

                                        setRoadmap(
                                          updated
                                        );

                                      }}
                                      className="w-full rounded-xl bg-card border border-white/10 px-4 py-3 text-primary font-semibold mb-4"
                                    />

                                    {/* DELETE PHASE */}

                                    <div className="flex justify-end mb-4">

                                      <button
                                        onClick={() => {

                                          if (
                                            !roadmap
                                          )
                                            return;

                                          const updated =
                                            structuredClone(
                                              roadmap
                                            );

                                          updated.phases.splice(
                                            pIdx,
                                            1
                                          );

                                          setRoadmap(
                                            updated
                                          );

                                        }}
                                        className="text-red-400 hover:text-red-300 text-sm"
                                      >
                                        Delete Phase
                                      </button>

                                    </div>

                                    {/* TASKS */}

                                    <div className="space-y-2">

                                      {phase.tasks.map(
                                        (
                                          task,
                                          taskIndex
                                        ) => (

                                          <div
                                            key={
                                              task.id
                                            }
                                            className="rounded-xl bg-card border border-white/10 p-4 space-y-4"
                                          >

                                            {/* TASK TITLE */}

                                            <div>

                                              <label className="text-xs text-gray-500 block mb-1">
                                                Task
                                              </label>

                                              <input
                                                value={
                                                  task.title
                                                }
                                                onChange={(e) => {

                                                  if (
                                                    !roadmap
                                                  )
                                                    return;

                                                  const updated =
                                                    structuredClone(
                                                      roadmap
                                                    );

                                                  updated
                                                    .phases[
                                                      pIdx
                                                    ]
                                                    .tasks[
                                                      taskIndex
                                                    ]
                                                    .title =
                                                    e.target.value;

                                                  setRoadmap(
                                                    updated
                                                  );

                                                }}
                                                className="w-full rounded-xl bg-surface border border-white/10 px-3 py-2 text-primary"
                                              />

                                            </div>

                                            <div className="grid grid-cols-2 gap-4">

                                              {/* DAY */}

                                              <div>

                                                <label className="text-xs text-gray-500 block mb-1">
                                                  Day
                                                </label>

                                                <input
                                                  type="number"
                                                  value={
                                                    task.day
                                                  }
                                                  onChange={(e) => {

                                                    if (
                                                      !roadmap
                                                    )
                                                      return;

                                                    const updated =
                                                      structuredClone(
                                                        roadmap
                                                      );

                                                    updated
                                                      .phases[
                                                        pIdx
                                                      ]
                                                      .tasks[
                                                        taskIndex
                                                      ]
                                                      .day =
                                                      Number(
                                                        e
                                                          .target
                                                          .value
                                                      );

                                                    setRoadmap(
                                                      updated
                                                    );

                                                  }}
                                                  className="w-full rounded-xl bg-surface border border-white/10 px-3 py-2"
                                                />

                                              </div>

                                              {/* ASSIGNED TO */}

                                              <div>

                                                <label className="text-xs text-gray-500 block mb-1">
                                                  Assigned To
                                                </label>

                                                <select
                                                  value={
                                                    task.assigned_to
                                                  }
                                                  onChange={(e) => {

                                                    if (
                                                      !roadmap
                                                    )
                                                      return;

                                                    const updated =
                                                      structuredClone(
                                                        roadmap
                                                      );

                                                    updated
                                                      .phases[
                                                        pIdx
                                                      ]
                                                      .tasks[
                                                        taskIndex
                                                      ]
                                                      .assigned_to =
                                                      e.target.value;

                                                    setRoadmap(
                                                      updated
                                                    );

                                                  }}
                                                  className="w-full rounded-xl bg-surface border border-white/10 px-3 py-2"
                                                >

                                                  {team.map(
                                                    (
                                                      member
                                                    ) => (

                                                      <option
                                                        key={
                                                          member.id
                                                        }
                                                        value={
                                                          member.name
                                                        }
                                                      >
                                                        {
                                                          member.name
                                                        }
                                                      </option>

                                                    )
                                                  )}

                                                </select>

                                              </div>

                                            </div>

                                            {/* DELETE TASK */}

                                            <div className="flex justify-end pt-2">

                                              <button
                                                onClick={() => {

                                                  if (
                                                    !roadmap
                                                  )
                                                    return;

                                                  const updated =
                                                    structuredClone(
                                                      roadmap
                                                    );

                                                  updated
                                                    .phases[
                                                      pIdx
                                                    ]
                                                    .tasks.splice(
                                                      taskIndex,
                                                      1
                                                    );

                                                  setRoadmap(
                                                    updated
                                                  );

                                                }}
                                                className="text-red-400 hover:text-red-300 text-sm"
                                              >
                                                Delete Task
                                              </button>

                                            </div>

                                          </div>

                                        )
                                      )}

                                    </div>

                                    {/* ADD TASK */}

                                    <div className="mt-5">

                                      <button
                                        onClick={() => {

                                          if (
                                            !roadmap
                                          )
                                            return;

                                          const updated =
                                            structuredClone(
                                              roadmap
                                            );

                                          updated
                                            .phases[
                                              pIdx
                                            ]
                                            .tasks.push({
                                              id: crypto.randomUUID(),
                                              title:
                                                "New Task",
                                              day: 1,
                                              assigned_to:
                                                "",
                                              skill_required:
                                                "",
                                            });

                                          setRoadmap(
                                            updated
                                          );

                                        }}
                                        className="text-accent text-sm hover:underline"
                                      >
                                        + Add Task
                                      </button>

                                    </div>

                                  </div>

                                )
                              )}

                              {/* ADD PHASE */}

                              <div className="pt-6">

                                <button
                                  onClick={() => {

                                    if (
                                      !roadmap
                                    )
                                      return;

                                    const updated =
                                      structuredClone(
                                        roadmap
                                      );

                                    updated.phases.push(
                                      {
                                        title: `Phase ${
                                          updated.phases
                                            .length +
                                          1
                                        }`,
                                        tasks: [],
                                      }
                                    );

                                    setRoadmap(
                                      updated
                                    );

                                  }}
                                  className="px-5 py-3 rounded-xl border border-white/10 hover:border-accent"
                                >
                                  + Add Phase
                                </button>

                              </div>

                            </div>

                            {/* EXTRACTION ERROR */}

                            {extractError && (

                              <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
                                {extractError}
                              </p>

                            )}

                            {/* ACTIONS */}

                            <div className="flex justify-end gap-4 pt-8">

                              <button
                                onClick={() =>
                                  setRoadmap(null)
                                }
                                className="px-5 py-3 rounded-xl border border-white/10"
                              >
                                Regenerate
                              </button>

                              <button
                                disabled={
                                  isExtracting
                                }
                                onClick={
                                  handleExtractRoadmap
                                }
                                className="px-5 py-3 rounded-xl border border-white/10 flex items-center gap-2 disabled:opacity-50"
                              >

                                {isExtracting ? (

                                  <Loader2
                                    size={16}
                                    className="animate-spin"
                                  />

                                ) : (

                                  <FileText
                                    size={16}
                                  />

                                )}

                                {extractDone
                                  ? "Roadmap Saved ✓"
                                  : isExtracting
                                  ? "Extracting..."
                                  : "Extract Roadmap"}

                              </button>

                              <button
                                onClick={
                                  handleAcceptRoadmap
                                }
                                className="px-8 py-3 rounded-xl bg-primary text-ink font-semibold"
                              >
                                Accept Roadmap
                              </button>

                            </div>

                          </div>

                        )}

                    </>

                  )}

                </div>

              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}