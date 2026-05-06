import {
  BookOpen,
  CheckSquare,
  FileUp,
  Languages,
  MonitorPlay,
  PenTool,
  Rocket,
  Save,
  Sparkles,
} from 'lucide-react';
import type { ChangeEvent, FormEvent } from 'react';
import type {
  EvaluationSetupFormState,
  TeacherSession,
} from '../../types/teacherDashboard';

interface EvaluationSetupViewProps {
  error: string;
  form: EvaluationSetupFormState;
  isSubmitting: boolean;
  mode: 'draft' | 'locked';
  onCreateNew: () => void;
  onFileChange: (field: 'questionPaper' | 'teacherModelAnswer', file: File | null) => void;
  onFormChange: <K extends keyof EvaluationSetupFormState>(field: K, value: EvaluationSetupFormState[K]) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  selectedSession: TeacherSession | null;
  successMessage: string;
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

export const EvaluationSetupView = ({
  error,
  form,
  isSubmitting,
  mode,
  onCreateNew,
  onFileChange,
  onFormChange,
  onSubmit,
  selectedSession,
  successMessage,
}: EvaluationSetupViewProps) => {
  const isLocked = mode === 'locked' && selectedSession;
  const displayExamType = isLocked ? selectedSession.preferences.exam_type : form.examType;
  const displayLanguageExam = isLocked ? Boolean(selectedSession.preferences.language_exam) : form.languageExam;
  const displayIsHandwritten = isLocked ? Boolean(selectedSession.preferences.is_handwritten) : form.isHandwritten;
  const displayMaxMarks = isLocked ? selectedSession.preferences.max_marks : form.maxMarks;
  const displayMinAnswerLength = isLocked ? selectedSession.preferences.min_answer_length : form.minAnswerLength;
  const displayPrompt = isLocked ? selectedSession.custom_prompt ?? '' : form.customPrompt;
  const displayLlmProvider = isLocked ? selectedSession.preferences.llm_provider ?? 'api' : form.llmProvider;
  const displayLlmModel = isLocked ? selectedSession.preferences.llm_model ?? 'gpt-4o' : form.llmModel;

  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <form onSubmit={onSubmit}>
        <div className="mb-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end w-full">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-[#0f172a] sm:text-5xl">
              Configure<br />Evaluation
            </h1>
            <p className="mt-4 max-w-[400px] text-[13px] leading-relaxed text-slate-500">
              Define the parameters, grading rubrics, and technical constraints for your academic assessment.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onCreateNew}
              className="flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <Save className="h-4 w-4" />
              <span className="text-left leading-tight">Save<br />Draft</span>
            </button>
            <button
              type="submit"
              disabled={isSubmitting || Boolean(isLocked)}
              className="flex items-center justify-center gap-3 rounded-xl bg-[#02211e] px-7 py-4 text-[13px] font-bold text-white shadow-lg transition hover:bg-[#033630] disabled:cursor-not-allowed disabled:opacity-70"
            >
              Initiate<br />Setup
              <Rocket className="h-4 w-4" />
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
                Assessment Core
              </div>

              <div className="mb-8">
                <label className="mb-2 block text-xs font-bold text-slate-800">Session Name</label>
                <input
                  type="text"
                  disabled={Boolean(isLocked)}
                  value={isLocked ? selectedSession.name : form.name}
                  onChange={(event) => onFormChange('name', event.target.value)}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-3.5 text-[13px] font-semibold text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white disabled:cursor-not-allowed disabled:text-slate-500"
                  placeholder="e.g. Midterm Theory Evaluation"
                />
              </div>

              <div className="mb-8">
                <div className="mb-3 text-[13px] font-bold text-slate-800">Exam Classification</div>
                <div className="grid grid-cols-2 gap-3 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                  <button
                    type="button"
                    disabled={Boolean(isLocked)}
                    onClick={() => onFormChange('examType', 'Theory')}
                    className={`flex items-center justify-center gap-2 rounded-xl py-3.5 text-[13px] font-bold transition ${displayExamType === 'Theory'
                        ? 'bg-[#0f172a] text-white shadow-md'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                      }`}
                  >
                    <BookOpen className="h-4 w-4" />
                    Theory Based
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(isLocked)}
                    onClick={() => onFormChange('examType', 'Technical')}
                    className={`flex items-center justify-center gap-2 rounded-xl py-3.5 text-[13px] font-bold transition ${displayExamType === 'Technical'
                        ? 'bg-[#0f172a] text-white shadow-md'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                      }`}
                  >
                    <MonitorPlay className="h-4 w-4" />
                    Technical
                  </button>
                </div>
              </div>

