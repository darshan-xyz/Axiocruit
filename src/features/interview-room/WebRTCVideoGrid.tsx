import React from 'react';
import { VideoOff, Users, UserX, PlayCircle } from 'lucide-react';

export interface RemoteStream {
    socketId: string;
    userId: string;
    userName: string;
    stream: MediaStream;
}

export interface WebRTCVideoGridProps {
    localVideoRef: (el: HTMLVideoElement | null) => void;
    remoteStreams?: RemoteStream[];
    setRemoteVideoRef: (socketId: string, el: HTMLVideoElement | null) => void;
    isMuted: boolean;
    isVideoOff: boolean;
    isScreenSharing: boolean;
    isCodingTestVisible: boolean;
    isHost: boolean;
    userName?: string;
    onKickParticipant?: (socketId: string) => void;
    onStartCodingTest?: () => void;
    isDark?: boolean;
}

export const VIDEO_GRID_STYLES = `
  .video-grid {
    display: grid;
    gap: 16px;
    padding: 24px;
    padding-bottom: 90px;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    height: 100%;
    width: 100%;
    align-content: center;
    box-sizing: border-box;
    overflow-y: auto;
  }
  .video-tile {
    position: relative;
    border-radius: 16px;
    overflow: hidden;
    background: var(--bg-card, #111827);
    min-height: 200px;
    max-height: 45vh;
    border: 1px solid var(--border-color, rgba(255,255,255,0.05));
    transition: box-shadow 0.3s ease, transform 0.3s ease;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  }
  .video-tile:hover {
    box-shadow: 0 8px 30px rgba(37, 99, 235, 0.3);
    transform: translateY(-2px);
  }
  .video-tile video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .video-tile .video-label {
    position: absolute;
    bottom: 12px;
    left: 12px;
    background: rgba(17, 24, 39, 0.7);
    backdrop-filter: blur(8px);
    padding: 4px 10px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary, #fff);
    pointer-events: none;
    border: 1px solid var(--border-color, rgba(255,255,255,0.1));
  }
  .video-tile .kick-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    background: rgba(239, 68, 68, 0.85);
    border: none;
    border-radius: 8px;
    color: #fff;
    padding: 6px 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 600;
    opacity: 0;
    transition: opacity 0.2s, background 0.2s;
    z-index: 10;
  }
  .video-tile:hover .kick-btn {
    opacity: 1;
  }
  .video-tile .kick-btn:hover {
    background: rgba(220, 38, 38, 1);
  }
  .video-tile .local-badge {
    position: absolute;
    top: 8px;
    left: 8px;
    background: rgba(37, 99, 235, 0.75);
    backdrop-filter: blur(6px);
    padding: 2px 7px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
    color: #fff;
    pointer-events: none;
    letter-spacing: 0.5px;
  }
  .video-tile .video-off-overlay {
    position: absolute;
    inset: 0;
    background: var(--bg-card, #111827);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .video-tile .avatar-circle {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: var(--bg-header, #1f2937);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .video-grid.sidebar-mode {
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 12px;
    padding-bottom: 80px;
    align-content: start;
  }
  .video-grid.sidebar-mode .video-tile {
    min-height: 140px;
    max-height: 35vh;
    border-radius: 12px;
  }
`;

export const WebRTCVideoGrid: React.FC<WebRTCVideoGridProps> = ({
    localVideoRef,
    remoteStreams = [],
    setRemoteVideoRef,
    isVideoOff,
    isScreenSharing,
    isCodingTestVisible,
    isHost,
    userName = 'You',
    onKickParticipant,
    onStartCodingTest,
    isDark = true,
}) => {
    return (
        <div className={`${
            isCodingTestVisible
                ? 'w-[320px] min-w-[280px] max-w-[380px] border-l'
                : 'flex-1'
        } overflow-hidden relative transition-all duration-500 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-slate-100 border-slate-200'}`}>
            <style>{VIDEO_GRID_STYLES}</style>

            {/* "Start Coding Test" Button — Host only, shown in full video view */}
            {!isCodingTestVisible && isHost && onStartCodingTest && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
                    <button
                        onClick={onStartCodingTest}
                        className="flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-full shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300 text-sm font-semibold border border-blue-400/20"
                    >
                        <PlayCircle size={18} />
                        <span>Start Coding Test</span>
                    </button>
                </div>
            )}

            <div className={`video-grid ${isCodingTestVisible ? 'sidebar-mode' : ''}`} style={{ height: '100%' }}>
                {/* Local Video Tile */}
                <div className="video-tile">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    {isVideoOff && (
                        <div className="video-off-overlay">
                            <div className="avatar-circle">
                                <VideoOff size={24} className="text-neutral-600" />
                            </div>
                        </div>
                    )}
                    <span className="local-badge">YOU {isScreenSharing && '· SCREEN'}</span>
                    <span className="video-label">{userName}</span>
                </div>

                {/* Remote Video Tiles — one per connected peer */}
                {(remoteStreams || []).map((rs) => (
                    <div key={rs.socketId} className="video-tile">
                        <video
                            ref={(el) => setRemoteVideoRef(rs.socketId, el)}
                            autoPlay
                            playsInline
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                        <span className="video-label">{rs.userName}</span>

                        {/* Kick button — Host only, appears on hover */}
                        {isHost && onKickParticipant && (
                            <button
                                className="kick-btn"
                                onClick={() => onKickParticipant(rs.socketId)}
                                title={`Remove ${rs.userName} from session`}
                            >
                                <UserX size={13} />
                                Kick
                            </button>
                        )}
                    </div>
                ))}

                {/* Empty waiting state — only when no remote peers connected */}
                {remoteStreams.length === 0 && (
                    <div className="video-tile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
                        <div className="avatar-circle" style={{ width: 72, height: 72 }}>
                            <Users size={30} className="text-neutral-600" />
                        </div>
                        <p style={{ color: '#6b7280', fontSize: 13 }}>Waiting for participant...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WebRTCVideoGrid;
