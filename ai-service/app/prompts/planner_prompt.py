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

1. Divide the project into logical milestones/phases.
2. Break each milestone into small actionable tasks.
3. Assign every task to exactly one team member based on their skills.
4. Generate daily tasks.
5. Generate member-wise task lists.
6. Generate a project timeline.
7. Generate an initial Kanban board.
8. Generate an initial health object.

Return ONLY valid JSON.
Do NOT use markdown.
Do NOT use ```json.
Do NOT explain anything.

The response MUST follow this exact structure:

{{
"project": {{
"name": "",
"competition": "",
"deadline": ""
}},
"team": [],
"milestones": [],
"daily_tasks": [],
"member_tasks": {{}},
"timeline": [],
"kanban": {{
"todo": [],
"in_progress": [],
"done": []
}},
"health": {{
"progress": 0,
"health_score": 100,
"status": "Not Started",
"blockers": []
}}
}}
"""