import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import {
  Code2, CheckCircle, XCircle, ChevronRight, Clock, Trophy,
  AlertTriangle, Terminal, Zap, BookOpen, Loader2, BarChart3,
  ArrowRight, RefreshCw, Eye, EyeOff
} from 'lucide-react';
import { apiRequest } from '@/core/api';
import { io } from 'socket.io-client';

// ── Types ──────────────────────────────────────────────────────────────────────
interface TestCase {
  input: string;
  expectedOutput: string;
}

interface Question {
  _id: string;
  title: string;
  description: string;
  difficulty: 'very_easy' | 'easy' | 'medium' | 'hard';
  category: 'basics' | 'oop' | 'dsa';
  visibleTestCases: TestCase[];
  starterCode?: string;
  starterTemplates?: {
    python?: string;
    javascript?: string;
    typescript?: string;
    java?: string;
    cpp?: string;
  };
}

interface VisibleCaseResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  errorType: string | null;
}

interface HiddenSummary {
  total: number;
  passed: number;
  failed: number;
}

interface SubmitResponse {
  passed: boolean;
  score: number;
  visibleTestResults: VisibleCaseResult[];
  hiddenTestSummary: HiddenSummary;
  nextDifficulty: string;
  nextCategory: string | null;
  questionNumber: number;
  totalQuestions: number;
  sessionComplete: boolean;
  finalScore?: number;
}

type Phase = 'loading' | 'question' | 'result_feedback' | 'completed' | 'error';
export type SupportedLanguage = 'python' | 'javascript' | 'typescript' | 'java' | 'cpp';

// ── Constants ──────────────────────────────────────────────────────────────────
const DIFFICULTY_CONFIG = {
  very_easy: { label: 'Very Easy', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30' },
  easy:      { label: 'Easy',      color: 'text-green-400',   bg: 'bg-green-400/10',   border: 'border-green-400/30'   },
  medium:    { label: 'Medium',    color: 'text-yellow-400',  bg: 'bg-yellow-400/10',  border: 'border-yellow-400/30'  },
  hard:      { label: 'Hard',      color: 'text-red-400',     bg: 'bg-red-400/10',     border: 'border-red-400/30'     },
};
const CATEGORY_CONFIG = {
  basics: { label: 'Python Basics', icon: '🐍' },
  oop:    { label: 'OOP',           icon: '🏗️' },
  dsa:    { label: 'Data Structures & Algorithms', icon: '🧠' },
};
const MAX_QUESTIONS = 5;

const DEFAULT_STARTER_TEMPLATES: Record<SupportedLanguage, string> = {
  python: `# Write your Python solution below\n# Read input using: input() or sys.stdin.read()\n# Print output using: print()\n\n`,
  javascript: `// Write your JavaScript (Node.js) solution below\n// Read input using fs.readFileSync(0, 'utf-8')\n// Print output using console.log()\nconst fs = require('fs');\n\n`,
  typescript: `// Write your TypeScript solution below\nimport * as fs from 'fs';\n\n`,
  java: `import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Write your solution below\n    }\n}\n`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution below\n    return 0;\n}\n`,
};

const STARTER_CODE = DEFAULT_STARTER_TEMPLATES.python;

// ── Helper Components ──────────────────────────────────────────────────────────
const DifficultyBadge: React.FC<{ difficulty: keyof typeof DIFFICULTY_CONFIG }> = ({ difficulty }) => {
  const cfg = DIFFICULTY_CONFIG[difficulty];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
};

const CategoryBadge: React.FC<{ category: keyof typeof CATEGORY_CONFIG }> = ({ category }) => {
  const cfg = CATEGORY_CONFIG[category];
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
      <span>{cfg.icon}</span> {cfg.label}
    </span>
  );
};

const ProgressBar: React.FC<{ current: number; total: number }> = ({ current, total }) => (
  <div className="flex items-center gap-3">
    <span className="text-xs text-neutral-400 font-mono whitespace-nowrap">Q {current}/{total}</span>
    <div className="flex gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 w-6 rounded-full transition-all duration-500 ${
            i < current ? 'bg-blue-600' : 'bg-neutral-700'
          }`}
        />
      ))}
    </div>
  </div>
);

