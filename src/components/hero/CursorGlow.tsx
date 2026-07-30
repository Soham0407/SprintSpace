import { useEffect, useRef } from 'react';

/**
 * A soft accent-colored glow that eases toward the cursor, sitting above
 * everything else in the hero. Deliberately separate from RevealMask's own
 * cursor tracking — keeps the (already-delicate) canvas masking logic
 * untouched while adding a second, purely decorative layer.
 */
const CursorGlow = () => {
  const ref = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: -999, y: -999 });
  const smooth = useRef({ x: -999, y: -999 });
  const raf = useRef(0);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMove);

    const tick = () => {
      smooth.current.x += (mouse.current.x - smooth.current.x) * 0.08;
      smooth.current.y += (mouse.current.y - smooth.current.y) * 0.08;
      if (ref.current) {
        ref.current.style.transform = `translate(${smooth.current.x}px, ${smooth.current.y}px)`;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="fixed top-0 left-0 w-[420px] h-[420px] -ml-[210px] -mt-[210px] pointer-events-none z-40 opacity-60"
      style={{
        background:
          'radial-gradient(circle, rgba(255,91,46,0.10) 0%, rgba(255,91,46,0.04) 35%, transparent 70%)',
      }}
    />
  );
};

export default CursorGlow;
