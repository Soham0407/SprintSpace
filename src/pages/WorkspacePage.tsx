import { useRef, useState, useEffect, useMemo } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AlertTriangle, ListChecks, Users, MessageCircle, FolderOpen, Flag, ArrowLeft, Trash2, Loader2 } from 'lucide-react';
import CountUp from '../components/reactbits/CountUp';
import SpotlightCard from '../components/reactbits/SpotlightCard';
import BlackHoleCountdown from '../components/deadline/BlackHoleCountdown';
import { useAsyncData } from '../hooks/useAsyncData';
import { getWorkspace, deleteWorkspace, toggleTaskComplete, assignTask } from '../api/workspace';
import type { KanbanColumn } from '../api/types';
import { createArchive } from '../api/archive';
import AskAIWidget from '../components/workspace/AskAIWidget';
import { useParams, useNavigate } from "react-router-dom";
const ProgressBar = ({ label, sub, value }: { label: string; sub: string; value: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <div ref={ref}>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-primary text-sm">{label}</span>
        <span className="text-gray-500 text-xs">{sub}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-accent"
          initial={{ width: 0 }}
          animate={isInView ? { width: `${value}%` } : {}}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
};

const WorkspacePage = () => {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const [memberSkills,setMemberSkills]=useState<Record<string,string>>({})
  const { data: ws, loading, error } =
  useAsyncData(() => getWorkspace(workspaceId!), [workspaceId]);
  
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [archiveResult, setArchiveResult] = useState<'Winner' | 'Finalist' | 'Runner-up' | 'Shipped'>('Shipped');
  const [archiveStack, setArchiveStack] = useState('');
  const [archiveUrl, setArchiveUrl] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [kanban, setKanban] = useState<KanbanColumn[]>([]);
  const [projectIdea,setProjectIdea]=useState("")
const [plannerOpen,setPlannerOpen]=useState(true)
const [isGenerating,setIsGenerating]=useState(false)
const [generatedPlan,setGeneratedPlan]=useState(null)
const [currentStep, setCurrentStep] = useState(1);
const [selectedResources, setSelectedResources] = useState<string[]>([]);
const [aiInstructions, setAiInstructions] = useState("");

  useEffect(() => {
    if (ws) setKanban(ws.kanban);
  }, [ws]);
  const memberProgress = useMemo(() => {
    const counts = new Map<string, { total: number; done: number }>();

    kanban.forEach((column) => {
      column.tasks.forEach((task) => {
        if (!task.assignedTo) return;
        const entry = counts.get(task.assignedTo) ?? { total: 0, done: 0 };
        entry.total += 1;
        if (column.id === 'done') entry.done += 1;
        counts.set(task.assignedTo, entry);
      });
    });

    const result = new Map<string, number>();
    counts.forEach((v, memberId) => {
      result.set(memberId, v.total === 0 ? 0 : Math.round((v.done / v.total) * 100));
    });
    return result;
  }, [kanban]);

  const handleToggleTask = async (taskId: string, currentColumnId: string) => {
    const completing = currentColumnId !== 'done';

    // Optimistic local move: pull task out of its current column, push into target column
    setKanban((prev) => {
      let movedTask: KanbanColumn['tasks'][number] | undefined;
      const withoutTask = prev.map((col) => {
        const found = col.tasks.find((t) => t.id === taskId);
        if (found) movedTask = found;
        return { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) };
      });
      if (!movedTask) return prev;

      const targetColumnId = completing ? 'done' : 'todo';
      const updatedTask = {
        ...movedTask,
        completedAt: completing ? new Date().toISOString() : null,
      };

      return withoutTask.map((col) =>
        col.id === targetColumnId ? { ...col, tasks: [...col.tasks, updatedTask] } : col
      );
    });

    try {
      await toggleTaskComplete(taskId, completing);
    } catch (e) {
      setActionError((e as Error).message);
    }
  };

  const handleAssignTask = async (taskId: string, memberId: string) => {
    const resolvedId = memberId === '' ? null : memberId;

    setKanban((prev) =>
      prev.map((col) => ({
        ...col,
        tasks: col.tasks.map((t) => (t.id === taskId ? { ...t, assignedTo: resolvedId } : t)),
      }))
    );

    try {
      await assignTask(taskId, resolvedId);
    } catch (e) {
      setActionError((e as Error).message);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this workspace and its linked competition? This action cannot be undone.")) {
      return;
    }
    
    setIsDeleting(true);
    setActionError(null);
    try {
      await deleteWorkspace(workspaceId!, ws?.competitionId);
      navigate('/dashboard');
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleArchive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ws) return;

    setIsArchiving(true);
    setActionError(null);
    try {
      const parsedStack = archiveStack
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      await createArchive({
        name: ws.competitionName,
        competition: ws.competitionName,
        competitionId: ws.competitionId,
        workspaceId: workspaceId,
        result: archiveResult,
        stack: parsedStack,
        href: archiveUrl || '#',
      });

      await deleteWorkspace(workspaceId!, ws.competitionId);

      setIsArchiveModalOpen(false);
      navigate('/dashboard');
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div className="bg-ink min-h-screen">
      <section className="relative pt-12 md:pt-16 pb-10 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          {error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <AlertTriangle size={48} className="text-red-400 mb-4" />
              <h2 className="text-primary text-xl mb-2">Error loading workspace</h2>
              <p className="text-gray-400 max-w-md mx-auto">{error.message}</p>
            </div>
          ) : loading || !ws ? (
            <div className="animate-pulse">
              <div className="h-3 w-32 bg-white/10 rounded mb-3" />
              <div className="h-10 w-72 bg-white/10 rounded mb-8" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 grid grid-cols-2 gap-3">
                  {new Array(3).fill(0).map((_, i) => (
                    <div key={i} className="h-24 bg-card border border-white/5 rounded-2xl" />
                  ))}
                </div>
                <div className="h-56 bg-card border border-white/5 rounded-2xl" />
              </div>
            </div>
          ) : (
            <>
              <span className="text-xs text-gray-500 tracking-wide">YOUR WORKSPACE</span>
              <h1 className="font-display text-primary text-2xl md:text-4xl mt-1 mb-8">
                {ws.competitionName}
              </h1>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 grid grid-cols-3 gap-3 sm:gap-4">
                  <SpotlightCard className="!p-5" spotlightColor="rgba(255, 91, 46, 0.15)">
                    <span className="text-xs text-gray-500 block mb-2">Project Health</span>
                    <span className="text-3xl text-primary">
                      <CountUp to={ws.healthScore} duration={1.5} />
                      <span className="text-lg text-gray-500">%</span>
                    </span>
                  </SpotlightCard>
                  <SpotlightCard className="!p-5" spotlightColor="rgba(255, 91, 46, 0.15)">
                    <span className="text-xs text-gray-500 block mb-2">Progress</span>
                    <span className="text-3xl text-primary">
                      <CountUp to={ws.progressPercent} duration={1.5} />
                      <span className="text-lg text-gray-500">%</span>
                    </span>
                  </SpotlightCard>
                  <SpotlightCard className="!p-5" spotlightColor="rgba(255, 91, 46, 0.15)">
                    <span className="text-xs text-gray-500 flex items-center gap-1.5 mb-2">
                      <AlertTriangle size={12} /> Blockers
                    </span>
                    <span className="text-3xl text-accent">{ws.criticalBlockers}</span>
                  </SpotlightCard>
                </div>

                <div className="bg-card border border-white/5 rounded-2xl flex flex-col items-center justify-center py-6">
                  <BlackHoleCountdown deadline={ws.deadline} size={150} />
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {!loading && ws && (
        <>
          <section className="px-4 md:px-6 py-10">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-2 mb-6">
                <ListChecks size={16} className="text-primary" />
                <h2 className="text-primary text-lg">Smart Kanban</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {kanban.map((column) => (
                  <div key={column.id} className="bg-card rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-400">{column.label}</span>
                      <span className="text-xs text-gray-600">{column.tasks.length}</span>
                    </div>
                    <div className="space-y-2">
                      {column.tasks.map((task) => {
                        const assignedMember = ws.team.find((m) => m.id === task.assignedTo);
                        return (
                          <div
                            key={task.id}
                            className="bg-surface rounded-xl px-4 py-3 border border-white/5"
                          >
                            <div className="flex items-start gap-2.5 mb-2">
                              <input
                                type="checkbox"
                                checked={column.id === 'done'}
                                onChange={() => handleToggleTask(task.id, column.id)}
                                className="mt-0.5 accent-accent shrink-0"
                              />
                              <span
                                className={`text-sm ${
                                  column.id === 'done' ? 'text-gray-500 line-through' : 'text-primary/90'
                                }`}
                              >
                                {task.title}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 pl-6">
                              <select
                                value={task.assignedTo ?? ''}
                                onChange={(e) => handleAssignTask(task.id, e.target.value)}
                                className="text-[11px] bg-transparent border border-white/10 rounded-full px-2 py-1 text-gray-400 focus:outline-none focus:border-accent"
                              >
                                <option value="">Unassigned</option>
                                {ws.team.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.name}
                                  </option>
                                ))}
                              </select>
                              {assignedMember && (
                                <span className="text-[10px] text-accent">{assignedMember.name}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="px-4 md:px-6 py-10">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <h2 className="text-primary text-lg mb-6">Team Dashboard</h2>
                <div className="space-y-5">
                  {ws.team.map((member) => {
                    const hasTasks = memberProgress.has(member.id);
                    const value = hasTasks ? memberProgress.get(member.id)! : member.progress;
                    const sub = hasTasks
                      ? `${member.role} · ${value}% of assigned tasks`
                      : `${member.role} · No tasks assigned`;
                    return (
                      <ProgressBar key={member.id} label={member.name} sub={sub} value={value} />
                    );
                  })}
                </div>
              </div>

              <div>
                <h2 className="text-primary text-lg mb-6">Timeline & Milestones</h2>
                <div className="space-y-3">
                  {ws.timeline.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 text-sm">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          item.status === 'done'
                            ? 'bg-primary'
                            : item.status === 'active'
                            ? 'bg-accent'
                            : 'bg-white/15'
                        }`}
                      />
                      <span className={item.status === 'pending' ? 'text-gray-600' : 'text-primary/90'}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="px-4 md:px-6 py-10">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-primary text-lg mb-6">Action Center</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
                  <Link to="/sprintroom" className="block h-full">
                    <SpotlightCard
                      className="h-full flex flex-col cursor-pointer"
                      spotlightColor="rgba(255, 91, 46, 0.15)"
                    >
                      <div className="w-11 h-11 rounded-lg bg-white/5 flex items-center justify-center text-primary mb-5">
                        <Users size={20} />
                      </div>
                      <h3 className="text-primary text-lg md:text-xl mb-3">SprintRoom</h3>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-sm text-gray-400">
                          <MessageCircle size={13} className="text-accent shrink-0" /> Team Chat
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-400">
                          <span className="mt-0 w-1 h-1 rounded-full bg-accent shrink-0" /> Meetings
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-400">
                          <span className="mt-0 w-1 h-1 rounded-full bg-accent shrink-0" /> Online Members
                        </li>
                      </ul>
                    </SpotlightCard>
                  </Link>
                </motion.div>

                <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
                  <Link to="/resources" className="block h-full">
                    <SpotlightCard
                      className="h-full flex flex-col cursor-pointer"
                      spotlightColor="rgba(255, 91, 46, 0.15)"
                    >
                      <div className="w-11 h-11 rounded-lg bg-white/5 flex items-center justify-center text-primary mb-5">
                        <FolderOpen size={20} />
                      </div>
                      <h3 className="text-primary text-lg md:text-xl mb-3">Resources</h3>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-sm text-gray-400">
                          <span className="mt-0 w-1 h-1 rounded-full bg-accent shrink-0" /> GitHub
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-400">
                          <span className="mt-0 w-1 h-1 rounded-full bg-accent shrink-0" /> Files
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-400">
                          <span className="mt-0 w-1 h-1 rounded-full bg-accent shrink-0" /> Rulebook
                        </li>
                      </ul>
                    </SpotlightCard>
                  </Link>
                </motion.div>
              </div>

              <div className="flex flex-col items-center gap-4 mt-6">
                {actionError && (
                  <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 w-full lg:w-2/3">
                    {actionError}
                  </p>
                )}
                
                <div className="flex flex-col sm:flex-row justify-center gap-4 w-full lg:w-2/3 mx-auto">
                  <motion.button
                    onClick={() => setIsArchiveModalOpen(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 flex items-center justify-center gap-2 border border-accent/50 rounded-2xl py-4 text-accent text-sm font-medium bg-card hover:shadow-[0_0_24px_2px_rgba(255,91,46,0.25)] transition-shadow"
                  >
                    <Flag size={16} />
                    Finish Competition & Archive
                  </motion.button>

                  <motion.button
                    disabled={isDeleting}
                    onClick={handleDelete}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 flex items-center justify-center gap-2 border border-red-500/50 rounded-2xl py-4 text-red-500 text-sm font-medium bg-card hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} />
                        Delete Workspace
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </section>

      {/* Archive Modal */}
      {isArchiveModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-card border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative"
          >
            <h3 className="font-display text-primary text-xl md:text-2xl mb-2">Finish & Archive Project</h3>
            <p className="text-gray-400 text-sm mb-6">
              Archive this workspace into your showcase! Once archived, it will be moved from active workspaces to the archive hub.
            </p>

            <form onSubmit={handleArchive} className="space-y-5">
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Project Result</label>
                <select
                  value={archiveResult}
                  onChange={(e) => setArchiveResult(e.target.value as any)}
                  className="w-full rounded-xl bg-surface border border-white/10 px-4 py-3 text-primary outline-none focus:border-accent"
                >
                  <option value="Shipped">Shipped</option>
                  <option value="Winner">Winner</option>
                  <option value="Finalist">Finalist</option>
                  <option value="Runner-up">Runner-up</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Tech Stack (comma separated)</label>
                <input
                  type="text"
                  placeholder="Next.js, Tailwind, Supabase"
                  value={archiveStack}
                  onChange={(e) => setArchiveStack(e.target.value)}
                  className="w-full rounded-xl bg-surface border border-white/10 px-4 py-3 text-primary outline-none focus:border-accent"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Project Demo / Code Link (Optional)</label>
                <input
                  type="url"
                  placeholder="https://github.com/..."
                  value={archiveUrl}
                  onChange={(e) => setArchiveUrl(e.target.value)}
                  className="w-full rounded-xl bg-surface border border-white/10 px-4 py-3 text-primary outline-none focus:border-accent"
                />
              </div>

              {actionError && (
                <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
                  {actionError}
                </p>
              )}

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsArchiveModalOpen(false)}
                  className="flex-1 rounded-2xl border border-white/10 py-3.5 text-primary text-sm font-medium bg-transparent hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isArchiving}
                  className="flex-1 rounded-2xl bg-primary text-ink py-3.5 text-sm font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
                >
                  {isArchiving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Archiving...
                    </>
                  ) : (
                    "Confirm & Archive"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
        </>
      )}
        <AskAIWidget
open={plannerOpen}
setOpen={setPlannerOpen}

projectIdea={projectIdea}
setProjectIdea={setProjectIdea}

memberSkills={memberSkills}
setMemberSkills={setMemberSkills}

currentStep={currentStep}
setCurrentStep={setCurrentStep}

selectedResources={selectedResources}
setSelectedResources={setSelectedResources}

aiInstructions={aiInstructions}
setAiInstructions={setAiInstructions}

team={ws?.team ?? []}
/>
    </div>
  );
};

export default WorkspacePage;