import { useRef, useState, useEffect, useMemo } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AlertTriangle, ListChecks, Users, MessageCircle, FolderOpen, Flag, ArrowLeft, Trash2, Loader2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import CountUp from '../components/reactbits/CountUp';
import SpotlightCard from '../components/reactbits/SpotlightCard';
import BlackHoleCountdown from '../components/deadline/BlackHoleCountdown';
import { useAsyncData } from '../hooks/useAsyncData';
import { getWorkspace, deleteWorkspace, toggleTaskComplete } from '../api/workspace';
import { getWorkspaceInvites, cancelInvite } from '../api/invites';
import { supabase } from '../lib/supabaseClient';
import type { KanbanColumn } from '../api/types';
import { createArchive } from '../api/archive';
import AskAIWidget from '../components/workspace/AskAIWidget';
import InvitesSection from '../components/workspace/InvitesSection';
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
const KANBAN_COLUMNS: { id: string; label: string }[] = [
  { id: 'todo', label: 'To Do' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
];
const WorkspacePage = () => {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const [memberSkills,setMemberSkills]=useState<Record<string,string>>({})
  const { data: ws, loading, error, refresh} =
  useAsyncData(() => getWorkspace(workspaceId!), [workspaceId]);

  // Fetch pending invites for the Team Dashboard display
  const { data: workspaceInvites, loading: loadingInvites, refresh: refreshInvites } = useAsyncData(
    () => getWorkspaceInvites(workspaceId!),
    [workspaceId]
  );
  const pendingInvites = (workspaceInvites ?? []).filter((i) => i.status === 'pending');

  // Fetch active member profile IDs to prevent duplicate invites
  const { data: membersRaw } = useAsyncData(
    async () => {
      const { data, error } = await supabase
        .from('workspace_members')
        .select('profile_id')
        .eq('workspace_id', workspaceId!);
      if (error) throw new Error(error.message);
      return (data ?? []) as { profile_id: string | null }[];
    },
    [workspaceId]
  );

  // Compute already member or invited list
  const alreadyInvitedIds = useMemo(() => {
    const isSupabase = Boolean(import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes('placeholder'));
    const activeMemberProfileIds = isSupabase
      ? (membersRaw ?? []).map((m) => m.profile_id).filter(Boolean) as string[]
      : (ws?.team ?? []).map((m) => m.id);
    const pendingIds = (workspaceInvites ?? []).map((i) => i.userId).filter(Boolean);
    return [...activeMemberProfileIds, ...pendingIds];
  }, [ws, membersRaw, workspaceInvites]);



  // Fetch current user's membership role to determine if they are the owner
  const { data: userRole } = useAsyncData(
    async () => {
      const isSupabase = Boolean(import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes('placeholder'));
      if (!isSupabase) return 'Owner';
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId!)
        .eq('profile_id', user.id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data?.role ?? null;
    },
    [workspaceId]
  );

  const isOwner = useMemo(() => {
    const isSupabase = Boolean(import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes('placeholder'));
    if (!isSupabase) return true;
    return userRole === 'Owner';
  }, [userRole]);
  
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [archiveResult, setArchiveResult] = useState<'Winner' | 'Finalist' | 'Runner-up' | 'Shipped'>('Shipped');
  const [archiveStack, setArchiveStack] = useState('');
  const [archiveUrl, setArchiveUrl] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [kanban, setKanban] = useState<KanbanColumn[]>([]);
  const [projectIdea,setProjectIdea]=useState("")
const [currentStep, setCurrentStep] = useState(1);
const [selectedResources, setSelectedResources] = useState<string[]>([]);
const [aiInstructions, setAiInstructions] = useState("");
const [plannerOpen, setPlannerOpen] = useState(false);

useEffect(() => {
  if (!workspaceId) return;

  const savedPlannerState = localStorage.getItem(
    `planner_state_${workspaceId}`
  );

  const plannerIntroSeen = localStorage.getItem(
    `planner_intro_seen_${workspaceId}`
  );

  if (savedPlannerState || plannerIntroSeen) {
    return;
  }

  setPlannerOpen(true);
}, [workspaceId]);

  useEffect(() => {
    if (ws) setKanban(ws.kanban);
  }, [ws]);
  const phaseGroups = useMemo(() => {
    const groups = new Map<string, { total: number; done: number; tasks: (KanbanColumn['tasks'][number] & { columnId: string })[] }>();

    kanban.forEach((column) => {
      column.tasks.forEach((task) => {
        const key = task.phase ?? 'Unphased';
        const entry = groups.get(key) ?? { total: 0, done: 0, tasks: [] };
        entry.total += 1;
        if (column.id === 'done') entry.done += 1;
        entry.tasks.push({ ...task, columnId: column.id });
        groups.set(key, entry);
      });
    });

    return Array.from(groups.entries()).map(([title, data]) => {
      const columnId = data.done === 0 ? 'todo' : data.done === data.total ? 'done' : 'in-progress';
      return {
        title,
        done: data.done,
        total: data.total,
        columnId,
        tasks: data.tasks.sort((a, b) => (a.day ?? 0) - (b.day ?? 0)),
      };
    });
  }, [kanban]);

  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());

  const togglePhaseExpanded = (title: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };
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
  await refresh();
} catch (e) {
  setActionError((e as Error).message);
}
  };

  /* const handleAssignTask = async (taskId: string, memberId: string) => {
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
  }; */

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
      <nav className="fixed top-0 left-0 right-0 z-[100] border-b border-white/10 bg-white/[0.04] backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-primary truncate">
            {ws?.competitionName ?? 'SprintSpace'}
          </span>
          <div className="flex items-center gap-1 md:gap-2">
            <button
              onClick={() => setPlannerOpen(true)}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-primary hover:bg-white/5 transition"
            >
              <Sparkles size={16} className="text-accent" />
              AskAI
            </button>
            <Link
              to={`/workspace/${workspaceId}/resources`}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-primary hover:bg-white/5 transition"
            >
              <FolderOpen size={16} className="text-accent" />
              Resource Hub
            </Link>
            <Link
              to={`/sprintroom/${workspaceId}`}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-primary hover:bg-white/5 transition"
            >
              <MessageCircle size={16} className="text-accent" />
              Sprintroom
            </Link>
          </div>
        </div>
      </nav>
      <section className="relative pt-24 md:pt-28 pb-10 px-4 md:px-6">
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
              <h1 className="font-display text-primary text-2xl md:text-4xl mt-1 mb-6">
                {ws.competitionName}
              </h1>

              <InvitesSection
                workspaceId={workspaceId!}
                competitionName={ws.competitionName}
                currentMembersCount={ws.team.length}
                team={ws.team}
                isOwner={isOwner}
                invites={workspaceInvites ?? []}
                loadingInvites={loadingInvites}
                refreshInvites={refreshInvites}
                alreadyInvitedIds={alreadyInvitedIds}
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 grid grid-cols-2 gap-3 sm:gap-4">
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

          {phaseGroups.length > 0 && (
            <section className="px-4 md:px-6 py-10">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-2 mb-6">
                <ListChecks size={16} className="text-primary" />
                <h2 className="text-primary text-lg">Smart Kanban</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {KANBAN_COLUMNS.map((column) => {
                  const columnPhases = phaseGroups.filter((p) => p.columnId === column.id);
                  return (
                    <div key={column.id} className="bg-card rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-gray-400">{column.label}</span>
                        <span className="text-xs text-gray-600">{columnPhases.length}</span>
                      </div>
                      <div className="space-y-2">
                        {columnPhases.length === 0 && (
                          <p className="text-xs text-gray-600 text-center py-4">No phases yet.</p>
                        )}
                        {columnPhases.map((phase) => {
                          const isExpanded = expandedPhases.has(phase.title);
                          const pct = phase.total === 0 ? 0 : Math.round((phase.done / phase.total) * 100);
                          return (
                            <div
                              key={phase.title}
                              className="bg-surface rounded-xl border border-white/5 overflow-hidden"
                            >
                              <button
                                onClick={() => togglePhaseExpanded(phase.title)}
                                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
                              >
                                <div className="min-w-0 flex-1">
                                  <span className="text-sm text-primary/90 block truncate">{phase.title}</span>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <div className="h-1 flex-1 rounded-full bg-white/10 overflow-hidden">
                                      <div
                                        className="h-full rounded-full bg-accent transition-all"
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                    <span className="text-[11px] text-gray-500 shrink-0">
                                      {phase.done}/{phase.total}
                                    </span>
                                  </div>
                                </div>
                                {isExpanded ? (
                                  <ChevronUp size={14} className="text-gray-500 shrink-0" />
                                ) : (
                                  <ChevronDown size={14} className="text-gray-500 shrink-0" />
                                )}
                              </button>

                              {isExpanded && (
                                <div className="px-4 pb-3 space-y-2 border-t border-white/5 pt-3">
                                  {phase.tasks.map((task) => {
                                    const assignedMember = ws.team.find((m) => m.id === task.assignedTo);
                                    const isDone = task.columnId === 'done';
                                    return (
                                      <div key={task.id} className="text-xs">
                                        <span
                                          className={isDone ? 'text-gray-500 line-through' : 'text-primary/90'}
                                        >
                                          {task.title}
                                        </span>
                                        <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                                          <span className={assignedMember ? 'text-accent' : 'text-gray-600'}>
                                            {assignedMember?.name ?? 'Unassigned'}
                                          </span>
                                          {task.day != null && (
                                            <span className="text-gray-600">· Day {task.day}</span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
          )}
          {ws.team.length > 0 && (
            <section className="px-4 md:px-6 py-10">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-primary text-lg mb-6">Member Task Lists</h2>

                <div className="flex flex-wrap gap-2 mb-6">
                  {ws.team.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMemberId(m.id)}
                      className={`text-xs px-3.5 py-1.5 rounded-full border transition-colors ${
                        (selectedMemberId ?? ws.team[0].id) === m.id
                          ? 'bg-primary text-ink border-primary'
                          : 'border-white/10 text-gray-400 hover:text-primary hover:border-white/30'
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>

                <div className="bg-card rounded-2xl p-4 border border-white/5">
                  {(() => {
                    const activeId = selectedMemberId ?? ws.team[0].id;
                    const myTasks = kanban
                      .flatMap((col) => col.tasks.map((t) => ({ ...t, columnId: col.id })))
                      .filter((t) => t.assignedTo === activeId)
                      .sort((a, b) => (a.day ?? 0) - (b.day ?? 0));

                    if (myTasks.length === 0) {
                      return <p className="text-gray-500 text-sm text-center py-6">No tasks assigned yet.</p>;
                    }

                    return (
                      <div className="space-y-2">
                        {myTasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center gap-3 bg-surface rounded-xl px-4 py-3 border border-white/5"
                          >
                            <input
                              type="checkbox"
                              checked={task.columnId === 'done'}
                              onChange={() => handleToggleTask(task.id, task.columnId)}
                              className="accent-accent shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <span
                                className={`text-sm block ${
                                  task.columnId === 'done' ? 'text-gray-500 line-through' : 'text-primary/90'
                                }`}
                              >
                                {task.title}
                              </span>
                              {task.phase && (
                                <span className="text-[11px] text-gray-500">{task.phase}</span>
                              )}
                            </div>
                            {task.day != null && (
                              <span className="text-[11px] text-accent shrink-0">Day {task.day}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </section>
          )}

          <section className="px-4 md:px-6 py-10">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                  <h2 className="text-primary text-lg mb-6">Team Dashboard</h2>
                  <div className="space-y-5">
                    {/* Active members */}
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

                    {/* Pending invites integrated directly into the list */}
                    {pendingInvites.map((invite) => (
                      <div key={invite.id}>
                        <div className="flex items-baseline justify-between mb-1.5">
                          <span className="text-primary text-sm">{invite.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-yellow-400 text-xs">Invite pending</span>
                            {isOwner && (
                              <button
                                onClick={async () => {
                                  await cancelInvite(invite.id);
                                  refreshInvites();
                                }}
                                className="text-[11px] text-red-400 hover:text-red-300 border border-red-400/20 rounded-lg px-2 py-0.5 transition-colors"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full bg-yellow-500/25 w-0 animate-pulse" />
                        </div>
                      </div>
                    ))}
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
            </div>
          </section>

          <section className="px-4 md:px-6 py-10">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-primary text-lg mb-6">Action Center</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
                  <Link to={`/sprintroom/${workspaceId}`} className="block h-full">
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
                  <Link to={`/workspace/${workspaceId}/resources`} className="block h-full">
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
 pendingInvites={pendingInvites}
  deadline={ws?.deadline ?? ""}
  competitionName={ws?.competitionName ?? ""}

  workspaceId={workspaceId!}
refreshWorkspace={refresh}
/>
    </div>
  );
};

export default WorkspacePage;