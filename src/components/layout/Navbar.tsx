import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Discover', href: '/discover' },
  { label: 'TeamMatch', href: '/teammatch' },
  { label: 'Workspace', href: '/workspace' },
  { label: 'Resources', href: '/resources' },
  { label: 'Archive', href: '/archive' },
];

const LogoMark = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M4 20 L14 20 L20 4" stroke="#DEDBC8" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 20 L20 4" stroke="#FF5B2E" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

const Navbar = () => {
  const { pathname } = useLocation();

  return (
    <nav className="fixed top-0 inset-x-0 z-[100] flex items-center justify-between px-5 sm:px-8 py-4 sm:py-5">
      <Link to="/" className="flex items-center gap-2.5">
        <LogoMark />
        <span className="font-display text-base sm:text-lg text-primary tracking-tight">SprintSpace</span>
      </Link>

      <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 liquid-glass rounded-full px-1.5 py-1.5 items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.label}
              to={item.href}
              className={`relative px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                active ? 'bg-primary text-ink' : 'text-primary/70 hover:text-primary hover:bg-white/10'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <Link
          to="/login"
          className="hidden sm:inline text-xs text-primary/70 hover:text-primary transition-colors"
        >
          Log in
        </Link>
        <Link
          to="/signup"
          className="text-xs bg-primary text-ink rounded-full px-4 py-2 font-medium hover:bg-white transition-colors"
        >
          Sign up
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
