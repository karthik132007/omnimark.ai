import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SessionResult } from '../types/teacherDashboard';
import { getStudentResults, requestStudentReevaluation, changeStudentPassword } from '../lib/studentApi';

/**
 * Helper to safely extract marks from a dynamic result object.
 * @param item - The session result containing the evaluation scores.
 * @returns Formatted marks string or 'N/A' if missing.
 */
const marksText = (item: SessionResult) => {
  const result = item.result as { total_marks?: number; marks?: number };
  if (typeof result.total_marks === 'number') return result.total_marks.toFixed(2);
  if (typeof result.marks === 'number') return result.marks.toFixed(2);
  return 'N/A';
};

/**
 * Student Dashboard Component
 * Displays the current student's evaluation results and provides
 * functionality to request reevaluations.
 */
export const StudentDashboard = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<SessionResult[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reasonBySession, setReasonBySession] = useState<Record<string, string>>({});
  const [statusMsg, setStatusMsg] = useState('');

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const rollnum = useMemo(() => Number(localStorage.getItem('student_rollnum') || 0), []);

  useEffect(() => {
    if (localStorage.getItem('role') !== 'student' || !rollnum) {
      navigate('/student-auth');
      return;
    }

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getStudentResults(rollnum);
        setRows(data.results);
        setName(data.student.name);
      } catch (err) {
        setError('Unable to load results.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [navigate, rollnum]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('student_rollnum');
    localStorage.removeItem('student_name');
    navigate('/student-auth');
  };

  const submitReevaluation = async (sessionId: string) => {
    setStatusMsg('');
    try {
      const reason = reasonBySession[sessionId]?.trim() || 'Please reevaluate this result.';
      await requestStudentReevaluation(rollnum, sessionId, reason);
      setStatusMsg(`Reevaluation request submitted for ${sessionId}`);
    } catch {
      setStatusMsg(`Failed to submit reevaluation request for ${sessionId}`);
    }
  };

  const submitPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return;
    setStatusMsg('');
    setError('');
    setPasswordLoading(true);
    try {
      await changeStudentPassword(oldPassword, newPassword);
      setStatusMsg('Password changed successfully.');
      setOldPassword('');
      setNewPassword('');
      setShowPasswordForm(false);
    } catch (err) {
      setError('Failed to change password. Ensure your current password is correct.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="page-shell min-h-screen px-4 py-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Student Dashboard</h1>
            <p className="text-sm text-slate-600">{name || 'Student'} | Roll #{rollnum}</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowPasswordForm(!showPasswordForm)} 
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {showPasswordForm ? 'Cancel' : 'Change Password'}
            </button>
            <button onClick={logout} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Logout</button>
          </div>
        </div>

        {showPasswordForm && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Update Password</h2>
            <form onSubmit={submitPasswordChange} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Current Password</label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={passwordLoading}
                className="rounded-lg bg-slate-900 px-6 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {passwordLoading ? 'Updating...' : 'Save New Password'}
              </button>
            </form>
          </div>
        )}

        {statusMsg ? <p className="rounded-lg bg-cyan-50 px-3 py-2 text-sm text-cyan-700">{statusMsg}</p> : null}
        {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
        {loading ? <p className="text-sm text-slate-600">Loading...</p> : null}

        {!loading ? (
          <div className="space-y-3">
            {rows.map((row) => (
              <div key={`${row.session_id}-${row.student_name}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="grid gap-2 sm:grid-cols-3">
                  <p className="text-sm"><span className="font-semibold">Session:</span> {row.session_id}</p>
                  <p className="text-sm"><span className="font-semibold">Name on PDF:</span> {row.student_name}</p>
                  <p className="text-sm"><span className="font-semibold">Marks:</span> {marksText(row)}</p>
                </div>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    value={reasonBySession[row.session_id] ?? ''}
                    onChange={(e) => setReasonBySession((cur) => ({ ...cur, [row.session_id]: e.target.value }))}
                    placeholder="Reason for reevaluation"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => submitReevaluation(row.session_id)}
                    className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900"
                  >
                    Request Reevaluation
                  </button>
                </div>
              </div>
            ))}
            {!rows.length ? <p className="text-sm text-slate-600">No results found yet.</p> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};
