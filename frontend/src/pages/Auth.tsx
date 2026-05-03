import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Brain, Building2, LogIn, ShieldCheck, Sparkles, UserPlus } from 'lucide-react';

const API_URL = 'http://localhost:8000';

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const res = await axios.post(`${API_URL}/auth/login`, { email, password });
        localStorage.setItem('token', res.data.access_token);
        localStorage.setItem('role', res.data.role);

        if (res.data.role === 'university') {
          navigate('/univ-dashboard');
        } else {
          navigate('/teacher-dashboard');
        }
      } else {
        await axios.post(`${API_URL}/auth/univ/register`, { name, email, password });

        const res = await axios.post(`${API_URL}/auth/login`, { email, password });
        localStorage.setItem('token', res.data.access_token);
        localStorage.setItem('role', res.data.role);
        navigate('/univ-dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-shell relative min-h-screen overflow-hidden px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="hero-orb orb-one" />
      <div className="hero-orb orb-two" />
      <div className="hero-orb orb-three" />

      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl flex-col">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6 flex items-center justify-between rounded-[1.75rem] border border-white/70 bg-white/75 px-5 py-4 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-2xl md:px-7"
        >
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#dff7ff_0%,#9bd6ff_45%,#d9dbff_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_24px_rgba(56,189,248,0.22)]">
              <Brain className="h-5 w-5 text-slate-900" />
            </div>
            <div>
              <div className="font-display text-lg font-semibold tracking-[-0.04em] text-slate-950">OmniMark AI</div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Evaluation OS</div>
            </div>
          </Link>

          <Link
            to="/"
            className="nav-link-pill inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
          >
            Back Home
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
          className="frost-panel flex flex-1 items-center rounded-[2.2rem] p-3 shadow-[0_36px_120px_rgba(15,23,42,0.12)]"
        >
          <div className="grid w-full gap-6 rounded-[1.8rem] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.97)_0%,rgba(239,248,255,0.94)_100%)] p-6 lg:grid-cols-[0.92fr_1.08fr] lg:p-8">
            <div className="flex flex-col justify-center">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 shadow-[0_10px_30px_rgba(148,163,184,0.12)]">
                <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
                {isLogin ? 'Teacher + university sign in' : 'University sign up'}
              </div>

              <div className="mt-6">
                <h1 className="font-display text-4xl font-semibold tracking-[-0.06em] text-slate-950 md:text-5xl">
                  {isLogin ? 'Sign in to your OmniMark AI workspace.' : 'Create your OmniMark AI workspace.'}
                </h1>
                <p className="mt-4 max-w-lg text-sm leading-7 text-slate-500 md:text-base">
                  {isLogin
                    ? 'Teachers and universities can both sign in here and continue directly into their role-based dashboards.'
                    : 'Launch your university evaluation system with AI grading, OCR processing, dashboards, and secure review flows in one premium onboarding step.'}
                </p>
              </div>

              <div className="mt-6 rounded-full border border-white/80 bg-white/85 p-1 shadow-[0_12px_30px_rgba(148,163,184,0.12)]">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(true);
                      setError('');
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      isLogin ? 'bg-slate-950 text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)]' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(false);
                      setError('');
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      !isLogin ? 'bg-slate-950 text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)]' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>
              </div>

              {error ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 rounded-[1.25rem] border border-rose-100 bg-rose-50/90 px-4 py-3 text-sm font-medium text-rose-600"
                >
                  {error}
                </motion.div>
              ) : null}

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                {!isLogin ? (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">University Name</label>
                    <div className="relative">
                      <Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="auth-input w-full rounded-[1.2rem] border border-white/80 bg-white/85 py-4 pl-11 pr-4 text-slate-900 outline-none"
                        placeholder="Harvard University"
                        autoComplete="organization"
                      />
                    </div>
                  </div>
                ) : null}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Email Address</label>
                  <div className="relative">
                    <ShieldCheck className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="auth-input w-full rounded-[1.2rem] border border-white/80 bg-white/85 py-4 pl-11 pr-4 text-slate-900 outline-none"
                      placeholder="admin@university.edu"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
                  <div className="relative">
                    <ShieldCheck className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="auth-input w-full rounded-[1.2rem] border border-white/80 bg-white/85 py-4 pl-11 pr-4 text-slate-900 outline-none"
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="button-sheen mt-2 inline-flex w-full items-center justify-center gap-2 rounded-[1.2rem] bg-slate-950 px-6 py-4 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)] transition hover:-translate-y-1 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {isLogin ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  {isSubmitting ? (isLogin ? 'Signing in...' : 'Creating workspace...') : isLogin ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              <div className="mt-6 rounded-[1.4rem] border border-white/80 bg-white/75 px-4 py-4 text-sm leading-7 text-slate-500">
                {isLogin
                  ? 'Teachers and universities can both sign in here. You will be routed automatically to the correct dashboard after login.'
                  : 'University registration creates the institution account first, then signs you in automatically and routes you to the university dashboard. Teacher accounts are added by the university admin.'}
              </div>
            </div>

            <div className="flex items-center">
              <motion.div
                whileHover={{ y: -8, rotateX: 2, rotateY: -3 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="relative w-full"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <img
                  src="/image.png"
                  alt="OmniMark AI dashboard preview"
                  className="h-full w-full object-cover"
                />
              </motion.div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
};
