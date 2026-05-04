import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Clock3,
  FileArchive,
  LayoutDashboard,
  PlayCircle,
  Plus,
  Sparkles,
  Upload,
} from 'lucide-react';
import type { TeacherSession, TeacherSessionSummary } from '../../types/teacherDashboard';

interface OverviewViewProps {
  onCreateSession: () => void;
  onOpenUploads: () => void;
  onSelectSession: (sessionId: string) => void;
  selectedSession: TeacherSession | null;
  sessions: TeacherSessionSummary[];
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));

export const OverviewView = ({
  onCreateSession,
  onOpenUploads,
  onSelectSession,
  selectedSession,
  sessions,
}: OverviewViewProps) => {
  const processedSessions = sessions.filter(s => s.status === 'processed').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header / Welcome */}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between px-2">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Overview
          </h1>
          <p className="mt-2 text-[15px] text-slate-500 max-w-xl leading-relaxed">
            Manage your evaluation workflows, upload student scripts, and leverage AI to uncover insights about your class performance.
          </p>
        </div>
      </div>

      {/* Bento Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Welcome & Stats Card (Span 2) */}
        <div className="md:col-span-2 frost-panel rounded-[2rem] border border-white/80 p-8 shadow-[0_32px_100px_rgba(15,23,42,0.08)] bg-gradient-to-br from-white to-slate-50 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <LayoutDashboard className="w-32 h-32 text-slate-900" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 shadow-sm">
              Teacher Workspace
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">
              Ready to evaluate?
            </h2>
            <p className="mt-2 text-slate-600 text-[15px] max-w-md">
              Start a new session or pick up where you left off. The engine is primed and waiting.
            </p>
          </div>
          
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white/60 p-5 backdrop-blur-md">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Sessions</div>
              <div className="mt-1 text-3xl font-black text-slate-900">{sessions.length}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/60 p-5 backdrop-blur-md">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Processed</div>
              <div className="mt-1 text-3xl font-black text-emerald-600">{processedSessions}</div>
            </div>
          </div>
        </div>

        {/* AI Analyze Action Card */}
        <div className="md:col-span-1 group relative rounded-[2rem] border border-transparent bg-gradient-to-br from-indigo-500 to-purple-600 p-1 shadow-[0_20px_60px_rgba(99,102,241,0.25)] transition-all hover:-translate-y-1 hover:shadow-[0_25px_80px_rgba(99,102,241,0.35)] cursor-pointer overflow-hidden"
             onClick={() => alert("AI Analyze Class feature is coming soon! It will analyze student track records to optimize your teaching approach.")}>
          <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-overlay"></div>
          <div className="relative flex h-full flex-col justify-between rounded-[1.8rem] bg-slate-900/40 p-7 backdrop-blur-xl transition-colors group-hover:bg-slate-900/30">
            <div>
              <div className="inline-flex items-center justify-center rounded-xl bg-white/20 p-3 backdrop-blur-md text-white">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-bold text-white">AI Analyze</h3>
              <p className="mt-2 text-sm leading-relaxed text-indigo-100">
                Deep dive into class performance. Uncover learning gaps and optimize your teaching approach.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm font-bold text-white">
              Launch Intelligence <Sparkles className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Create Session Action */}
        <div className="md:col-span-1 interactive-surface rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md cursor-pointer flex flex-col justify-between group"
             onClick={onCreateSession}>
          <div>
            <div className="inline-flex items-center justify-center rounded-xl bg-slate-100 p-3 text-slate-700 transition-colors group-hover:bg-slate-900 group-hover:text-white">
              <Plus className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-lg font-bold text-slate-900">Create Session</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Start a new evaluation workflow. Configure rubrics, marks, and constraints.
            </p>
          </div>
        </div>

        {/* Active Session Focus */}
        <div className="md:col-span-2 frost-panel rounded-[2rem] border border-white/80 p-6 shadow-sm bg-white/70">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                <PlayCircle className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">Current Focus</div>
                <div className="text-lg font-bold text-slate-900">
                  {selectedSession ? selectedSession.name : 'No active session'}
                </div>
              </div>
            </div>
            <div className={`rounded-full px-3 py-1 text-xs font-bold ${
              selectedSession?.status === 'processing' ? 'bg-amber-100 text-amber-700' : 
              selectedSession?.status === 'processed' ? 'bg-emerald-100 text-emerald-700' :
              selectedSession ? 'bg-slate-100 text-slate-700' : 'bg-slate-100 text-slate-400'
            }`}>
              {selectedSession ? selectedSession.status.toUpperCase() : 'IDLE'}
            </div>
          </div>

          {selectedSession ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Progress</div>
                  <div className="text-sm font-black text-slate-900">
                    {selectedSession.processed ?? 0} / {selectedSession.total_files ?? 0}
                  </div>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div 
                    className="h-full bg-slate-900 transition-all duration-500"
                    style={{ width: `${Math.min(100, ((selectedSession.processed ?? 0) / Math.max(1, selectedSession.total_files ?? 1)) * 100)}%` }}
                  />
                </div>
              </div>
              
              <button
                type="button"
                onClick={onOpenUploads}
                className="flex items-center justify-center gap-3 rounded-2xl border-2 border-slate-900 bg-slate-900 p-4 text-sm font-bold text-white transition hover:bg-slate-800 shadow-[0_8px_20px_rgba(15,23,42,0.15)] hover:-translate-y-0.5"
              >
                Manage Script Uploads
                <Upload className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 px-4 py-6 text-center text-sm font-medium text-slate-500">
              Select a session from the sidebar or create a new one to unlock workflow tools.
            </div>
          )}
        </div>

        {/* Recent Sessions List */}
        <div className="md:col-span-3 frost-panel rounded-[2rem] border border-white/80 p-6 shadow-sm bg-white/70">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Recent Sessions</h3>
            <span className="text-xs font-bold text-slate-500">{sessions.length} total</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.length ? (
              sessions.map((session) => (
                <button
                  key={session.session_id}
                  onClick={() => onSelectSession(session.session_id)}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="font-semibold text-slate-900 line-clamp-1 mr-2">{session.name}</div>
                    <div className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      session.status === 'processed' ? 'bg-emerald-100 text-emerald-700' :
                      session.status === 'processing' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {session.status}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs font-medium text-slate-500">{formatDate(session.created_at)}</div>
                    <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:text-slate-900 group-hover:translate-x-1" />
                  </div>
                </button>
              ))
            ) : (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white/50 px-4 py-8 text-center text-sm font-medium text-slate-500">
                No evaluation history found. Create your first session to get started.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
