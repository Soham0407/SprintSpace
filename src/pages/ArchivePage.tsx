import { Sparkles } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import ConstellationField from '../components/archive/ConstellationField';
import { useAsyncData } from '../hooks/useAsyncData';
import { getArchiveProjects } from '../api/archive';

const ArchivePage = () => {
  const { data: projects, loading } = useAsyncData(getArchiveProjects, []);

  return (
    <PageShell
      eyebrow="COMPETITION ARCHIVE"
      title="Every sprint becomes proof of work."
      intro="Once a project ships, it doesn't disappear into a forgotten repo — it becomes a star in your own record. Brighter stars, bigger wins. Click one."
    >
      {loading && (
        <div
          className="w-full rounded-2xl bg-card border border-white/5 animate-pulse"
          style={{ height: 'min(70vh, 560px)' }}
        />
      )}

      {!loading && projects && projects.length === 0 && (
        <div className="text-center py-24">
          <Sparkles size={28} className="text-gray-600 mx-auto mb-4" />
          <p className="text-primary/70 mb-1">No shipped projects yet.</p>
          <p className="text-gray-500 text-sm">Finish your first sprint and it'll show up here.</p>
        </div>
      )}

      {!loading && projects && projects.length > 0 && <ConstellationField projects={projects} />}
    </PageShell>
  );
};

export default ArchivePage;
