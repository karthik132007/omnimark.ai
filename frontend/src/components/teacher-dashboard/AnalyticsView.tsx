import { useEffect, useState } from 'react';
import {
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  FileText,
  Loader2,
  ScanSearch,
  Search,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Target,
  MessageSquare,
} from 'lucide-react';
import type { TeacherSession } from '../../types/teacherDashboard';
import type { SessionResult, NlpResult, LlmResult } from '../../types/teacherDashboard';
import { getSessionResults } from '../../lib/teacherDashboardApi';

interface AnalyticsViewProps {
  selectedSession: TeacherSession | null;
  isProcessing: boolean;
}

const isNlpResult = (result: NlpResult | LlmResult): result is NlpResult =>
  'similarity' in result && 'keyword_score' in result;

const pct = (v: number) => `${Math.round(v * 100)}%`;

/* ─── Stat Card ─── */
const StatCard = ({ icon: Icon, label, value, sub, tone = 'slate' }: {
  icon: typeof Award; label: string; value: string | number; sub?: string;
  tone?: 'emerald' | 'amber' | 'sky' | 'slate' | 'rose';
}) => {
  const bg: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    sky: 'bg-sky-50 text-sky-700',
    slate: 'bg-slate-100 text-slate-700',
    rose: 'bg-rose-50 text-rose-700',
  };
  return (
    <div className="interactive-surface rounded-[1.6rem] border border-white/75 bg-white/80 p-5 shadow-[0_16px_30px_rgba(148,163,184,0.08)]">
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${bg[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">{value}</div>
      <div className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{label}</div>
      {sub && <div className="mt-1 text-[11px] text-slate-500">{sub}</div>}
    </div>
  );
};

/* ═══════════════════ NLP Table View ═══════════════════ */
const NlpAnalytics = ({ results, maxMarks }: { results: SessionResult[]; maxMarks: number }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const scores = results.map((r) => (r.result as NlpResult).marks);
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const highest = scores.length ? Math.max(...scores) : 0;
  const lowest = scores.length ? Math.min(...scores) : 0;

  const filtered = searchQuery.trim()
    ? results.filter((r) => r.student_name.toLowerCase().includes(searchQuery.toLowerCase()))
    : results;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Students" value={results.length} tone="sky" />
        <StatCard icon={Award} label="Average Score" value={`${avg.toFixed(1)} / ${maxMarks}`} tone="emerald" />
        <StatCard icon={TrendingUp} label="Highest" value={`${highest} / ${maxMarks}`} tone="amber" />
        <StatCard icon={TrendingDown} label="Lowest" value={`${lowest} / ${maxMarks}`} tone="rose" />
      </div>

      {/* Table */}
      <div className="rounded-[2rem] border border-white/75 bg-white/80 shadow-[0_20px_60px_rgba(148,163,184,0.1)] overflow-hidden">
        <div className="px-8 pt-6 pb-4 flex flex-wrap items-center gap-3">
          <div className="h-1.5 w-1.5 rounded-full bg-[#0f172a]" />
          <span className="text-[11px] font-black uppercase tracking-widest text-[#0f172a]">Student Score Breakdown</span>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-4">
            <button
              type="button"
              onClick={() => {}}
              className="flex items-center gap-2 rounded-lg bg-[#0f172a] px-3.5 py-2 text-[12px] font-bold text-white transition hover:bg-slate-800"
            >
              <BrainCircuit className="h-3.5 w-3.5" />
              Re-evaluate with LLM
            </button>
            <button
              type="button"
              onClick={() => {}}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[12px] font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <ScanSearch className="h-3.5 w-3.5" />
              Cheat Detection
            </button>
          </div>

          {/* Search */}
          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student..."
              className="w-[200px] rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-[12px] font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-8 py-4">#</th>
                <th className="px-4 py-4">Student Name</th>
                <th className="px-4 py-4 text-center">Marks</th>
                <th className="px-4 py-4 text-center">Similarity</th>
                <th className="px-4 py-4 text-center">Keyword Score</th>
                <th className="px-4 py-4 text-center">Length Score</th>
                <th className="px-8 py-4 text-center">Grade</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const res = r.result as NlpResult;
                const pctScore = maxMarks > 0 ? (res.marks / maxMarks) * 100 : 0;
                let grade = 'F';
                let gradeTone = 'bg-rose-50 text-rose-700';
                if (pctScore >= 90) { grade = 'A+'; gradeTone = 'bg-emerald-50 text-emerald-700'; }
                else if (pctScore >= 80) { grade = 'A'; gradeTone = 'bg-emerald-50 text-emerald-600'; }
                else if (pctScore >= 70) { grade = 'B+'; gradeTone = 'bg-sky-50 text-sky-700'; }
                else if (pctScore >= 60) { grade = 'B'; gradeTone = 'bg-sky-50 text-sky-600'; }
                else if (pctScore >= 50) { grade = 'C'; gradeTone = 'bg-amber-50 text-amber-700'; }
                else if (pctScore >= 40) { grade = 'D'; gradeTone = 'bg-orange-50 text-orange-700'; }

                return (
                  <tr key={r.student_name + i} className="border-b border-slate-50 transition hover:bg-slate-50/60">
                    <td className="px-8 py-4 text-xs font-bold text-slate-400">{i + 1}</td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-900">{r.student_name}</div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-base font-extrabold text-slate-900">{res.marks}</span>
                      <span className="text-xs text-slate-400"> / {maxMarks}</span>
                    </td>
                    <td className="px-4 py-4 text-center font-semibold text-slate-700">{pct(res.similarity)}</td>
                    <td className="px-4 py-4 text-center font-semibold text-slate-700">{pct(res.keyword_score)}</td>
                    <td className="px-4 py-4 text-center font-semibold text-slate-700">{pct(res.length_score)}</td>
                    <td className="px-8 py-4 text-center">
                      <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${gradeTone}`}>{grade}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════ LLM Card View ═══════════════════ */
const LlmStudentCard = ({ result, index }: { result: SessionResult; index: number }) => {
  const [expanded, setExpanded] = useState(false);
  const res = result.result as LlmResult;
  const questions = Object.keys(res.marks || {});
  const hasOcrIssue = res.other_info?.ocr_issue_detected;

  return (
    <div className="interactive-surface rounded-[2rem] border border-white/75 bg-white/80 shadow-[0_16px_30px_rgba(148,163,184,0.08)] overflow-hidden transition-all">
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-4 px-6 py-5 text-left transition hover:bg-slate-50/60"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-bold text-slate-900 truncate">{result.student_name}</div>
          <div className="mt-1 text-xs text-slate-500 truncate">{res.evaluation_note}</div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {hasOcrIssue && (
            <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
              <AlertTriangle className="h-3 w-3" /> OCR
            </span>
          )}
          <div className="text-right">
            <div className="text-xl font-extrabold text-slate-900">{res.total_marks}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total</div>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-700">{res.confidence_score}%</span>
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-100 px-6 py-5 space-y-5 animate-[fadeIn_200ms_ease]">
          {/* Question-wise table */}
          {questions.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[#0f172a]">
                <Target className="h-3.5 w-3.5" /> Question-wise Breakdown
              </div>
              <div className="rounded-2xl border border-slate-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="px-5 py-3 text-left">Question</th>
                      <th className="px-5 py-3 text-center">Marks</th>
                      <th className="px-5 py-3 text-left">Feedback</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((q) => (
                      <tr key={q} className="border-t border-slate-50">
                        <td className="px-5 py-3 font-semibold text-slate-800">{q}</td>
                        <td className="px-5 py-3 text-center">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-950 text-xs font-bold text-white">
                            {res.marks[q]}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs leading-relaxed text-slate-600">
                          {res.question_feedback?.[q] || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Evaluation note */}
          {res.evaluation_note && (
            <div className="rounded-2xl bg-[#eef2fc] p-5">
              <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-600">
                <MessageSquare className="h-3.5 w-3.5" /> Evaluation Note
              </div>
              <p className="text-[13px] leading-relaxed text-slate-700">{res.evaluation_note}</p>
            </div>
          )}

          {/* Strengths & Weaknesses */}
          {(res.other_info?.strengths?.length || res.other_info?.weaknesses?.length) ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {res.other_info?.strengths?.length ? (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                  <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-emerald-700">
                    <Zap className="h-3.5 w-3.5" /> Strengths
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {res.other_info.strengths.map((s) => (
                      <span key={s} className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-800">{s}</span>
                    ))}
                  </div>
                </div>
              ) : null}
              {res.other_info?.weaknesses?.length ? (
                <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
                  <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-rose-700">
                    <AlertTriangle className="h-3.5 w-3.5" /> Weaknesses
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {res.other_info.weaknesses.map((w) => (
                      <span key={w} className="rounded-full bg-rose-100 px-3 py-1 text-[11px] font-semibold text-rose-800">{w}</span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

const LlmAnalytics = ({ results }: { results: SessionResult[] }) => {
  const totals = results.map((r) => (r.result as LlmResult).total_marks);
  const confidences = results.map((r) => (r.result as LlmResult).confidence_score);
  const avg = totals.length ? totals.reduce((a, b) => a + b, 0) / totals.length : 0;
  const avgConf = confidences.length ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 0;
  const highest = totals.length ? Math.max(...totals) : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Students" value={results.length} tone="sky" />
        <StatCard icon={Award} label="Average Marks" value={avg.toFixed(1)} tone="emerald" />
        <StatCard icon={TrendingUp} label="Highest" value={highest} tone="amber" />
        <StatCard icon={ShieldCheck} label="Avg Confidence" value={`${avgConf.toFixed(0)}%`} tone="slate" sub="AI grading confidence" />
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 px-1">
          <div className="h-1.5 w-1.5 rounded-full bg-[#0f172a]" />
          <span className="text-[11px] font-black uppercase tracking-widest text-[#0f172a]">Individual Reports</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-500">{results.length}</span>
        </div>
        {results.map((r, i) => (
          <LlmStudentCard key={r.student_name + i} result={r} index={i} />
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════ Processing View ═══════════════════ */
const ProcessingView = ({ selectedSession, isProcessing }: { selectedSession: TeacherSession | null; isProcessing: boolean }) => {
  const processed = selectedSession?.processed ?? 0;
  const total = selectedSession?.total_files ?? 0;
  const progressPercent = total > 0 ? Math.round((processed / total) * 100) : 0;
  const statusTone = selectedSession?.status === 'processed' ? 'text-emerald-500' : 'text-amber-500';

  return (
    <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
      <section className="frost-panel rounded-[2rem] border border-white/80 p-6 shadow-[0_28px_90px_rgba(15,23,42,0.1)]">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 shadow-[0_10px_24px_rgba(148,163,184,0.12)]">
          <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
          Processing In Progress
        </div>
        <h2 className="font-display mt-4 text-3xl font-semibold tracking-[-0.05em] text-slate-950 md:text-4xl">
          Processing Scripts...
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 md:text-base">
          The OmniMark engine is analyzing the uploaded student scripts. Feel free to leave this page; the process will continue in the background.
        </p>
        <div className="mt-8 rounded-[1.5rem] border border-white/75 bg-white/80 p-5 shadow-[0_16px_30px_rgba(148,163,184,0.08)]">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-slate-900">Overall Progress</div>
            <div className={`text-sm font-bold ${statusTone}`}>{progressPercent}%</div>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-slate-900 transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>{Math.min(processed, total)} of {total} scripts processed</span>
            </div>
            {isProcessing && (
              <div className="flex items-center gap-2 text-amber-600">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Analyzing next script...</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <aside className="frost-panel rounded-[2rem] border border-white/80 p-6 shadow-[0_28px_80px_rgba(15,23,42,0.08)] h-fit">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Live Tracker</div>
        <div className="mt-6 flex flex-col gap-3">
          {total > 0 ? (
            Array.from({ length: total }).map((_, index) => {
              const isCompleted = index < processed;
              const isCurrent = index === processed && isProcessing;
              let Icon = FileText;
              let tone = 'text-slate-400 bg-slate-100/50';
              let border = 'border-slate-200/50';
              if (isCompleted) { Icon = CheckCircle2; tone = 'text-emerald-600 bg-emerald-50'; border = 'border-emerald-100'; }
              else if (isCurrent) { Icon = Loader2; tone = 'text-amber-600 bg-amber-50'; border = 'border-amber-200 shadow-sm'; }
              return (
                <div key={index} className={`flex items-center gap-3 rounded-2xl border ${border} bg-white/60 p-3 transition-all ${isCurrent ? 'scale-[1.02]' : ''}`}>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
                    <Icon className={`h-4 w-4 ${isCurrent ? 'animate-spin' : ''}`} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900">Student Script {index + 1}</div>
                    <div className="text-xs text-slate-500">{isCompleted ? 'Evaluation completed' : isCurrent ? 'Extracting & grading...' : 'In queue'}</div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-sm text-slate-500 italic">No scripts found in session.</div>
          )}
        </div>
      </aside>
    </div>
  );
};

/* ═══════════════════ Main Component ═══════════════════ */
export const AnalyticsView = ({ selectedSession, isProcessing }: AnalyticsViewProps) => {
  const [results, setResults] = useState<SessionResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isProcessed = selectedSession?.status === 'processed';
  const isLlm = selectedSession?.correction_mode === 'LLM';
  const maxMarks = selectedSession?.preferences?.max_marks ?? 100;

  useEffect(() => {
    if (!isProcessed || !selectedSession?.session_id) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await getSessionResults(selectedSession.session_id);
        setResults(data);
      } catch {
        setError('Failed to load evaluation results.');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchResults();
  }, [isProcessed, selectedSession?.session_id]);

  /* Still processing → show progress */
  if (!isProcessed) {
    return <ProcessingView selectedSession={selectedSession} isProcessing={isProcessing} />;
  }

  /* Loading results */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        <span className="ml-3 text-sm font-semibold text-slate-500">Loading results...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-600">{error}</div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1100px]">
      {/* Page header — matching EvaluationSetupView */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-[#0f172a] sm:text-5xl">
          Evaluation<br />Analytics
        </h1>
        <p className="mt-4 max-w-[500px] text-[13px] leading-relaxed text-slate-500">
          {isLlm
            ? 'AI-powered question-wise grading reports with confidence scoring and qualitative feedback.'
            : 'Score breakdown across similarity, keyword matching, and length heuristics for every student.'}
        </p>
      </div>

      {results.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white/70 px-8 py-16 text-center">
          <BarChart3 className="mx-auto h-10 w-10 text-slate-300" />
          <div className="mt-4 text-sm font-semibold text-slate-500">No results found for this session.</div>
        </div>
      ) : isLlm ? (
        <LlmAnalytics results={results} />
      ) : (
        <NlpAnalytics results={results} maxMarks={maxMarks} />
      )}
    </div>
  );
};