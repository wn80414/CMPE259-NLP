from pydantic import BaseModel, Field
from typing import List, Optional

# ---------- Sub-Models for Nested Arrays/Objects ----------

class EducationEntry(BaseModel):
    school: str = ""
    degree: str = ""
    location: str = ""
    graduation_date: str = ""
    gpa: str = ""
    coursework: List[str] = Field(default_factory=list)


class ExperienceEntry(BaseModel):
    company: str = ""
    role: str = ""
    location: Optional[str] = ""
    start_date: Optional[str] = ""
    end_date: Optional[str] = ""
    bullets: List[str] = Field(default_factory=list)


class ProjectEntry(BaseModel):
    name: str = ""
    tech_stack: List[str] = Field(default_factory=list)
    bullets: List[str] = Field(default_factory=list)


class SkillsSchema(BaseModel):
    languages: List[str] = Field(default_factory=list)
    cloud: List[str] = Field(default_factory=list)
    ml_ai: List[str] = Field(default_factory=list)
    tools: List[str] = Field(default_factory=list)


# ---------- Main Resume Schema ----------

class ResumeSchema(BaseModel):
    name: str = ""
    email: str = ""
    phone: str = ""
    linkedin: str = ""
    github: str = ""

    # Nested Lists default to an empty list
    education: List[EducationEntry] = Field(default_factory=list)
    experience: List[ExperienceEntry] = Field(default_factory=list)
    projects: List[ProjectEntry] = Field(default_factory=list)
    
    # Nested Object defaults to an empty SkillsSchema instance
    skills: SkillsSchema = Field(default_factory=SkillsSchema)

    awards: List[str] = Field(default_factory=list)
    raw_summary: str = ""