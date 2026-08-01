from app.prompts.planner_prompt import build_planner_prompt
from app.services.gemini_client import client
from app.core.config import settings
import json

async def generate_plan(data):
    print("Step 1: Request received")

    prompt = build_planner_prompt(data)
    print("Step 2: Prompt built")

    response = client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=prompt
    )

    print("Step 3: Gemini responded")

    text = response.text

    # Remove markdown code fences if present
    text = text.replace("```json", "").replace("```", "").strip()

    plan = json.loads(text)

    return plan