// ── Timer ──────────────────────────────────────────────────────────────────────
const Timer: React.FC<{ running: boolean }> = ({ running }) => {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return (
    <div className="flex items-center gap-1.5 text-neutral-400 text-sm font-mono">
      <Clock size={14} />
      {mm}:{ss}
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────────────
export const CodingTestPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [phase, setPhase]                     = useState<Phase>('loading');
  const [sessionId, setSessionId]             = useState<string | null>(null);
  const [question, setQuestion]               = useState<Question | null>(null);
  const [questionNumber, setQuestionNumber]   = useState(1);
  const [language, setLanguage]               = useState<SupportedLanguage>('python');
  const [code, setCode]                       = useState(STARTER_CODE);
  const [submitting, setSubmitting]           = useState(false);
  const [submitResponse, setSubmitResponse]   = useState<SubmitResponse | null>(null);
  const [finalScore, setFinalScore]           = useState<number | null>(null);
  const [errorMsg, setErrorMsg]               = useState('');
  const [showDescription, setShowDescription] = useState(true);
  const [advancing, setAdvancing]             = useState(false);

  // Track question IDs we've already submitted (for UX guard)
  const submittedIds = useRef<Set<string>>(new Set());

  // Real-time Socket.IO sync ref
  const socketRef = useRef<any>(null);

  const getInitialCode = (q: Question | null, lang: SupportedLanguage) => {
    if (!q) return DEFAULT_STARTER_TEMPLATES[lang];
    if (q.starterTemplates && q.starterTemplates[lang]) {
      return q.starterTemplates[lang]!;
    }
    if (lang === 'python' && q.starterCode) {
      return q.starterCode;
    }
    return DEFAULT_STARTER_TEMPLATES[lang];
  };

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    const newTemplate = getInitialCode(question, newLang);
    setCode(newTemplate);
    if (socketRef.current && sessionId) {
      socketRef.current.emit('code-change', {
        roomId: sessionId,
        code: newTemplate,
        language: newLang,
      });
    }
  };

  // ── Socket.IO Real-time Connection for Assessment Sync ────────────────────────
  useEffect(() => {
    if (!sessionId) return;
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    try {
      const socket = io('/', {
        auth: { token, userName: user?.name || 'Candidate' },
        transports: ['websocket', 'polling'],
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('join-room', {
          roomId: sessionId,
          interviewId: sessionId,
          roomType: 'coding',
          isRecruiter: false,
        });
      });

      socket.on('code-change', ({ code: incomingCode, language: incomingLang }: { code?: string; language?: SupportedLanguage }) => {
        if (incomingCode !== undefined) {
          setCode(incomingCode);
        }
        if (incomingLang !== undefined) {
          setLanguage(incomingLang);
        }
      });

      return () => {
        socket.disconnect();
      };
    } catch (e) {
      console.warn('[CodingTestPage] Socket connection error:', e);
    }
  }, [sessionId]);

  const handleCodeChange = (val: string | undefined) => {
    const newCode = val ?? '';
    setCode(newCode);
    if (socketRef.current && sessionId) {
      socketRef.current.emit('code-change', {
        roomId: sessionId,
        code: newCode,
        language,
      });
    }
  };

  // ── Start session on mount ───────────────────────────────────────────────────
  useEffect(() => {
    if (!jobId) { setErrorMsg('No job ID provided.'); setPhase('error'); return; }
    startSession();
  }, [jobId]);

  const startSession = async () => {
    setPhase('loading');
    try {
      const res = await apiRequest('/coding-test/start', 'POST', { jobId });
      setSessionId(res.sessionId);
      setQuestion(res.question);
      setQuestionNumber(1);
      setCode(getInitialCode(res.question, language));
      setPhase('question');
    } catch (err: any) {
      // If an in-progress session already exists, try to resume it
      if (err?.sessionId) {
        await resumeSession(err.sessionId);
      } else {
        setErrorMsg(err?.message || 'Failed to start test session.');
        setPhase('error');
      }
    }
  };

  const resumeSession = async (sid: string) => {
    try {
      setSessionId(sid);
      const res = await apiRequest(`/coding-test/${sid}/next`, 'GET');
      if (res.done) { setFinalScore(res.finalScore ?? 0); setPhase('completed'); return; }
      setQuestion(res.question);
      setQuestionNumber(res.questionNumber);
      setCode(getInitialCode(res.question, language));
      setPhase('question');
    } catch {
      setErrorMsg('Failed to resume session.');
      setPhase('error');
    }
  };

  // ── Submit answer ─────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!sessionId || !question || submitting) return;
    if (submittedIds.current.has(question._id)) return;

    setErrorMsg('');
    setSubmitting(true);
    try {
      const res: SubmitResponse = await apiRequest(
        `/coding-test/${sessionId}/submit`,
        'POST',
        { questionId: question._id, submittedCode: code, language }
      );
      submittedIds.current.add(question._id);
      setSubmitResponse(res);

      // Emit real-time adaptive test event via Socket.IO
      if (socketRef.current && sessionId) {
        socketRef.current.emit('adaptive-test-event', {
          sessionId,
          score: res.score,
          passed: res.passed,
          sessionComplete: res.sessionComplete,
          questionNumber,
          nextDifficulty: res.nextDifficulty,
        });
      }

      if (res.sessionComplete) {
        setFinalScore(res.finalScore ?? res.score);
        setPhase('completed');
      } else {
        setPhase('result_feedback');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [sessionId, question, code, submitting, questionNumber, language]);

  // ── Fetch next question ───────────────────────────────────────────────────────
  const handleNext = async () => {
    if (!sessionId || advancing) return;
    setAdvancing(true);
    try {
      const res = await apiRequest(`/coding-test/${sessionId}/next`, 'GET');
      if (res.done) {
        setFinalScore(res.finalScore ?? 0);
        setPhase('completed');
      } else {
        setQuestion(res.question);
        setQuestionNumber(res.questionNumber);
        setCode(getInitialCode(res.question, language));
        setSubmitResponse(null);
        setPhase('question');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to fetch next question.');
    } finally {
      setAdvancing(false);
    }
  };

  // ── Keyboard shortcut: Ctrl+Enter to submit ───────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && phase === 'question') {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, handleSubmit]);

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Loading
  // ─────────────────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-[#07000F] flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-2 border-blue-500/30 flex items-center justify-center">
            <Code2 size={36} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="absolute inset-0 rounded-full border-t-2 border-blue-500 dark:border-blue-400 animate-spin" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-1">Preparing Your Test</h2>
          <p className="text-neutral-400 text-sm">Selecting a question from our question bank…</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Error
  // ─────────────────────────────────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <div className="min-h-screen bg-[#07000F] flex flex-col items-center justify-center gap-6 px-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <AlertTriangle size={32} className="text-red-400" />
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold text-white mb-2">Something Went Wrong</h2>
          <p className="text-neutral-400 text-sm mb-6">{errorMsg}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Completed
  // ─────────────────────────────────────────────────────────────────────────────
  if (phase === 'completed') {
    const score = finalScore ?? 0;
    const grade = score >= 80 ? { label: 'Excellent', color: 'text-emerald-400', glow: 'shadow-emerald-500/30' }
                : score >= 60 ? { label: 'Good',      color: 'text-yellow-400',  glow: 'shadow-yellow-500/30'  }
                : score >= 40 ? { label: 'Fair',       color: 'text-orange-400',  glow: 'shadow-orange-500/30'  }
                :               { label: 'Needs Work', color: 'text-red-400',     glow: 'shadow-red-500/30'     };

    return (
      <div className="min-h-screen bg-[#07000F] hex-pattern flex flex-col items-center justify-center px-4 py-12">
        {/* Glowing score ring */}
        <div className={`relative w-44 h-44 mb-8`}>
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(37,99,235,0.15)" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="44" fill="none"
              stroke="url(#scoreGrad)" strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 44}`}
              strokeDashoffset={`${2 * Math.PI * 44 * (1 - score / 100)}`}
              style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)' }}
            />
            <defs>
              <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#60A5FA" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Trophy size={20} className="text-blue-600 dark:text-blue-400 mb-0.5" />
            <span className={`text-4xl font-black ${grade.color}`}>{score}%</span>
            <span className="text-xs text-neutral-500 font-medium">{grade.label}</span>
          </div>
        </div>

        <div className="text-center max-w-md mb-10">
          <h1 className="text-3xl font-black mb-2">
            <span className="gradient-text">Test Complete!</span>
          </h1>
          <p className="text-neutral-400">
            You answered {MAX_QUESTIONS} adaptive questions. Your final score has been submitted to the recruiter.
          </p>
        </div>

        {/* Score breakdown */}
        <div className="grid grid-cols-3 gap-4 mb-10 w-full max-w-sm">
          {[
            { label: 'Final Score',  value: `${score}%`,         icon: <BarChart3 size={18} /> },
            { label: 'Questions',    value: `${MAX_QUESTIONS}`,   icon: <BookOpen size={18} /> },
            { label: 'Grade',        value: grade.label,          icon: <Trophy size={18} />   },
          ].map(item => (
            <div key={item.label} className="glass-card rounded-xl p-4 text-center">
              <div className="text-blue-600 dark:text-blue-400 flex justify-center mb-1">{item.icon}</div>
              <div className="font-bold text-white text-lg leading-tight">{item.value}</div>
              <div className="text-xs text-neutral-500 mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate(-1)}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Question + Result Feedback (split-pane layout)
  // ─────────────────────────────────────────────────────────────────────────────
  const isResultPhase = phase === 'result_feedback';

  return (
    <div className="w-full min-h-screen bg-[#07000F] flex flex-col overflow-hidden">

      {/* ── Top Nav Bar ─────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-slate-700 bg-[#0D0117]/90 backdrop-blur-md shrink-0">
        {/* Left: Logo + title */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center">
            <Code2 size={14} className="text-white" />
          </div>
          <span className="font-bold text-sm text-white">Adaptive Python Test</span>
        </div>

        {/* Centre: Progress */}
        <ProgressBar current={questionNumber} total={MAX_QUESTIONS} />

        {/* Right: Difficulty + Timer */}
        <div className="flex items-center gap-4">
          {question && <DifficultyBadge difficulty={question.difficulty} />}
          <Timer running={phase === 'question' && !submitting} />
        </div>
      </header>

      {/* ── Main Split Layout ────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT PANE — Question Description */}
        <aside className="w-[38%] min-w-[320px] max-w-[480px] flex flex-col border-r border-slate-700 overflow-hidden bg-[#0a001a]/40">

          {/* Question header */}
          <div className="px-6 pt-5 pb-4 border-b border-slate-700 shrink-0">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h2 className="text-lg font-bold text-white leading-snug">
                {question?.title}
              </h2>
              <button
                onClick={() => setShowDescription(v => !v)}
                className="shrink-0 p-1.5 rounded-md text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-colors"
                title={showDescription ? 'Hide description' : 'Show description'}
              >
                {showDescription ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {question && <DifficultyBadge difficulty={question.difficulty} />}
              {question && <CategoryBadge category={question.category} />}
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

            {/* Description */}
            {showDescription && question && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen size={14} className="text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Problem</span>
                </div>
                <div className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap bg-[#0D0117]/60 rounded-xl p-4 border border-slate-700">
                  {question.description}
                </div>
              </div>
            )}

            {/* Visible Test Cases */}
            {question && question.visibleTestCases.length > 0 && !isResultPhase && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Terminal size={14} className="text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Examples</span>
                </div>
                <div className="space-y-3">
                  {question.visibleTestCases.map((tc, i) => (
                    <div key={i} className="rounded-xl border border-slate-700 overflow-hidden">
                      <div className="grid grid-cols-2 divide-x divide-slate-700">
                        <div className="p-3">
                          <p className="text-[10px] text-neutral-500 font-semibold uppercase mb-1.5">Input</p>
                          <pre className="text-xs text-neutral-300 font-mono whitespace-pre-wrap break-all">
                            {tc.input || '(no input)'}
                          </pre>
                        </div>
                        <div className="p-3">
                          <p className="text-[10px] text-neutral-500 font-semibold uppercase mb-1.5">Expected Output</p>
                          <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap break-all">
                            {tc.expectedOutput}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── RESULT FEEDBACK PANEL ────────────────────────────────────── */}
            {isResultPhase && submitResponse && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">

                {/* Overall verdict */}
                <div className={`flex items-center gap-3 p-4 rounded-xl border ${
                  submitResponse.passed
                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/25 text-red-400'
                }`}>
                  {submitResponse.passed
                    ? <CheckCircle size={22} />
                    : <XCircle size={22} />}
                  <div>
                    <p className="font-bold text-base">
                      {submitResponse.passed ? 'All Tests Passed!' : 'Some Tests Failed'}
                    </p>
                    <p className="text-xs opacity-75">Score: {submitResponse.score}%</p>
                  </div>
                  <span className="ml-auto text-2xl font-black">{submitResponse.score}%</span>
                </div>

                {/* Hidden test summary */}
                <div className="glass-card rounded-xl p-4">
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Hidden Tests</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-700"
                        style={{ width: `${(submitResponse.hiddenTestSummary.passed / submitResponse.hiddenTestSummary.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-mono text-white whitespace-nowrap">
                      {submitResponse.hiddenTestSummary.passed}/{submitResponse.hiddenTestSummary.total}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">
                    {submitResponse.hiddenTestSummary.failed > 0
                      ? `${submitResponse.hiddenTestSummary.failed} hidden case${submitResponse.hiddenTestSummary.failed > 1 ? 's' : ''} failed`
                      : 'All hidden cases passed ✓'}
                  </p>
                </div>

                {/* Visible test case results */}
                <div>
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Visible Test Results</p>
                  <div className="space-y-2">
                    {submitResponse.visibleTestResults.map((r, i) => (
                      <div
                        key={i}
                        className={`rounded-xl border p-3 ${
                          r.passed
                            ? 'bg-emerald-500/5 border-emerald-500/20'
                            : 'bg-red-500/5 border-red-500/20'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {r.passed
                            ? <CheckCircle size={13} className="text-emerald-400 shrink-0" />
                            : <XCircle size={13} className="text-red-400 shrink-0" />}
                          <span className="text-xs font-semibold text-neutral-300">Case {i + 1}</span>
                          {r.errorType && (
                            <span className="ml-auto text-[10px] text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">
                              {r.errorType}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                          <div>
                            <p className="text-neutral-600 mb-0.5">Input</p>
                            <pre className="text-neutral-400 whitespace-pre-wrap break-all">{r.input || '(empty)'}</pre>
                          </div>
                          <div>
                            <p className={`mb-0.5 ${r.passed ? 'text-emerald-600' : 'text-red-600'}`}>
                              {r.passed ? 'Output ✓' : 'Your Output'}
                            </p>
                            <pre className={`whitespace-pre-wrap break-all ${r.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                              {r.actualOutput || '(no output)'}
                            </pre>
                            {!r.passed && (
                              <>
                                <p className="text-neutral-600 mt-1 mb-0.5">Expected</p>
                                <pre className="text-emerald-400 whitespace-pre-wrap break-all">{r.expectedOutput}</pre>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Adaptive transition hint */}
                {submitResponse.nextDifficulty && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600 dark:text-blue-400">
                    <Zap size={13} />
                    <span>
                      Next question: <strong>{submitResponse.nextDifficulty.replace('_', ' ')}</strong>
                      {submitResponse.nextCategory ? ` · ${CATEGORY_CONFIG[submitResponse.nextCategory as keyof typeof CATEGORY_CONFIG]?.label ?? submitResponse.nextCategory}` : ''}
                    </span>
                  </div>
                )}

                {/* Next button */}
                <button
                  onClick={handleNext}
                  disabled={advancing}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl font-semibold text-sm transition-all duration-300 disabled:opacity-50"
                >
                  {advancing
                    ? <><Loader2 size={16} className="animate-spin" /> Loading…</>
                    : <><ArrowRight size={16} /> Next Question</>}
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* RIGHT PANE — Monaco Editor + Actions */}
        <main className="flex-1 flex flex-col overflow-hidden">

          {/* Editor toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700 bg-[#0a001a]/20 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400 font-mono font-medium">
                {language === 'python' ? 'solution.py' :
                 language === 'javascript' ? 'solution.js' :
                 language === 'typescript' ? 'solution.ts' :
                 language === 'java' ? 'Solution.java' : 'solution.cpp'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
                disabled={isResultPhase}
                className="text-[11px] bg-neutral-800/80 text-neutral-200 border border-slate-600 rounded px-2 py-0.5 outline-none cursor-pointer hover:border-slate-500 transition"
              >
                <option value="python">Python 3</option>
                <option value="javascript">JavaScript (Node.js)</option>
                <option value="typescript">TypeScript</option>
                <option value="java">Java (JDK 21)</option>
                <option value="cpp">C++ (C++17)</option>
              </select>
              {!isResultPhase && (
                <span className="text-[10px] text-neutral-500 hidden sm:inline">
                  Ctrl+Enter to submit
                </span>
              )}
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage="python"
              language={language === 'java' ? 'java' : (language === 'cpp' ? 'cpp' : (language === 'typescript' ? 'typescript' : (language === 'javascript' ? 'javascript' : 'python')))}
              value={code}
              onChange={handleCodeChange}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
                fontLigatures: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                glyphMargin: false,
                folding: true,
                wordWrap: 'on',
                readOnly: isResultPhase,
                automaticLayout: true,
                padding: { top: 16, bottom: 16 },
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                renderLineHighlight: 'line',
                bracketPairColorization: { enabled: true },
              }}
            />
          </div>

          {/* Error Alert Banner in Question Phase */}
          {!isResultPhase && errorMsg && (
            <div className="shrink-0 mx-5 my-2 p-3.5 bg-red-950/80 border border-red-500/50 rounded-xl flex items-center justify-between text-red-300 text-sm shadow-lg shadow-red-950/40">
              <div className="flex items-center gap-2.5">
                <AlertTriangle size={18} className="shrink-0 text-red-400" />
                <span className="font-medium">{errorMsg}</span>
              </div>
              <button
                onClick={() => setErrorMsg('')}
                className="text-xs text-red-400 hover:text-white bg-red-900/40 hover:bg-red-800/60 px-2.5 py-1 rounded-md transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Submit footer */}
          {!isResultPhase && (
            <div className="shrink-0 px-5 py-3.5 border-t border-slate-700 bg-[#0a001a]/40 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <RefreshCw size={12} />
                <span>Code auto-saves as you type</span>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting || !code.trim() || code.trim() === STARTER_CODE.trim()}
                id="submit-code-btn"
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg font-semibold text-sm transition-all duration-300 shadow-md shadow-blue-500/25 hover:shadow-blue-500/35 disabled:opacity-40 disabled:cursor-not-allowed btn-glow"
              >
                {submitting
                  ? <><Loader2 size={16} className="animate-spin" /> Running Tests…</>
                  : <><ChevronRight size={16} /> Submit Answer</>}
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CodingTestPage;
