import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  User, 
  LogOut,
  ChevronRight,
  GraduationCap
} from 'lucide-react';

export type StudentDashboardView = 'overview' | 'results' | 'profile';

interface StudentSidebarProps {
  activeView: StudentDashboardView;
  onViewChange: (view: StudentDashboardView) => void;
  onLogout: () => void;
  studentName: string;
  rollnum: number;
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({
  activeView,
  onViewChange,
  onLogout,
  studentName,
  rollnum
}) => {
  const menuItems = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'results' as const, label: 'My Results', icon: FileText },
    { id: 'profile' as const, label: 'Profile', icon: User },
  ];

  return (
    <aside className="flex flex-col rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-8 flex items-center gap-3 px-2 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
          <GraduationCap size={24} />
        </div>
        <div>
          <h2 className="font-bold text-slate-900">OmniMark AI</h2>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Student Portal</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight size={14} />}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-slate-100">
        <div className="mb-4 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100">
          <p className="text-xs font-medium text-slate-500">Logged in as</p>
          <p className="text-sm font-bold text-slate-900 truncate">{studentName}</p>
          <p className="text-[10px] text-slate-400 font-mono">Roll: #{rollnum}</p>
        </div>
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
