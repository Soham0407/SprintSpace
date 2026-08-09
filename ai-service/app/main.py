# pyrefly: ignore [missing-import]
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.planner import router as planner_router
from app.services.gemini_client import client
from app.core.config import settings

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
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