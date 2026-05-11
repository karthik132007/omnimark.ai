import React from 'react';
import { 
  Trophy, 
  Target, 
  FileCheck, 
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import type { SessionResult } from '../../types/teacherDashboard';

interface StudentOverviewViewProps {
  studentName: string;
  results: SessionResult[];
  onViewResults: () => void;
}

export const StudentOverviewView: React.FC<StudentOverviewViewProps> = ({
  studentName,
  results,
  onViewResults
}) => {
  const stats = React.useMemo(() => {
    if (!results.length) return null;

    const scores = results.map(r => {
      const res = r.result as { total_marks?: number; marks?: number };
      return res.total_marks ?? res.marks ?? 0;
    });

    const totalExams = results.length;
    const averageScore = scores.reduce((a, b) => a + b, 0) / totalExams;
    const highestScore = Math.max(...scores);
    const recentScore = scores[0];

    return {
      totalExams,
      averageScore: averageScore.toFixed(1),
      highestScore: highestScore.toFixed(1),
      recentScore: recentScore.toFixed(1)
    };
  }, [results]);

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <div className="mb-4 rounded-full bg-slate-50 p-4 text-slate-400">
          <FileCheck size={48} />
        </div>
        <h3 className="text-xl font-bold text-slate-900">No results yet</h3>
        <p className="mt-2 text-slate-500">Your evaluation results will appear here once they are processed by your teachers.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          label="Total Exams" 
          value={stats.totalExams.toString()} 
          icon={<FileCheck className="text-blue-600" size={20} />} 
          bgColor="bg-blue-50"
        />
        <StatCard 
          label="Average Score" 
          value={stats.averageScore} 
          icon={<Target className="text-purple-600" size={20} />} 
          bgColor="bg-purple-50"
        />
        <StatCard 
          label="Highest Score" 
          value={stats.highestScore} 
          icon={<Trophy className="text-amber-600" size={20} />} 
          bgColor="bg-amber-50"
        />
        <StatCard 
          label="Recent Score" 
          value={stats.recentScore} 
          icon={<TrendingUp className="text-emerald-600" size={20} />} 
          bgColor="bg-emerald-50"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Recent Performance</h3>
            <button 
              onClick={onViewResults}
              className="text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              View All
            </button>
          </div>
          <div className="space-y-4">
            {results.slice(0, 5).map((row, idx) => {
              const score = (row.result as any).total_marks ?? (row.result as any).marks ?? 0;
              return (
                <div key={idx} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-100 shadow-sm text-slate-600 font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{row.session_id}</p>
                      <p className="text-xs text-slate-500">Evaluated on {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-slate-900">{score.toFixed(1)}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Marks</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-xl shadow-slate-200">
            <h3 className="mb-2 text-lg font-bold">Quick Tip</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              You can request a reevaluation if you believe your marks don't reflect your performance. Provide a clear reason to help your teacher understand your concern.
            </p>
            <button 
              onClick={onViewResults}
              className="mt-6 w-full rounded-xl bg-white py-3 text-sm font-bold text-slate-900 hover:bg-slate-50 transition-colors"
            >
              Request Reevaluation
            </button>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-rose-600">
              <AlertCircle size={20} />
              <h3 className="font-bold">Important Note</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Reevaluation requests are subject to teacher approval. You will be notified once a decision is made.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  bgColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, bgColor }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
    <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl ${bgColor}`}>
      {icon}
    </div>
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <p className="text-2xl font-black text-slate-900">{value}</p>
  </div>
);
