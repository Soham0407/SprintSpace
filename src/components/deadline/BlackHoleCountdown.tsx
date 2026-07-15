import { useEffect, useRef, useState } from 'react';

interface BlackHoleCountdownProps {
  deadline: string; // ISO date string
  size?: number;
}

interface Particle {
  angle: number;
  radius: number;
  speed: number;
}

function formatRemaining(ms: number) {
  if (ms <= 0) return { d: 0, h: 0, m: 0, s: 0, expired: true };
  const totalSeconds = Math.floor(ms / 1000);
  return {
    d: Math.floor(totalSeconds / 86400),
    h: Math.floor((totalSeconds % 86400) / 3600),
    m: Math.floor((totalSeconds % 3600) / 60),
    s: totalSeconds % 60,
    expired: false,
  };
}

const URGENCY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // a week: "calm" -> "critical" range

const BlackHoleCountdown = ({ deadline, size = 200 }: BlackHoleCountdownProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef(0);
  const [remaining, setRemaining] = useState(() =>
    formatRemaining(new Date(deadline).getTime() - Date.now()),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(formatRemaining(new Date(deadline).getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const center = size / 2;
    const horizonR = size * 0.1;
    const outerR = size * 0.46;

    if (particlesRef.current.length === 0) {
      particlesRef.current = new Array(70).fill(0).map(() => ({
        angle: Math.random() * Math.PI * 2,
        radius: horizonR + Math.random() * (outerR - horizonR),
        speed: 0.4 + Math.random() * 0.8,
      }));
    }

    const tick = () => {
      const msRemaining = Math.max(0, new Date(deadline).getTime() - Date.now());
      const urgency = 1 - Math.min(1, msRemaining / URGENCY_WINDOW_MS); // 0 calm -> 1 critical

      ctx.clearRect(0, 0, size, size);

      // Ambient glow, reddening as urgency rises
      const glow = ctx.createRadialGradient(center, center, horizonR * 0.5, center, center, outerR * 1.15);
      const gG = Math.round(91 - urgency * 55);
      const gB = Math.round(46 - urgency * 26);
      glow.addColorStop(0, `rgba(255,${gG},${gB},${0.22 + urgency * 0.22})`);
      glow.addColorStop(1, 'rgba(255,91,46,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(center, center, outerR * 1.15, 0, Math.PI * 2);
      ctx.fill();

      const infallRate = 0.05 + urgency * 0.32;

      particlesRef.current.forEach((p) => {
        const normRadius = (p.radius - horizonR) / (outerR - horizonR);
        p.angle += (p.speed / Math.max(0.35, p.radius / horizonR)) * 0.018;
        p.radius -= infallRate * (1.15 - normRadius);

        if (p.radius <= horizonR) {
          p.radius = outerR;
          p.angle = Math.random() * Math.PI * 2;
        }

        const x = center + Math.cos(p.angle) * p.radius;
        const y = center + Math.sin(p.angle) * p.radius * 0.55; // flatten into a disk

        const pg = Math.round(91 - urgency * 60);
        const pb = Math.round(46 - urgency * 30);
        const nearHorizon = normRadius < 0.22;

        ctx.beginPath();
        if (nearHorizon) {
          const tailAngle = p.angle - 0.18;
          const tx = center + Math.cos(tailAngle) * (p.radius + 4);
          const ty = center + Math.sin(tailAngle) * (p.radius + 4) * 0.55;
          ctx.strokeStyle = `rgba(255,${pg},${pb},0.85)`;
          ctx.lineWidth = 1.3;
          ctx.moveTo(tx, ty);
          ctx.lineTo(x, y);
          ctx.stroke();
        } else {
          ctx.fillStyle = `rgba(255,${pg},${pb},0.8)`;
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Event horizon
      ctx.beginPath();
      ctx.fillStyle = '#000000';
      ctx.arc(center, center, horizonR, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.strokeStyle = `rgba(255,${Math.round(91 - urgency * 45)},${Math.round(46 - urgency * 20)},0.55)`;
      ctx.lineWidth = 1;
      ctx.arc(center, center, horizonR, 0, Math.PI * 2);
      ctx.stroke();

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [deadline, size]);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <canvas ref={canvasRef} style={{ width: size, height: size }} />
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="font-mono text-primary text-sm sm:text-base tracking-wider">
          {remaining.expired
            ? 'CLOSED'
            : `${pad(remaining.d)}:${pad(remaining.h)}:${pad(remaining.m)}:${pad(remaining.s)}`}
        </span>
        <span className="font-mono text-[9px] text-gray-500 tracking-[0.2em] mt-1.5">
          {remaining.expired ? 'DEADLINE PASSED' : 'UNTIL DEADLINE'}
        </span>
      </div>
    </div>
  );
};

export default BlackHoleCountdown;
