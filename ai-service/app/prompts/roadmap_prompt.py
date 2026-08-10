def build_roadmap_prompt(data):
    phase_lines = []
    for phase in data.phases:
        task_summaries = "\n".join(f"    - {t.title} (Day {t.day}, {t.assigned_to})" for t in phase.tasks)
        phase_lines.append(f"  {phase.title}\n{task_summaries}")
    plan_summary = "\n".join(phase_lines)

    return f"""
You are a technical project lead writing a roadmap document for a hackathon team.

Competition: {data.competition}
Project Idea: {data.project_idea}
Deadline: {data.deadline}

Approved execution plan:
{plan_summary}

Write a readable project roadmap document in Markdown covering: project overview,
objectives, major phases with phase-wise goals, key milestones, dependencies,
expected deliverables, team responsibility overview, and final completion stages.

Do not re-list every individual task — summarize at the phase level. This is a
project-level narrative document, not a task list.

Return ONLY the markdown content, no commentary, no code fences.
"""