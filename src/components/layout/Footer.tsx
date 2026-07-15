const Footer = () => {
  return (
    <footer className="bg-ink border-t border-white/10 px-6 py-10 md:px-10">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="font-display text-lg text-primary tracking-tight">SprintSpace</span>
        <p className="text-xs text-gray-500 text-center md:text-right">
          Built for Web Wonders, SIH, and every hackathon in between.
          <br className="hidden md:block" /> Discover → Team → Workspace → Ship → Portfolio.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
