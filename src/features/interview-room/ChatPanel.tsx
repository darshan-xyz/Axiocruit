import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { MessageSquare, Send, X } from 'lucide-react';

export interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    timestamp: string;
}

export interface ChatPanelProps {
    socket?: React.RefObject<Socket | null>;
    roomId?: string;
    currentUserId?: string;
    currentUserName?: string;
    isDark?: boolean;
    isOpen?: boolean;
    onClose?: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
    socket,
    roomId,
    currentUserId = 'self',
    currentUserName = 'You',
    isDark = true,
    isOpen = true,
    onClose,
}) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const s = socket?.current;
        if (!s) return;

        const handleIncomingMessage = (msg: ChatMessage) => {
            setMessages((prev) => [...prev, msg]);
        };

        s.on('chat-message', handleIncomingMessage);
        return () => {
            s.off('chat-message', handleIncomingMessage);
        };
    }, [socket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const newMsg: ChatMessage = {
            id: Date.now().toString(),
            senderId: currentUserId,
            senderName: currentUserName,
            text: inputText.trim(),
            timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, newMsg]);

        if (socket?.current && roomId) {
            socket.current.emit('chat-message', {
                roomId,
                message: newMsg,
            });
        }

        setInputText('');
    };

    if (!isOpen) return null;

    return (
        <div className={`flex flex-col h-full ${isDark ? 'bg-neutral-900 text-white' : 'bg-white text-slate-900'}`}>
            {/* Header */}
            <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-slate-700 bg-neutral-950' : 'border-slate-300 bg-slate-50'}`}>
                <div className="flex items-center gap-2">
                    <MessageSquare size={16} className="text-blue-500" />
                    <span className="text-sm font-bold">Session Chat</span>
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition">
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Messages list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-neutral-500 text-center">
                        No messages yet. Send a message to participants in this room.
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.senderId === currentUserId;
                        return (
                            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <span className="text-[10px] text-neutral-500 mb-0.5">{msg.senderName}</span>
                                <div
                                    className={`px-3 py-1.5 rounded-xl text-xs max-w-[80%] break-words ${
                                        isMe
                                            ? 'bg-blue-600 text-white'
                                            : isDark
                                                ? 'bg-neutral-800 text-neutral-200'
                                                : 'bg-slate-100 text-slate-800'
                                    }`}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <form onSubmit={sendMessage} className={`p-3 border-t flex gap-2 ${isDark ? 'border-slate-700 bg-neutral-950' : 'border-slate-300 bg-slate-50'}`}>
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a message..."
                    className={`flex-1 px-3 py-2 text-xs rounded-xl border outline-none ${
                        isDark
                            ? 'bg-neutral-900 border-slate-700 text-white placeholder-neutral-500 focus:border-blue-500'
                            : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500'
                    }`}
                />
                <button
                    type="submit"
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                >
                    <Send size={13} />
                </button>
            </form>
        </div>
    );
};

export default ChatPanel;
