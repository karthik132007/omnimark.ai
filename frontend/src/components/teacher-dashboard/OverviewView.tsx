import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Award,
  BarChart3,
  BrainCircuit,
  Clock3,
  LineChart as LineChartIcon,
  Plus,
  UploadCloud,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getTeacherDashboardSummary } from '../../lib/teacherDashboardApi';
import type { TeacherDashboardSummary, TeacherSession, TeacherSessionSummary } from '../../types/teacherDashboard';

interface OverviewViewProps {
  onCreateSession: () => void;
  onOpenUploads: () => void;
  onSelectSession: (sessionId: string) => void;
  onOpenOmi: () => void;
  selectedSession: TeacherSession | null;
  sessions: TeacherSessionSummary[];
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));

const emptySummary: TeacherDashboardSummary = {
  metrics: {
    total_sessions: 0,
    processed_sessions: 0,
    total_submissions: 0,
    average_marks: 0,
    highest_marks: 0,
    lowest_marks: 0,
  },
  trend: [],
  common_mistakes: [],
  toppers: [],
  score_distribution: [],
  risk_bands: [],
};

const chartTooltipStyle = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  boxShadow: '0 16px 34px rgba(15,23,42,0.08)',
};

export const OverviewView = ({
  onCreateSession,
  onOpenUploads,
  onSelectSession,
  onOpenOmi,
  selectedSession,
  sessions,
}: OverviewViewProps) => {
  const [summary, setSummary] = useState<TeacherDashboardSummary>(emptySummary);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [summaryError, setSummaryError] = useState('');

  const hasPerformanceData = summary.metrics.total_submissions > 0;
  const trendData = useMemo(() => summary.trend.slice(-8), [summary.trend]);
  const recentSessions = useMemo(() => sessions.slice(0, 6), [sessions]);

  useEffect(() => {
    let mounted = true;

    const loadSummary = async () => {
      try {
        const data = await getTeacherDashboardSummary();
        if (!mounted) {
          return;
        }
        setSummary(data);
        setSummaryError('');
      } catch {
        if (!mounted) {
          return;
        }
        setSummary(emptySummary);
        setSummaryError('Unable to load dashboard analytics right now.');
      } finally {
        if (mounted) {
          setIsLoadingSummary(false);
        }
      }
    };

    void loadSummary();

    return () => {
      mounted = false;
    };
  }, [sessions, selectedSession?.status, selectedSession?.processed]);

  useEffect(() => {
    if (selectedSession?.status !== 'processing') {
      return;
    }

    const interval = window.setInterval(async () => {
      try {
        const data = await getTeacherDashboardSummary();
        setSummary(data);
      } catch {
        // Keep previous summary and retry on the next interval.
      }
    }, 6000);

    return () => window.clearInterval(interval);
  }, [selectedSession?.status]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-8">
      <section className="rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Teacher Analytics</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Class Performance Command Center</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Live scoring trends, common mistakes, risk signals, and top performers from your graded sessions.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onCreateSession}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              New Session
            </button>
            <button
              type="button"
              onClick={onOpenUploads}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <UploadCloud className="h-4 w-4" />
              Upload Scripts
            </button>
            <button
              type="button"
              onClick={onOpenOmi}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <BrainCircuit className="h-4 w-4" />
              Omi Insights
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {[
          ['Sessions', summary.metrics.total_sessions],
          ['Processed', summary.metrics.processed_sessions],
          ['Submissions', summary.metrics.total_submissions],
          ['Average Marks', summary.metrics.average_marks],
          ['Highest', summary.metrics.highest_marks],
          ['Lowest', summary.metrics.lowest_marks],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </section>

      {summaryError ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          {summaryError}
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Line Chart</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">Average Marks Trend</h2>
            </div>
            <LineChartIcon className="h-5 w-5 text-slate-400" />
          </div>
          <div className="h-80">
            {hasPerformanceData ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 8, right: 12, bottom: 8, left: -12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [value, 'Avg marks']} />
                  <Line type="monotone" dataKey="average_marks" stroke="#0f172a" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm font-medium text-slate-500">
                {isLoadingSummary ? 'Loading trend...' : 'Process a session to unlock trend analysis.'}
              </div>
            )}
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-4">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Bar Chart</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">Common Mistakes</h2>
            </div>
            <BarChart3 className="h-5 w-5 text-slate-400" />
          </div>
          <div className="h-80">
            {summary.common_mistakes.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.common_mistakes} layout="vertical" margin={{ top: 8, right: 8, bottom: 8, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 11, fill: '#475569' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="count" fill="#334155" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm font-medium text-slate-500">
                Mistake analytics appears after grading data is available.
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Class Toppers</h2>
            <Award className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-2">
            {summary.toppers.length > 0 ? (
              summary.toppers.map((topper, index) => (
                <div key={`${topper.student_name}-${topper.session_name}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{index + 1}. {topper.student_name}</p>
                    <p className="truncate text-xs text-slate-500">{topper.session_name}</p>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{topper.percentage}%</p>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                No topper data yet.
              </div>
            )}
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-4">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Score Distribution</h2>
          <div className="h-64">
            {summary.score_distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.score_distribution} margin={{ top: 6, right: 12, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="students" fill="#0f172a" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
                No score distribution yet.
              </div>
            )}
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-4">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Support Bands</h2>
          <div className="space-y-2">
            {summary.risk_bands.map((band) => (
              <div key={band.name} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <p className="text-sm font-medium text-slate-700">{band.name}</p>
                <p className="rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-semibold text-white">{band.students}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-slate-200 bg-white px-3 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              At-risk students
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {summary.risk_bands.find((band) => band.name === 'At risk')?.students ?? 0}
            </p>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Active Session</h2>
            <Clock3 className="h-5 w-5 text-slate-400" />
          </div>
          {selectedSession ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Session</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selectedSession.name}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Status</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selectedSession.status}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Progress</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {selectedSession.processed ?? 0} / {selectedSession.total_files ?? 0}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
              Select a session to track live processing status.
            </div>
          )}
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent Sessions</h2>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{sessions.length} total</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {recentSessions.length > 0 ? (
              recentSessions.map((session) => (
                <button
                  type="button"
                  key={session.session_id}
                  onClick={() => onSelectSession(session.session_id)}
                  className="group rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-slate-300 hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{session.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(session.created_at)}</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-slate-400 transition group-hover:text-slate-700" />
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500 sm:col-span-2">
                No sessions found. Create your first evaluation session.
              </div>
            )}
          </div>
        </article>
      </section>
    </div>
  );
};
