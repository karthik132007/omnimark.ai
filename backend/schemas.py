from typing import Optional

from pydantic import BaseModel, Field


class EvaluationPreferences(BaseModel):
    exam_type: str = Field(..., description="Theory or Technical")
    language_exam: Optional[bool] = Field(default=None, description="Only for theory exams")
    max_marks: int
    min_answer_length: int
    is_handwritten: Optional[bool] = Field(default=False, description="Whether the answers are handwritten")
    llm_provider: Optional[str] = Field(default="api", description="Provider for LLM")
    llm_model: Optional[str] = Field(default="gpt-4o", description="Model for LLM")
    # FUTURE SCOPE: Rubric binding
    rubric_id: Optional[str] = Field(default=None, description="Optional rubric identifier for structured grading")
    lms_sync_enabled: Optional[bool] = Field(default=False, description="Whether to sync results back to LMS")


class SessionCreateResponse(BaseModel):
    session_id: str


class SessionSummary(BaseModel):
    session_id: str
    name: str
    status: str
    correction_mode: str
    created_at: str


class SessionDetail(BaseModel):
    session_id: str
    name: str
    status: str
    correction_mode: str
    preferences: EvaluationPreferences
    created_at: str
    total_files: Optional[int] = None
    processed: Optional[int] = None
    custom_prompt: Optional[str] = None
    # FUTURE SCOPE: LMS linkage
    external_lms_id: Optional[str] = Field(default=None, description="Linked ID in external LMS system")

class QuestionParerPrefrences(BaseModel):
    difficulty:str
    max_marks:int
    no_of_ques:int
    course:str
    choice_aval:bool
    choice_type:str
    custom_prompt:str
