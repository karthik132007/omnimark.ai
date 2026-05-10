# Frontend Component Notes

This directory contains reusable UI sections for the role-based dashboards.

## Teacher Dashboard Components

- `teacher-dashboard/DashboardSidebar.tsx`: session navigation, workflow selection, and active session state display.
- `teacher-dashboard/OverviewView.tsx`: teacher overview metrics, session summaries, and high-level workflow entry points.
- `teacher-dashboard/EvaluationSetupView.tsx`: session creation form and locked session preference display.
- `teacher-dashboard/ScriptUploadsView.tsx`: answer-script ZIP upload, upload inspection, and processing controls.
- `teacher-dashboard/AnalyticsView.tsx`: processed result analytics, cheat detection report display, and direct teacher reevaluation actions.

## University Components

- `univ/UnivAdminDashboard.tsx`: university-level teacher administration and authenticated university dashboard shell.

## Student Flow

The student dashboard lives in `frontend/src/pages/StudentDashboard.tsx`. It is connected to:

- `frontend/src/lib/studentApi.ts`
- `GET /student/{rollnum}/results`
- `POST /student/{rollnum}/request-reevaluation`

This provides the student result visibility and reevaluation request workflow described in the backend API.
