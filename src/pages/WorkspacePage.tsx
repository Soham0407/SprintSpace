import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { AlertTriangle, ListChecks } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import CountUp from '../components/reactbits/CountUp';
import SpotlightCard from '../components/reactbits/SpotlightCard';
import BlackHoleCountdown from '../components/deadline/BlackHoleCountdown';
import { useAsyncData } from '../hooks/useAsyncData';
import { getWorkspace } from '../api/workspace';

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
  const { data: ws, loading } = useAsyncData(getWorkspace, []);

  return (
    <div className="bg-ink min-h-screen">
      <section className="relative pt-28 pb-10 px-4 md:px-6">
        <Navbar />
        <div className="max-w-6xl mx-auto">
          {loading || !ws ? (
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

                {/* The deadline gets real visual weight — not another small stat tile */}
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
                {ws.kanban.map((column) => (
                  <div key={column.id} className="bg-card rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-400">{column.label}</span>
                      <span className="text-xs text-gray-600">{column.tasks.length}</span>
                    </div>
                    <div className="space-y-2">
                      {column.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="bg-surface rounded-xl px-4 py-3 text-sm text-primary/90 border border-white/5"
                        >
                          {task.title}
                        </div>
                      ))}
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
                  {ws.team.map((member) => (
                    <ProgressBar
                      key={member.id}
                      label={member.name}
                      sub={`${member.role} · ${member.progress}%`}
                      value={member.progress}
                    />
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
          </section>
        </>
      )}
    </div>
  );
};

export default WorkspacePage;
