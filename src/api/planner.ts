export interface PlannerTeamMember {
  name: string;
  skills: string[];
}

export interface PlannerRequestInput {
  competition: string;
  projectIdea: string;
  deadline: string;
  aiInstructions: string;
  team: PlannerTeamMember[];
}

export interface PlannerTask {
  id: string;
  title: string;
  day: number;
  assigned_to: string;
  skill_required: string;
}

export interface PlannerPhase {
  title: string;
  tasks: PlannerTask[];
}

export interface PlannerResponse {
  phases: PlannerPhase[];
}

const BASE_URL = import.meta.env.VITE_AI_SERVICE_URL ?? 'http://localhost:8000';

export async function generateRoadmap(input: PlannerRequestInput): Promise<PlannerResponse> {
  const res = await fetch(`${BASE_URL}/ai/planner`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      competition: input.competition,
      project_idea: input.projectIdea,
      deadline: input.deadline,
      ai_instructions: input.aiInstructions,
      team: input.team,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail ?? `AI Planner request failed (${res.status})`);
  }

  return res.json();
}