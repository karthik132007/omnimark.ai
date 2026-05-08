import { useMemo, useState } from 'react';
import type { ClassroomStudent, ClassroomStudentDetailResponse, NlpResult, LlmResult, ReevaluationRequest } from '../../types/teacherDashboard';

interface MyClassViewProps {
  students: ClassroomStudent[];
  selectedRollnum: number | null;
  selectedDetail: ClassroomStudentDetailResponse | null;
  isLoading: boolean;
  error: string;
  requests: ReevaluationRequest[];
  requestActionLoading: string | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  onApproveRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
  onSelectStudent: (rollnum: number) => void;
}

const marksText = (result: NlpResult | LlmResult) => {
  const total = (result as LlmResult).total_marks;
  if (typeof total === 'number') return total.toFixed(2);
  const marks = (result as NlpResult).marks;
  if (typeof marks === 'number') return marks.toFixed(2);
  return 'N/A';
};

export const MyClassView = ({
  students,
  selectedRollnum,
  selectedDetail,
  isLoading,
  error,
  requests,
  requestActionLoading,
  isRefreshing,
  onRefresh,
  onApproveRequest,
  onRejectRequest,
  onSelectStudent,
}: MyClassViewProps) => {
  const [search, setSearch] = useState('');
  const [requestTab, setRequestTab] = useState<'pending' | 'approved'>('pending');
  const normalized = search.trim().toLowerCase();
  const filtered = students
    .slice()
    .sort((a, b) => a.rollnum - b.rollnum)
    .filter((s) => {
    if (!normalized) return true;
    return (s.name || '').toLowerCase().includes(normalized) || String(s.rollnum).includes(normalized);
  });
  const requestRows = useMemo(() => {
    return requests.filter((r) => (requestTab === 'pending' ? r.status === 'pending' : r.status === 'approved'));
  }, [requests, requestTab]);

  const fmtDate = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  const selectedRequests = selectedDetail?.requests || [];

  return (
    <section className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
      <article className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">My Class</h2>
            <p className="mt-1 text-sm text-slate-500">Students are mapped automatically from uploaded PDF names.</p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 disabled:opacity-70"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or roll number"
          className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        />

        <div className="mt-3 max-h-[540px] overflow-y-auto space-y-2">
          {filtered.map((student) => (
            <button
              key={student.rollnum}
              type="button"
              onClick={() => onSelectStudent(student.rollnum)}
              className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                selectedRollnum === student.rollnum
                  ? 'border-slate-800 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="text-xs opacity-80">Roll #{student.rollnum}</div>
              <div className="truncate text-sm font-medium">{student.name || 'Unknown'}</div>
            </button>
          ))}
          {!filtered.length ? <p className="text-sm text-slate-500">No students found.</p> : null}
        </div>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Reevaluation Requests</h3>
            <p className="mt-1 text-sm text-slate-500">Approve pending requests and track approved ones.</p>
          </div>
          <div className="inline-flex rounded-lg border border-slate-200 p-1 text-xs">
            <button
              type="button"
              onClick={() => setRequestTab('pending')}
              className={`rounded-md px-2 py-1 font-semibold ${requestTab === 'pending' ? 'bg-slate-900 text-white' : 'text-slate-700'}`}
            >
              Pending
            </button>
            <button
              type="button"
              onClick={() => setRequestTab('approved')}
              className={`rounded-md px-2 py-1 font-semibold ${requestTab === 'approved' ? 'bg-slate-900 text-white' : 'text-slate-700'}`}
            >
              Approved
            </button>
          </div>
        </div>
        <div className="mt-3 space-y-2">
          {requestRows.map((req) => (
            <div key={req._id} className="rounded-lg border border-slate-200 p-3 text-sm">
              <div><strong>Student:</strong> {req.student_name} (Roll #{req.rollnum})</div>
              <div><strong>Session:</strong> {req.session_id}</div>
              <div><strong>Reason:</strong> {req.reason}</div>
              <div><strong>Requested:</strong> {fmtDate(req.created_at)}</div>
              {req.status === 'approved' ? <div><strong>Approved:</strong> {fmtDate(req.approved_at)}</div> : null}
              {req.status === 'pending' ? (
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => onApproveRequest(req._id)}
                    disabled={requestActionLoading === req._id}
                    className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-70"
                  >
                    {requestActionLoading === req._id ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onRejectRequest(req._id)}
                    disabled={requestActionLoading === req._id}
                    className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 disabled:opacity-70"
                  >
                    Reject
                  </button>
                </div>
              ) : null}
            </div>
          ))}
          {!requestRows.length ? <p className="text-sm text-slate-500">No {requestTab} requests.</p> : null}
        </div>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-lg font-semibold text-slate-900">Student History</h3>
        {isLoading ? <p className="mt-3 text-sm text-slate-500">Loading...</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
        {!selectedDetail && !isLoading && !error ? (
          <p className="mt-3 text-sm text-slate-500">Select a student to view full result history.</p>
        ) : null}

        {selectedDetail ? (
          <div className="mt-3 space-y-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <div><strong>Name:</strong> {selectedDetail.student.name}</div>
              <div><strong>Roll Number:</strong> {selectedDetail.student.rollnum}</div>
              <div><strong>Total Attempts:</strong> {selectedDetail.results.length}</div>
              <div><strong>Total Requests:</strong> {selectedRequests.length}</div>
            </div>

            <div className="space-y-2">
              {selectedDetail.results.map((entry, idx) => (
                <div key={`${entry.session_id}-${idx}`} className="rounded-lg border border-slate-200 p-3 text-sm">
                  <div><strong>Session:</strong> {entry.session_id}</div>
                  <div><strong>Student Name in Script:</strong> {entry.student_name}</div>
                  <div><strong>Marks:</strong> {marksText(entry.result)}</div>
                  <div><strong>Reevaluations:</strong> {entry.reevaluation_history?.length ?? 0}</div>
                  {(entry.reevaluation_history?.length ?? 0) > 0 ? (
                    <div className="mt-2 space-y-1 rounded-lg bg-slate-50 p-2 text-xs text-slate-700">
                      {entry.reevaluation_history?.map((h, hidx) => (
                        <div key={`${entry.session_id}-hist-${hidx}`}>
                          {h.at} | {h.actor}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
              {!selectedDetail.results.length ? <p className="text-sm text-slate-500">No results yet.</p> : null}
            </div>

            <div className="rounded-lg border border-slate-200 p-3 text-sm">
              <div className="mb-2 font-semibold text-slate-900">Student Request History</div>
              <div className="space-y-2">
                {selectedRequests.map((req) => (
                  <div key={`profile-${req._id}`} className="rounded-md bg-slate-50 p-2">
                    <div><strong>Session:</strong> {req.session_id}</div>
                    <div><strong>Status:</strong> {req.status}</div>
                    <div><strong>Reason:</strong> {req.reason}</div>
                  </div>
                ))}
                {!selectedRequests.length ? <p className="text-sm text-slate-500">No requests by this student.</p> : null}
              </div>
            </div>
          </div>
        ) : null}
      </article>
    </section>
  );
};
