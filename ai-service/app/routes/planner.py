from fastapi import APIRouter, HTTPException
from app.schemas.planner import PlannerRequest, PlannerResponse
from app.services.planner_engine import generate_plan

router = APIRouter(prefix="/ai", tags=["AI"])

@router.post("/planner", response_model=PlannerResponse)
async def planner(request: PlannerRequest):
    try:
        return await generate_plan(request)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))