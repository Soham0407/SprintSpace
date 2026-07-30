// Shared types for the eventual backend contract. Every mock function in
// src/api/ returns these shapes wrapped in a Promise — swap the mock
// implementation for a real fetch() and no component code needs to change.

export interface Competition {
  id: string;
  name: string;
  organizer: string;
  category: string;
  deadline: string; // ISO date string
  prizePool: string;
  teamSize: string;
}

export interface Candidate {
  id: string;
  name: string;
  roleWanted: string;
  skills: string[];
  matchScore: number;
  available: boolean;
}

export interface ResourceItem {
  id: string;
  title: string;
  meta: string;
  href: string;
}

export interface ResourceSection {
  id: string;
  label: string;
  items: ResourceItem[];
}

export interface ArchiveProject {
  id: string;
  name: string;
  competition: string;
  competitionId?: string;
  workspaceId?: string;
  result: 'Winner' | 'Finalist' | 'Runner-up' | 'Shipped';
  stack: string[];
  href: string;
  createdAt?: string;
  deletedAt?: string | null;
}

export interface CreateArchiveInput {
  name: string;
  competition: string;
  competitionId?: string;
  workspaceId?: string;
  result: ArchiveProject['result'];
  stack: string[];
  href?: string;
}

export interface KanbanTask {
  id: string;
  title: string;
}

export interface KanbanColumn {
  id: string;
  label: string;
  tasks: KanbanTask[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  progress: number;
}

export interface TimelineStep {
  id: string;
  label: string;
  status: 'done' | 'active' | 'pending';
}

export interface WorkspaceData {
  competitionName: string;
  healthScore: number;
  progressPercent: number;
  criticalBlockers: number;
  deadline: string; // ISO date string
  kanban: KanbanColumn[];
  team: TeamMember[];
  timeline: TimelineStep[];
}

export interface CountryStat {
  countryCode: string;
  countryName: string;
  activeUsers: number;
}

export interface Resource {
  id: string;
  title: string;
  description: string | null;
  url: string;
  category: string;
  tags: string[];
  createdAt?: string;
  createdBy?: string | null;
}

export interface CreateResourceInput {
  title: string;
  description?: string;
  url: string;
  category: string;
  tags?: string[];
}

