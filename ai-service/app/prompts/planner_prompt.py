def build_planner_prompt(data):
    return f"""
You are an experienced hackathon project manager.

Competition:
{data.competition}

Project Idea:
{data.project_idea}

Deadline:
{data.deadline}

Team:
{data.team}

Generate:

1. Milestones
2. Small actionable tasks
3. Assign each task to the best member
4. Suggested timeline

Return everything as JSON.
"""