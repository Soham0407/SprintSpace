import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import ChaosMockup from '../components/hero/ChaosMockup';
import CleanMockup from '../components/hero/CleanMockup';
import RevealMask from '../components/hero/RevealMask';
import CursorGlow from '../components/hero/CursorGlow';
import { LiquidChrome } from '../components/reactbits/LiquidChrome';
import StarBorder from '../components/reactbits/StarBorder';
import ClickSpark from '../components/reactbits/ClickSpark';

const Hero = () => {
  return (
    <section className="relative w-full overflow-hidden bg-ink" style={{ height: '100dvh' }}>
      {/* Ambient background — a live, moving field standing in for the
          cinematic video backdrop (no real footage available to use) */}
      <div className="absolute inset-0 opacity-40 hero-zoom">
        <LiquidChrome baseColor={[0.05, 0.05, 0.06]} speed={0.25} amplitude={0.3} interactive={false} />
      </div>

      {/* Chaos layer — the "before" */}
      <div className="absolute inset-0">
        <ChaosMockup />
      </div>

      <div className="absolute inset-0 noise-overlay opacity-[0.25] mix-blend-overlay pointer-events-none z-10" />
      <div className="absolute inset-0 scanlines opacity-70 pointer-events-none z-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-transparent to-ink/75 pointer-events-none z-10" />

      {/* Reveal layer — clean SprintSpace dashboard, only visible in the cursor spotlight */}
      <RevealMask>
        <CleanMockup />
      </RevealMask>

      <CursorGlow />

      {/* HUD frame */}
      <div className="hud-corner hud-corner--tl" />
      <div className="hud-corner hud-corner--tr" />
      <div className="hud-corner hud-corner--bl" />
      <div className="hud-corner hud-corner--br" />

      <Navbar />

      {/* Heading */}
      <div className="absolute top-[22%] sm:top-[19%] left-0 right-0 flex flex-col items-center text-center px-5 pointer-events-none z-40">
        <span
          className="font-mono text-accent text-[10px] sm:text-xs tracking-[0.3em] mb-4 hero-anim hero-fade"
          style={{ animationDelay: '0.1s' }}
        >
          // AI-POWERED COMPETITION OS
        </span>
        <h1 className="font-display text-primary leading-[1.05]">
          <span
            className="block text-3xl sm:text-5xl md:text-6xl hero-anim hero-reveal"
            style={{ letterSpacing: '-0.01em', animationDelay: '0.25s' }}
          >
            SIX TOOLS BECOME
          </span>
          <span
            className="block text-3xl sm:text-5xl md:text-6xl mt-2 text-accent hero-anim hero-reveal"
            style={{ letterSpacing: '-0.01em', animationDelay: '0.42s' }}
          >
            ONE WORKSPACE
          </span>
        </h1>
      </div>

      {/* Bottom-left paragraph */}
      <div
        className="hidden sm:block absolute bottom-14 left-10 md:left-14 max-w-[240px] z-40 hero-anim hero-fade"
        style={{ animationDelay: '0.7s' }}
      >
        <p className="text-sm text-primary/70 leading-relaxed font-sans">
          Every hackathon starts scattered — WhatsApp threads, Trello boards, a Drive folder
          nobody can find. It doesn&apos;t have to stay that way.
        </p>
      </div>

      {/* Bottom-right block */}
      <div
        className="absolute bottom-10 sm:bottom-16 left-5 right-5 sm:left-auto sm:right-10 md:right-14 max-w-full sm:max-w-[260px] flex flex-col items-start gap-4 z-40 hero-anim hero-fade"
        style={{ animationDelay: '0.85s' }}
      >
        <p className="text-xs sm:text-sm text-primary/70 leading-relaxed font-sans">
          Move your cursor to see what&apos;s underneath. Then go build it for real.
        </p>
        <ClickSpark sparkColor="#FF5B2E" sparkCount={10} sparkRadius={16}>
          <Link to="/workspace">
            <StarBorder
              as="button"
              color="#FF5B2E"
              speed="4s"
              className="group"
            >
              <span
                className="flex items-center gap-2 bg-primary text-ink rounded-full pl-5 pr-1.5 py-1.5 font-medium text-sm transition-all group-hover:gap-3"
                style={{ boxShadow: '0 0 24px 2px rgba(255,91,46,0.35)' }}
              >
                Enter the Sprint
                <span className="bg-ink rounded-full w-8 h-8 flex items-center justify-center transition-transform group-hover:scale-110">
                  <ArrowRight size={16} className="text-primary" />
                </span>
              </span>
            </StarBorder>
          </Link>
        </ClickSpark>
      </div>
    </section>
  );
};

export default Hero;
