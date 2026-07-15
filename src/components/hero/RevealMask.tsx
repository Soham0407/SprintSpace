import { useEffect, useRef } from 'react';

const SPOTLIGHT_R = 260;

interface RevealMaskProps {
  children: React.ReactNode;
}

/**
 * Renders `children` full-bleed but masked so only a soft circle around the
 * (eased) cursor position is visible. The mask canvas is rendered at half
 * the container's resolution — the gradient is inherently soft, so nothing
 * looks different, but it roughly quarters the per-frame `toDataURL()` cost.
 */
const RevealMask = ({ children }: RevealMaskProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -999, y: -999 });
  const smooth = useRef({ x: -999, y: -999 });
  const rafRef = useRef(0);
  const frameRef = useRef(0);
  const sizeRef = useRef({ w: 0, h: 0 });

  useEffect(() => {
    const updateSize = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      sizeRef.current = { w: rect.width, h: rect.height };
      if (canvasRef.current) {
        canvasRef.current.width = Math.max(1, Math.round(rect.width / 2));
        canvasRef.current.height = Math.max(1, Math.round(rect.height / 2));
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    const setFromClient = (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      mouse.current = { x: clientX - rect.left, y: clientY - rect.top };
    };
    const handleMouseMove = (e: MouseEvent) => setFromClient(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) setFromClient(t.clientX, t.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    const tick = () => {
      smooth.current.x += (mouse.current.x - smooth.current.x) * 0.12;
      smooth.current.y += (mouse.current.y - smooth.current.y) * 0.12;
      frameRef.current += 1;

      // Regenerate the mask every other frame — halves the toDataURL cost,
      // imperceptible against the eased cursor motion.
      if (frameRef.current % 2 === 0) {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx && sizeRef.current.w > 0) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const scale = canvas.width / sizeRef.current.w;
          const cx = smooth.current.x * scale;
          const cy = smooth.current.y * scale;
          const r = SPOTLIGHT_R * scale;

          const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
          gradient.addColorStop(0, 'rgba(255,255,255,1)');
          gradient.addColorStop(0.4, 'rgba(255,255,255,1)');
          gradient.addColorStop(0.6, 'rgba(255,255,255,0.75)');
          gradient.addColorStop(0.75, 'rgba(255,255,255,0.4)');
          gradient.addColorStop(0.88, 'rgba(255,255,255,0.12)');
          gradient.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();

          if (revealRef.current) {
            const url = `url(${canvas.toDataURL()})`;
            revealRef.current.style.maskImage = url;
            revealRef.current.style.webkitMaskImage = url;
            revealRef.current.style.maskSize = '100% 100%';
            revealRef.current.style.webkitMaskSize = '100% 100%';
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-20">
      <canvas ref={canvasRef} className="hidden" aria-hidden />
      <div ref={revealRef} className="absolute inset-0 pointer-events-none">
        {children}
      </div>
    </div>
  );
};

export default RevealMask;
