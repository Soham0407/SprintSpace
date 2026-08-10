from fastapi import APIRouter, HTTPException
from app.schemas.planner import PlannerRequest, PlannerResponse, RoadmapRequest, RoadmapResponse
from app.services.planner_engine import generate_plan
from app.services.roadmap_engine import generate_roadmap_doc

router = APIRouter(prefix="/ai", tags=["AI"])

@router.post("/planner", response_model=PlannerResponse)
async def planner(request: PlannerRequest):
    try:
        return await generate_plan(request)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

@router.post("/roadmap", response_model=RoadmapResponse)
async def roadmap(request: RoadmapRequest):
    try:
        return await generate_roadmap_doc(request)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))