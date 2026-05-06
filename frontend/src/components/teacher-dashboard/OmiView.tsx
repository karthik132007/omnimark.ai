import { BrainCircuit, Loader2, Sparkles, AlertCircle, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getOmiAnalysis } from '../../lib/teacherDashboardApi';
import type { OmiAnalysisResponse } from '../../types/teacherDashboard';

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

  return (
    <div className="space-y-8 max-w-5xl mx-auto relative z-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between px-2 pt-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl font-display flex items-center gap-4">
            <div className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-3 text-white shadow-lg">
              <BrainCircuit className="h-8 w-8" />
            </div>
            Omi Assistant
          </h1>
          <p className="mt-4 text-[16px] text-slate-600 max-w-2xl leading-relaxed font-medium">
            Your personal AI analyst. Omi deeply understands your class performance metrics and provides actionable insights.
          </p>
        </div>
        <button
          onClick={fetchAnalysis}
          disabled={isLoading}
          className="mt-4 md:mt-0 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-700 border border-slate-200/60 shadow-sm hover:bg-slate-50 hover:text-indigo-600 transition-colors disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh Insights
        </button>
      </div>

      {isLoading && !analysis && (
        <div className="frost-panel interactive-surface rounded-[2.5rem] p-16 flex flex-col items-center justify-center text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative inline-flex items-center justify-center rounded-full bg-slate-900 p-6 text-white">
              <Sparkles className="h-10 w-10 animate-bounce" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Omi is analyzing your class...</h3>
            <p className="mt-2 text-slate-500 font-medium">Crunching numbers and finding patterns.</p>
          </div>
        </div>
      )}

      {error && !isLoading && (
        <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-6 text-red-700 flex items-start gap-4 shadow-sm">
          <AlertCircle className="h-6 w-6 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-lg">Analysis Failed</h3>
            <p className="mt-1 font-medium">{error}</p>
          </div>
        </div>
      )}

      {analysis && !isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Greeting & Overview */}
          <div className="md:col-span-12 frost-panel interactive-surface rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgba(15,23,42,0.04)] bg-gradient-to-r from-white/90 to-indigo-50/30">
            <h2 className="text-2xl font-black text-slate-900 font-display mb-4 flex items-center gap-2">
              Message from Omi <Sparkles className="h-5 w-5 text-indigo-500" />
            </h2>
            <div className="text-[16px] text-slate-700 leading-relaxed font-medium space-y-4">
              <p className="italic text-indigo-900/80">"{analysis.greeting}"</p>
              <p>{analysis.overview}</p>
            </div>
          </div>

          {/* Strengths & Areas for Improvement */}
          <div className="md:col-span-6 flex flex-col gap-6">
            <div className="flex-1 frost-panel interactive-surface rounded-[2rem] p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-black text-slate-900 font-display">Class Strengths</h3>
              </div>
              <ul className="space-y-4">
                {analysis.strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold mt-0.5">{idx + 1}</span>
                    <span className="text-[15px] font-medium text-slate-700 leading-relaxed">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="md:col-span-6 flex flex-col gap-6">
            <div className="flex-1 frost-panel interactive-surface rounded-[2rem] p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-black text-slate-900 font-display">Areas for Improvement</h3>
              </div>
              <ul className="space-y-4">
                {analysis.areas_for_improvement.map((area, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 text-xs font-bold mt-0.5">{idx + 1}</span>
                    <span className="text-[15px] font-medium text-slate-700 leading-relaxed">{area}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action Plan */}
          <div className="md:col-span-12 group relative rounded-[2.5rem] p-[2px] overflow-hidden mt-2">
             <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-90"></div>
             <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-overlay"></div>
             <div className="relative h-full rounded-[2.4rem] bg-slate-900/90 p-8 backdrop-blur-2xl">
               <h3 className="text-2xl font-black text-white font-display mb-6 flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg"><ArrowRight className="h-5 w-5 text-white" /></div>
                  Recommended Action Plan
               </h3>
               <div className="grid gap-4 sm:grid-cols-2">
                 {analysis.action_plan.map((action, idx) => (
                   <div key={idx} className="bg-white/10 rounded-2xl p-5 border border-white/10 hover:bg-white/20 transition-colors">
                      <div className="text-indigo-300 font-black text-xs uppercase tracking-widest mb-2">Step {idx + 1}</div>
                      <p className="text-white text-[15px] leading-relaxed font-medium">{action}</p>
                   </div>
                 ))}
               </div>
             </div>
          </div>

        </div>
      )}
    </div>
  );
};
