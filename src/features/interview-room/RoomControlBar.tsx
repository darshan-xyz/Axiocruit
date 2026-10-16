import React from 'react';
import { Mic, MicOff, Video, VideoOff, Monitor, PhoneOff, UserX } from 'lucide-react';

export interface RoomControlBarProps {
    isMuted: boolean;
    isVideoOff: boolean;
    isScreenSharing: boolean;
    isRecruiter: boolean;
    remoteStreamsCount: number;
    onToggleMute: () => void;
    onToggleVideo: () => void;
    onToggleScreenShare: () => void;
    onEndCall: () => void;
    onQuickKick?: () => void;
    isDark?: boolean;
}

export const RoomControlBar: React.FC<RoomControlBarProps> = ({
    isMuted,
    isVideoOff,
    isScreenSharing,
    isRecruiter,
    remoteStreamsCount,
    onToggleMute,
    onToggleVideo,
    onToggleScreenShare,
    onEndCall,
    onQuickKick,
    isDark = true,
}) => {
    return (
        <div
            className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center justify-center gap-3 px-6 py-3 border rounded-full backdrop-blur-xl ${
                isDark
                    ? 'bg-neutral-900/95 border-neutral-700 shadow-[0_8px_32px_rgba(0,0,0,0.6)]'
                    : 'bg-white/95 border-slate-300 shadow-[0_8px_32px_rgba(37,99,235,0.15)]'
            }`}
        >
            {/* Mute */}
            <button
                onClick={onToggleMute}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                    isMuted
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                        : isDark
                        ? 'bg-neutral-800 text-white border border-neutral-700 hover:bg-neutral-700'
                        : 'bg-blue-50 text-slate-800 border border-blue-200 hover:bg-blue-100'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
            >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            {/* Video Toggle */}
            <button
                onClick={onToggleVideo}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                    isVideoOff
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                        : isDark
                        ? 'bg-neutral-800 text-white border border-neutral-700 hover:bg-neutral-700'
                        : 'bg-blue-50 text-slate-800 border border-blue-200 hover:bg-blue-100'
                }`}
                title={isVideoOff ? 'Turn on Video' : 'Turn off Video'}
            >
                {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
            </button>

            {/* Screen Share */}
            <button
                onClick={onToggleScreenShare}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                    isScreenSharing
                        ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/30'
                        : isDark
                        ? 'bg-neutral-800 text-white border border-neutral-700 hover:bg-neutral-700'
                        : 'bg-blue-50 text-slate-800 border border-blue-200 hover:bg-blue-100'
                }`}
                title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
            >
                <Monitor size={20} />
            </button>

            {/* Divider */}
            <div className={`w-px h-8 mx-2 ${isDark ? 'bg-neutral-700' : 'bg-slate-200'}`} />

            {/* End Call — visible to ALL users */}
            <button
                onClick={onEndCall}
                className="h-11 px-6 rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-red-500/20 active:scale-95 text-sm font-semibold cursor-pointer"
                title={isRecruiter ? 'End / Complete Interview' : 'Leave Call'}
            >
                <PhoneOff size={18} />
                <span>{isRecruiter ? 'End Interview' : 'Leave Call'}</span>
            </button>

            {/* Recruiter Controls: Quick-kick from footer when only 1 remote peer */}
            {isRecruiter && remoteStreamsCount === 1 && onQuickKick && (
                <>
                    <div className={`w-px h-8 mx-2 ${isDark ? 'bg-neutral-700' : 'bg-slate-200'}`} />
                    <button
                        onClick={onQuickKick}
                        className={`h-11 px-5 rounded-full border flex items-center justify-center gap-2 transition-all duration-200 text-sm font-medium cursor-pointer ${
                            isDark
                                ? 'bg-neutral-800 text-red-400 border-red-500/30 hover:bg-red-500/10'
                                : 'bg-white text-red-500 border-red-400/30 hover:bg-red-50'
                        }`}
                        title="Remove candidate from session"
                    >
                        <UserX size={18} />
                        <span>Kick Candidate</span>
                    </button>
                </>
            )}
        </div>
    );
};

export default RoomControlBar;
