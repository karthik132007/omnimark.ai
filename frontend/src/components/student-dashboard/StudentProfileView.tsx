import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Hash, 
  ShieldCheck, 
  KeyRound,
  Eye,
  EyeOff,
  Save,
  Loader2
} from 'lucide-react';

interface StudentProfileViewProps {
  studentName: string;
  rollnum: number;
  onSubmitPasswordChange: (e: React.FormEvent, oldPass: string, newPass: string) => Promise<void>;
  statusMsg: string;
  error: string;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  studentName,
  rollnum,
  onSubmitPasswordChange,
  statusMsg,
  error
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmitPasswordChange(e, oldPassword, newPassword);
      setOldPassword('');
      setNewPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1 space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-slate-900 text-3xl font-black text-white">
            {studentName.charAt(0)}
          </div>
          <h3 className="text-xl font-bold text-slate-900">{studentName}</h3>
          <p className="text-sm font-medium text-slate-500">Regular Student</p>
          
          <div className="mt-6 space-y-3 border-t border-slate-100 pt-6 text-left">
            <InfoItem icon={<User size={16} />} label="Full Name" value={studentName} />
            <InfoItem icon={<Hash size={16} />} label="Roll Number" value={`#${rollnum}`} />
            <InfoItem icon={<ShieldCheck size={16} />} label="Account Type" value="Verified" />
          </div>
        </div>

        <div className="rounded-3xl bg-blue-600 p-6 text-white shadow-xl shadow-blue-100">
          <h4 className="mb-2 font-bold">Privacy Matters</h4>
          <p className="text-xs text-blue-100 leading-relaxed">
            Your evaluation data is secure and only visible to you and your assigned teachers. Keep your password confidential.
          </p>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-900">
              <KeyRound size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Update Password</h3>
              <p className="text-sm text-slate-500">Strengthen your account security</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Current Password</label>
                <div className="relative">
                  <input
                    type={showOld ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOld(!showOld)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {statusMsg && (
              <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-medium text-emerald-700 border border-emerald-100">
                {statusMsg}
              </div>
            )}
            {error && (
              <div className="rounded-2xl bg-rose-50 p-4 text-sm font-medium text-rose-700 border border-rose-100">
                {error}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-2xl bg-slate-900 px-8 py-3 text-sm font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={18} />}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-3">
    <div className="text-slate-400">{icon}</div>
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-sm font-bold text-slate-900">{value}</p>
    </div>
  </div>
);
