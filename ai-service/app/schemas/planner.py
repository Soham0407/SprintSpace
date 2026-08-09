from pydantic import BaseModel
from typing import List

class TeamMember(BaseModel):
    name: str
    skills: List[str]

class PlannerRequest(BaseModel):
    competition: str
    project_idea: str
    deadline: str
    ai_instructions: str = ""
    team: List[TeamMember]

class PlannerTask(BaseModel):
    id: str
    title: str
    day: int
    assigned_to: str
    skill_required: str

class PlannerPhase(BaseModel):
    title: str
    tasks: List[PlannerTask]

class PlannerResponse(BaseModel):
    phases: List[PlannerPhase]