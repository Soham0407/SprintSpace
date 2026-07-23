import { useState } from 'react';
import {
  CheckCircle2,
  GitBranch,
  Copy,
  ExternalLink,
  Upload,
  Eye,
  Trash2,
  Download,
  FileText,
  Image,
  FolderOpen,
  PenTool,
  Sparkles,
} from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import SpotlightCard from '../components/reactbits/SpotlightCard';

// ─── MOCK DATA ──────────────────────────────────────────────────────────────
const MOCK_REPO = {
  url: 'github.com/sprintspace/web-wonders-2026',
  branch: 'main',
  lastUpdated: '2 hours ago',
};

const MOCK_RULEBOOK_DOCS = [
  'Rulebook.pdf',
  'Problem Statement.pdf',
  'Submission Guidelines.pdf',
  'Judging Criteria.pdf',
  'Timeline.pdf',
];

const MOCK_PROJECT_FILES: { name: string; icon: typeof FileText }[] = [
  { name: 'Research.pdf', icon: FileText },
  { name: 'Architecture.pdf', icon: FileText },
  { name: 'Presentation.pptx', icon: FileText },
  { name: 'UI Design.fig', icon: PenTool },
  { name: 'Images', icon: Image },
  { name: 'Documentation', icon: FolderOpen },
];

// ─── Row (shared list item) ────────────────────────────────────────────────
const FileRow = ({
  icon: Icon,
  name,
  actions,
}: {
  icon: typeof FileText;
  name: string;
  actions: { label: string; icon: typeof Eye; onClick?: () => void }[];
}) => (
  <div className="flex items-center justify-between gap-3 bg-surface rounded-xl px-4 py-3 border border-white/5">
    <div className="flex items-center gap-3 min-w-0">
      <Icon size={16} className="text-accent shrink-0" />
      <span className="text-sm text-primary/90 truncate">{name}</span>
    </div>
    <div className="flex items-center gap-1 shrink-0">
      {actions.map((a) => (
        <button
          key={a.label}
          onClick={a.onClick}
          title={a.label}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-primary hover:bg-white/5 transition-colors"
        >
          <a.icon size={13} />
        </button>
      ))}
    </div>
  </div>
);

const ResourceHubPage = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(`https://${MOCK_REPO.url}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <PageShell
      eyebrow="RESOURCE HUB"
      title="Resource Hub"
      intro="Everything the AI Copilot and your team need for this competition, in one place."
    >
      {/* AI Knowledge Status */}
      <div className="bg-card border border-white/5 rounded-2xl px-6 py-5 flex flex-wrap items-center gap-x-8 gap-y-3 mb-10">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <CheckCircle2 size={15} className="text-accent" /> Rulebook Indexed
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <CheckCircle2 size={15} className="text-accent" /> Files Available
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <CheckCircle2 size={15} className="text-accent" /> GitHub Linked
        </div>
        <div className="flex items-center gap-2 text-xs bg-accent/10 border border-accent/20 text-accent rounded-full px-3 py-1.5 ml-auto">
          <Sparkles size={12} />
          Status: Ready for AI Copilot
        </div>
      </div>

      <div className="space-y-6">
        {/* GitHub Repository */}
        <SpotlightCard spotlightColor="rgba(255, 91, 46, 0.15)">
          <div className="w-11 h-11 rounded-lg bg-white/5 flex items-center justify-center text-primary mb-5">
            <GitBranch size={20} />
          </div>
          <h2 className="text-primary text-lg md:text-xl mb-4">GitHub Repository</h2>

          <div className="space-y-2 mb-6 text-sm">
            <div className="flex items-center justify-between gap-4 bg-surface rounded-xl px-4 py-3 border border-white/5">
              <span className="text-gray-500">Repository URL</span>
              <span className="text-primary/90 truncate">{MOCK_REPO.url}</span>
            </div>
            <div className="flex items-center justify-between gap-4 bg-surface rounded-xl px-4 py-3 border border-white/5">
              <span className="text-gray-500">Main Branch</span>
              <span className="text-primary/90">{MOCK_REPO.branch}</span>
            </div>
            <div className="flex items-center justify-between gap-4 bg-surface rounded-xl px-4 py-3 border border-white/5">
              <span className="text-gray-500">Last Updated</span>
              <span className="text-primary/90">{MOCK_REPO.lastUpdated}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
  <a
    href={`https://${MOCK_REPO.url}`}
    target="_blank"
    rel="noreferrer"
    className="flex items-center gap-1.5 text-xs bg-primary text-ink rounded-full px-4 py-2 font-medium hover:bg-white transition-colors"
  >
    <ExternalLink size={13} />
    Open Repository
  </a>

  <button
    onClick={handleCopy}
    className="flex items-center gap-1.5 text-xs border border-white/10 text-gray-400 hover:text-primary hover:border-white/30 rounded-full px-4 py-2 transition-colors"
  >
    <Copy size={13} />
    {copied ? "Copied!" : "Copy Link"}
  </button>
</div>
        </SpotlightCard>

        {/* Rulebook */}
        <SpotlightCard spotlightColor="rgba(255, 91, 46, 0.15)">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-white/5 flex items-center justify-center text-primary">
                <FileText size={20} />
              </div>
              <h2 className="text-primary text-lg md:text-xl">Rulebook</h2>
            </div>
            <button className="flex items-center gap-1.5 text-xs bg-primary text-ink rounded-full px-4 py-2 font-medium hover:bg-white transition-colors">
              <Upload size={13} /> Upload
            </button>
          </div>

          <div className="space-y-2">
            {MOCK_RULEBOOK_DOCS.map((name) => (
              <FileRow
                key={name}
                icon={FileText}
                name={name}
                actions={[
                  { label: 'Preview', icon: Eye },
                  { label: 'Delete', icon: Trash2 },
                ]}
              />
            ))}
          </div>
        </SpotlightCard>

        {/* Project Files */}
        <SpotlightCard spotlightColor="rgba(255, 91, 46, 0.15)">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-white/5 flex items-center justify-center text-primary">
                <FolderOpen size={20} />
              </div>
              <h2 className="text-primary text-lg md:text-xl">Project Files</h2>
            </div>
            <button className="flex items-center gap-1.5 text-xs bg-primary text-ink rounded-full px-4 py-2 font-medium hover:bg-white transition-colors">
              <Upload size={13} /> Upload
            </button>
          </div>

          <div className="space-y-2">
            {MOCK_PROJECT_FILES.map((f) => (
              <FileRow
                key={f.name}
                icon={f.icon}
                name={f.name}
                actions={[
                  { label: 'Preview', icon: Eye },
                  { label: 'Download', icon: Download },
                  { label: 'Delete', icon: Trash2 },
                ]}
              />
            ))}
          </div>
        </SpotlightCard>
      </div>
    </PageShell>
  );
};

export default ResourceHubPage;