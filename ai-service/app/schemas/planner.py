from pydantic import BaseModel
from typing import List

class TeamMember(BaseModel):
    name: str
    skills: List[str]

class PlannerRequest(BaseModel):
    competition: str
    project_idea: str
    deadline: str
    team: List[TeamMember]