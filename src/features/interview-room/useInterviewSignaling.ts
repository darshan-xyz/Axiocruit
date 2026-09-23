import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useToast } from '@/components/Toast';
import { apiRequest } from '@/utils/api';

const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

export interface PeerUser {
    socketId: string;
    userId: string;
    userName: string;
}

export interface RemoteStream {
    socketId: string;
    userId: string;
    userName: string;
    stream: MediaStream;
}

export interface UseInterviewSignalingProps {
    interviewId?: string;
    interview: any | null;
    isRecruiter: boolean;
    initialCode: string;
    initialLanguage: string;
    flushLogs?: () => Promise<void>;
}

export const useInterviewSignaling = ({
    interviewId,
    interview,
    isRecruiter,
    initialCode,
    initialLanguage,
    flushLogs,
}: UseInterviewSignalingProps) => {
    const navigate = useNavigate();
    const { addToast } = useToast();

    // Waiting Room & Admission Requests
    const [isWaitingForHost, setIsWaitingForHost] = useState(false);
    const [admissionRequests, setAdmissionRequests] = useState<PeerUser[]>([]);

    // Media states
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    // Dynamic layout & test visibility
    const [isCodingTestVisible, setIsCodingTestVisible] = useState(false);

    // Code & test states
    const [code, setCode] = useState<string>(initialCode);
    const [editorLanguage, setEditorLanguage] = useState<string>(initialLanguage);
    const [adaptiveSession, setAdaptiveSession] = useState<any>(null);
    const [lastEvaluation, setLastEvaluation] = useState<any>(null);
    const [evaluating, setEvaluating] = useState(false);

    // Proctoring alerts
    const [proctorAlerts, setProctorAlerts] = useState<Array<any>>([]);

    // Remote streams
    const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);

    // Refs
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
    const localStreamRef = useRef<MediaStream | null>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);
    const isInitiatorRef = useRef(false);
    const remoteVideoRefs = useRef<Map<string, HTMLVideoElement | null>>(new Map());

    const codeRef = useRef<string>(code);
    const languageRef = useRef<string>(editorLanguage);
    const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => { codeRef.current = code; }, [code]);
    useEffect(() => { languageRef.current = editorLanguage; }, [editorLanguage]);

    const admittedRef = useRef(false);
    const pendingPeersRef = useRef<PeerUser[]>([]);
    const isHostRef = useRef(isRecruiter);
    isHostRef.current = isRecruiter;

    // User info
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;

    // Create Peer Connection
    const createPeerConnection = useCallback((remoteSocketId: string, peerUser: PeerUser, socket: Socket) => {
        if (peerConnectionsRef.current.has(remoteSocketId)) {
            return peerConnectionsRef.current.get(remoteSocketId)!;
        }

        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnectionsRef.current.set(remoteSocketId, pc);

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => {
                pc.addTrack(track, localStreamRef.current!);
            });
        }

        pc.ontrack = (event) => {
            if (event.streams[0]) {
                const incomingStream = event.streams[0];
                setRemoteStreams((prev) => {
                    const exists = prev.find((rs) => rs.socketId === remoteSocketId);
                    if (exists) {
                        return prev.map((rs) =>
                            rs.socketId === remoteSocketId ? { ...rs, stream: incomingStream } : rs
                        );
                    }
                    return [
                        ...prev,
                        {
                            socketId: remoteSocketId,
                            userId: peerUser.userId,
                            userName: peerUser.userName,
                            stream: incomingStream,
                        },
                    ];
                });

                const videoEl = remoteVideoRefs.current.get(remoteSocketId);
                if (videoEl) {
                    videoEl.srcObject = incomingStream;
                }
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice-candidate', {
                    candidate: event.candidate,
                    to: remoteSocketId,
                });
            }
        };

        pc.oniceconnectionstatechange = () => {
            if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
                addToast('error', 'Connection to peer lost');
                setRemoteStreams((prev) => prev.filter((rs) => rs.socketId !== remoteSocketId));
                peerConnectionsRef.current.delete(remoteSocketId);
            }
        };

        return pc;
    }, [addToast]);

    // Initialize media & socket
    useEffect(() => {
        if (!interview) return;

        let isMounted = true;
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        const connectToPeers = (peers: PeerUser[], socket: Socket) => {
            isInitiatorRef.current = true;
            peers.forEach((peer) => {
                const pc = createPeerConnection(peer.socketId, peer, socket);
                pc.createOffer()
                    .then((offer) => pc.setLocalDescription(offer))
                    .then(() => {
                        socket.emit('offer', {
                            offer: pc.localDescription,
                            to: peer.socketId,
                        });
                    })
                    .catch((err) => console.error('Error creating offer:', err));
            });
        };

        const initRoom = async () => {
            const isHost = interview.isUserHost === true || isRecruiter;
            if (isHost) {
                admittedRef.current = true;
                isHostRef.current = true;
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                });
                localStreamRef.current = stream;
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
            } catch (err) {
                addToast('error', 'Camera/microphone access denied. You can still join but others will not see/hear you.');
                localStreamRef.current = new MediaStream();
            }

            const socket = io('/', {
                auth: { token, userName: user?.name },
                transports: ['websocket', 'polling'],
            });
            socketRef.current = socket;

            socket.on('connect', () => {
                if (!isMounted) return;
                addToast('info', 'Connected to interview server');
                socket.emit('join-room', {
                    roomId: interview.meetingId,
                    userId: user?._id || user?.id,
                    userName: user?.name || 'Unknown User',
                    role: isHost ? 'host' : (user?.role || 'CANDIDATE'),
                });
            });

            socket.on('waiting-for-host', () => {
                if (!isMounted) return;
                if (isHostRef.current) {
                    admittedRef.current = true;
                    setIsWaitingForHost(false);
                    return;
                }
                setIsWaitingForHost(true);
            });

            socket.on('admitted', () => {
                if (!isMounted) return;
                admittedRef.current = true;
                setIsWaitingForHost(false);
                addToast('success', '✅ You have been admitted to the interview!');
                socket.emit('request-editor-state', { roomId: interview.meetingId });

                if (pendingPeersRef.current.length > 0) {
                    connectToPeers(pendingPeersRef.current, socket);
                    pendingPeersRef.current = [];
                }
            });

            socket.on('admission-denied', () => {
                if (!isMounted) return;
                addToast('error', 'Your request to join was denied');
                socket.disconnect();
                const dashboardPath = isRecruiter ? '/recruiter/dashboard' : '/candidate/dashboard';
                navigate(dashboardPath);
            });

            socket.on('admission-request', (requestingUser: PeerUser) => {
                if (!isMounted) return;
                setAdmissionRequests(prev => {
                    if (prev.find(u => u.socketId === requestingUser.socketId)) return prev;
                    return [...prev, requestingUser];
                });
            });

            socket.on('admission-canceled', ({ socketId }) => {
                if (!isMounted) return;
                setAdmissionRequests(prev => prev.filter(u => u.socketId !== socketId));
            });

            socket.on('connect_error', (err) => {
                if (!isMounted) return;
                addToast('error', `Connection error: ${err.message}`);
            });

            socket.on('room-users', (users: PeerUser[]) => {
                if (!isMounted || users.length === 0) return;
                if (admittedRef.current) {
                    connectToPeers(users, socket);
                } else {
                    pendingPeersRef.current = [...pendingPeersRef.current, ...users];
                }
            });

            socket.on('user-connected', (peer: PeerUser) => {
                if (!isMounted) return;
                addToast('success', `${peer.userName} has joined the interview`);
                createPeerConnection(peer.socketId, peer, socket);
            });

            socket.on('offer', async ({ offer, from, userId, userName }) => {
                if (!isMounted) return;
                try {
                    const peerUser: PeerUser = { socketId: from, userId, userName };
                    const pc = createPeerConnection(from, peerUser, socket);
                    await pc.setRemoteDescription(new RTCSessionDescription(offer));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    socket.emit('answer', { answer, to: from });
                } catch (err) {
                    console.error('Error handling offer:', err);
                }
            });

            socket.on('answer', async ({ answer, from }) => {
                if (!isMounted) return;
                try {
                    const pc = peerConnectionsRef.current.get(from);
                    if (pc) {
                        await pc.setRemoteDescription(new RTCSessionDescription(answer));
                    }
                } catch (err) {
                    console.error('Error handling answer:', err);
                }
            });

            socket.on('ice-candidate', async ({ candidate, from }) => {
                if (!isMounted) return;
                try {
                    const pc = peerConnectionsRef.current.get(from);
                    if (pc && candidate) {
                        await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    }
                } catch (err) {
                    console.error('Error handling ICE candidate:', err);
                }
            });

            socket.on('code-change', ({ code: incomingCode, language }) => {
                if (!isMounted) return;
                setCode(incomingCode);
                if (language !== undefined) setEditorLanguage(language);
            });

            socket.on('language-change', ({ language: incomingLang }) => {
                if (!isMounted) return;
                setEditorLanguage(incomingLang);
            });

            socket.on('provide-editor-state', ({ requesterId }) => {
                if (!isMounted) return;
                socket.emit('editor-state-response', {
                    targetSocketId: requesterId,
                    code: codeRef.current,
                    language: languageRef.current,
                });
            });

            socket.on('editor-state-sync', ({ code: syncedCode, language: syncedLang }) => {
                if (!isMounted) return;
                setCode(syncedCode);
                setEditorLanguage(syncedLang);
                addToast('info', 'Editor re-synced with the latest session state.');
            });

            socket.io.on('reconnect', () => {
                if (!isMounted || !interview) return;
                socket.emit('join-room', {
                    roomId: interview.meetingId,
                    userId: user?._id || user?.id,
                    userName: user?.name || 'Unknown User',
                    role: isHostRef.current ? 'host' : (user?.role || 'CANDIDATE'),
                });
                socket.emit('request-editor-state', { roomId: interview.meetingId });
            });

            socket.on('user-disconnected', ({ socketId, userName: disconnectedName }) => {
                if (!isMounted) return;
                addToast('info', `${disconnectedName} has left the interview`);
                const pc = peerConnectionsRef.current.get(socketId);
                if (pc) {
                    pc.close();
                    peerConnectionsRef.current.delete(socketId);
                }
                setRemoteStreams((prev) => prev.filter((rs) => rs.socketId !== socketId));
            });

            socket.on('adaptive-test-sync', (data: any) => {
                if (!isMounted) return;
                if (data.sessionData) setAdaptiveSession(data.sessionData);
                if (data.evaluation !== undefined) setLastEvaluation(data.evaluation);
            });

            socket.on('proctor-event', (eventData: any) => {
                if (!isMounted) return;
                try {
                    const alert = {
                        type: eventData.type,
                        detail: eventData.detail,
                        timestamp: eventData.timestamp,
                        candidateName: eventData.candidateName,
                    };
                    setProctorAlerts(prev => [...prev, alert]);
                } catch (err) {
                    console.error('[useInterviewSignaling] Error processing proctor-event:', err);
                }
            });

            socket.on('kicked-from-room', async () => {
                if (!isMounted) return;
                addToast('error', 'You have been removed from the session by the host.');

                if (!isHostRef.current && flushLogs) {
                    try { await flushLogs(); } catch (e) { console.error('Failed to flush logs on kick', e); }
                }

                peerConnectionsRef.current.forEach((pc) => pc.close());
                peerConnectionsRef.current.clear();
                if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop());
                if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach((t) => t.stop());
                if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
                redirectTimeoutRef.current = setTimeout(() => {
                    if (!isMounted) return;
                    const dashboardPath = user?.role === 'RECRUITER' ? '/recruiter/dashboard' : '/candidate/dashboard';
                    navigate(dashboardPath);
                }, 1500);
            });

            socket.on('interview-ended', async ({ message }) => {
                if (!isMounted) return;
                addToast('info', `✅ ${message || 'This interview has been completed.'}`);

                if (!isHostRef.current && flushLogs) {
                    try { await flushLogs(); } catch (e) { console.error('Failed to flush logs on end', e); }
                }

                peerConnectionsRef.current.forEach((pc) => pc.close());
                peerConnectionsRef.current.clear();
                if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop());
                if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach((t) => t.stop());
                socket.disconnect();

                if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
                redirectTimeoutRef.current = setTimeout(() => {
                    if (!isMounted) return;
                    const isFreelancer = user?.role === 'INTERVIEWER' || user?.role === 'freelancer';
                    const dashboardPath = isFreelancer
                        ? '/interviewer'
                        : (user?.role === 'RECRUITER' ? '/recruiter/schedule' : '/candidate/interviews');
                    navigate(dashboardPath);
                }, 2000);
            });

            socket.on('coding-test-started', () => {
                if (!isMounted) return;
                setIsCodingTestVisible(true);
                addToast('info', '📝 Coding test has been started by the host.');
            });
        };

        initRoom();

        return () => {
            isMounted = false;
            if (redirectTimeoutRef.current) {
                clearTimeout(redirectTimeoutRef.current);
                redirectTimeoutRef.current = null;
            }
            if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop());
            if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach((t) => t.stop());
            peerConnectionsRef.current.forEach((pc) => pc.close());
            peerConnectionsRef.current.clear();
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [interview, isRecruiter, addToast, navigate, createPeerConnection, flushLogs]);

    // Callback ref for local video
    const setLocalVideoRef = useCallback((el: HTMLVideoElement | null) => {
        localVideoRef.current = el;
        if (el && localStreamRef.current) {
            el.srcObject = localStreamRef.current;
        }
    }, []);

    // Callback ref for remote video
    const setRemoteVideoRef = useCallback((socketId: string, el: HTMLVideoElement | null) => {
        remoteVideoRefs.current.set(socketId, el);
        if (el) {
            const rs = remoteStreams.find((r) => r.socketId === socketId);
            if (rs?.stream) {
                el.srcObject = rs.stream;
            }
        }
    }, [remoteStreams]);

    // Toggle controls
    const toggleMute = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach((track) => {
                track.enabled = !track.enabled;
            });
            setIsMuted(prev => !prev);
        }
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach((track) => {
                track.enabled = !track.enabled;
            });
            setIsVideoOff(prev => !prev);
        }
    };

    const toggleScreenShare = async () => {
        if (isScreenSharing) {
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach((t) => t.stop());
                screenStreamRef.current = null;
            }
            if (localStreamRef.current) {
                const videoTrack = localStreamRef.current.getVideoTracks()[0];
                if (videoTrack) {
                    peerConnectionsRef.current.forEach((pc) => {
                        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
                        if (sender) sender.replaceTrack(videoTrack);
                    });
                }
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = localStreamRef.current;
                }
            }
            setIsScreenSharing(false);
        } else {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                screenStreamRef.current = screenStream;
                const screenTrack = screenStream.getVideoTracks()[0];

                peerConnectionsRef.current.forEach((pc) => {
                    const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
                    if (sender) sender.replaceTrack(screenTrack);
                });

                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = screenStream;
                }

                screenTrack.onended = () => {
                    toggleScreenShare();
                };

                setIsScreenSharing(true);
                addToast('info', 'Screen sharing started');
            } catch (err) {
                addToast('error', 'Failed to start screen sharing');
            }
        }
    };

    const admitCandidate = (socketId: string) => {
        if (socketRef.current) {
            socketRef.current.emit('admit-user', { targetSocketId: socketId });
            setAdmissionRequests(prev => prev.filter(u => u.socketId !== socketId));
        }
    };

    const denyCandidate = (socketId: string) => {
        if (socketRef.current) {
            socketRef.current.emit('deny-user', { targetSocketId: socketId });
            setAdmissionRequests(prev => prev.filter(u => u.socketId !== socketId));
        }
    };

    const kickParticipant = (targetSocketId: string) => {
        if (socketRef.current) {
            socketRef.current.emit('kick-user', { targetSocketId });
            addToast('info', 'Participant has been removed from the session.');
        }
    };

    const broadcastCodeChange = (newCode: string) => {
        setCode(newCode);
        if (socketRef.current && interview) {
            socketRef.current.emit('code-change', {
                roomId: interview.meetingId,
                code: newCode,
                language: editorLanguage,
            });
        }
    };

    return {
        socketRef,
        localVideoRef,
        remoteStreams,
        isWaitingForHost,
        admissionRequests,
        isMuted,
        isVideoOff,
        isScreenSharing,
        isCodingTestVisible,
        setIsCodingTestVisible,
        code,
        setCode,
        editorLanguage,
        setEditorLanguage,
        adaptiveSession,
        setAdaptiveSession,
        lastEvaluation,
        setLastEvaluation,
        evaluating,
        setEvaluating,
        proctorAlerts,
        setProctorAlerts,
        setLocalVideoRef,
        setRemoteVideoRef,
        toggleMute,
        toggleVideo,
        toggleScreenShare,
        admitCandidate,
        denyCandidate,
        kickParticipant,
        broadcastCodeChange,
        localStreamRef,
        screenStreamRef,
        peerConnectionsRef,
    };
};
