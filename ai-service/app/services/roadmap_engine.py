from app.prompts.roadmap_prompt import build_roadmap_prompt
from app.services.gemini_client import client
from app.core.config import settings
from app.schemas.planner import RoadmapResponse

async def generate_roadmap_doc(data) -> RoadmapResponse:
    prompt = build_roadmap_prompt(data)
    response = client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=prompt
    )
    content = response.text.strip()
    if content.startswith("```"):
        content = content.strip("`").lstrip("markdown").strip()
    return RoadmapResponse(content=content)