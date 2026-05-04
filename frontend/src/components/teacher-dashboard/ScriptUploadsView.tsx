import {
  AlertCircle,
  CheckCircle2,
  CheckSquare,
  FileArchive,
  FileText,
  Info,
  LoaderCircle,
  Play,
  Rocket,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react';
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import type { TeacherSession, ZipInspection } from '../../types/teacherDashboard';

interface ScriptUploadsViewProps {
  error: string;
  inspection: ZipInspection | null;
  isProcessing: boolean;
  isUploading: boolean;
  onProcess: () => void;
  onUpload: () => void;
  onZipSelected: (file: File | null) => void;
  selectedSession: TeacherSession | null;
  successMessage: string;
  uploadFile: File | null;
  uploadProgress: number;
}

const statusLabel: Record<string, string> = {
  created: 'Ready for Upload',
  uploaded: 'Ready to Process',
  processing: 'Processing...',
  processed: 'Complete',
};

export const ScriptUploadsView = ({
  error,
  inspection,
  isProcessing,
  isUploading,
  onProcess,
  onUpload,
  onZipSelected,
  selectedSession,
  successMessage,
  uploadFile,
  uploadProgress,
}: ScriptUploadsViewProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const onSelectFile = (event: ChangeEvent<HTMLInputElement>) => {
    onZipSelected(event.target.files?.[0] ?? null);
  };

  const onDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(false);
    onZipSelected(event.dataTransfer.files?.[0] ?? null);
  };

  if (!selectedSession) {
    return (
      <div className="mx-auto w-full max-w-[1100px]">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-[#0f172a] sm:text-5xl">
            Script<br />Uploads
          </h1>
          <p className="mt-4 max-w-[400px] text-[13px] leading-relaxed text-slate-500">
            Select a session from the sidebar to upload student answer sheets.
          </p>
        </div>

        <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white/60 px-8 py-20 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100">
            <FileArchive className="h-7 w-7 text-slate-400" />
          </div>
          <div className="mt-5 text-lg font-semibold text-slate-500">No session selected</div>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
            Choose an existing session or create a new one in Evaluation Setup to start uploading scripts.
          </p>
        </div>
      </div>
    );
  }

  const processedCount = selectedSession.processed ?? 0;
  const totalFiles = selectedSession.total_files ?? inspection?.pdfCount ?? 0;
  const progressPct = totalFiles > 0 ? Math.min(100, Math.round((processedCount / totalFiles) * 100)) : 0;
  const canProcess = selectedSession.status === 'uploaded' && !isProcessing;

  return (
    <div className="mx-auto w-full max-w-[1100px]">
      {/* ─── Page Header (matches EvaluationSetupView) ─── */}
      <div className="mb-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end w-full">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#0f172a] sm:text-5xl">
            Script<br />Uploads
          </h1>
          <p className="mt-4 max-w-[400px] text-[13px] leading-relaxed text-slate-500">
            Upload student answer sheets as a ZIP package. Each PDF is treated as one student script.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">Session</div>
            <div className="mt-1 text-sm font-bold text-slate-900 truncate max-w-[200px]">{selectedSession.name}</div>
          </div>
          <div className={`rounded-xl px-4 py-3 text-[13px] font-bold ${
            selectedSession.status === 'processed'
              ? 'bg-emerald-50 text-emerald-700'
              : selectedSession.status === 'processing'
                ? 'bg-amber-50 text-amber-700'
                : 'bg-slate-100 text-slate-700'
          }`}>
            {statusLabel[selectedSession.status] ?? selectedSession.status}
          </div>
        </div>
      </div>

      {/* ─── Alert Banner ─── */}
      {(error || successMessage) && (
        <div className={`mb-6 rounded-xl border px-4 py-3 text-sm font-medium ${
          error
            ? 'border-rose-100 bg-rose-50 text-rose-600'
            : 'border-emerald-100 bg-emerald-50 text-emerald-700'
        }`}>
          {error || successMessage}
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* ─── Left Column ─── */}
        <div className="space-y-6">
          {/* Upload Zone */}
          <div className="rounded-[2rem] bg-white p-8 shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-slate-100">
            <div className="mb-6 flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-[#0f172a]">
              <div className="h-1.5 w-1.5 rounded-full bg-[#0f172a]" />
              Upload Package
            </div>

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className={`group relative flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition ${
                isDragging
                  ? 'border-sky-400 bg-sky-50/70'
                  : uploadFile
                    ? 'border-emerald-200 bg-emerald-50/40'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <input ref={inputRef} type="file" accept=".zip,application/zip" className="hidden" onChange={onSelectFile} />
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm ${
                uploadFile ? 'bg-emerald-500 text-white' : 'bg-[#0f172a] text-white'
              }`}>
                {uploadFile ? <CheckSquare className="h-6 w-6" /> : <UploadCloud className="h-6 w-6" />}
              </div>
              <div className="mt-4 text-[15px] font-bold text-slate-900">
                {uploadFile ? uploadFile.name : 'Drag & drop your ZIP here'}
              </div>
              <div className="mt-1.5 text-[12px] text-slate-500">
                {uploadFile
                  ? `${(uploadFile.size / (1024 * 1024)).toFixed(2)} MB • Click to change`
                  : 'or click to browse your files'}
              </div>
              <div className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
                {uploadFile ? 'Change File' : 'Choose ZIP File'}
              </div>
            </button>

            {/* Inspection Result */}
            {inspection && (
              <div className={`mt-5 rounded-2xl border p-4 text-sm ${
                inspection.pdfCount > 0
                  ? 'border-emerald-100 bg-emerald-50/60 text-emerald-700'
                  : 'border-amber-100 bg-amber-50/60 text-amber-700'
              }`}>
                <div className="flex items-center gap-2 font-semibold">
                  {inspection.pdfCount > 0 ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  {inspection.pdfCount > 0
                    ? `${inspection.pdfCount} student PDF(s) detected`
                    : 'No valid PDFs detected'}
                </div>
                {inspection.ignoredFiles.length > 0 && (
                  <div className="mt-1.5 text-[12px] leading-5 opacity-80">
                    {inspection.ignoredFiles.length} non-PDF file(s) will be ignored.
                  </div>
                )}
              </div>
            )}

            {/* Upload Button + Progress */}
            {uploadFile && (
              <div className="mt-5 space-y-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onUpload}
                    disabled={isUploading || !inspection?.pdfCount}
                    className="flex items-center justify-center gap-3 rounded-xl bg-[#02211e] px-7 py-4 text-[13px] font-bold text-white shadow-lg transition hover:bg-[#033630] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isUploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                    {isUploading ? 'Uploading...' : 'Upload ZIP'}
                  </button>

                  {canProcess && (
                    <button
                      type="button"
                      onClick={onProcess}
                      className="flex items-center justify-center gap-3 rounded-xl bg-[#0f172a] px-7 py-4 text-[13px] font-bold text-white shadow-lg transition hover:bg-slate-800"
                    >
                      <Rocket className="h-4 w-4" />
                      Start Processing
                    </button>
                  )}
                </div>

                {(isUploading || uploadProgress > 0) && (
                  <div>
                    <div className="mb-2 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                      <span>Upload Progress</span>
                      <span className="text-[#0f172a]">{uploadProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#eef2fc]">
                      <div
                        className="h-full bg-[#0f172a] transition-all duration-500"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Detected Files */}
          {inspection?.pdfNames.length ? (
            <div className="rounded-[2rem] bg-white p-8 shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-slate-100">
              <div className="mb-6 flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-[#0f172a]">
                <div className="h-1.5 w-1.5 rounded-full bg-[#0f172a]" />
                Detected Students
                <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-500">{inspection.pdfNames.length}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {inspection.pdfNames.slice(0, 12).map((name) => (
                  <div key={name} className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-[12px] font-semibold text-slate-700">{name}</span>
                  </div>
                ))}
                {inspection.pdfNames.length > 12 && (
                  <div className="flex items-center rounded-xl bg-[#0f172a] px-3 py-2">
                    <span className="text-[12px] font-bold text-white">+{inspection.pdfNames.length - 12} more</span>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* ─── Right Column ─── */}
        <div className="space-y-6">
          {/* Processing Status Panel */}
          <div className="rounded-[2rem] bg-[#eef2fc] p-8">
            <div className="mb-6 text-[11px] font-black uppercase tracking-widest text-[#334155]">
              Processing Status
            </div>

            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                selectedSession.status === 'processed'
                  ? 'bg-emerald-500 text-white'
                  : isProcessing
                    ? 'bg-amber-500 text-white'
                    : 'bg-white shadow-sm text-slate-500'
              }`}>
                {selectedSession.status === 'processed'
                  ? <CheckCircle2 className="h-5 w-5" />
                  : isProcessing
                    ? <LoaderCircle className="h-5 w-5 animate-spin" />
                    : <Play className="h-5 w-5" />}
              </div>
              <div>
                <div className="text-2xl font-extrabold text-[#0f172a]">{progressPct}%</div>
                <div className="text-[11px] font-semibold text-slate-500">
                  {processedCount} / {totalFiles} scripts
                </div>
              </div>
            </div>

            <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-white/60">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                  selectedSession.status === 'processed' ? 'bg-emerald-500' : 'bg-[#0f172a]'
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {canProcess && (
              <button
                type="button"
                onClick={onProcess}
                disabled={isProcessing}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f172a] px-5 py-3.5 text-[13px] font-bold text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isProcessing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                {isProcessing ? 'Processing...' : 'Start Processing'}
              </button>
            )}
          </div>

          {/* Validation Rules */}
          <div className="rounded-[2rem] bg-white p-8 shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-slate-100">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0f172a] text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[14px] font-extrabold text-[#0f172a]">Upload Rules</div>
                <div className="text-[11px] font-semibold text-slate-500">Validation Requirements</div>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { text: 'Only .zip archives accepted', icon: FileArchive },
                { text: 'One PDF per student answer script', icon: FileText },
                { text: 'PDF filename = Student name', icon: Info },
                { text: 'Non-PDF files are auto-ignored', icon: AlertCircle },
              ].map((rule) => {
                const Icon = rule.icon;
                return (
                  <div key={rule.text} className="flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-100 p-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">
                      <Icon className="h-3.5 w-3.5 text-slate-500" />
                    </div>
                    <span className="text-[13px] font-medium text-slate-700">{rule.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
