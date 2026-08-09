const HeroSpaceLayer = () => {
  const stars = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: 0.8 + Math.random() * 1.6,
    delay: Math.random() * 5,
    duration: 2 + Math.random() * 3,
  }));

  const shootingStars = [
    { id: 0, top: '12%', left: '8%', delay: 3, duration: 11 },
    { id: 1, top: '32%', left: '48%', delay: 14, duration: 13 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
      <style>{`
        @keyframes heroSpaceTwinkle {
          0%, 100% { opacity: 0.12; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.25); }
        }
        @keyframes heroSpaceShoot {
          0%, 92% { opacity: 0; transform: rotate(-30deg) translateX(0); }
          93% { opacity: 1; transform: rotate(-30deg) translateX(0); }
          98% { opacity: 0.8; transform: rotate(-30deg) translateX(160px); }
          100% { opacity: 0; transform: rotate(-30deg) translateX(180px); }
        }
        @keyframes heroSpaceDiskSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .hero-space-star {
          position: absolute;
          border-radius: 9999px;
          background: #DEDBC8;
          animation-name: heroSpaceTwinkle;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          will-change: opacity, transform;
        }
        .hero-space-shooter {
          position: absolute;
          width: 110px; height: 1.5px;
          background: linear-gradient(90deg, rgba(255,255,255,0.85), rgba(255,255,255,0));
          border-radius: 9999px;
          opacity: 0;
          animation-name: heroSpaceShoot;
          animation-timing-function: ease-out;
          animation-iteration-count: infinite;
          will-change: opacity, transform;
        }
        .hero-space-blackhole {
          position: absolute;
          bottom: 6%;
          right: 5%;
          width: 90px;
          height: 90px;
        }
        .hero-space-disk {
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          background: conic-gradient(from 0deg, rgba(255,91,46,0) 0%, rgba(255,91,46,0.35) 25%, rgba(255,91,46,0) 55%, rgba(255,91,46,0.2) 80%, rgba(255,91,46,0) 100%);
          animation: heroSpaceDiskSpin 40s linear infinite;
          will-change: transform;
        }
        .hero-space-core {
          position: absolute;
          inset: 28%;
          border-radius: 9999px;
          background: #000;
          box-shadow: 0 0 14px 2px rgba(255,91,46,0.25);
        }
        .hero-space-line {
          position: absolute;
          height: 1px;
          background: rgba(222,219,200,0.14);
          transform-origin: left center;
        }
      `}</style>

      {stars.map((s) => (
        <span
          key={s.id}
          className="hero-space-star"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}

      {shootingStars.map((s) => (
        <span
          key={s.id}
          className="hero-space-shooter"
          style={{
            top: s.top,
            left: s.left,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}

      <div className="hero-space-line" style={{ top: '22%', left: '15%', width: '90px', transform: 'rotate(18deg)' }} />
      <div className="hero-space-line" style={{ top: '68%', left: '65%', width: '70px', transform: 'rotate(-24deg)' }} />

      <div className="hero-space-blackhole">
        <div className="hero-space-disk" />
        <div className="hero-space-core" />
      </div>
    </div>
  );
};

export default HeroSpaceLayer;