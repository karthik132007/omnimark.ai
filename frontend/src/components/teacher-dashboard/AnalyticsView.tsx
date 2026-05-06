import { useEffect, useState } from 'react';
import {
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
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
  Eye,
  X,
} from 'lucide-react';
import type { TeacherSession } from '../../types/teacherDashboard';
import type { SessionResult, NlpResult, LlmResult, CheatDetectionReport } from '../../types/teacherDashboard';
import { getCheatReport, getSessionResults, triggerCheatDetection } from '../../lib/teacherDashboardApi';

interface AnalyticsViewProps {
  selectedSession: TeacherSession | null;
  isProcessing: boolean;
}



const pct = (v: number) => `${Math.round(v * 100)}%`;

const KNOWN_STRENGTHS = new Set([
  "Good conceptual clarity", "Accurate facts", "Relevant content", "Well-structured answer", "Good examples", "Comprehensive coverage", "Good language use", "Critical thinking", "Original insights", "Effective communication", "Formal definition", "Real-world applications", "Clear intuitive understanding", "Sound reasoning", "Correct method/process", "Correct units/notation", "Answers all sub-parts", "Concise and focused", "Well-justified claims"
]);

const KNOWN_WEAKNESSES = new Set([
  "Missed definitions", "Inaccurate facts", "Irrelevant content", "Poor structure", "Lack of examples", "Incomplete answer", "Poor language use", "Lack of critical thinking", "Plagiarism detected", "Ineffective communication", "Lack of formal definition", "Lack of real-world applications", "Unclear intuitive understanding", "Weak reasoning", "Incorrect method/process", "Incorrect units/notation", "Missed sub-parts", "Overly verbose", "Poor justification"
]);

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
const NlpAnalytics = ({
  results,
  maxMarks,
  onRunCheatDetection,
}: {
  results: SessionResult[];
  maxMarks: number;
  onRunCheatDetection: () => void;
}) => {
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
              onClick={onRunCheatDetection}
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

/* ═══════════════════ LLM Dashboard View ═══════════════════ */
const LlmAnalytics = ({ results, onRunCheatDetection }: { results: SessionResult[]; onRunCheatDetection: () => void }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<SessionResult | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'marks_desc' | 'marks_asc'>('marks_desc');

  const totals = results.map((r) => (r.result as LlmResult).total_marks);
  const confidences = results.map((r) => (r.result as LlmResult).confidence_score);
  const avg = totals.length ? totals.reduce((a, b) => a + b, 0) / totals.length : 0;
  const avgConf = confidences.length ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 0;
  // Needs attention (confidence < 75%)
  const ocrIssuesCount = results.filter(r => (r.result as LlmResult).other_info?.ocr_issue_detected).length;
  // Needs attention (confidence < 75%)
  const needsAttentionCount = results.filter(r => (r.result as LlmResult).confidence_score < 75).length;

  // Top performers
  const sortedByMarks = [...results].sort((a, b) => (b.result as LlmResult).total_marks - (a.result as LlmResult).total_marks);
  const topPerformers = sortedByMarks.slice(0, 3);

  // Common Strengths
  const strengthCounts: Record<string, number> = {};
  results.forEach(r => {
    const strengths = (r.result as LlmResult).other_info?.strengths || [];
    strengths.forEach(s => {
      const clean = s.trim();
      const match = Array.from(KNOWN_STRENGTHS).find(k => k.toLowerCase() === clean.toLowerCase());
      if (match) {
        strengthCounts[match] = (strengthCounts[match] || 0) + 1;
      }
    });
  });
  const commonStrengths = Object.entries(strengthCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

  // Common Weaknesses
  const weaknessCounts: Record<string, number> = {};
  results.forEach(r => {
    const weaknesses = (r.result as LlmResult).other_info?.weaknesses || [];
    weaknesses.forEach(w => {
      const clean = w.trim();
      const match = Array.from(KNOWN_WEAKNESSES).find(k => k.toLowerCase() === clean.toLowerCase());
      if (match) {
        weaknessCounts[match] = (weaknessCounts[match] || 0) + 1;
      }
    });
  });
  const commonWeaknesses = Object.entries(weaknessCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

  let filtered = searchQuery.trim()
    ? results.filter((r) => r.student_name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [...results];

  filtered.sort((a, b) => {
    if (sortBy === 'name') return a.student_name.localeCompare(b.student_name);
    const marksA = (a.result as LlmResult).total_marks;
    const marksB = (b.result as LlmResult).total_marks;
    return sortBy === 'marks_desc' ? marksB - marksA : marksA - marksB;
  });

  return (
    <div className="space-y-6 relative">
      {/* Top Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={Users} label="Total Students" value={results.length} tone="sky" />
        <StatCard icon={Award} label="Average Marks" value={avg.toFixed(1)} tone="emerald" />
        <StatCard icon={ShieldCheck} label="Avg Confidence" value={`${avgConf.toFixed(0)}%`} tone="slate" />
        <StatCard icon={AlertTriangle} label="Needs Attention" value={needsAttentionCount} tone="amber" sub="Confidence < 75%" />
        <StatCard icon={FileText} label="OCR Issues" value={ocrIssuesCount} tone="rose" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        {/* Main Left Column */}
        <div className="space-y-6">
          {/* Table */}
          <div className="rounded-[2rem] border border-white/75 bg-white/80 shadow-[0_20px_60px_rgba(148,163,184,0.1)] overflow-hidden h-fit">
            <div className="px-8 pt-6 pb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-[#0f172a]" />
                <span className="text-[11px] font-black uppercase tracking-widest text-[#0f172a]">Student Performance</span>
              </div>
              <div className="flex items-center gap-3">
                {/* Actions */}
                <div className="flex items-center gap-2 mr-2">
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-lg bg-[#0f172a] px-3.5 py-2 text-[12px] font-bold text-white transition hover:bg-slate-800"
                  >
                    <BrainCircuit className="h-3.5 w-3.5" />
                    Re-evaluate All
                  </button>
                  <button
                    type="button"
                    onClick={onRunCheatDetection}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[12px] font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <ScanSearch className="h-3.5 w-3.5" />
                    Cheat Detection
                  </button>
                </div>

                {/* Sort */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="appearance-none rounded-lg border border-slate-200 bg-slate-50 py-2 pl-3 pr-8 text-[12px] font-medium text-slate-800 outline-none transition focus:border-slate-300 focus:bg-white cursor-pointer"
                  >
                    <option value="marks_desc">Highest Marks</option>
                    <option value="marks_asc">Lowest Marks</option>
                    <option value="name">Name (A-Z)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name..."
                    className="w-[200px] rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-[12px] font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
                  />
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <th className="px-8 py-4">#</th>
                    <th className="px-4 py-4">Student Name</th>
                    <th className="px-4 py-4 text-center">Total Marks</th>
                    <th className="px-4 py-4 text-center">AI Confidence</th>
                    <th className="px-4 py-4 text-center">OCR Issue</th>
                    <th className="px-8 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => {
                    const res = r.result as LlmResult;
                    const hasOcrIssue = res.other_info?.ocr_issue_detected;
                    
                    let perfLabel = 'Average';
                    let perfTone = 'bg-amber-50 text-amber-700 border-amber-200/50';
                    if (res.confidence_score >= 85) { perfLabel = 'Excellent'; perfTone = 'bg-emerald-50 text-emerald-700 border-emerald-200/50'; }
                    else if (res.confidence_score >= 70) { perfLabel = 'Good'; perfTone = 'bg-sky-50 text-sky-700 border-sky-200/50'; }
                    else if (res.confidence_score < 50) { perfLabel = 'Poor'; perfTone = 'bg-rose-50 text-rose-700 border-rose-200/50'; }

                    return (
                      <tr key={r.student_name + i} className="border-b border-slate-50 transition hover:bg-slate-50/80">
                        <td className="px-8 py-4 text-xs font-bold text-slate-400">{i + 1}</td>
                        <td className="px-4 py-4 font-semibold text-slate-900">{r.student_name}</td>
                        <td className="px-4 py-4 text-center font-extrabold text-slate-900">{res.total_marks}</td>
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${perfTone}`}>
                            {res.confidence_score}% - {perfLabel}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {hasOcrIssue ? (
                            <span className="inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">Yes</span>
                          ) : (
                            <span className="inline-flex rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-500">No</span>
                          )}
                        </td>
                        <td className="px-8 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedStudent(r)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-[#0f172a] hover:text-white"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-8 py-16 text-center text-sm font-medium text-slate-500">
                        No results found matching "{searchQuery}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Sidebar Widgets */}
        <div className="space-y-6">
          {/* Top Performers */}
          <div className="rounded-[2rem] border border-white/75 bg-white/80 p-6 shadow-[0_20px_60px_rgba(148,163,184,0.1)]">
            <div className="mb-5 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[#0f172a]">
              <Award className="h-3.5 w-3.5" /> Top Performers
            </div>
            <div className="space-y-4">
              {topPerformers.map((r, i) => {
                const res = r.result as LlmResult;
                return (
                  <div key={r.student_name + i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                        {i + 1}
                      </div>
                      <span className="text-[13px] font-semibold text-slate-800">{r.student_name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[13px] font-bold text-slate-900">
                      <span>{res.total_marks}</span>
                    </div>
                  </div>
                );
              })}
              {topPerformers.length === 0 && <div className="text-[12px] text-slate-500">No data available.</div>}
            </div>
          </div>

          {/* Common Strengths */}
          <div className="rounded-[2rem] border border-white/75 bg-white/80 p-6 shadow-[0_20px_60px_rgba(148,163,184,0.1)]">
            <div className="mb-5 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-emerald-600">
              <Zap className="h-3.5 w-3.5" /> Common Strengths
            </div>
            {commonStrengths.length > 0 ? (
              <div className="space-y-4">
                {commonStrengths.map(([strength, count], i) => {
                  const percentage = Math.round((count / results.length) * 100);
                  return (
                    <div key={strength + i}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[12px] font-semibold text-slate-700">{strength}</span>
                        <span className="text-[11px] font-bold text-slate-500">{percentage}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-emerald-400" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-[12px] text-slate-500">No common strengths identified.</div>
            )}
          </div>

          {/* Common Weaknesses */}
          <div className="rounded-[2rem] border border-white/75 bg-white/80 p-6 shadow-[0_20px_60px_rgba(148,163,184,0.1)]">
            <div className="mb-5 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-rose-600">
              <Target className="h-3.5 w-3.5" /> Common Weaknesses
            </div>
            {commonWeaknesses.length > 0 ? (
              <div className="space-y-4">
                {commonWeaknesses.map(([weakness, count], i) => {
                  const percentage = Math.round((count / results.length) * 100);
                  return (
                    <div key={weakness + i}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[12px] font-semibold text-slate-700">{weakness}</span>
                        <span className="text-[11px] font-bold text-slate-500">{percentage}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-rose-400" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-[12px] text-slate-500">No common weaknesses identified.</div>
            )}
          </div>
          

        </div>
      </div>

      {/* Slide-out Drawer for Student Details */}
      {selectedStudent && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm animate-fade-in" 
            onClick={() => setSelectedStudent(null)}
          />
          
          {/* Drawer Panel */}
          <div className="relative w-full max-w-2xl bg-white shadow-2xl animate-slide-in-right overflow-y-auto flex flex-col h-full">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/80 px-8 py-6 backdrop-blur-xl">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">{selectedStudent.student_name}</h2>
                <div className="mt-1 flex items-center gap-3">
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Detailed Report</span>
                  {(selectedStudent.result as LlmResult).other_info?.ocr_issue_detected && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                      <AlertTriangle className="h-2.5 w-2.5" /> OCR Issue
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-8 space-y-8">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Marks</div>
                  <div className="mt-1 text-3xl font-extrabold text-slate-900">{(selectedStudent.result as LlmResult).total_marks}</div>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                  <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600">AI Confidence</div>
                  <div className="mt-1 text-3xl font-extrabold text-emerald-700">{(selectedStudent.result as LlmResult).confidence_score}%</div>
                </div>
              </div>

              {/* Evaluation Note */}
              {(selectedStudent.result as LlmResult).evaluation_note && (
                <div className="rounded-3xl bg-[#eef2fc] p-6">
                  <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-600">
                    <MessageSquare className="h-3.5 w-3.5" /> AI Evaluation Note
                  </div>
                  <p className="text-[14px] leading-relaxed text-slate-700">
                    {(selectedStudent.result as LlmResult).evaluation_note}
                  </p>
                </div>
              )}

              {/* Question Breakdown */}
              {Object.keys((selectedStudent.result as LlmResult).marks || {}).length > 0 && (
                <div>
                  <div className="mb-4 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[#0f172a]">
                    <Target className="h-3.5 w-3.5" /> Question-wise Breakdown
                  </div>
                  <div className="rounded-2xl border border-slate-100 overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <th className="px-5 py-3">Question</th>
                          <th className="px-5 py-3 text-center">Marks</th>
                          <th className="px-5 py-3">Feedback</th>
                        </tr>
                      </thead>
                        <tbody>
                        {Object.keys((selectedStudent.result as LlmResult).marks || {}).map((q) => (
                          <tr key={q} className="border-t border-slate-50">
                            <td className="px-5 py-4 font-semibold text-slate-800">{q}</td>
                            <td className="px-5 py-4 text-center">
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white shadow-sm">
                                {(selectedStudent.result as LlmResult).marks[q]}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-[13px] leading-relaxed text-slate-600">
                              {(selectedStudent.result as LlmResult).question_feedback?.[q] || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Strengths & Weaknesses */}
              <div className="space-y-4">
                {((selectedStudent.result as LlmResult).other_info?.strengths?.length ?? 0) > 0 && (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6">
                    <div className="mb-4 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-emerald-700">
                      <Zap className="h-3.5 w-3.5" /> Strengths
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(selectedStudent.result as LlmResult).other_info?.strengths?.map((s) => (
                        <span key={s} className="rounded-full bg-emerald-100/80 border border-emerald-200/60 px-4 py-2 text-[12px] font-bold text-emerald-800">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {((selectedStudent.result as LlmResult).other_info?.weaknesses?.length ?? 0) > 0 && (
                  <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-6">
                    <div className="mb-4 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-rose-700">
                      <AlertTriangle className="h-3.5 w-3.5" /> Areas for Improvement
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(selectedStudent.result as LlmResult).other_info?.weaknesses?.map((w) => (
                        <span key={w} className="rounded-full bg-rose-100/80 border border-rose-200/60 px-4 py-2 text-[12px] font-bold text-rose-800">{w}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div className="sticky bottom-0 border-t border-slate-100 bg-slate-50 px-8 py-4 flex justify-end gap-3">
               <button
                 type="button"
                 className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
               >
                 Export PDF
               </button>
               <button
                 type="button"
                 onClick={() => setSelectedStudent(null)}
                 className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800"
               >
                 Close Report
               </button>
            </div>
          </div>
        </div>
      )}
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
  const [cheatReport, setCheatReport] = useState<CheatDetectionReport | null>(null);
  const [cheatStatus, setCheatStatus] = useState('idle');
  const [isRunningCheat, setIsRunningCheat] = useState(false);
  const [cheatError, setCheatError] = useState('');

  const isProcessed = selectedSession?.status === 'processed';
  const isLlm = selectedSession?.correction_mode === 'LLM';
  const maxMarks = selectedSession?.preferences?.max_marks ?? 100;

  useEffect(() => {
    if (!isProcessed || !selectedSession?.session_id) {
      setResults([]);
      setCheatReport(null);
      setCheatStatus('idle');
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      setError('');
      try {
        const [data, cheat] = await Promise.all([
          getSessionResults(selectedSession.session_id),
          getCheatReport(selectedSession.session_id),
        ]);
        setResults(data);
        setCheatReport(cheat.report);
        setCheatStatus(cheat.status || 'idle');
        setCheatError('');
      } catch {
        setError('Failed to load evaluation results.');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchResults();
  }, [isProcessed, selectedSession?.session_id]);

  useEffect(() => {
    if (!selectedSession?.session_id || !isProcessed) {
      return;
    }
    if (cheatStatus !== 'running') {
      return;
    }

    const pollId = window.setInterval(async () => {
      try {
        const cheat = await getCheatReport(selectedSession.session_id);
        setCheatReport(cheat.report);
        setCheatStatus(cheat.status || 'idle');
      } catch {
        // Keep previous state and retry.
      }
    }, 4000);

    return () => window.clearInterval(pollId);
  }, [cheatStatus, isProcessed, selectedSession?.session_id]);

  const handleRunCheatDetection = async () => {
    if (!selectedSession?.session_id) {
      return;
    }
    setIsRunningCheat(true);
    setCheatError('');
    setCheatReport(null);
    try {
      await triggerCheatDetection(selectedSession.session_id);
      setCheatStatus('running');
    } catch {
      setCheatError('Failed to start cheat detection. Please try again.');
    } finally {
      setIsRunningCheat(false);
    }
  };

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

      <div className="mb-6 rounded-[1.6rem] border border-white/75 bg-white/80 p-5 shadow-[0_16px_30px_rgba(148,163,184,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-black uppercase tracking-widest text-[#0f172a]">Cheat Detection</div>
            <div className="mt-1 text-sm font-semibold text-slate-600">
              {cheatStatus === 'running' ? 'Scanning pair-wise similarities...' : 'Multi-signal similarity check across the full class.'}
            </div>
          </div>
          <button
            type="button"
            onClick={handleRunCheatDetection}
            disabled={isRunningCheat || cheatStatus === 'running'}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[12px] font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRunningCheat || cheatStatus === 'running' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ScanSearch className="h-3.5 w-3.5" />}
            {cheatStatus === 'running' ? 'Running...' : 'Run Cheat Detection'}
          </button>
        </div>

        {cheatError ? (
          <div className="mt-3 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">{cheatError}</div>
        ) : null}

        {cheatReport ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Flagged Pairs</div>
              <div className="mt-1 text-xl font-extrabold text-slate-900">{cheatReport.summary.pairs_flagged}</div>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Students Flagged</div>
              <div className="mt-1 text-xl font-extrabold text-slate-900">{cheatReport.summary.students_flagged}</div>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Highest Pair Score</div>
              <div className="mt-1 text-xl font-extrabold text-slate-900">{Math.round(cheatReport.summary.highest_pair_score * 100)}%</div>
            </div>
          </div>
        ) : null}

        {cheatReport?.flagged_pairs?.length ? (
          <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-3">
            <div className="text-[11px] font-black uppercase tracking-widest text-amber-700">Top Suspicious Pairs</div>
            <div className="mt-2 space-y-1">
              {cheatReport.flagged_pairs.slice(0, 3).map((pair) => (
                <div key={`${pair.student_1}-${pair.student_2}`} className="text-xs font-semibold text-amber-800">
                  {pair.student_1} vs {pair.student_2} - {Math.round(pair.score * 100)}% ({pair.risk_level})
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {results.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white/70 px-8 py-16 text-center">
          <BarChart3 className="mx-auto h-10 w-10 text-slate-300" />
          <div className="mt-4 text-sm font-semibold text-slate-500">No results found for this session.</div>
        </div>
      ) : isLlm ? (
        <LlmAnalytics results={results} onRunCheatDetection={handleRunCheatDetection} />
      ) : (
        <NlpAnalytics results={results} maxMarks={maxMarks} onRunCheatDetection={handleRunCheatDetection} />
      )}
    </div>
  );
};
