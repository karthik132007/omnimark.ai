import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  FileStack,
  LayoutDashboard,
  LogOut,
  Plus,
  ScanSearch,
  Upload,
  Trash2,
  Ellipsis,
} from 'lucide-react';
import { useState } from 'react';
import type { DashboardView, TeacherSessionSummary } from '../../types/teacherDashboard';

interface DashboardSidebarProps {
  activeView: DashboardView;
  isDraftMode: boolean;
  isSessionsExpanded: boolean;
  isProcessing: boolean;
  onCreateSession: () => void;
  onLogout: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onSetActiveView: (view: DashboardView) => void;
  onToggleSessions: () => void;
  selectedSessionId: string | null;
  sessions: TeacherSessionSummary[];
}

const workflowItems: Array<{
  icon: typeof ScanSearch;
  label: string;
  view: DashboardView;
  description: string;
}> = [
  { icon: ScanSearch, label: 'Evaluation Setup', view: 'evaluation-setup', description: 'Configure grading rules' },
  { icon: Upload, label: 'Script Uploads', view: 'script-uploads', description: 'Upload student scripts' },
  { icon: BarChart3, label: 'Analytics', view: 'analytics', description: 'Review scoring insights' },
];

const statusDot = (status: string) => {
  switch (status) {
    case 'processed':
      return 'bg-emerald-500';
    case 'processing':
      return 'bg-amber-500 animate-pulse';
    case 'uploaded':
      return 'bg-sky-500';
    default:
      return 'bg-slate-300';
  }
};

const currentStepIndex = (activeView: DashboardView) => workflowItems.findIndex((item) => item.view === activeView);

export const DashboardSidebar = ({
  activeView,
  isDraftMode,
  isSessionsExpanded,
  isProcessing,
  onCreateSession,
  onLogout,
  onSelectSession,
  onDeleteSession,
  onSetActiveView,
  onToggleSessions,
  selectedSessionId,
  sessions,
}: DashboardSidebarProps) => {
  const showWorkflow = Boolean(selectedSessionId) || isDraftMode;
  const activeStep = currentStepIndex(activeView);
  const [hoveredSession, setHoveredSession] = useState<string | null>(null);

  return (
    <aside className={`flex h-full flex-col rounded-[1.4rem] bg-[#0f0f0f] px-3 py-4 shadow-[0_30px_80px_rgba(0,0,0,0.3)] ${isProcessing ? 'pointer-events-none opacity-60' : ''}`}>

      {/* ─── Brand ─── */}
      <div className="flex items-center gap-3 px-2 pb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
          <FileStack className="h-4 w-4 text-white/90" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display text-[15px] font-semibold tracking-[-0.03em] text-white/95">OmniMark AI</div>
        </div>
      </div>

      {/* ─── New Session Button ─── */}
      <button
        type="button"
        onClick={onCreateSession}
        className="mx-1 flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.05] px-3.5 py-2.5 text-[13px] font-medium text-white/80 transition hover:bg-white/[0.1] hover:text-white"
      >
        <Plus className="h-4 w-4" />
        New Session
      </button>

      {/* ─── Session List (ChatGPT-style conversation history) ─── */}
      <div className="mt-4 flex-1 overflow-y-auto min-h-0">
        <button
          type="button"
          onClick={onToggleSessions}
          className="flex w-full items-center gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35 transition hover:text-white/60"
        >
          {isSessionsExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          Sessions
          {sessions.length > 0 && (
            <span className="ml-auto rounded-md bg-white/[0.07] px-1.5 py-0.5 text-[10px] font-medium text-white/40">{sessions.length}</span>
          )}
        </button>

        {isSessionsExpanded && (
          <div className="mt-1 space-y-0.5">
            {sessions.length ? (
              sessions.map((session) => {
                const isActive = session.session_id === selectedSessionId;
                const isHovered = hoveredSession === session.session_id;

                return (
                  <div
                    key={session.session_id}
                    className="group relative"
                    onMouseEnter={() => setHoveredSession(session.session_id)}
                    onMouseLeave={() => setHoveredSession(null)}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectSession(session.session_id)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition ${
                        isActive
                          ? 'bg-white/[0.1] text-white'
                          : 'text-white/55 hover:bg-white/[0.06] hover:text-white/80'
                      }`}
                    >
                      <span className={`h-2 w-2 shrink-0 rounded-full ${statusDot(session.status)}`} />
                      <span className="flex-1 truncate text-[13px] font-medium">{session.name}</span>
                    </button>

                    {/* Delete on hover — ChatGPT style */}
                    {(isHovered || isActive) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.session_id);
                        }}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-white/25 transition hover:bg-white/[0.1] hover:text-rose-400"
                        title="Delete Session"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="px-3 py-4 text-[12px] leading-5 text-white/30">
                No sessions yet. Create one to get started.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Navigation ─── */}
      <div className="mt-auto space-y-1 border-t border-white/[0.06] pt-3">
        <button
          type="button"
          onClick={() => onSetActiveView('dashboard')}
          className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition ${
            activeView === 'dashboard'
              ? 'bg-white/[0.1] text-white'
              : 'text-white/50 hover:bg-white/[0.06] hover:text-white/80'
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </button>

        {/* Workflow Steps */}
        {showWorkflow && (
          <div className="space-y-0.5">
            {workflowItems.map((item, index) => {
              const isComplete = activeStep > index;
              const isCurrent = activeStep === index;
              const Icon = item.icon;

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onSetActiveView(item.view)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition ${
                    isCurrent
                      ? 'bg-white/[0.1] text-white'
                      : 'text-white/50 hover:bg-white/[0.06] hover:text-white/80'
                  }`}
                >
                  <div className={`flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold ${
                    isCurrent
                      ? 'bg-white/20 text-white'
                      : isComplete
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-white/[0.06] text-white/30'
                  }`}>
                    {isComplete ? <CheckCircle2 className="h-3 w-3" /> : index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-[13px] font-medium">{item.label}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Logout */}
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium text-white/40 transition hover:bg-white/[0.06] hover:text-rose-400"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </aside>
  );
};
