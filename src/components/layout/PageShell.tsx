import Footer from './Footer';

interface PageShellProps {
  eyebrow: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}

const PageShell = ({ eyebrow, title, intro, children }: PageShellProps) => {
  return (
    <div className="bg-ink min-h-screen">
      <section className="relative pt-12 md:pt-16 pb-10 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <span className="text-xs text-gray-500 tracking-wide">{eyebrow}</span>
          <h1 className="font-display text-primary text-2xl md:text-4xl leading-tight tracking-tight mt-1 mb-3">
            {title}
          </h1>
          {intro && <p className="text-gray-400 text-sm md:text-base max-w-xl mb-8">{intro}</p>}
          {!intro && <div className="mb-8" />}
          {children}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default PageShell;
