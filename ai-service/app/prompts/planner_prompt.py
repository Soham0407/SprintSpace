def build_planner_prompt(data):
    team_lines = "\n".join(
        f"- {m.name}: {', '.join(m.skills) if m.skills else 'no listed skills'}"
        for m in data.team
    )

    return f"""
You are an expert AI Project Manager for hackathons.

Competition:
{data.competition}

Project Idea:
{data.project_idea}

Deadline:
{data.deadline}

Team:
{team_lines}

Additional Instructions:
{data.ai_instructions or "None"}

Generate a day-by-day project roadmap split into phases. Each phase contains tasks.
Each task must be assigned to exactly one team member listed above, matched to
their skills where possible.

Your task is to generate a complete project execution plan.

Requirements:

1. Divide the project into logical phases.
2. Break each phase into small actionable tasks.
3. Assign every task to exactly one team member.
4. Match tasks to the member's listed skills where possible.
5. Give every task a day number.
6. Create enough tasks to cover the complete project until the deadline.
7. Keep tasks practical and actionable.
8. Do not create separate project, team, milestone, timeline, kanban, or health objects.
9. The phases and tasks are the ONLY information that should be returned.

Return ONLY valid JSON.
Do NOT use markdown.
Do NOT use ```json.
Do NOT explain anything.

The response MUST follow this exact structure:

{{
  "phases": [
    {{
      "title": "Phase 1",
      "tasks": [
        {{
          "id": "task-1",
          "title": "Task description",
          "day": 1,
          "assigned_to": "Team Member Name",
          "skill_required": "Frontend"
        }}
      ]
    }}
  ]
}}

Rules:

- The top-level key MUST be "phases".
- "phases" MUST be an array.
- Every phase MUST contain "title" and "tasks".
- Every task MUST contain:
  - id
  - title
  - day
  - assigned_to
  - skill_required
- "day" MUST be an integer.
- "assigned_to" MUST exactly match one of the team member names provided above.
- "skill_required" should match one of the member's relevant skills where possible.
- Do NOT return "project".
- Do NOT return "team".
- Do NOT return "milestones".
- Do NOT return "daily_tasks".
- Do NOT return "member_tasks".
- Do NOT return "timeline".
- Do NOT return "kanban".
- Do NOT return "health".
- Do NOT return "blockers".
"""