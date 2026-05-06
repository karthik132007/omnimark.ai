import {
  BookOpen,
  CheckSquare,
  FileUp,
  Settings,
  Wand2,
} from 'lucide-react';
import type { ChangeEvent, FormEvent } from 'react';
import type { QCPFormState } from '../../types/teacherDashboard';

interface QCPViewProps {
  error: string;
  form: QCPFormState;
  isSubmitting: boolean;
  onFileChange: (file: File | null) => void;
  onFormChange: <K extends keyof QCPFormState>(field: K, value: QCPFormState[K]) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  successMessage: string;
  generatedPaper: string | null;
}

const UploadTile = ({
  acceptLabel,
  description,
  disabled,
  file,
  label,
  onChange,
}: {
  acceptLabel: string;
  description: string;
  disabled: boolean;
  file: File | null;
  label: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) => (
  <div className="relative mb-6 last:mb-0">
    <div className="text-sm font-bold text-slate-800 mb-4">{label}</div>
    <label
      className={`block rounded-2xl border-2 border-dashed p-6 text-center transition ${disabled
          ? 'cursor-not-allowed border-slate-200 bg-white/40'
          : 'cursor-pointer border-indigo-100 bg-white/60 hover:border-indigo-300 hover:bg-white/80'
        }`}
    >
      <input type="file" accept=".pdf,application/pdf" disabled={disabled} className="hidden" onChange={onChange} />
      <div className="flex flex-col items-center justify-center gap-3">
        {file ? (
          <CheckSquare className="h-8 w-8 text-emerald-500" />
        ) : (
          <FileUp className="h-8 w-8 text-slate-400" />
        )}
        <div>
          <div className="text-[13px] font-bold text-slate-900">{description}</div>
          <div className="mt-1 text-[11px] font-medium text-slate-500">{acceptLabel}</div>
        </div>
        <div className="mt-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
          {file ? 'Change File' : 'Choose File'}
        </div>
        {file && (
          <div className="mt-2 text-[11px] font-medium text-emerald-600">
            Attached: {file.name}
          </div>
        )}
      </div>
    </label>
  </div>
);

export const QCPView = ({
  error,
  form,
  isSubmitting,
  onFileChange,
  onFormChange,
  onSubmit,
  successMessage,
  generatedPaper,
}: QCPViewProps) => {
  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <form onSubmit={onSubmit}>
        <div className="mb-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end w-full">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-[#0f172a] sm:text-5xl">
              Question Paper<br />Creator
            </h1>
            <p className="mt-4 max-w-[400px] text-[13px] leading-relaxed text-slate-500">
              Generate dynamic question papers based on your curriculum documents, difficulty settings, and formatting preferences.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-3 rounded-xl bg-[#02211e] px-7 py-4 text-[13px] font-bold text-white shadow-lg transition hover:bg-[#033630] disabled:cursor-not-allowed disabled:opacity-70"
            >
              Generate<br />Paper
              <Wand2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {(error || successMessage) && (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm font-medium ${error
                ? 'border-rose-100 bg-rose-50 text-rose-600'
                : 'border-emerald-100 bg-emerald-50 text-emerald-700'
              }`}
          >
            {error || successMessage}
          </div>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] bg-white p-8 shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-slate-100">
              <div className="mb-6 flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-[#0f172a]">
                <div className="h-1.5 w-1.5 rounded-full bg-[#0f172a]" />
                Paper Configuration
              </div>

              <div className="mb-8">
                <label className="mb-2 block text-xs font-bold text-slate-800">Course / Subject</label>
                <input
                  type="text"
                  value={form.course}
                  onChange={(event) => onFormChange('course', event.target.value)}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-3.5 text-[13px] font-semibold text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                  placeholder="e.g. Advanced Data Structures"
                />
              </div>

              <div className="mb-8">
                <div className="mb-3 text-[13px] font-bold text-slate-800">Difficulty Level</div>
                <div className="grid grid-cols-5 gap-3 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                  {['Easy', 'Doable', 'Medium', 'Hard', 'Extreme'].map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => onFormChange('difficulty', diff)}
                      className={`flex items-center justify-center gap-2 rounded-xl py-3.5 text-[13px] font-bold transition ${form.difficulty === diff
                          ? 'bg-[#0f172a] text-white shadow-md'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                        }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div>
                  <div className="mb-3 text-[13px] font-bold text-slate-800">Maximum Marks</div>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      value={form.max_marks}
                      onChange={(event) => onFormChange('max_marks', Number(event.target.value))}
                      className="w-full rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4 text-xl font-bold text-[#0f172a] outline-none"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest text-[#94a3b8]">
                      PTS
                    </span>
                  </div>
                </div>
                <div>
                  <div className="mb-3 text-[13px] font-bold text-slate-800">No. of Questions</div>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      value={form.no_of_ques}
                      onChange={(event) => onFormChange('no_of_ques', Number(event.target.value))}
                      className="w-full rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4 text-xl font-bold text-[#0f172a] outline-none"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest text-[#94a3b8]">
                      QUES
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-8 flex items-center justify-between rounded-2xl bg-slate-50 p-5 px-6 border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
                    <Settings className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-slate-900">Include Choices (OR options)</div>
                    <div className="text-[11px] font-medium text-slate-500 mt-0.5">Enable internal or external choices</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onFormChange('choice_aval', !form.choice_aval)}
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${form.choice_aval ? 'bg-[#0f172a]' : 'bg-slate-200'
                    }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition ${form.choice_aval ? 'translate-x-5' : 'translate-x-0'
                      }`}
                  />
                </button>
              </div>

              {form.choice_aval && (
                <div className="mb-8">
                  <div className="mb-3 text-[13px] font-bold text-slate-800">Choice Type</div>
                  <div className="grid grid-cols-2 gap-3 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => onFormChange('choice_type', 'Internal')}
                      className={`flex items-center justify-center gap-2 rounded-xl py-3.5 text-[13px] font-bold transition ${form.choice_type === 'Internal'
                          ? 'bg-[#0f172a] text-white shadow-md'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                        }`}
                    >
                      Internal
                    </button>
                    <button
                      type="button"
                      onClick={() => onFormChange('choice_type', 'External')}
                      className={`flex items-center justify-center gap-2 rounded-xl py-3.5 text-[13px] font-bold transition ${form.choice_type === 'External'
                          ? 'bg-[#0f172a] text-white shadow-md'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                        }`}
                    >
                      External
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] bg-[#eef2fc] p-8">
              <div className="mb-6 text-[11px] font-black uppercase tracking-widest text-[#334155]">
                Reference Artifacts
              </div>

              <UploadTile
                acceptLabel="PDF Document"
                description="Upload curriculum or reference material"
                disabled={isSubmitting}
                file={form.relevent_docs}
                label="Relevant Documents"
                onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
              />
            </div>

            <div className="rounded-[2rem] bg-white p-8 shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-slate-100">
              <div className="mb-6 flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-[#0f172a]">
                <div className="h-1.5 w-1.5 rounded-full bg-[#0f172a]" />
                Custom Generation Prompt
              </div>
              <div>
                <label className="mb-3 block text-[13px] font-bold text-slate-800">Additional Instructions</label>
                <textarea
                  value={form.custom_prompt}
                  onChange={(event) => onFormChange('custom_prompt', event.target.value)}
                  rows={4}
                  placeholder="E.g., Include at least one real-world scenario question, use Bloom's taxonomy..."
                  className="w-full resize-none rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4 text-[13px] font-medium leading-relaxed text-[#64748b] outline-none placeholder:text-[#94a3b8] focus:bg-white focus:ring-1 focus:ring-indigo-100 transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Generated Paper — Rendered as a real question paper */}
        {generatedPaper && (
          <div className="mt-10">
            {(() => {
              try {
                // 1. Strip LLM chat tokens
                let raw = generatedPaper.replace(/<\|im_start\|>/g, '').replace(/<\|im_end\|>/g, '').trim();

                // 2. Extract the outermost JSON object
                const jsonMatch = raw.match(/\{[\s\S]*\}/);
                if (jsonMatch) raw = jsonMatch[0];

                // 3. Fix unquoted question_no values like  "question_no": 1a  →  "question_no": "1a"
                raw = raw.replace(/"question_no"\s*:\s*([0-9]+[a-zA-Z]+)/g, '"question_no": "$1"');

                const paper = JSON.parse(raw);
                const chapters: [string, any[]][] = paper.questions
                  ? Object.entries(paper.questions)
                  : [];

                return (
                  <div className="space-y-6">
                    {/* ── Success Banner ── */}
                    <div className="flex items-center justify-between rounded-2xl bg-emerald-50 border border-emerald-200 px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-white">
                          <CheckSquare className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-[15px] font-extrabold text-emerald-900">Generation Complete</div>
                          <div className="text-[12px] font-semibold text-emerald-600">Your question paper is ready — scroll down to review</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-[13px] font-bold text-white shadow-md hover:bg-emerald-500 transition"
                      >
                        Print / Export PDF
                      </button>
                    </div>

                    {/* ── The Question Paper ── */}
                    <div id="qcp-paper" className="rounded-[2rem] bg-white border border-slate-200 shadow-[0_10px_50px_rgba(0,0,0,0.06)] overflow-hidden print:shadow-none print:rounded-none print:border-none">
                      {/* Paper Title Block */}
                      <div className="border-b-2 border-slate-900 px-10 py-10 lg:px-16 lg:py-12 text-center">
                        <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-[0.12em] text-slate-900 leading-tight">
                          {paper.exam_title || 'Examination'}
                        </h2>
                        <p className="mt-3 text-lg font-bold text-slate-600">
                          {paper.course || form.course}
                        </p>
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-2 text-[13px] font-bold text-slate-500 uppercase tracking-widest">
                          <span>Time: <span className="text-slate-900">3 Hours</span></span>
                          <span>Max. Marks: <span className="text-slate-900">{paper.total_marks ?? form.max_marks}</span></span>
                        </div>
                        <p className="mt-5 text-[12px] text-slate-400 font-semibold italic">
                          Answer all questions. Each unit carries equal marks. Internal choices are provided where applicable.
                        </p>
                      </div>

                      {/* Questions Body */}
                      <div className="px-10 py-10 lg:px-16 lg:py-14 space-y-10">
                        {chapters.map(([unit, questions], unitIdx) => (
                          <div key={unit}>
                            {/* Unit Header */}
                            <div className="flex items-center gap-4 mb-7">
                              <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-slate-900 text-[12px] font-black text-white">
                                {unitIdx + 1}
                              </span>
                              <h3 className="text-[15px] font-black uppercase tracking-[0.15em] text-slate-900">
                                {unit}
                              </h3>
                              <div className="flex-1 border-t border-dashed border-slate-300" />
                            </div>

                            {/* Questions in this unit */}
                            <div className="space-y-6 pl-4 border-l-2 border-slate-100">
                              {Array.isArray(questions) && questions.map((q: any, qIdx: number) => (
                                <div key={qIdx} className="pl-5 relative">
                                  {/* Connector dot */}
                                  <span className="absolute -left-[7px] top-[10px] h-3 w-3 rounded-full border-2 border-slate-300 bg-white" />

                                  <div className="flex items-start gap-4">
                                    {/* Question number */}
                                    <span className="shrink-0 font-black text-slate-900 text-[15px] min-w-[42px]">
                                      {q.question_no}).
                                    </span>

                                    {/* Question text */}
                                    <p className="flex-1 text-[15px] leading-[1.75] text-slate-700 font-medium">
                                      {q.question}
                                    </p>

                                    {/* Marks badge */}
                                    <span className="shrink-0 mt-0.5 inline-flex items-center justify-center rounded-lg bg-slate-100 border border-slate-200 px-3 py-1.5 text-[13px] font-black text-slate-900 tabular-nums">
                                      {q.marks}M
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Unit divider (except last) */}
                            {unitIdx < chapters.length - 1 && (
                              <div className="mt-10 flex items-center gap-3">
                                <div className="flex-1 border-t border-slate-200" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">• • •</span>
                                <div className="flex-1 border-t border-slate-200" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="border-t border-slate-200 px-10 py-6 lg:px-16 text-center">
                        <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">— End of Paper —</p>
                      </div>
                    </div>
                  </div>
                );
              } catch {
                // Fallback: show raw text cleanly
                return (
                  <div className="rounded-[2rem] bg-white p-8 shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-slate-100">
                    <div className="mb-4 flex items-center gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-[14px] font-extrabold text-[#0f172a]">Raw Output</div>
                        <div className="text-[11px] font-semibold text-slate-500">Could not parse — showing raw model output</div>
                      </div>
                    </div>
                    <pre className="mt-4 p-5 rounded-xl bg-slate-50 border border-slate-100 text-[13px] leading-relaxed whitespace-pre-wrap max-h-[600px] overflow-y-auto font-mono text-slate-700">
                      {generatedPaper}
                    </pre>
                  </div>
                );
              }
            })()}
          </div>
        )}
      </form>
    </div>
  );
};
