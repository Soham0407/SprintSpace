import { useState, useEffect, useRef } from 'react';
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
  Plus,
  Search,
  X,
  Loader2,
  BookOpen,
  FileUp,
  Link2,
} from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import SpotlightCard from '../components/reactbits/SpotlightCard';
import { getResources, createResource, deleteResource, uploadResourceFile } from '../api/resources';
import type { Resource } from '../api/types';
import { motion, AnimatePresence } from 'framer-motion';

// ─── MOCK REPO DATA ────────────────────────────────────────────────────────
const MOCK_REPO = {
  url: 'github.com/sprintspace/web-wonders-2026',
  branch: 'main',
  lastUpdated: '2 hours ago',
};

// ─── Row (shared list item) ────────────────────────────────────────────────
const FileRow = ({
  icon: Icon,
  name,
  description,
  actions,
}: {
  icon: typeof FileText;
  name: string;
  description?: string | null;
  actions: { label: string; icon: typeof Eye; onClick?: () => void }[];
}) => (
  <div className="flex items-center justify-between gap-3 bg-surface rounded-xl px-4 py-3 border border-white/5 hover:border-white/10 transition-colors">
    <div className="flex items-center gap-3 min-w-0">
      <Icon size={16} className="text-accent shrink-0" />
      <div className="min-w-0">
        <span className="text-sm font-medium text-primary/95 truncate block">{name}</span>
        {description && (
          <span className="text-xs text-gray-500 truncate block mt-0.5">{description}</span>
        )}
      </div>
    </div>
    <div className="flex items-center gap-1 shrink-0">
      {actions.map((a) => (
        <button
          key={a.label}
          onClick={a.onClick}
          title={a.label}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-primary hover:bg-white/5 transition-colors"
        >
          <a.icon size={14} />
        </button>
      ))}
    </div>
  </div>
);

