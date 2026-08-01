# pyrefly: ignore [missing-import]
from fastapi import FastAPI
from app.routes.planner import router as planner_router
from app.services.gemini_client import client
from app.core.config import settings

app = FastAPI()
app.include_router(planner_router)
@app.get("/")
def root():
    return {"message": "SprintSpace AI Backend"}

@app.get("/health/gemini")
async def health_gemini():
    try:
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents="Reply with only the word OK."
        )

        return {
            "gemini_reachable": True,
            "reply": response.text
        }

    except Exception as e:
        return {
            "gemini_reachable": False,
            "error": str(e)
        }