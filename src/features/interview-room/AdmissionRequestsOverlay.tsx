import React from 'react';
import { Users } from 'lucide-react';
import { PeerUser } from './useInterviewSignaling';

export interface AdmissionRequestsOverlayProps {
    requests?: PeerUser[];
    onAdmit: (socketId: string) => void;
    onDeny: (socketId: string) => void;
}

export const AdmissionRequestsOverlay: React.FC<AdmissionRequestsOverlayProps> = ({
    requests = [],
    onAdmit,
    onDeny,
}) => {
    if (!requests || requests.length === 0) return null;

    return (
        <div className="absolute top-4 right-4 z-50 flex flex-col gap-3">
            {(requests || []).map((req) => (
                <div
                    key={req.socketId}
                    className="bg-neutral-900 border border-neutral-700 p-4 rounded-xl shadow-2xl w-80 flex flex-col gap-3"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                            <Users className="text-blue-600 dark:text-blue-400" size={20} />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-white">{req.userName}</p>
                            <p className="text-xs text-neutral-400">wants to join</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onDeny(req.socketId)}
                            className="flex-1 py-1.5 px-3 rounded text-sm font-medium bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition border border-neutral-700"
                        >
                            Deny
                        </button>
                        <button
                            onClick={() => onAdmit(req.socketId)}
                            className="flex-1 py-1.5 px-3 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition"
                        >
                            Admit
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AdmissionRequestsOverlay;
