import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Send,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import type { SessionResult } from '../../types/teacherDashboard';

interface StudentResultsViewProps {
  results: SessionResult[];
  onSubmitReevaluation: (sessionId: string, reason: string) => Promise<void>;
  statusMsg: string;
}

export const StudentResultsView: React.FC<StudentResultsViewProps> = ({
  results,
  onSubmitReevaluation,
  statusMsg
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  const filteredResults = results.filter(r => 
    r.session_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleExpand = (sessionId: string) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId);
  };

  const handleReasonChange = (sessionId: string, reason: string) => {
    setReasons(prev => ({ ...prev, [sessionId]: reason }));
  };

  const handleSubmit = async (sessionId: string) => {
    const reason = reasons[sessionId] || 'Please reevaluate this result.';
    setSubmitting(prev => ({ ...prev, [sessionId]: true }));
    try {
      await onSubmitReevaluation(sessionId, reason);
      setReasons(prev => ({ ...prev, [sessionId]: '' }));
    } finally {
      setSubmitting(prev => ({ ...prev, [sessionId]: false }));
    }
  };

  const marksText = (item: SessionResult) => {
    const result = item.result as { total_marks?: number; marks?: number };
    if (typeof result.total_marks === 'number') return result.total_marks.toFixed(2);
    if (typeof result.marks === 'number') return result.marks.toFixed(2);
    return 'N/A';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-xl font-bold text-slate-900">Evaluation Results</h3>
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>
      </div>

      {statusMsg && (
        <div className={`flex items-center gap-3 rounded-2xl p-4 text-sm font-medium ${
          statusMsg.includes('Failed') ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
        }`}>
          {statusMsg.includes('Failed') ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          {statusMsg}
        </div>
      )}

      <div className="space-y-4">
        {filteredResults.map((row) => {
          const isExpanded = expandedSession === row.session_id;
          const score = marksText(row);
          
          return (
            <div 
              key={row.session_id} 
              className={`overflow-hidden rounded-3xl border transition-all ${
                isExpanded ? 'border-slate-900 ring-1 ring-slate-900' : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div 
                className="flex cursor-pointer items-center justify-between p-5"
                onClick={() => toggleExpand(row.session_id)}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-600">
                    <Clock size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{row.session_id}</h4>
                    <p className="text-xs text-slate-500">Recorded on {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-2xl font-black text-slate-900">{score}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Score</p>
                  </div>
                  <div className={`rounded-full p-1 ${isExpanded ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-6 space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-4">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">Submission Details</h5>
                      <div className="space-y-2">
                        <DetailRow label="Student Name" value={row.student_name} />
                        <DetailRow label="PDF Source" value={row.pdf_file} />
                        <DetailRow label="Result Type" value={'result' in row && 'total_marks' in (row.result as any) ? 'LLM Evaluated' : 'NLP Scored'} />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">Evaluation Insight</h5>
                      <div className="rounded-2xl bg-white p-4 border border-slate-100 shadow-sm text-sm text-slate-600">
                        {row.result && 'evaluation_note' in (row.result as any) 
                          ? (row.result as any).evaluation_note 
                          : "This session was evaluated using natural language processing patterns based on model answers and keyword matching."}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <h5 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">Request Reevaluation</h5>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <div className="relative flex-1">
                        <textarea
                          placeholder="Why do you think this needs another look?"
                          value={reasons[row.session_id] || ''}
                          onChange={(e) => handleReasonChange(row.session_id, e.target.value)}
                          className="w-full min-h-[44px] max-h-32 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                          rows={1}
                        />
                      </div>
                      <button
                        onClick={() => handleSubmit(row.session_id)}
                        disabled={submitting[row.session_id]}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-50"
                      >
                        {submitting[row.session_id] ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <>
                            <Send size={16} />
                            <span>Submit Request</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {!filteredResults.length && (
          <div className="rounded-3xl border border-dashed border-slate-200 p-12 text-center bg-white">
            <p className="text-slate-500">No sessions found matching "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-slate-500">{label}</span>
    <span className="font-bold text-slate-900">{value}</span>
  </div>
);
