import { mockDelay } from './mockClient';
import type { WorkspaceData } from './types';

// MOCK — replace with a real fetch to GET /api/workspace/:id
const WORKSPACE: WorkspaceData = {
  competitionName: 'Web Wonders 2026',
  healthScore: 87,
  progressPercent: 78,
  criticalBlockers: 2,
  deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000).toISOString(),
  kanban: [
    { id: 'todo', label: 'To Do', tasks: [{ id: 't1', title: 'Landing Page' }, { id: 't2', title: 'Presentation' }, { id: 't3', title: 'Testing' }] },
    { id: 'in-progress', label: 'In Progress', tasks: [{ id: 't4', title: 'Authentication' }, { id: 't5', title: 'Dashboard' }, { id: 't6', title: 'AI Context Setup' }] },
    { id: 'done', label: 'Done', tasks: [{ id: 't7', title: 'Database' }, { id: 't8', title: 'Login' }] },
  ],
  team: [
    { id: 'm1', name: 'Rahul', role: 'Frontend', progress: 90 },
    { id: 'm2', name: 'Priya', role: 'Backend', progress: 70 },
    { id: 'm3', name: 'Anjali', role: 'AI Module', progress: 40 },
    { id: 'm4', name: 'Rohit', role: 'Documentation', progress: 60 },
  ],
  timeline: [
    { id: 'ti1', label: 'Problem Analysis', status: 'done' },
    { id: 'ti2', label: 'UI Design', status: 'done' },
    { id: 'ti3', label: 'Database Setup', status: 'done' },
    { id: 'ti4', label: 'Backend APIs', status: 'active' },
    { id: 'ti5', label: 'AI Integration', status: 'pending' },
    { id: 'ti6', label: 'Testing', status: 'pending' },
    { id: 'ti7', label: 'Deployment', status: 'pending' },
    { id: 'ti8', label: 'Final Presentation', status: 'pending' },
  ],
};

export async function getWorkspace(): Promise<WorkspaceData> {
  return mockDelay(WORKSPACE);
}
