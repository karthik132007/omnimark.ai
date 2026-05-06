import {
  AlertCircle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  Gauge,
  Lightbulb,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { getOmiAnalysis } from '../../lib/teacherDashboardApi';
import type { OmiAnalysisResponse } from '../../types/teacherDashboard';

const asList = (items?: string[]) => (Array.isArray(items) ? items.filter(Boolean) : []);

const performanceStyle = (level?: string) => {
  const normalized = level?.toLowerCase();

  if (normalized === 'excellent') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (normalized === 'good') {
    return 'border-cyan-200 bg-cyan-50 text-cyan-700';
  }

  if (normalized === 'poor') {
    return 'border-rose-200 bg-rose-50 text-rose-700';
  }

  return 'border-amber-200 bg-amber-50 text-amber-700';
};

const InsightList = ({
  items,
  tone,
}: {
  items: string[];
  tone: 'emerald' | 'amber' | 'cyan' | 'rose' | 'indigo';
}) => {
  const toneClasses = {
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    cyan: 'bg-cyan-50 text-cyan-700',
    rose: 'bg-rose-50 text-rose-700',
    indigo: 'bg-indigo-50 text-indigo-700',
  };

  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${toneClasses[tone]}`}>
            {index + 1}
          </span>
          <span className="text-sm font-medium leading-relaxed text-slate-700">{item}</span>
        </li>
      ))}
    </ul>
  );
};

export const OmiView = () => {
  const [analysis, setAnalysis] = useState<OmiAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getOmiAnalysis();
      if (data.error) {
        setError(data.error);
      } else {
        setAnalysis(data);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while consulting Omi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const strengths = asList(analysis?.strengths);
  const improvements = asList(analysis?.areas_for_improvement);
  const insights = asList(analysis?.insights);
  const priorityFocus = asList(analysis?.priority_focus);
  const riskSignals = asList(analysis?.risk_signals);
  const teachingStrategy = asList(analysis?.teaching_strategy);
  const actionPlan = asList(analysis?.action_plan);
  const checkpoints = asList(analysis?.next_checkpoints);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-8">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="px-6 py-7 sm:px-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-cyan-700">
              <Sparkles className="h-3.5 w-3.5" />
              Omi Assistant
            </div>
            <h1 className="mt-4 max-w-3xl text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
              Class intelligence that turns scores into next steps.
            </h1>
            <p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-slate-600 sm:text-base">
              Omi reads your class metrics, spots patterns, and gives you focused actions for the next teaching cycle.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={fetchAnalysis}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Refresh Insights
              </button>
              {analysis?.performance_level ? (
                <span className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold capitalize ${performanceStyle(analysis.performance_level)}`}>
                  <Gauge className="h-4 w-4" />
                  {analysis.performance_level}
                </span>
              ) : null}
            </div>
          </div>
          <div className="border-t border-slate-200 bg-slate-950 px-6 py-7 text-white lg:border-l lg:border-t-0 sm:px-8">
            <div className="flex h-full flex-col justify-between gap-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950">
                  <BrainCircuit className="h-7 w-7" />
                </div>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                  Academic analyst
                </span>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">Current brief</p>
                <p className="mt-3 text-lg font-semibold leading-7 text-white">
                  {analysis?.greeting || 'Preparing a clear read on your latest class performance.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {isLoading && !analysis ? (
        <section className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-slate-950">Omi is analyzing your class</h2>
          <p className="mt-2 text-sm font-medium text-slate-500">Reviewing trends, mistakes, risk bands, and performance gaps.</p>
        </section>
      ) : null}

      {error && !isLoading ? (
        <section className="flex items-start gap-4 rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">
          <AlertCircle className="mt-0.5 h-6 w-6 shrink-0" />
          <div>
            <h2 className="text-lg font-bold">Analysis failed</h2>
            <p className="mt-1 text-sm font-semibold">{error}</p>
          </div>
        </section>
      ) : null}

      {analysis && !isLoading ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                <Lightbulb className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Executive Summary</p>
                <h2 className="text-xl font-bold text-slate-950">What Omi noticed</h2>
              </div>
            </div>
            <p className="mt-5 text-base font-medium leading-7 text-slate-700">{analysis.overview}</p>
            {analysis.trend_summary ? (
              <div className="mt-5 rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-4">
                <div className="flex items-center gap-2 text-sm font-bold text-cyan-800">
                  <TrendingUp className="h-4 w-4" />
                  Trend summary
                </div>
                <p className="mt-2 text-sm font-medium leading-6 text-cyan-900">{analysis.trend_summary}</p>
              </div>
            ) : null}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Priority Focus</p>
                <h2 className="text-xl font-bold text-slate-950">Start here</h2>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {(priorityFocus.length ? priorityFocus : improvements.slice(0, 2)).map((item, index) => (
                <div key={`${item}-${index}`} className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
                  <p className="text-sm font-semibold leading-6 text-amber-900">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-4">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-950">Class Strengths</h2>
            </div>
            <InsightList items={strengths} tone="emerald" />
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-4">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-950">Risk Signals</h2>
            </div>
            <InsightList items={riskSignals.length ? riskSignals : improvements} tone="rose" />
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-4">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                <Sparkles className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-950">Key Insights</h2>
            </div>
            <InsightList items={insights.length ? insights : improvements} tone="cyan" />
          </section>

          <section className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm xl:col-span-7">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-cyan-200">
                <ArrowRight className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-200">Recommended Action Plan</p>
                <h2 className="text-xl font-bold">Next teaching moves</h2>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {actionPlan.map((action, index) => (
                <div key={`${action}-${index}`} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-200">Step {index + 1}</p>
                  <p className="mt-2 text-sm font-medium leading-6 text-white">{action}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-950">Teaching Strategy</h2>
            </div>
            <InsightList items={teachingStrategy.length ? teachingStrategy : actionPlan.slice(0, 3)} tone="indigo" />
          </section>

          {checkpoints.length || analysis.confidence_note ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-12">
              <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
                {checkpoints.length ? (
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">Next Checkpoints</h2>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {checkpoints.map((checkpoint, index) => (
                        <div key={`${checkpoint}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <p className="text-sm font-semibold leading-6 text-slate-700">{checkpoint}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {analysis.confidence_note ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Confidence Note</p>
                    <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{analysis.confidence_note}</p>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