const ResourceHubPage = () => {
  const [copied, setCopied] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTag, setSelectedTag] = useState('All');

  // Modal / Add Resource State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState<'url' | 'file'>('url');
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('Project File');
  const [newTagsString, setNewTagsString] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const data = await getResources();
      setResources(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch resources.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleCopy = () => {
    navigator.clipboard?.writeText(`https://${MOCK_REPO.url}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleOpenAddModal = (categoryPrefill?: string) => {
    if (categoryPrefill) {
      setNewCategory(categoryPrefill);
    }
    setUploadType('url');
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    if (!newTitle.trim()) {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setNewTitle(baseName);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    if (uploadType === 'url' && !newUrl.trim()) return;
    if (uploadType === 'file' && !selectedFile) return;

    try {
      setIsSubmitting(true);
      let finalUrl = newUrl.trim();

      if (uploadType === 'file' && selectedFile) {
        setUploadStatus('Uploading file to storage...');
        finalUrl = await uploadResourceFile(selectedFile);
      }

      setUploadStatus('Saving resource metadata...');
      const tags = newTagsString
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await createResource({
        title: newTitle.trim(),
        url: finalUrl,
        description: newDescription.trim() || undefined,
        category: newCategory,
        tags,
      });

      // Reset form
      setNewTitle('');
      setNewUrl('');
      setSelectedFile(null);
      setNewDescription('');
      setNewTagsString('');
      setUploadStatus('');
      setIsModalOpen(false);

      // Refresh list
      await fetchResources();
    } catch (err: any) {
      alert(err.message || 'Failed to create resource.');
    } finally {
      setIsSubmitting(false);
      setUploadStatus('');
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;
    try {
      await deleteResource(id);
      setResources((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete resource.');
    }
  };

  // Helper to resolve icon based on file ending / category
  const getResourceIcon = (title: string, category: string) => {
    const t = title.toLowerCase();
    if (t.endsWith('.pdf')) return FileText;
    if (t.endsWith('.fig') || t.includes('figma')) return PenTool;
    if (t.endsWith('.png') || t.endsWith('.jpg') || t.endsWith('.jpeg') || t.endsWith('.svg')) return Image;
    if (t.endsWith('.pptx') || t.endsWith('.ppt') || t.endsWith('.key')) return FileText;
    if (t.includes('github') || t.includes('starter') || t.includes('boilerplate')) return GitBranch;

    if (category === 'Rulebook') return FileText;
    if (category === 'Project File') return FolderOpen;
    return Sparkles;
  };

  // Derived category lists for specific sections
  const rulebookResources = resources.filter((r) => r.category === 'Rulebook');
  const projectFileResources = resources.filter((r) => r.category === 'Project File');

  // Unified lists of tags for the explorer filter
  const allTags = Array.from(new Set(resources.flatMap((r) => r.tags)));

  // Filtered list for the "Explore All Resources" section
  const filteredResources = resources.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      r.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory;
    const matchesTag = selectedTag === 'All' || r.tags.includes(selectedTag);

    return matchesSearch && matchesCategory && matchesTag;
  });

  const categoriesList = [
    'All',
    'Rulebook',
    'Project File',
    'Pitch Deck',
    'Design Kit',
    'Boilerplate',
    'Mentorship',
    'Other',
  ];

  return (
    <PageShell
      eyebrow="RESOURCE HUB"
      title="Resource Hub"
      intro="Everything the AI Copilot and your team need for this competition, in one place."
    >
      {/* AI Knowledge Status */}
      <div className="bg-card border border-white/5 rounded-2xl px-6 py-5 flex flex-wrap items-center gap-x-8 gap-y-3 mb-10">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <CheckCircle2 size={15} className="text-accent" /> Rulebooks Synced ({rulebookResources.length})
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <CheckCircle2 size={15} className="text-accent" /> Files Available ({projectFileResources.length})
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <CheckCircle2 size={15} className="text-accent" /> GitHub Linked
        </div>
        <div className="flex items-center gap-2 text-xs bg-accent/10 border border-accent/20 text-accent rounded-full px-3 py-1.5 ml-auto">
          <Sparkles size={12} className="animate-pulse" />
          Status: Ready for AI Copilot
        </div>
      </div>

      {loading && resources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <Loader2 className="animate-spin text-accent" size={30} />
          <p className="text-sm">Loading Sprint Workspace Resources...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl p-6 text-center mb-10">
          <p className="text-sm font-semibold">Error Loading Resources</p>
          <p className="text-xs mt-1 text-red-400/80">{error}</p>
          <button
            onClick={fetchResources}
            className="mt-4 px-4 py-2 bg-red-500/20 text-red-300 rounded-lg text-xs hover:bg-red-500/30 transition-colors"
          >
            Retry Fetching
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  {copied ? 'Copied!' : 'Copy Link'}
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
                <button
                  onClick={() => handleOpenAddModal('Rulebook')}
                  className="flex items-center gap-1.5 text-xs bg-primary text-ink rounded-full px-4 py-2 font-medium hover:bg-white transition-colors"
                >
                  <Upload size={13} /> Add Document
                </button>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                {rulebookResources.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-500">
                    No rulebooks found. Click "Add Document" to upload.
                  </div>
                ) : (
                  rulebookResources.map((item) => (
                    <FileRow
                      key={item.id}
                      icon={getResourceIcon(item.title, item.category)}
                      name={item.title}
                      description={item.description}
                      actions={[
                        {
                          label: 'Open Link',
                          icon: ExternalLink,
                          onClick: () => window.open(item.url, '_blank'),
                        },
                        {
                          label: 'Delete',
                          icon: Trash2,
                          onClick: () => handleDeleteResource(item.id),
                        },
                      ]}
                    />
                  ))
                )}
              </div>
            </SpotlightCard>
          </div>

          {/* Project Files */}
          <SpotlightCard spotlightColor="rgba(255, 91, 46, 0.15)">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-white/5 flex items-center justify-center text-primary">
                  <FolderOpen size={20} />
                </div>
                <h2 className="text-primary text-lg md:text-xl">Project Files</h2>
              </div>
              <button
                onClick={() => handleOpenAddModal('Project File')}
                className="flex items-center gap-1.5 text-xs bg-primary text-ink rounded-full px-4 py-2 font-medium hover:bg-white transition-colors"
              >
                <Upload size={13} /> Add File Link
              </button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {projectFileResources.length === 0 ? (
                <div className="text-center py-10 text-xs text-gray-500">
                  No project files found. Click "Add File Link" to attach project assets.
                </div>
              ) : (
                projectFileResources.map((item) => (
                  <FileRow
                    key={item.id}
                    icon={getResourceIcon(item.title, item.category)}
                    name={item.title}
                    description={item.description}
                    actions={[
                      {
                        label: 'Open File',
                        icon: Download,
                        onClick: () => window.open(item.url, '_blank'),
                      },
                      {
                        label: 'Delete',
                        icon: Trash2,
                        onClick: () => handleDeleteResource(item.id),
                      },
                    ]}
                  />
                ))
              )}
            </div>
          </SpotlightCard>

          {/* Interactive Resource Hub Explorer */}
          <SpotlightCard spotlightColor="rgba(255, 91, 46, 0.08)">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
                <div>
                  <h2 className="text-primary text-lg md:text-xl font-semibold flex items-center gap-2">
                    <BookOpen size={18} className="text-accent" />
                    Resource Hub Explorer
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Search and filter references, Figma styles, APIs, templates, and mentor notes.
                  </p>
                </div>

                <button
                  onClick={() => handleOpenAddModal()}
                  className="flex items-center justify-center gap-1.5 text-xs bg-accent/20 hover:bg-accent/30 text-primary border border-accent/30 rounded-full px-4.5 py-2 font-medium transition-colors"
                >
                  <Plus size={14} className="text-accent" /> Add New Resource
                </button>
              </div>

              {/* Filters Panel */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search bar */}
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search title, description or tags..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-surface border border-white/5 rounded-xl pl-9.5 pr-4 py-2.5 text-xs text-primary placeholder-gray-500 focus:outline-none focus:border-accent/40 transition-colors"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Categories Scrollable chips */}
                <div className="flex flex-wrap items-center gap-2 border-t border-b border-white/5 py-3">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 mr-2">Category:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {categoriesList.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`text-xs px-3.5 py-1.5 rounded-lg border transition-all ${
                          selectedCategory === cat
                            ? 'bg-accent/15 border-accent text-primary'
                            : 'bg-surface/50 border-white/5 text-gray-400 hover:text-primary hover:border-white/10'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags checklists */}
                {allTags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                    <span className="text-[10px] uppercase tracking-wider mr-2">Filter by Tag:</span>
                    <button
                      onClick={() => setSelectedTag('All')}
                      className={`px-2.5 py-1 rounded-md text-[11px] transition-colors ${
                        selectedTag === 'All'
                          ? 'bg-white/10 text-primary'
                          : 'bg-transparent text-gray-400 hover:text-primary'
                      }`}
                    >
                      All Tags
                    </button>
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(tag)}
                        className={`px-2.5 py-1 rounded-md text-[11px] transition-colors ${
                          selectedTag === tag
                            ? 'bg-accent/20 text-accent font-semibold'
                            : 'bg-surface border border-white/5 text-gray-400 hover:text-primary hover:border-white/10'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dynamic Results Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-2">
                <AnimatePresence mode="popLayout">
                  {filteredResources.map((item) => {
                    const Icon = getResourceIcon(item.title, item.category);
                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="group flex flex-col justify-between bg-surface/50 hover:bg-surface border border-white/5 hover:border-accent/20 rounded-xl p-5 transition-all relative overflow-hidden"
                      >
                        <div>
                          {/* Card header */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <span className="text-[10px] font-semibold text-accent/90 bg-accent/10 border border-accent/20 rounded px-2.5 py-0.5 uppercase tracking-wider">
                              {item.category}
                            </span>
                            <button
                              onClick={() => handleDeleteResource(item.id)}
                              className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 hover:bg-white/5 p-1.5 rounded-lg transition-all"
                              title="Delete Resource"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          {/* Card Content */}
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-accent/80 shrink-0">
                              <Icon size={16} />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-primary text-sm font-semibold leading-snug group-hover:text-accent transition-colors truncate">
                                {item.title}
                              </h3>
                              <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                                {item.description || 'No description provided.'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Card footer */}
                        <div className="border-t border-white/5 pt-4 mt-4 flex flex-col gap-3">
                          {/* Tags */}
                          {item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {item.tags.map((t) => (
                                <span
                                  key={t}
                                  className="text-[9px] bg-white/5 text-gray-400 rounded px-1.5 py-0.5 hover:text-primary transition-colors"
                                >
                                  #{t}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Link anchor */}
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-center gap-1.5 w-full bg-white/5 hover:bg-primary hover:text-ink text-primary text-xs py-2 rounded-lg font-medium transition-all"
                          >
                            <ExternalLink size={12} />
                            Visit Resource
                          </a>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {filteredResources.length === 0 && (
                  <div className="col-span-full text-center py-16 border border-dashed border-white/5 rounded-xl text-gray-500 text-xs">
                    No resources match your filters. Click "Add New Resource" to populate the hub.
                  </div>
                )}
              </div>
            </div>
          </SpotlightCard>
        </div>
      )}

      {/* Elegant Form Modal with Glassmorphism */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="bg-card border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between border-b border-white/5 px-6 py-4.5 bg-surface/40">
                <div className="flex items-center gap-2.5">
                  <Sparkles size={16} className="text-accent" />
                  <h3 className="text-primary text-base font-semibold">Add Resource Link</h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-primary hover:bg-white/5 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Form details */}
              <form onSubmit={handleAddResource} className="p-6 space-y-4">
                {/* Mode Selector Tabs */}
                <div className="flex bg-surface border border-white/5 rounded-xl p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => setUploadType('url')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-all ${
                      uploadType === 'url'
                        ? 'bg-accent/15 border border-accent/20 text-accent font-semibold'
                        : 'text-gray-400 hover:text-primary hover:bg-white/5'
                    }`}
                  >
                    <Link2 size={13} />
                    External Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadType('file')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-all ${
                      uploadType === 'file'
                        ? 'bg-accent/15 border border-accent/20 text-accent font-semibold'
                        : 'text-gray-400 hover:text-primary hover:bg-white/5'
                    }`}
                  >
                    <FileUp size={13} />
                    Local File
                  </button>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1.5 font-medium">
                    Resource Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Next.js Auth Flow Boilerplate"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-surface border border-white/5 rounded-xl px-4 py-3 text-xs text-primary placeholder-gray-500 focus:outline-none focus:border-accent/40 transition-colors"
                  />
                </div>

                {/* Dynamic upload body */}
                {uploadType === 'url' ? (
                  /* URL input field */
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1.5 font-medium">
                      External URL / Link *
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://github.com/sprintspace/..."
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      className="w-full bg-surface border border-white/5 rounded-xl px-4 py-3 text-xs text-primary placeholder-gray-500 focus:outline-none focus:border-accent/40 transition-colors"
                    />
                  </div>
                ) : (
                  /* Drag and drop local file uploader */
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1.5 font-medium">
                      Select Local File *
                    </label>
                    
                    {selectedFile ? (
                      <div className="flex items-center justify-between gap-3 bg-surface border border-accent/20 rounded-xl px-4 py-3.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText size={16} className="text-accent shrink-0" />
                          <div className="min-w-0">
                            <span className="text-xs text-primary font-medium block truncate">
                              {selectedFile.name}
                            </span>
                            <span className="text-[10px] text-gray-500 block">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedFile(null)}
                          className="text-gray-500 hover:text-red-400 p-1 rounded-lg hover:bg-white/5 transition-colors"
                          title="Remove file"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex flex-col items-center justify-center border border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                          isDragging
                            ? 'bg-accent/5 border-accent text-accent'
                            : 'bg-surface border-white/5 hover:border-white/20 text-gray-400 hover:text-primary'
                        }`}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileChange(e.target.files[0]);
                            }
                          }}
                        />
                        <Upload size={22} className="text-accent/80 mb-2 group-hover:scale-110 transition-transform" />
                        <p className="text-xs font-medium">
                          Drag & drop your file here, or <span className="text-accent underline font-semibold">browse</span>
                        </p>
                        <p className="text-[10px] text-gray-500 mt-1">Supports PDF, Image, Figma, scripts etc.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1.5 font-medium">
                    Short Description
                  </label>
                  <textarea
                    placeholder="Describe how your team or the AI copilot can utilize this resource..."
                    rows={3}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full bg-surface border border-white/5 rounded-xl px-4 py-3 text-xs text-primary placeholder-gray-500 focus:outline-none focus:border-accent/40 transition-colors resize-none"
                  />
                </div>

                {/* Category & Tags Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1.5 font-medium">
                      Category
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full bg-surface border border-white/5 rounded-xl px-3 py-3 text-xs text-primary focus:outline-none focus:border-accent/40 transition-colors cursor-pointer"
                    >
                      <option value="Rulebook">Rulebook Document</option>
                      <option value="Project File">Project File / Asset</option>
                      <option value="Pitch Deck">Pitch Deck</option>
                      <option value="Design Kit">Design Kit</option>
                      <option value="Boilerplate">Boilerplate Code</option>
                      <option value="Mentorship">Mentorship Guide</option>
                      <option value="Other">Other Reference</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1.5 font-medium">
                      Tags (Comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="figma, react, official"
                      value={newTagsString}
                      onChange={(e) => setNewTagsString(e.target.value)}
                      className="w-full bg-surface border border-white/5 rounded-xl px-4 py-3 text-xs text-primary placeholder-gray-500 focus:outline-none focus:border-accent/40 transition-colors"
                    />
                  </div>
                </div>

                {/* Progress helper state */}
                {uploadStatus && (
                  <div className="flex items-center gap-2 text-xs text-accent bg-accent/5 border border-accent/15 px-4 py-2.5 rounded-xl">
                    <Loader2 size={12} className="animate-spin text-accent" />
                    <span>{uploadStatus}</span>
                  </div>
                )}

                {/* Submit button */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-surface border border-white/5 text-gray-400 hover:text-primary rounded-xl py-3 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-primary hover:bg-white text-ink disabled:opacity-50 disabled:cursor-not-allowed rounded-xl py-3 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={13} className="animate-spin" /> {uploadStatus ? 'Uploading...' : 'Adding...'}
                      </>
                    ) : (
                      <>Add Resource</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageShell>
  );
};

export default ResourceHubPage;