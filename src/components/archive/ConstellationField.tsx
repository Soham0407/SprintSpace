import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Trophy } from 'lucide-react';
import type { ArchiveProject } from '../../api/types';

const RESULT_STYLE: Record<ArchiveProject['result'], { size: number; color: string; glow: string }> = {
  Winner: { size: 16, color: '#FFD68A', glow: 'rgba(255,214,138,0.9)' },
  Finalist: { size: 11, color: '#FF9466', glow: 'rgba(255,148,102,0.7)' },
  'Runner-up': { size: 11, color: '#FF9466', glow: 'rgba(255,148,102,0.7)' },
  Shipped: { size: 7, color: '#B9B6A6', glow: 'rgba(185,182,166,0.5)' },
};

function seeded(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return () => {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    return h / 0x7fffffff;
  };
}

interface StarPoint {
  project: ArchiveProject;
  x: number;
  y: number;
  delay: number;
  duration: number;
}

const ConstellationField = ({ projects }: { projects: ArchiveProject[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const stars: StarPoint[] = projects.map((p) => {
    const rand = seeded(p.id);
    return {
      project: p,
      x: 10 + rand() * 80,
      y: 14 + rand() * 68,
      delay: rand() * 4,
      duration: 2.4 + rand() * 2.2,
    };
  });

  const lines: [StarPoint, StarPoint][] = [];
  for (let i = 0; i < stars.length; i++) {
    for (let j = i + 1; j < stars.length; j++) {
      const shares = stars[i].project.stack.some((s) => stars[j].project.stack.includes(s));
      if (shares) lines.push([stars[i], stars[j]]);
    }
  }

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5;
      const relY = (e.clientY - rect.top) / rect.height - 0.5;
      if (groupRef.current) {
        groupRef.current.style.transform = `translate(${-relX * 16}px, ${-relY * 12}px)`;
      }
    };
    el.addEventListener('mousemove', handleMove);
    return () => el.removeEventListener('mousemove', handleMove);
  }, []);

  const active = stars.find((s) => s.project.id === selected);

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl overflow-hidden bg-card border border-white/5"
      style={{ height: 'min(70vh, 560px)' }}
      onClick={() => setSelected(null)}
    >
      <div className="absolute -top-20 -left-10 w-72 h-72 rounded-full bg-accent/10 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-blue-500/5 blur-[90px] pointer-events-none" />

      <div ref={groupRef} className="absolute inset-0 transition-transform duration-300 ease-out">
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {lines.map(([a, b], i) => (
            <line
              key={i}
              x1={`${a.x}%`}
              y1={`${a.y}%`}
              x2={`${b.x}%`}
              y2={`${b.y}%`}
              stroke="rgba(222,219,200,0.12)"
              strokeWidth={1}
            />
          ))}
        </svg>

        {stars.map((s) => {
          const style = RESULT_STYLE[s.project.result];
          const isActive = selected === s.project.id;
          return (
            <button
              key={s.project.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelected(isActive ? null : s.project.id);
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform hover:scale-150"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: style.size,
                height: style.size,
                background: style.color,
                boxShadow: `0 0 ${style.size * 1.6}px ${style.glow}`,
                animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
                outline: isActive ? `2px solid ${style.color}` : 'none',
                outlineOffset: 4,
              }}
              aria-label={s.project.name}
            />
          );
        })}
      </div>

      {active && (
        <div
          className="absolute bottom-5 left-5 right-5 sm:left-6 sm:right-auto sm:w-72 bg-ink/90 backdrop-blur border border-white/10 rounded-2xl p-5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={14} style={{ color: RESULT_STYLE[active.project.result].color }} />
            <span className="text-xs font-medium" style={{ color: RESULT_STYLE[active.project.result].color }}>
              {active.project.result}
            </span>
          </div>
          <h3 className="text-primary text-lg mb-1">{active.project.name}</h3>
          <p className="text-xs text-gray-500 mb-3">{active.project.competition}</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {active.project.stack.map((s) => (
              <span
                key={s}
                className="text-[10px] bg-white/5 border border-white/10 text-gray-400 rounded-full px-2 py-0.5"
              >
                {s}
              </span>
            ))}
          </div>
          <a
            href={active.project.href}
            className="flex items-center gap-1.5 text-xs text-primary/80 hover:text-primary transition-colors"
          >
            View project <ExternalLink size={12} />
          </a>
        </div>
      )}

      {!active && (
        <p className="absolute bottom-5 left-5 text-xs text-gray-600 pointer-events-none">
          Click a star to see the project
        </p>
      )}
    </div>
  );
};

export default ConstellationField;
