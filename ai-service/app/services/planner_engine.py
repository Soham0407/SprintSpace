import json

from app.prompts.planner_prompt import build_planner_prompt
from app.services.gemini_client import client
from app.core.config import settings


async def generate_plan(data):

    prompt = build_planner_prompt(data)

    response = client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=prompt
    )

    text = response.text.strip()

    # Remove markdown if Gemini returns it
    text = text.replace("```json", "")
    text = text.replace("```", "")
    text = text.strip()

    print("\n========== GEMINI RESPONSE ==========\n")
    print(text)
    print("\n=====================================\n")

    try:
        plan = json.loads(text)
        return plan

    except json.JSONDecodeError as e:
        return {
            "success": False,
            "error": "Gemini returned invalid JSON",
            "details": str(e),
            "raw_response": text
        }