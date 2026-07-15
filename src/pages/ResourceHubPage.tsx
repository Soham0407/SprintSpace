import { FileText, Palette, Code2, GraduationCap, ArrowUpRight } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import SpotlightCard from '../components/reactbits/SpotlightCard';
import { useAsyncData } from '../hooks/useAsyncData';
import { getResourceSections } from '../api/resources';

const ICONS: Record<string, typeof FileText> = {
  'pitch-decks': FileText,
  'design-kits': Palette,
  boilerplate: Code2,
  mentorship: GraduationCap,
};

const ResourceHubPage = () => {
  const { data: sections, loading } = useAsyncData(getResourceSections, []);

  return (
    <PageShell
      eyebrow="RESOURCE HUB"
      title="Everything you'd normally hunt for at 2am."
      intro="Templates, starter code, and design kits your team can actually ship with — curated once so you don't have to Google it mid-sprint."
    >
      {loading && (
        <div className="space-y-10">
          {new Array(4).fill(0).map((_, i) => (
            <div key={i}>
              <div className="h-3 w-32 bg-white/10 rounded mb-4 animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {new Array(3).fill(0).map((_, j) => (
                  <div key={j} className="bg-card border border-white/5 rounded-xl p-5 h-24 animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && sections && (
        <div className="space-y-10">
          {sections.map((section) => {
            const Icon = ICONS[section.id] ?? FileText;
            return (
              <div key={section.id}>
                <div className="flex items-center gap-2 mb-4">
                  <Icon size={16} className="text-accent" />
                  <h2 className="text-primary text-lg">{section.label}</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {section.items.map((item) => (
                    <SpotlightCard
                      key={item.id}
                      className="!p-5 flex flex-col justify-between"
                      spotlightColor="rgba(255, 91, 46, 0.12)"
                    >
                      <div>
                        <h3 className="text-primary text-sm mb-1.5 leading-snug">{item.title}</h3>
                        <span className="text-xs text-gray-500">{item.meta}</span>
                      </div>
                      <a
                        href={item.href}
                        className="flex items-center gap-1 text-xs text-primary/80 hover:text-primary transition-colors self-start mt-4"
                      >
                        Open <ArrowUpRight size={12} />
                      </a>
                    </SpotlightCard>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
};

export default ResourceHubPage;
