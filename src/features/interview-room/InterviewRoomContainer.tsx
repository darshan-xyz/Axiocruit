import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VideoOff, Users, Code } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { apiRequest } from '@/utils/api';
import { useProctoring } from '@/hooks/useProctoring';
import { useTheme } from '@/core/ThemeContext';
import { useInterviewSignaling } from './useInterviewSignaling';
import { WebRTCVideoGrid } from './WebRTCVideoGrid';
import { MonacoCodeEditor } from './MonacoCodeEditor';
import { AdaptiveTestPanel } from './AdaptiveTestPanel';
import { ProctoringHUD } from './ProctoringHUD';
import { WaitingRoom } from './WaitingRoom';
import { AdmissionRequestsOverlay } from './AdmissionRequestsOverlay';
import { EndInterviewModal } from './EndInterviewModal';
import { RoomControlBar } from './RoomControlBar';

export const InterviewRoomContainer: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addToast, ToastContainer } = useToast();
    const { isDark } = useTheme();

    const [interview, setInterview] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isEditorFocused, setIsEditorFocused] = useState(false);
    const [isParticipantDropdownOpen, setIsParticipantDropdownOpen] = useState(false);
    const participantDropdownRef = useRef<HTMLDivElement>(null);

    const [showEndInterviewModal, setShowEndInterviewModal] = useState(false);
    const [completingInterview, setCompletingInterview] = useState(false);
    const [interviewerRemarks, setInterviewerRemarks] = useState('');

    const editorContainerRef = useRef<HTMLDivElement>(null);

    // Starter code
    const getStarterCode = (name = 'Candidate') =>
        `# Welcome to the Procruit Interview Sandbox, ${name}!\n# Write your code here...\n\nprint("Hello World!")\n`;

    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;
    const roleBasedIsHost =
        user?.role === 'RECRUITER' ||
        user?.role === 'recruiter' ||
        user?.role === 'organization' ||
        user?.role === 'FREELANCER' ||
        user?.role === 'freelancer';
    const isRecruiter = interview?.isUserHost ?? roleBasedIsHost;

    // Headless signaling hook
    const signaling = useInterviewSignaling({
        interviewId: id,
        interview,
        isRecruiter,
        initialCode: getStarterCode('Candidate'),
        initialLanguage: 'python',
    });

    // Proctoring Hook (Candidate only)
    const { isConnected: proctorWsConnected, flushLogs } = useProctoring({
        interviewId: interview?._id || '',
        videoRef: signaling.localVideoRef,
        editorContainerRef,
        enabled: !isRecruiter && !!interview,
        isVideoOff: signaling.isVideoOff,
        captureIntervalMs: 500,
        socketRef: signaling.socketRef,
        roomId: interview?.meetingId || '',
    });

    // Close participant dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (participantDropdownRef.current && !participantDropdownRef.current.contains(e.target as Node)) {
                setIsParticipantDropdownOpen(false);
            }
        };
        if (isParticipantDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isParticipantDropdownOpen]);

    // Fetch interview details
    useEffect(() => {
        const fetchInterview = async () => {
            try {
                const data = await apiRequest(`/interviews/${id}`);
                setInterview(data);
                if (signaling.code === getStarterCode('Candidate')) {
                    const candidateName = data.candidateId?.name || 'Candidate';
                    signaling.setCode(getStarterCode(candidateName));
                }
                setLoading(false);
            } catch (err: any) {
                setError(err.message || 'Failed to load interview');
                setLoading(false);
            }
        };
        fetchInterview();
    }, [id]);

    // End call handler
    const handleEndCall = async () => {
        if (isRecruiter) {
            setShowEndInterviewModal(true);
            return;
        }

        if (!isRecruiter && interview?._id) {
            try {
                await flushLogs();
            } catch (err) {
                console.error('Failed to flush logs:', err);
            }
        }

        if (signaling.localStreamRef.current) {
            signaling.localStreamRef.current.getTracks().forEach((t) => t.stop());
        }
        if (signaling.screenStreamRef.current) {
            signaling.screenStreamRef.current.getTracks().forEach((t) => t.stop());
        }
        signaling.peerConnectionsRef.current.forEach((pc) => pc.close());
        signaling.peerConnectionsRef.current.clear();
        if (signaling.socketRef.current) {
            signaling.socketRef.current.disconnect();
        }

        const dashboardPath = user?.role === 'RECRUITER' ? '/recruiter/schedule' : '/candidate/interviews';
        navigate(dashboardPath);
    };

    // Just leave call without completing
    const handleJustLeaveCall = async () => {
        setShowEndInterviewModal(false);
        if (signaling.localStreamRef.current) signaling.localStreamRef.current.getTracks().forEach((t) => t.stop());
        if (signaling.screenStreamRef.current) signaling.screenStreamRef.current.getTracks().forEach((t) => t.stop());
        signaling.peerConnectionsRef.current.forEach((pc) => pc.close());
        signaling.peerConnectionsRef.current.clear();
        if (signaling.socketRef.current) signaling.socketRef.current.disconnect();

        const isFreelancer = user?.role === 'INTERVIEWER' || user?.role === 'freelancer';
        navigate(isFreelancer ? '/interviewer' : '/recruiter/schedule');
    };

    // Complete interview & trigger AI report
    const handleCompleteInterview = async () => {
        if (!interview?._id) return;
        setCompletingInterview(true);

        try {
            if (signaling.socketRef.current && interview.meetingId) {
                signaling.socketRef.current.emit('end-interview', { meetingId: interview.meetingId });
            }

            if (signaling.localStreamRef.current) signaling.localStreamRef.current.getTracks().forEach((t) => t.stop());
            if (signaling.screenStreamRef.current) signaling.screenStreamRef.current.getTracks().forEach((t) => t.stop());
            signaling.peerConnectionsRef.current.forEach((pc) => pc.close());
            signaling.peerConnectionsRef.current.clear();

            await apiRequest(`/interviews/${interview._id}/complete`, 'POST', {
                interviewerRemarks: interviewerRemarks.trim(),
                codingTestSessionId: signaling.adaptiveSession?.sessionId || undefined,
            });

            addToast('success', '✅ Interview completed! AI report is generating in the background.');

            setTimeout(() => {
                if (signaling.socketRef.current) signaling.socketRef.current.disconnect();
                const isFreelancer = user?.role === 'INTERVIEWER' || user?.role === 'freelancer';
                navigate(isFreelancer ? '/interviewer' : '/recruiter/schedule');
            }, 800);
        } catch (err: any) {
            addToast('error', err.message || 'Failed to complete interview');
        } finally {
            setCompletingInterview(false);
            setShowEndInterviewModal(false);
        }
    };

    // Start adaptive test
    const handleStartAdaptiveTest = async () => {
        if (!interview || !interview.candidateId) return;
        try {
            signaling.setEvaluating(true);
            const res = await apiRequest('/coding-test/start', 'POST', {
                jobId: interview.jobId?._id,
                candidateId: interview.candidateId._id,
            });
            const sessionData = {
                sessionId: res.sessionId,
                currentQuestion: res.question,
                questionNumber: res.questionNumber,
                difficulty: res.currentDifficulty,
                status: 'in_progress',
                finalScore: null,
            };
            signaling.setAdaptiveSession(sessionData);
            signaling.setLastEvaluation(null);
            signaling.setIsCodingTestVisible(true);

            if (signaling.socketRef.current) {
                signaling.socketRef.current.emit('adaptive-test-event', {
                    sessionData,
                    evaluation: null,
                });
                if (interview.meetingId) {
                    signaling.socketRef.current.emit('coding-test-started-event', {
                        roomId: interview.meetingId,
                    });
                }
            }
            addToast('success', 'Adaptive test started');
        } catch (err: any) {
            addToast('error', err.message || 'Failed to start test');
        } finally {
            signaling.setEvaluating(false);
        }
    };

    // Submit and next question
    const handleSubmitAndNextAdaptiveTest = async () => {
        if (!signaling.adaptiveSession) return;
        try {
            signaling.setEvaluating(true);
            const submitRes = await apiRequest(`/coding-test/${signaling.adaptiveSession.sessionId}/submit`, 'POST', {
                questionId: signaling.adaptiveSession.currentQuestion._id,
                submittedCode: signaling.code,
            });

            const passed = submitRes.passed;
            addToast(passed ? 'success' : 'warning', passed ? 'All test cases passed!' : `Passed ${submitRes.score}% of test cases`);

            const nextRes = await apiRequest(`/coding-test/${signaling.adaptiveSession.sessionId}/next`);

            let newSessionData;
            if (nextRes.done) {
                newSessionData = { ...signaling.adaptiveSession, status: 'completed', finalScore: nextRes.finalScore };
                addToast('success', `Test Completed! Final Score: ${nextRes.finalScore}%`);
            } else {
                newSessionData = {
                    ...signaling.adaptiveSession,
                    currentQuestion: nextRes.question,
                    questionNumber: nextRes.questionNumber,
                    difficulty: nextRes.currentDifficulty,
                };
            }

            signaling.setAdaptiveSession(newSessionData);
            signaling.setLastEvaluation(submitRes);

            if (signaling.socketRef.current) {
                signaling.socketRef.current.emit('adaptive-test-event', {
                    sessionData: newSessionData,
                    evaluation: submitRes,
                });
            }
        } catch (err: any) {
            addToast('error', err.message || 'Failed to evaluate code');
        } finally {
            signaling.setEvaluating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-neutral-400">Loading interview room...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <VideoOff className="text-red-400" size={28} />
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-2">Cannot Join Interview</h2>
                    <p className="text-neutral-400 mb-6">{error}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (signaling.isWaitingForHost) {
        return (
            <WaitingRoom
                setLocalVideoRef={signaling.setLocalVideoRef}
                isMuted={signaling.isMuted}
                isVideoOff={signaling.isVideoOff}
                userName={user?.name || 'You'}
                onToggleMute={signaling.toggleMute}
                onToggleVideo={signaling.toggleVideo}
                onLeave={() => {
                    if (signaling.socketRef.current) signaling.socketRef.current.disconnect();
                    navigate(-1);
                }}
            />
        );
    }

    const totalConnected = signaling.remoteStreams.length + 1;

    return (
        <div className={`h-screen flex flex-col overflow-hidden ${isDark ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'}`}>
            <ToastContainer />

            {/* Top Bar */}
            <header className={`relative z-[100] h-14 flex items-center justify-between px-4 flex-shrink-0 backdrop-blur-sm border-b ${isDark ? 'bg-neutral-900/80 border-neutral-800' : 'bg-white/80 border-slate-200'}`}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-xs font-bold shadow-lg shadow-blue-500/20 text-white">
                        AI
                    </div>
                    <div>
                        <h1 className="text-sm font-semibold">
                            {interview?.jobId?.title ? `Interview: ${interview.jobId.title}` : 'Procruit Technical Interview'}
                        </h1>
                        <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                            {interview?.meetingId?.slice(0, 8)}... • {interview?.status}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 relative">
                    {/* View Coding Test Results Button */}
                    {isRecruiter && interview?.candidateId?._id && interview?.jobId?._id && (
                        <button
                            onClick={() => window.open(`#/recruiter/coding-test-result/${interview.jobId._id}/candidate/${interview.candidateId._id}`, '_blank')}
                            className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 rounded-full transition-colors shadow-lg shadow-blue-500/10 cursor-pointer"
                            title="View candidate's adaptive coding test performance"
                        >
                            <Code size={13} className="text-blue-600 dark:text-blue-400" />
                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Test Results</span>
                        </button>
                    )}

                    {/* Participant count */}
                    <div className="relative" ref={participantDropdownRef}>
                        <button
                            onClick={() => setIsParticipantDropdownOpen((prev) => !prev)}
                            className={`flex items-center gap-2 px-3 py-1 rounded-full cursor-pointer transition-all duration-200 ${
                                isParticipantDropdownOpen
                                    ? 'bg-neutral-700 border border-neutral-600 ring-1 ring-neutral-500/30'
                                    : 'bg-neutral-800 border border-neutral-700 hover:bg-neutral-700'
                            }`}
                            title="View Participants"
                        >
                            <Users size={12} className="text-neutral-400" />
                            <span className="text-xs text-neutral-300">
                                {totalConnected} participant{totalConnected !== 1 ? 's' : ''}
                            </span>
                        </button>

                        {isParticipantDropdownOpen && (
                            <div className="absolute left-0 top-full mt-2 w-64 max-h-80 overflow-y-auto bg-neutral-900/95 border border-neutral-700 rounded-xl shadow-2xl backdrop-blur-md z-[10000]">
                                <div className="sticky top-0 bg-neutral-900/95 backdrop-blur-md px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-white">In this call</span>
                                    <span className="text-[11px] text-neutral-500">{totalConnected}</span>
                                </div>
                                <div className="px-2 py-2 flex flex-col gap-1.5">
                                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-neutral-800/60 transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center flex-shrink-0 border border-neutral-700">
                                            <Users size={14} className="text-neutral-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium text-white truncate">{user?.name || 'You'}</p>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 font-medium">YOU</span>
                                            </div>
                                        </div>
                                    </div>
                                    {signaling.remoteStreams.map((rs, i) => (
                                        <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-neutral-800/60 transition-colors">
                                            <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center flex-shrink-0 border border-neutral-700">
                                                <Users size={14} className="text-neutral-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-neutral-300 truncate">{rs.userName}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {signaling.remoteStreams.length > 0 ? (
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            <span className="text-xs text-green-400">Live</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                            <span className="text-xs text-yellow-400">Waiting for participant...</span>
                        </div>
                    )}
                </div>

                {/* Proctoring HUD */}
                <ProctoringHUD
                    isRecruiter={isRecruiter}
                    proctorWsConnected={proctorWsConnected}
                    proctorAlerts={signaling.proctorAlerts}
                    isDark={isDark}
                />
            </header>

            {/* Main Dynamic View */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Host Admission Overlay */}
                {isRecruiter && (
                    <AdmissionRequestsOverlay
                        requests={signaling.admissionRequests}
                        onAdmit={signaling.admitCandidate}
                        onDeny={signaling.denyCandidate}
                    />
                )}

                {/* Monaco Collaborative IDE (Visible when coding test started) */}
                {signaling.isCodingTestVisible && (
                    <MonacoCodeEditor
                        code={signaling.code}
                        language={signaling.editorLanguage}
                        onChange={signaling.broadcastCodeChange}
                        isEditorFocused={isEditorFocused}
                        onToggleFocus={() => setIsEditorFocused(!isEditorFocused)}
                        editorContainerRef={editorContainerRef}
                        isDark={isDark}
                        isHost={isRecruiter}
                        adaptiveSession={signaling.adaptiveSession}
                        evaluating={signaling.evaluating}
                        onStartAdaptiveTest={handleStartAdaptiveTest}
                    >
                        <AdaptiveTestPanel
                            adaptiveSession={signaling.adaptiveSession}
                            lastEvaluation={signaling.lastEvaluation}
                            evaluating={signaling.evaluating}
                            isHost={isRecruiter}
                            onSubmitAndNext={handleSubmitAndNextAdaptiveTest}
                        />
                    </MonacoCodeEditor>
                )}

                {/* Video Area */}
                <WebRTCVideoGrid
                    localVideoRef={signaling.setLocalVideoRef}
                    remoteStreams={signaling.remoteStreams}
                    setRemoteVideoRef={signaling.setRemoteVideoRef}
                    isMuted={signaling.isMuted}
                    isVideoOff={signaling.isVideoOff}
                    isScreenSharing={signaling.isScreenSharing}
                    isCodingTestVisible={signaling.isCodingTestVisible}
                    isHost={isRecruiter}
                    userName={user?.name || 'You'}
                    onKickParticipant={signaling.kickParticipant}
                    onStartCodingTest={() => {
                        signaling.setIsCodingTestVisible(true);
                        if (signaling.socketRef.current && interview?.meetingId) {
                            signaling.socketRef.current.emit('coding-test-started-event', {
                                roomId: interview.meetingId,
                            });
                        }
                        addToast('info', '📝 Coding panel opened. Use "Start Adaptive Test" to begin the assessment.');
                    }}
                    isDark={isDark}
                />
            </div>

            {/* End Interview Modal */}
            <EndInterviewModal
                isOpen={showEndInterviewModal}
                remarks={interviewerRemarks}
                completing={completingInterview}
                onRemarksChange={setInterviewerRemarks}
                onComplete={handleCompleteInterview}
                onJustLeave={handleJustLeaveCall}
                onClose={() => setShowEndInterviewModal(false)}
            />

            {/* Floating Pill Controls */}
            <RoomControlBar
                isMuted={signaling.isMuted}
                isVideoOff={signaling.isVideoOff}
                isScreenSharing={signaling.isScreenSharing}
                isRecruiter={isRecruiter}
                remoteStreamsCount={signaling.remoteStreams.length}
                onToggleMute={signaling.toggleMute}
                onToggleVideo={signaling.toggleVideo}
                onToggleScreenShare={signaling.toggleScreenShare}
                onEndCall={handleEndCall}
                onQuickKick={
                    signaling.remoteStreams.length === 1
                        ? () => signaling.kickParticipant(signaling.remoteStreams[0].socketId)
                        : undefined
                }
                isDark={isDark}
            />
        </div>
    );
};

export default InterviewRoomContainer;
