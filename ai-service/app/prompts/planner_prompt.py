def build_planner_prompt(data):
    team_lines = "\n".join(
        f"- {m.name}: {', '.join(m.skills) if m.skills else 'no listed skills'}"
        for m in data.team
    )

    return f"""
You are an experienced hackathon project manager.

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

Generate a day-by-day project roadmap split into phases. Each phase contains
tasks. Each task must be assigned to exactly one team member listed above,
matched to their skills where possible.

Return ONLY valid JSON, no markdown, no commentary, in EXACTLY this shape:

{{
  "phases": [
    {{
      "title": "string",
      "tasks": [
        {{
          "id": "string (unique, e.g. t1, t2)",
          "title": "string",
          "day": integer (1-indexed day number from project start),
          "assigned_to": "string (must exactly match a team member name above)",
          "skill_required": "string"
        }}
      ]
    }}
  ]
}}
"""