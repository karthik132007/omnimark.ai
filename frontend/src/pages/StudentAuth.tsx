import { useState } from 'react';
import { isAxiosError } from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { studentLogin } from '../lib/studentApi';

export const StudentAuth = () => {
  const navigate = useNavigate();
  const [rollnum, setRollnum] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const parsed = Number(rollnum);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        setError('Enter a valid roll number.');
        return;
      }
      const res = await studentLogin(parsed, password);
      localStorage.setItem('token', res.access_token);
      localStorage.setItem('role', 'student');
      localStorage.setItem('student_rollnum', String(res.rollnum));
      localStorage.setItem('student_name', String(res.name ?? ''));
      navigate('/student-dashboard');
    } catch (err) {
      setError(isAxiosError(err) ? String(err.response?.data?.detail ?? 'Unable to login') : 'Unable to login');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-shell min-h-screen px-4 py-8">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Student Login</h1>
        <p className="mt-1 text-sm text-slate-500">Use your roll number and password.</p>

        {error ? <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p> : null}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Roll Number</label>
            <input
              type="number"
              min={1}
              required
              value={rollnum}
              onChange={(e) => setRollnum(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="1"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 text-sm text-slate-600">
          Teacher/University? <Link to="/auth" className="font-semibold text-slate-900 underline">Go to main login</Link>
        </div>
      </div>
    </div>
  );
};
