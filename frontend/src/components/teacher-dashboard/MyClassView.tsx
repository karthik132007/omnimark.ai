import { useState } from 'react';
import type { ClassroomStudent, ClassroomStudentDetailResponse, NlpResult, LlmResult } from '../../types/teacherDashboard';

interface MyClassViewProps {
  students: ClassroomStudent[];
  selectedRollnum: number | null;
  selectedDetail: ClassroomStudentDetailResponse | null;
  isLoading: boolean;
  error: string;
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
  onSelectStudent,
}: MyClassViewProps) => {
  const [search, setSearch] = useState('');
  const normalized = search.trim().toLowerCase();
  const filtered = students.filter((s) => {
    if (!normalized) return true;
    return s.name.toLowerCase().includes(normalized) || String(s.rollnum).includes(normalized);
  });

  return (
    <section className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
      <article className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">My Class</h2>
        <p className="mt-1 text-sm text-slate-500">Students are mapped automatically from uploaded PDF names.</p>
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
              <div className="truncate text-sm font-medium">{student.name}</div>
            </button>
          ))}
          {!filtered.length ? <p className="text-sm text-slate-500">No students found.</p> : null}
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
            </div>

            <div className="space-y-2">
              {selectedDetail.results.map((entry, idx) => (
                <div key={`${entry.session_id}-${idx}`} className="rounded-lg border border-slate-200 p-3 text-sm">
                  <div><strong>Session:</strong> {entry.session_id}</div>
                  <div><strong>Student Name in Script:</strong> {entry.student_name}</div>
                  <div><strong>Marks:</strong> {marksText(entry.result)}</div>
                </div>
              ))}
              {!selectedDetail.results.length ? <p className="text-sm text-slate-500">No results yet.</p> : null}
            </div>
          </div>
        ) : null}
      </article>
    </section>
  );
};
