import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudentResults, requestStudentReevaluation, changeStudentPassword } from '../lib/studentApi';
import { StudentSidebar, type StudentDashboardView } from '../components/student-dashboard/StudentSidebar';
import { StudentOverviewView } from '../components/student-dashboard/StudentOverviewView';
import { StudentResultsView } from '../components/student-dashboard/StudentResultsView';
import { StudentProfileView } from '../components/student-dashboard/StudentProfileView';
import type { SessionResult } from '../types/teacherDashboard';

/**
 * Redesigned Student Dashboard Component
 * Orchestrates multiple views: Overview, Results, and Profile.
 * Provides a modern, responsive layout with a persistent sidebar.
 */
export const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<StudentDashboardView>('overview');
  const [rows, setRows] = useState<SessionResult[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

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
        setError('Unable to load results. Please try again later.');
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

  const handleReevaluation = async (sessionId: string, reason: string) => {
    setStatusMsg('');
    try {
      await requestStudentReevaluation(rollnum, sessionId, reason);
      setStatusMsg(`Reevaluation request submitted for ${sessionId}`);
    } catch {
      setStatusMsg(`Failed to submit reevaluation request for ${sessionId}`);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent, oldPass: string, newPass: string) => {
    e.preventDefault();
    setStatusMsg('');
    setError('');
    try {
      await changeStudentPassword(oldPass, newPass);
      setStatusMsg('Password updated successfully.');
    } catch (err) {
      setError('Failed to update password. Please check your current password.');
      throw err;
    }
  };

  if (loading && !rows.length) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-900 border-t-transparent mx-auto" />
          <p className="text-sm font-medium text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell min-h-screen bg-[#F8FAFC] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl gap-6 lg:grid-cols-[280px_1fr]">
        <StudentSidebar
          activeView={activeView}
          onViewChange={setActiveView}
          onLogout={logout}
          studentName={name}
          rollnum={rollnum}
        />

        <main className="flex flex-col gap-6">
          <header className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-8 py-6 shadow-sm">
            <div>
              <h2 className="text-2xl font-black text-slate-900 capitalize">
                {activeView === 'overview' ? `Welcome back, ${name.split(' ')[0]}!` : activeView.replace('-', ' ')}
              </h2>
              <p className="text-sm font-medium text-slate-500">
                {activeView === 'overview' 
                  ? "Here's what's happening with your evaluations." 
                  : `Manage your ${activeView} and account settings.`}
              </p>
            </div>
            <div className="hidden sm:block">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-900 font-bold border border-slate-100">
                {name.charAt(0)}
              </div>
            </div>
          </header>

          <div className="flex-1">
            {activeView === 'overview' && (
              <StudentOverviewView 
                studentName={name} 
                results={rows} 
                onViewResults={() => setActiveView('results')} 
              />
            )}
            
            {activeView === 'results' && (
              <StudentResultsView 
                results={rows} 
                onSubmitReevaluation={handleReevaluation} 
                statusMsg={statusMsg} 
              />
            )}
            
            {activeView === 'profile' && (
              <StudentProfileView 
                studentName={name} 
                rollnum={rollnum} 
                onSubmitPasswordChange={handlePasswordChange}
                statusMsg={statusMsg}
                error={error}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
