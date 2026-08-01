from fastapi import APIRouter
from app.schemas.planner import PlannerRequest
from app.services.planner_engine import generate_plan

router = APIRouter(prefix="/ai", tags=["AI"])

@router.post("/planner")
async def planner(request: PlannerRequest):
    result = await generate_plan(request)
    return result