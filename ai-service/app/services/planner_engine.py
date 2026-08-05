from app.prompts.planner_prompt import build_planner_prompt
from app.services.gemini_client import client
from app.core.config import settings
from app.schemas.planner import PlannerResponse
import json

async def generate_plan(data) -> PlannerResponse:
    prompt = build_planner_prompt(data)

    response = client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=prompt
    )

    text = response.text.replace("```json", "").replace("```", "").strip()

    try:
        raw = json.loads(text)
    except json.JSONDecodeError as e:
        raise ValueError(f"AI returned invalid JSON: {e}")

    # Raises a pydantic ValidationError (→ 422) if the shape doesn't match —
    # this is the actual validation step, not just a hopeful json.loads().
    return PlannerResponse(**raw)