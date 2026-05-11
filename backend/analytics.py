import json
from fastapi import APIRouter, Depends
from Engine.Dashbord_data.eda import get_teacher_dashboard_summary, get_teacher_stats, get_session_stats
from Engine.OMI.omi import explain_stats
from backend.auth import get_optional_current_user
from backend.utils import resolve_teacher_identity, get_authorized_session

router = APIRouter(tags=["Analytics"])

@router.get("/dashboard/teacher_stats")
def dashboard_teacher_stats(
    teacher_email: str | None = None,
    current_user: dict | None = Depends(get_optional_current_user),
):
    teacher = resolve_teacher_identity(current_user, teacher_email)
    stats = get_teacher_stats(teacher["email"], teacher.get("id"))
    if isinstance(stats, dict):
        return stats
    return stats.fillna(0).to_dict()

@router.get("/dashboard/teacher_summary")
def dashboard_teacher_summary(
    teacher_email: str | None = None,
    current_user: dict | None = Depends(get_optional_current_user),
):
    teacher = resolve_teacher_identity(current_user, teacher_email)
    return get_teacher_dashboard_summary(teacher["email"], teacher.get("id"))

@router.get("/omi/analyze")
def omi_analyze(
    teacher_email: str | None = None,
    current_user: dict | None = Depends(get_optional_current_user),
):
    teacher = resolve_teacher_identity(current_user, teacher_email)
    stats_data = get_teacher_dashboard_summary(teacher["email"], teacher.get("id"))
    
    try:
        analysis_json_str = explain_stats(stats_data)
        return json.loads(analysis_json_str)
    except Exception as e:
        return {"error": "Failed to parse Omi analysis", "raw": str(e)}

@router.get("/session/{session_id}/stats")
def dashboard_session_stats(
    session_id: str,
    teacher_email: str | None = None,
    current_user: dict | None = Depends(get_optional_current_user),
):
    get_authorized_session(session_id, current_user, teacher_email)
    stats = get_session_stats(session_id)
    if isinstance(stats, dict):
        return stats
    return stats.fillna(0).to_dict()
