import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AlertTriangle,
    Download,
    Filter,
    LogOut,
    Mail,
    Pencil,
    Plus,
    Search,
    ShieldCheck,
    Trash2,
    UserCheck,
    Users,
    X,
} from 'lucide-react';
import { api } from '../../lib/api';

interface TeacherRecord {
    _id: string;
    email: string;
    name: string;
}

type SortMode = 'name-asc' | 'name-desc' | 'email-asc' | 'email-desc';

export const UnivAdminDashboard = () => {
    const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [editingTeacher, setEditingTeacher] = useState<TeacherRecord | null>(null);
    const [editingName, setEditingName] = useState('');
    const [editingEmail, setEditingEmail] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortMode, setSortMode] = useState<SortMode>('name-asc');
    const [domainFilter, setDomainFilter] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();

    const token = localStorage.getItem('token');

    const fetchTeachers = async () => {
        setIsLoading(true);
        setErrorMessage('');
        try {
            const res = await api.get('/univ/teachers');
            setTeachers(res.data);
        } catch (error) {
            console.error(error);
            setErrorMessage('Unable to fetch teachers. Please refresh and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!token) {
            navigate('/auth');
            return;
        }

        void fetchTeachers();
    }, [navigate, token]);

    useEffect(() => {
        if (!successMessage) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setSuccessMessage('');
        }, 2800);

        return () => window.clearTimeout(timeoutId);
    }, [successMessage]);

    const domainStats = useMemo(() => {
        const domainCounts: Record<string, number> = {};
        for (const teacher of teachers) {
            const domain = teacher.email.split('@')[1]?.toLowerCase() ?? 'unknown';
            domainCounts[domain] = (domainCounts[domain] ?? 0) + 1;
        }

        return Object.entries(domainCounts)
            .map(([domain, count]) => ({ domain, count }))
            .sort((a, b) => b.count - a.count);
    }, [teachers]);

    const filteredTeachers = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        const records = teachers.filter((teacher) => {
            const teacherDomain = teacher.email.split('@')[1]?.toLowerCase() ?? 'unknown';
            const matchesDomain = domainFilter === 'all' || teacherDomain === domainFilter;
            const matchesQuery =
                query.length === 0 ||
                teacher.name.toLowerCase().includes(query) ||
                teacher.email.toLowerCase().includes(query);

            return matchesDomain && matchesQuery;
        });

        records.sort((a, b) => {
            switch (sortMode) {
                case 'name-desc':
                    return b.name.localeCompare(a.name);
                case 'email-asc':
                    return a.email.localeCompare(b.email);
                case 'email-desc':
                    return b.email.localeCompare(a.email);
                case 'name-asc':
                default:
                    return a.name.localeCompare(b.name);
            }
        });

        return records;
    }, [teachers, searchQuery, sortMode, domainFilter]);

    const uniqueDomains = useMemo(() => domainStats.map((item) => item.domain), [domainStats]);

    const topDomain = domainStats[0];
    const activeFilterCount = filteredTeachers.length;

    const handleAddTeacher = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');
        setIsSaving(true);

        try {
            await api.post('/univ/teachers', { name, email, password });
            setName('');
            setEmail('');
            setPassword('');
            setSuccessMessage('Teacher account created successfully.');
            void fetchTeachers();
        } catch {
            setErrorMessage('Unable to add teacher. Verify email uniqueness and try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const startEditing = (teacher: TeacherRecord) => {
        setEditingTeacher(teacher);
        setEditingName(teacher.name);
        setEditingEmail(teacher.email);
        setErrorMessage('');
        setSuccessMessage('');
    };

    const handleUpdateTeacher = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTeacher) {
            return;
        }

        setErrorMessage('');
        setSuccessMessage('');
        setIsSaving(true);

        try {
            await api.put(`/univ/teachers/${editingTeacher._id}`, {
                name: editingName,
                email: editingEmail,
            });
            setEditingTeacher(null);
            setSuccessMessage('Teacher details updated successfully.');
            void fetchTeachers();
        } catch {
            setErrorMessage('Unable to update teacher details. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Delete this teacher account? This cannot be undone.')) {
            setErrorMessage('');
            setSuccessMessage('');
            try {
                await api.delete(`/univ/teachers/${id}`);
                setSuccessMessage('Teacher removed successfully.');
                void fetchTeachers();
            } catch {
                setErrorMessage('Unable to delete this teacher. Please try again.');
            }
        }
    };

    const exportTeachersCsv = () => {
        const rows = [
            ['name', 'email', 'domain'],
            ...filteredTeachers.map((teacher) => [
                teacher.name,
                teacher.email,
                teacher.email.split('@')[1]?.toLowerCase() ?? 'unknown',
            ]),
        ];

        const csv = rows
            .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'teachers_export.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setSuccessMessage('CSV export generated.');
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('user_email');
        navigate('/');
    };

    return (
        <div className="page-shell min-h-screen px-4 py-8 sm:px-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <section className="relative overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-br from-cyan-100/80 via-white/90 to-blue-100/80 p-6 shadow-[0_25px_60px_rgba(56,189,248,0.15)] md:p-8">
                    <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-cyan-300/30 blur-3xl" />
                    <div className="absolute -bottom-8 left-10 h-32 w-32 rounded-full bg-blue-300/30 blur-2xl" />

                    <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="font-display text-sm uppercase tracking-[0.2em] text-cyan-700">University Admin Console</p>
                            <h1 className="font-display text-3xl font-bold text-slate-900 md:text-4xl">Faculty Access Command Center</h1>
                            <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
                                Manage faculty accounts, track institutional email coverage, and maintain clean onboarding workflows.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={exportTeachersCsv}
                                className="button-sheen inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:text-cyan-700"
                            >
                                <Download className="h-4 w-4" /> Export CSV
                            </button>
                            <button
                                onClick={logout}
                                className="button-sheen inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-rose-100"
                            >
                                <LogOut className="h-4 w-4" /> Logout
                            </button>
                        </div>
                    </div>
                </section>

                {errorMessage && (
                    <div className="animate-fade-in rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        <p className="flex items-center gap-2 font-medium"><AlertTriangle className="h-4 w-4" /> {errorMessage}</p>
                    </div>
                )}

                {successMessage && (
                    <div className="animate-fade-in rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        <p className="flex items-center gap-2 font-medium"><ShieldCheck className="h-4 w-4" /> {successMessage}</p>
                    </div>
                )}

                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <article className="frost-panel interactive-surface rounded-2xl p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Total Teachers</p>
                        <p className="mt-2 flex items-center gap-2 text-3xl font-bold text-slate-900"><Users className="h-6 w-6 text-cyan-600" /> {teachers.length}</p>
                    </article>
                    <article className="frost-panel interactive-surface rounded-2xl p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Visible Results</p>
                        <p className="mt-2 flex items-center gap-2 text-3xl font-bold text-slate-900"><UserCheck className="h-6 w-6 text-blue-600" /> {activeFilterCount}</p>
                    </article>
                    <article className="frost-panel interactive-surface rounded-2xl p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Email Domains</p>
                        <p className="mt-2 flex items-center gap-2 text-3xl font-bold text-slate-900"><Mail className="h-6 w-6 text-sky-600" /> {uniqueDomains.length}</p>
                    </article>
                    <article className="frost-panel interactive-surface rounded-2xl p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Top Domain</p>
                        <p className="mt-2 text-lg font-bold text-slate-900">{topDomain?.domain ?? 'N/A'}</p>
                        <p className="text-sm text-slate-600">{topDomain ? `${topDomain.count} account(s)` : 'No data yet'}</p>
                    </article>
                </section>

                <section className="grid gap-6 xl:grid-cols-[1fr,1.6fr]">
                    <aside className="frost-panel rounded-2xl p-6">
                        <h2 className="font-display text-xl font-bold text-slate-900">Add New Teacher</h2>
                        <p className="mt-1 text-sm text-slate-600">Create faculty login credentials for this university.</p>

                        <form onSubmit={handleAddTeacher} className="mt-5 space-y-4">
                            <label className="block">
                                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Teacher Name</span>
                                <input
                                    type="text"
                                    placeholder="e.g. Dr. Priya Nair"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="auth-input w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 outline-none"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Email</span>
                                <input
                                    type="email"
                                    placeholder="teacher@university.edu"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="auth-input w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 outline-none"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Temporary Password</span>
                                <input
                                    type="password"
                                    placeholder="Set initial password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="auth-input w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 outline-none"
                                />
                            </label>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="button-sheen inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                <Plus className="h-4 w-4" /> {isSaving ? 'Saving...' : 'Add Teacher'}
                            </button>
                        </form>
                    </aside>

                    <main className="frost-panel rounded-2xl p-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <h2 className="font-display text-xl font-bold text-slate-900">Teacher Directory</h2>
                                <p className="mt-1 text-sm text-slate-600">Search, sort, update, and manage registered teachers.</p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                <label className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <input
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search name or email"
                                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-cyan-400"
                                    />
                                </label>

                                <label className="relative">
                                    <Filter className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <select
                                        value={domainFilter}
                                        onChange={(e) => setDomainFilter(e.target.value)}
                                        className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-sm outline-none transition focus:border-cyan-400"
                                    >
                                        <option value="all">All domains</option>
                                        {uniqueDomains.map((domain) => (
                                            <option value={domain} key={domain}>{domain}</option>
                                        ))}
                                    </select>
                                </label>

                                <select
                                    value={sortMode}
                                    onChange={(e) => setSortMode(e.target.value as SortMode)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400"
                                >
                                    <option value="name-asc">Name A-Z</option>
                                    <option value="name-desc">Name Z-A</option>
                                    <option value="email-asc">Email A-Z</option>
                                    <option value="email-desc">Email Z-A</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-5 space-y-3">
                            {isLoading ? (
                                <p className="rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-600">Loading teachers...</p>
                            ) : filteredTeachers.length === 0 ? (
                                <p className="rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-600">No teachers match the current filters.</p>
                            ) : (
                                filteredTeachers.map((teacher) => {
                                    const domain = teacher.email.split('@')[1]?.toLowerCase() ?? 'unknown';

                                    return (
                                        <article
                                            key={teacher._id}
                                            className="hover-panel-glow rounded-xl border border-white/80 bg-white/80 px-4 py-4 shadow-sm transition"
                                        >
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <h3 className="text-base font-bold text-slate-900">{teacher.name}</h3>
                                                    <p className="text-sm text-slate-600">{teacher.email}</p>
                                                    <span className="mt-2 inline-block rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                                        {domain}
                                                    </span>
                                                </div>

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => startEditing(teacher)}
                                                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
                                                    >
                                                        <Pencil className="h-4 w-4" /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(teacher._id)}
                                                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                                                    >
                                                        <Trash2 className="h-4 w-4" /> Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })
                            )}
                        </div>
                    </main>
                </section>

                <section className="frost-panel rounded-2xl p-6">
                    <h2 className="font-display text-lg font-bold text-slate-900">Domain Distribution</h2>
                    <p className="mt-1 text-sm text-slate-600">Quick view of where faculty accounts are concentrated.</p>

                    <div className="mt-4 space-y-3">
                        {domainStats.length === 0 ? (
                            <p className="rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-600">No domain analytics available yet.</p>
                        ) : (
                            domainStats.map((item) => {
                                const percentage = teachers.length > 0 ? Math.round((item.count / teachers.length) * 100) : 0;
                                return (
                                    <div key={item.domain}>
                                        <div className="mb-1 flex items-center justify-between text-sm">
                                            <span className="font-medium text-slate-700">{item.domain}</span>
                                            <span className="text-slate-500">{item.count} ({percentage}%)</span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>
            </div>

            {editingTeacher && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm">
                    <div className="animate-fade-in w-full max-w-lg rounded-2xl border border-white/80 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.3)]">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="font-display text-xl font-bold text-slate-900">Edit Teacher</h2>
                            <button
                                onClick={() => setEditingTeacher(null)}
                                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateTeacher} className="space-y-4">
                            <label className="block">
                                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Teacher Name</span>
                                <input
                                    type="text"
                                    value={editingName}
                                    required
                                    onChange={(e) => setEditingName(e.target.value)}
                                    className="auth-input w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 outline-none"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Email</span>
                                <input
                                    type="email"
                                    value={editingEmail}
                                    required
                                    onChange={(e) => setEditingEmail(e.target.value)}
                                    className="auth-input w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 outline-none"
                                />
                            </label>

                            <div className="flex gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setEditingTeacher(null)}
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="button-sheen w-full rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {isSaving ? 'Updating...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
