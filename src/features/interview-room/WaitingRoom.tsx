import React from 'react';
import { Users, VideoOff, Video, Mic, MicOff } from 'lucide-react';

export interface WaitingRoomProps {
    setLocalVideoRef: (el: HTMLVideoElement | null) => void;
    isMuted: boolean;
    isVideoOff: boolean;
    userName?: string;
    onToggleMute: () => void;
    onToggleVideo: () => void;
    onLeave: () => void;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
    setLocalVideoRef,
    isMuted,
    isVideoOff,
    userName = 'You',
    onToggleMute,
    onToggleVideo,
    onLeave,
}) => {
    return (
        <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center text-white gap-6 px-4">
            {/* Camera preview so the candidate can check A/V before being admitted */}
            <div className="relative rounded-xl overflow-hidden border border-blue-500/30 shadow-xl shadow-blue-500/20" style={{ width: 280, height: 200 }}>
                <video
                    ref={setLocalVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                {isVideoOff && (
                    <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center">
                        <VideoOff size={32} className="text-neutral-600" />
                    </div>
                )}
                <span
                    style={{
                        position: 'absolute',
                        bottom: 8,
                        left: 8,
                        background: 'rgba(0,0,0,0.65)',
                        backdropFilter: 'blur(6px)',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        color: '#fff',
                    }}
                >
                    {userName}
                </span>

                {/* Mini A/V controls */}
                <div className="absolute top-2 right-2 flex gap-1.5">
                    <button
                        onClick={onToggleMute}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors text-xs ${
                            isMuted ? 'bg-red-500/80' : 'bg-black/60 hover:bg-black/80'
                        }`}
                        title={isMuted ? 'Unmute' : 'Mute'}
                    >
                        {isMuted ? <MicOff size={13} /> : <Mic size={13} />}
                    </button>
                    <button
                        onClick={onToggleVideo}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors text-xs ${
                            isVideoOff ? 'bg-red-500/80' : 'bg-black/60 hover:bg-black/80'
                        }`}
                        title={isVideoOff ? 'Turn on Camera' : 'Turn off Camera'}
                    >
                        {isVideoOff ? <VideoOff size={13} /> : <Video size={13} />}
                    </button>
                </div>
            </div>

            {/* Status text */}
            <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/20 border border-blue-500/40 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="text-blue-600 dark:text-blue-400" size={24} />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Waiting for Host</h2>
                <p className="text-neutral-400 mb-6 text-center max-w-md text-sm">
                    You are in the waiting room. The host will admit you shortly.
                </p>
                <div className="flex gap-2 items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>

            <button
                onClick={onLeave}
                className="px-6 py-2 border border-neutral-700 text-neutral-300 rounded-lg hover:bg-neutral-800 transition-colors text-sm"
            >
                Leave Waiting Room
            </button>
        </div>
    );
};

export default WaitingRoom;
