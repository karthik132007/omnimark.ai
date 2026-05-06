import { startTransition, useEffect, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { unzipSync } from 'fflate';

import { useNavigate } from 'react-router-dom';
import { DashboardSidebar } from '../components/teacher-dashboard/DashboardSidebar';
import { EvaluationSetupView } from '../components/teacher-dashboard/EvaluationSetupView';
import { OverviewView } from '../components/teacher-dashboard/OverviewView';
import { ScriptUploadsView } from '../components/teacher-dashboard/ScriptUploadsView';
import { AnalyticsView } from '../components/teacher-dashboard/AnalyticsView';
import { QCPView } from '../components/teacher-dashboard/QCPView';
import { OmiView } from '../components/teacher-dashboard/OmiView';
import {
  createTeacherSession,
  getTeacherSession,
  getTeacherSessionStatus,
  listTeacherSessions,
  processTeacherSession,
  uploadTeacherSessionZip,
  deleteTeacherSession,
} from '../lib/teacherDashboardApi';
import type {
  DashboardView,
  EvaluationSetupFormState,
  TeacherSession,
  TeacherSessionSummary,
  ZipInspection,
  QCPFormState,
} from '../types/teacherDashboard';

const defaultQCPFormState = (): QCPFormState => ({
  difficulty: 'Medium',
  max_marks: 100,
  no_of_ques: 10,
  course: '',
  choice_aval: false,
  choice_type: 'Internal',
  custom_prompt: '',
  relevent_docs: null,
});

const defaultFormState = (): EvaluationSetupFormState => ({
  name: '',
  examType: 'Theory',
  correctionMode: 'NLP',
  languageExam: true,
  isHandwritten: false,
  maxMarks: 100,
  minAnswerLength: 250,
  questionPaper: null,
  teacherModelAnswer: null,
  customPrompt: '',
  llmProvider: 'api',
  llmModel: 'gpt-4o',
});



const getErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    return String(error.response?.data?.detail ?? fallback);
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

const isPdfFile = (file: File | null) => {
  if (!file) {
    return false;
  }

  return file.name.toLowerCase().endsWith('.pdf');
};

const inspectZipFile = async (file: File) => {
  const archive = unzipSync(new Uint8Array(await file.arrayBuffer()));
  const entries = Object.keys(archive).filter((entry) => !entry.endsWith('/'));
  const pdfNames = entries
    .filter((entry) => entry.toLowerCase().endsWith('.pdf'))
    .map((entry) => entry.split('/').pop() ?? entry);
  const ignoredFiles = entries.filter((entry) => !entry.toLowerCase().endsWith('.pdf'));

  return {
    pdfCount: pdfNames.length,
    pdfNames,
    ignoredFiles,
    hasNestedFolders: entries.some((entry) => entry.includes('/')),
    totalEntries: entries.length,
  } satisfies ZipInspection;
};



export const TeacherDashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [activeView, setActiveView] = useState<DashboardView>('dashboard');
  const [form, setForm] = useState<EvaluationSetupFormState>(defaultFormState);
  const [qcpForm, setQcpForm] = useState<QCPFormState>(defaultQCPFormState());
  const [qcpResult, setQcpResult] = useState<string | null>(null);
  const [isSubmittingQcp, setIsSubmittingQcp] = useState(false);
  const [inspection, setInspection] = useState<ZipInspection | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSessionsExpanded, setIsSessionsExpanded] = useState(true);
  const [isSubmittingSetup, setIsSubmittingSetup] = useState(false);
  const [isUploadingZip, setIsUploadingZip] = useState(false);
  const [selectedSession, setSelectedSession] = useState<TeacherSession | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<TeacherSessionSummary[]>([]);
  const [setupError, setSetupError] = useState('');
  const [setupSuccess, setSetupSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState('');


  const isDraftMode = activeView === 'evaluation-setup' && !selectedSessionId;

  useEffect(() => {
    if (!token) {
      navigate('/auth');
    }
  }, [navigate, token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const loadSessions = async () => {
      try {
        const sessionList = await listTeacherSessions();
        setSessions(sessionList);
      } catch (error) {
        setUploadError(getErrorMessage(error, 'Unable to load sessions right now.'));
      } finally {
      }
    };

    void loadSessions();
  }, [token]);

  useEffect(() => {
    if (!token || !selectedSessionId) {
      return;
    }

    const loadSession = async () => {
      try {
        const session = await getTeacherSession(selectedSessionId);
        setSelectedSession(session);
        setIsProcessing(session.status === 'processing');
      } catch (error) {
        setUploadError(getErrorMessage(error, 'Unable to load that session.'));
      }
    };

    void loadSession();
  }, [selectedSessionId, token]);

  useEffect(() => {
    if (selectedSession?.status !== 'processing') {
      return;
    }

    const intervalId = window.setInterval(async () => {
      try {
        const status = await getTeacherSessionStatus(selectedSession.session_id);
        setSelectedSession((current) =>
          current
            ? {
              ...current,
              status: status.status,
              processed: status.processed,
              total_files: status.total_files,
            }
            : current,
        );

        if (status.status !== 'processing') {
          setIsProcessing(false);
          setUploadSuccess('Processing completed successfully. Analytics can now be layered onto this session.');
          const refreshedSessions = await listTeacherSessions();
          setSessions(refreshedSessions);
        }
      } catch (error) {
        setUploadError(getErrorMessage(error, 'Unable to refresh processing status.'));
        setIsProcessing(false);
      }
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, [selectedSession]);

  const refreshSessions = async () => {
    const sessionList = await listTeacherSessions();
    setSessions(sessionList);
    return sessionList;
  };

  const resetSetupState = () => {
    setForm(defaultFormState());
    setSetupError('');
    setSetupSuccess('');
  };

  const resetQcpState = () => {
    setQcpForm(defaultQCPFormState());
    setQcpResult(null);
    setSetupError('');
    setSetupSuccess('');
  };

  const resetUploadState = () => {
    setInspection(null);
    setUploadError('');
    setUploadFile(null);
    setUploadProgress(0);
    setUploadSuccess('');
  };

  const beginNewSessionDraft = () => {
    startTransition(() => {
      setSelectedSessionId(null);
      setSelectedSession(null);
      setActiveView('evaluation-setup');
      setIsSessionsExpanded(true);
    });
    resetSetupState();
    resetUploadState();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user_email');
    navigate('/');
  };

  const handleSelectSession = (sessionId: string) => {
    const session = sessions.find((s) => s.session_id === sessionId);
    const targetView: DashboardView = session?.status === 'processed' ? 'analytics' : 'evaluation-setup';

    startTransition(() => {
      setSelectedSessionId(sessionId);
      setActiveView(targetView);
      setIsSessionsExpanded(true);
    });
    resetSetupState();
    resetUploadState();
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteTeacherSession(sessionId);
      if (sessionId === selectedSessionId) {
        beginNewSessionDraft();
      }
      await refreshSessions();
    } catch (error) {
      console.error('Failed to delete session:', error);
      alert('Failed to delete session. Please try again.');
    }
  };

  const handleActiveViewChange = (view: DashboardView) => {
    if ((view === 'script-uploads' || view === 'analytics') && !selectedSessionId) {
      setUploadError('Select a session first to continue through the workflow.');
      return;
    }

    setUploadError('');
    setActiveView(view);
  };

  const handleFormChange = <K extends keyof EvaluationSetupFormState>(field: K, value: EvaluationSetupFormState[K]) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleQcpFormChange = <K extends keyof QCPFormState>(field: K, value: QCPFormState[K]) => {
    setQcpForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleQcpFileChange = (file: File | null) => {
    if (file && !isPdfFile(file)) {
      setSetupError('Relevant documents must be PDF files.');
      return;
    }
    setSetupError('');
    setQcpForm((current) => ({
      ...current,
      relevent_docs: file,
    }));
  };

  const handleReferenceFileChange = (field: 'questionPaper' | 'teacherModelAnswer', file: File | null) => {
    if (file && !isPdfFile(file)) {
      setSetupError('Question paper and model answer must be PDF files for the current backend pipeline.');
      return;
    }

    setSetupError('');
    setForm((current) => ({
      ...current,
      [field]: file,
    }));
  };

  const handleCreateSession = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSetupError('');
    setSetupSuccess('');

    if (!form.name.trim()) {
      setSetupError('Add a session name before initiating setup.');
      return;
    }

    if (!isPdfFile(form.questionPaper) || !isPdfFile(form.teacherModelAnswer)) {
      setSetupError('Upload both the question paper and teacher model answer as PDF files.');
      return;
    }

    if (form.maxMarks <= 0 || form.minAnswerLength <= 0) {
      setSetupError('Maximum marks and minimum answer length must both be greater than zero.');
      return;
    }

    setIsSubmittingSetup(true);

    try {
      const response = await createTeacherSession(form);
      const [sessionDetail] = await Promise.all([
        getTeacherSession(response.session_id),
        refreshSessions(),
      ]);

      setSelectedSessionId(response.session_id);
      setSelectedSession(sessionDetail);
      setSetupSuccess('Session created successfully. You can now upload student scripts.');
      setActiveView('script-uploads');
      resetUploadState();
    } catch (error) {
      setSetupError(getErrorMessage(error, 'Unable to create the evaluation session.'));
    } finally {
      setIsSubmittingSetup(false);
    }
  };

  const handleZipSelected = async (file: File | null) => {
    setUploadError('');
    setUploadSuccess('');
    setUploadProgress(0);
    setInspection(null);
    setUploadFile(null);

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith('.zip')) {
      setUploadError('Only ZIP files are accepted for student script uploads.');
      return;
    }

    try {
      const zipInspection = await inspectZipFile(file);
      if (!zipInspection.pdfCount) {
        setUploadError('This ZIP does not contain any PDF files that look like student scripts.');
      } else if (zipInspection.hasNestedFolders) {
        setUploadSuccess('ZIP validated. Nested folders are supported, and student PDFs were detected.');
      }

      setInspection(zipInspection);
      setUploadFile(file);
    } catch (error) {
      setUploadError(getErrorMessage(error, 'Unable to inspect this ZIP file. Please try another archive.'));
    }
  };

  const handleUploadZip = async () => {
    if (!selectedSessionId || !uploadFile) {
      setUploadError('Select a session and choose a ZIP file before uploading.');
      return;
    }

    if (!inspection?.pdfCount) {
      setUploadError('The selected ZIP must contain at least one student PDF.');
      return;
    }

    setIsUploadingZip(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      await uploadTeacherSessionZip(selectedSessionId, {
        file: uploadFile,
        onProgress: setUploadProgress,
      });

      const [sessionDetail] = await Promise.all([
        getTeacherSession(selectedSessionId),
        refreshSessions(),
      ]);

      setSelectedSession(sessionDetail);
      setUploadSuccess(`ZIP uploaded successfully. ${inspection.pdfCount} student PDF(s) were prepared for this session.`);
      setUploadProgress(100);
    } catch (error) {
      setUploadError(getErrorMessage(error, 'Unable to upload the ZIP package.'));
    } finally {
      setIsUploadingZip(false);
    }
  };

  const handleProcessSession = async () => {
    if (!selectedSessionId) {
      setUploadError('Select a session before starting processing.');
      return;
    }

    setUploadError('');
    setUploadSuccess('');
    setIsProcessing(true);

    try {
      await processTeacherSession(selectedSessionId);
      setSelectedSession((current) => (current ? { ...current, status: 'processing' } : current));
      setUploadSuccess('Processing has started. Session status will refresh automatically.');
      setActiveView('analytics');
      await refreshSessions();
    } catch (error) {
      setIsProcessing(false);
      setUploadError(getErrorMessage(error, 'Unable to start processing for this session.'));
    }
  };

  const handleCreateQcp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSetupError('');
    setSetupSuccess('');
    
    if (!qcpForm.course.trim()) {
      setSetupError('Please enter a course or subject name.');
      return;
    }
    
    if (!qcpForm.relevent_docs) {
      setSetupError('Please upload relevant PDF documents for context.');
      return;
    }

    setIsSubmittingQcp(true);
    try {
      // Lazy load to avoid circular dependency issues at the top level
      const { generateQuestionPaper } = await import('../lib/teacherDashboardApi');
      const generated = await generateQuestionPaper(qcpForm);
      setQcpResult(generated);
      setSetupSuccess('Question paper generated successfully.');
    } catch (error) {
      setSetupError(getErrorMessage(error, 'Unable to generate the question paper.'));
    } finally {
      setIsSubmittingQcp(false);
    }
  };

  return (
    <div className="page-shell min-h-screen px-4 py-4 text-slate-900 sm:px-5 lg:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1600px] gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <DashboardSidebar
          activeView={activeView}
          isDraftMode={isDraftMode}
          isSessionsExpanded={isSessionsExpanded}
          isProcessing={isProcessing}
          onCreateSession={beginNewSessionDraft}
          onLogout={handleLogout}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
          onSetActiveView={handleActiveViewChange}
          onToggleSessions={() => setIsSessionsExpanded((current) => !current)}
          onOpenQcp={() => {
            setActiveView('qcp');
            resetQcpState();
          }}
          selectedSessionId={selectedSessionId}
          sessions={sessions}
        />

        <main className="space-y-4">
          {activeView === 'dashboard' ? (
            <OverviewView
              onCreateSession={beginNewSessionDraft}
              onOpenUploads={() => handleActiveViewChange('script-uploads')}
              onSelectSession={handleSelectSession}
              onOpenOmi={() => handleActiveViewChange('omi')}
              selectedSession={selectedSession}
              sessions={sessions}
            />
          ) : null}

          {activeView === 'evaluation-setup' ? (
            <EvaluationSetupView
              error={setupError}
              form={form}
              isSubmitting={isSubmittingSetup}
              mode={selectedSessionId ? 'locked' : 'draft'}
              onCreateNew={beginNewSessionDraft}
              onFileChange={handleReferenceFileChange}
              onFormChange={handleFormChange}
              onSubmit={handleCreateSession}
              selectedSession={selectedSession}
              successMessage={setupSuccess}
            />
          ) : null}

          {activeView === 'script-uploads' ? (
            <ScriptUploadsView
              error={uploadError}
              inspection={inspection}
              isProcessing={isProcessing}
              isUploading={isUploadingZip}
              onProcess={handleProcessSession}
              onUpload={handleUploadZip}
              onZipSelected={handleZipSelected}
              selectedSession={selectedSession}
              successMessage={uploadSuccess}
              uploadFile={uploadFile}
              uploadProgress={uploadProgress}
            />
          ) : null}

          {activeView === 'analytics' ? <AnalyticsView selectedSession={selectedSession} isProcessing={isProcessing} /> : null}

          {activeView === 'qcp' ? (
            <QCPView
              error={setupError}
              form={qcpForm}
              isSubmitting={isSubmittingQcp}
              onFileChange={handleQcpFileChange}
              onFormChange={handleQcpFormChange}
              onSubmit={handleCreateQcp}
              successMessage={setupSuccess}
              generatedPaper={qcpResult}
            />
          ) : null}

          {activeView === 'omi' ? (
            <OmiView />
          ) : null}
        </main>
      </div>
    </div>
  );
};