              {displayExamType === 'Technical' && (
                <div className="mb-8">
                  <div className="mb-3 text-[13px] font-bold text-slate-800">LLM Configuration</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-xs font-semibold text-slate-600">Provider</label>
                      <select
                        disabled={Boolean(isLocked)}
                        value={displayLlmProvider}
                        onChange={(event) => {
                          const val = event.target.value;
                          onFormChange('llmProvider', val);
                          if (val === 'api') {
                            onFormChange('llmModel', 'gpt-4o');
                          } else {
                            onFormChange('llmModel', 'qwen3-coder-next:cloud');
                          }
                        }}
                        className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-[13px] font-semibold text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white disabled:cursor-not-allowed"
                      >
                        <option value="api">API Models</option>
                        <option value="ollama">Ollama Models</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold text-slate-600">Model</label>
                      <select
                        disabled={Boolean(isLocked)}
                        value={displayLlmModel}
                        onChange={(event) => onFormChange('llmModel', event.target.value)}
                        className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-[13px] font-semibold text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white disabled:cursor-not-allowed"
                      >
                        {displayLlmProvider === 'api' ? (
                          <option value="gpt-4o">gpt-4o</option>
                        ) : (
                          <option value="qwen3-coder-next:cloud">qwen3-coder-next:cloud</option>
                        )}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {displayExamType === 'Theory' && (
                <div className="mb-4 flex items-center justify-between rounded-2xl bg-slate-50 p-5 px-6 border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
                      <Languages className="h-4 w-4 text-slate-600" />
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-slate-900">Language Based Exam</div>
                      <div className="text-[11px] font-medium text-slate-500 mt-0.5">Enable linguistic nuance & syntax evaluation</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={Boolean(isLocked)}
                    onClick={() => onFormChange('languageExam', !form.languageExam)}
                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${displayLanguageExam ? 'bg-[#0f172a]' : 'bg-slate-200'
                      }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition ${displayLanguageExam ? 'translate-x-5' : 'translate-x-0'
                        }`}
                    />
                  </button>
                </div>
              )}

              <div className="mb-8 flex items-center justify-between rounded-2xl bg-slate-50 p-5 px-6 border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
                    <PenTool className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-slate-900">Handwritten Scripts</div>
                    <div className="text-[11px] font-medium text-slate-500 mt-0.5">Enable advanced OCR for scanned handwritten answers</div>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={Boolean(isLocked)}
                  onClick={() => onFormChange('isHandwritten', !form.isHandwritten)}
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${displayIsHandwritten ? 'bg-[#0f172a]' : 'bg-slate-200'
                    }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition ${displayIsHandwritten ? 'translate-x-5' : 'translate-x-0'
                      }`}
                  />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="mb-3 text-[13px] font-bold text-slate-800">Maximum Marks</div>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      disabled={Boolean(isLocked)}
                      value={displayMaxMarks}
                      onChange={(event) => onFormChange('maxMarks', Number(event.target.value))}
                      className="w-full rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4 text-xl font-bold text-[#0f172a] outline-none disabled:cursor-not-allowed"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest text-[#94a3b8]">
                      PTS
                    </span>
                  </div>
                </div>
                <div>
                  <div className="mb-3 text-[13px] font-bold text-slate-800">Expected Length</div>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      disabled={Boolean(isLocked)}
                      value={displayMinAnswerLength}
                      onChange={(event) => onFormChange('minAnswerLength', Number(event.target.value))}
                      className="w-full rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4 text-xl font-bold text-[#0f172a] outline-none disabled:cursor-not-allowed"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest text-[#94a3b8]">
                      WORDS
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-8 shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-slate-100">
              <div className="mb-6 flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-[#0f172a]">
                <div className="h-1.5 w-1.5 rounded-full bg-[#0f172a]" />
                Grading Intelligence
              </div>
              <div>
                <label className="mb-3 block text-[13px] font-bold text-slate-800">Evaluation Heuristics & Context</label>
                <textarea
                  disabled={Boolean(isLocked)}
                  value={displayPrompt}
                  onChange={(event) => onFormChange('customPrompt', event.target.value)}
                  rows={4}
                  placeholder="Define specific evaluation criteria, common misconceptions, or mandatory keywords the AI should monitor..."
                  className="w-full resize-none rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4 text-[13px] font-medium leading-relaxed text-[#64748b] outline-none placeholder:text-[#94a3b8] focus:bg-white focus:ring-1 focus:ring-indigo-100 transition disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] bg-[#eef2fc] p-8">
              <div className="mb-6 text-[11px] font-black uppercase tracking-widest text-[#334155]">
                Reference Artifacts
              </div>

              <UploadTile
                acceptLabel="PDF or DOCX up to 10MB"
                description="Upload primary prompt"
                disabled={Boolean(isLocked)}
                file={form.questionPaper}
                label="Question Paper"
                onChange={(event) => onFileChange('questionPaper', event.target.files?.[0] ?? null)}
              />

              <UploadTile
                acceptLabel="PDF, CSV, or TXT"
                description="Upload gold standard"
                disabled={Boolean(isLocked)}
                file={form.teacherModelAnswer}
                label="Model Answer / Rubric"
                onChange={(event) => onFileChange('teacherModelAnswer', event.target.files?.[0] ?? null)}
              />
            </div>

            <div className="rounded-[2rem] bg-white p-8 shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-slate-100">
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0f172a] text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[14px] font-extrabold text-[#0f172a]">Luminary Check</div>
                  <div className="text-[11px] font-semibold text-slate-500">AI Prediction Engine</div>
                </div>
              </div>
              <p className="mb-8 text-[12px] leading-relaxed text-slate-600">
                Based on your parameters, we estimate a <strong className="font-bold text-[#0f172a]">98.4% accuracy</strong> in identifying semantic errors. The complexity level suggests a processing time of <strong className="font-bold text-[#0f172a]">1.2 seconds per script</strong>.
              </p>

              <div>
                <div className="mb-2 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                  <span>Calibration Progress</span>
                  <span className="text-[#0f172a]">75%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#eef2fc]">
                  <div className="h-full w-[75%] bg-[#0f172a]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
