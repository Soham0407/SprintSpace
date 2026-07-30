import { Link } from 'react-router-dom';
import { LiquidChrome } from '../reactbits/LiquidChrome';

interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

const AuthLayout = ({ eyebrow, title, children, footer }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-ink flex">
      {/* Form panel */}
      <div className="w-full lg:w-[46%] flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-16">
        <div className="max-w-sm mx-auto w-full">
          <Link to="/" className="inline-block mb-10 font-display text-lg text-primary">
            SprintSpace
          </Link>
          <span className="text-xs text-gray-500 tracking-wide block mb-2">{eyebrow}</span>
          <h1 className="text-primary text-2xl sm:text-3xl mb-8">{title}</h1>

          {children}

          <p className="text-sm text-gray-500 mt-8">{footer}</p>
        </div>
      </div>

      {/* Brand panel — hidden on small screens */}
      <div className="hidden lg:block lg:w-[54%] relative overflow-hidden">
        <div className="absolute inset-0 opacity-80">
          <LiquidChrome baseColor={[0.06, 0.06, 0.06]} speed={0.15} amplitude={0.25} interactive={false} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-ink/40" />
        <div className="relative h-full flex flex-col items-center justify-center px-10">
          <span className="font-display text-3xl xl:text-4xl tracking-tight mb-4 text-primary">
            SprintSpace
          </span>
          <p className="text-primary/70 text-sm max-w-xs text-center leading-relaxed">
            One workspace for the entire competition lifecycle — discover, team up, build, and
            ship.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
