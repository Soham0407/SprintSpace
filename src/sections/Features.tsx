import { Users, KanbanSquare, Calendar, ArrowUpRight, Brain } from 'lucide-react';
import { motion, useInView, type Variants } from 'framer-motion';
import { useRef } from 'react';
import SpotlightCard from '../components/reactbits/SpotlightCard';
import CountUp from '../components/reactbits/CountUp';
import WordsPullUpMultiStyle from '../components/animations/WordsPullUpMultiStyle';
import Threads from '../components/reactbits/Threads';

const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const FeatureCard = ({
  index,
  icon,
  title,
  tag,
  points,
}: {
  index: number;
  icon: React.ReactNode;
  title: string;
  tag: string;
  points: string[];
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      <SpotlightCard className="h-full flex flex-col" spotlightColor="rgba(255, 91, 46, 0.15)">
        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-primary mb-6">
          {icon}
        </div>
        <span className="text-xs text-gray-500 mb-1">{tag}</span>
        <h3 className="text-primary text-lg md:text-xl mb-4">{title}</h3>
        <ul className="space-y-2 mb-6 flex-1">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-2 text-sm text-gray-400">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-accent shrink-0" />
              {point}
            </li>
          ))}
        </ul>
        <button className="flex items-center gap-1 text-sm text-primary/80 hover:text-primary transition-colors self-start">
          Learn more
          <ArrowUpRight size={14} />
        </button>
      </SpotlightCard>
    </motion.div>
  );
};

const Features = () => {
  const aiRef = useRef(null);
  const aiInView = useInView(aiRef, { once: true, margin: '-100px' });
  const healthRef = useRef(null);

  return (
    <section id="teammatch" className="min-h-screen bg-ink px-4 md:px-6 py-20 md:py-28 relative">
      <div className="absolute inset-0 bg-noise opacity-[0.12] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">
        <div className="mb-14 md:mb-20">
          <WordsPullUpMultiStyle
            containerClassName="justify-start text-xl sm:text-2xl md:text-3xl lg:text-4xl font-normal mb-2"
            segments={[{ text: 'Every tool your team actually needs.', className: 'text-primary' }]}
          />
          <WordsPullUpMultiStyle
            containerClassName="justify-start text-xl sm:text-2xl md:text-3xl lg:text-4xl font-normal"
            segments={[{ text: 'Nothing you have to explain twice.', className: 'text-gray-500' }]}
            staggerDelay={0.06}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
          {/* Standout card — the AI Context Engine gets its own ambient
              background, same way the brief's video card stood out from the
              rest of the grid. */}
          <motion.div
            ref={aiRef}
            custom={0}
            variants={cardVariants}
            initial="hidden"
            animate={aiInView ? 'visible' : 'hidden'}
            className="lg:col-span-2 relative rounded-3xl overflow-hidden border border-neutral-800 min-h-[260px] flex flex-col justify-end p-8"
          >
            <div className="absolute inset-0 opacity-50">
              <Threads color={[1, 0.36, 0.18]} amplitude={0.8} distance={0.2} enableMouseInteraction={false} />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-accent mb-4">
                <Brain size={18} />
              </div>
              <span className="text-xs text-gray-400">THE HEART OF SPRINTSPACE</span>
              <h3 className="text-primary text-2xl md:text-3xl mt-1 max-w-md">
                One AI that reads your rulebook, tasks, and timeline together.
              </h3>
            </div>
          </motion.div>

          <motion.div
            ref={healthRef}
            custom={1}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <SpotlightCard className="h-full flex flex-col justify-between" spotlightColor="rgba(255, 91, 46, 0.15)">
              <span className="text-xs text-gray-500">PROJECT HEALTH ENGINE</span>
              <div className="my-4">
                <span className="text-5xl md:text-6xl text-primary font-medium">
                  <CountUp to={87} duration={1.8} />
                </span>
                <span className="text-2xl text-gray-500"> /100</span>
              </div>
              <p className="text-sm text-gray-400">
                Live readiness score across every workspace — not just what's done, what's actually
                on schedule.
              </p>
            </SpotlightCard>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <FeatureCard
            index={2}
            icon={<Users size={18} />}
            tag="01"
            title="AI TeamMatch"
            points={[
              'Match by skills, interests & availability',
              'Publish recruitment posts for open roles',
              'No more random WhatsApp DMs',
            ]}
          />
          <FeatureCard
            index={3}
            icon={<KanbanSquare size={18} />}
            tag="02"
            title="Smart Kanban"
            points={[
              'Owner, priority, due date, dependencies',
              'Drag-and-drop across To Do / In Progress / Done',
              'Attachments & comments on every task',
            ]}
          />
          <FeatureCard
            index={4}
            icon={<Calendar size={18} />}
            tag="03"
            title="Timeline & Milestones"
            points={[
              'Auto-generated sprint plan from your deadline',
              'Recovers automatically when you fall behind',
              'Everyone always knows what\u2019s next',
            ]}
          />
        </div>
      </div>
    </section>
  );
};

export default Features;
