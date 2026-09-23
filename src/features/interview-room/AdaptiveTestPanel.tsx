import React from 'react';
import { CheckCircle } from 'lucide-react';

export interface AdaptiveQuestion {
    _id: string;
    title: string;
    category: string;
    description: string;
}

export interface AdaptiveSession {
    sessionId: string;
    questionNumber: number;
    currentQuestion: AdaptiveQuestion;
    difficulty: string;
    status: 'in_progress' | 'completed';
    finalScore: number | null;
}

export interface EvaluationResult {
    passed: boolean;
    score: number;
}

export interface AdaptiveTestPanelProps {
    adaptiveSession: AdaptiveSession | null;
    lastEvaluation: EvaluationResult | null;
    evaluating: boolean;
    isHost: boolean;
    onSubmitAndNext: () => void;
}

export const AdaptiveTestPanel: React.FC<AdaptiveTestPanelProps> = ({
    adaptiveSession,
    lastEvaluation,
    evaluating,
    isHost,
    onSubmitAndNext,
}) => {
    if (!adaptiveSession) return null;

    if (adaptiveSession.status === 'completed') {
        return (
            <div className="bg-blue-500/10 border-b border-blue-500/30 p-4 shrink-0 flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                        <CheckCircle size={16} className="text-emerald-400" />
                        Test Completed
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1">
                        The candidate has finished the adaptive coding test.
                    </p>
                </div>
                <div className="text-right">
                    <span className="block text-xl font-black text-emerald-400">{adaptiveSession.finalScore}%</span>
                    <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Final Score</span>
                </div>
            </div>
        );
    }

    if (adaptiveSession.status === 'in_progress') {
        return (
            <div className="bg-neutral-800 border-b border-neutral-700 p-4 max-h-48 overflow-y-auto shrink-0 transition-all">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="font-bold text-white text-base">
                            Q{adaptiveSession.questionNumber}: {adaptiveSession.currentQuestion?.title}
                        </h3>
                        <div className="flex gap-2 text-[10px] mt-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400 uppercase font-bold border border-blue-500/30">
                                {adaptiveSession.difficulty?.replace('_', ' ')}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-neutral-700 text-neutral-300 border border-neutral-600">
                                {adaptiveSession.currentQuestion?.category}
                            </span>
                        </div>
                    </div>
                    {isHost && (
                        <button
                            onClick={onSubmitAndNext}
                            disabled={evaluating}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-semibold transition-colors disabled:opacity-50 shadow-md whitespace-nowrap"
                        >
                            {evaluating ? 'Evaluating...' : 'Submit & Next Question'}
                        </button>
                    )}
                </div>
                <p className="text-xs text-neutral-300 mt-2 whitespace-pre-wrap leading-relaxed">
                    {adaptiveSession.currentQuestion?.description}
                </p>

                {lastEvaluation && !lastEvaluation.passed && (
                    <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded p-2 text-xs text-red-200">
                        <strong className="text-red-400">Previous Result:</strong> Failed ({lastEvaluation.score}%). Next time, be sure to check logic and edge cases.
                    </div>
                )}
                {lastEvaluation && lastEvaluation.passed && (
                    <div className="mt-3 bg-green-500/10 border border-green-500/20 rounded p-2 text-xs text-green-200">
                        <strong className="text-green-400">Previous Result:</strong> Passed 100%!
                    </div>
                )}
            </div>
        );
    }

    return null;
};

export default AdaptiveTestPanel;
