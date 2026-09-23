import React, { useRef, useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Eraser, Pencil, RotateCcw } from 'lucide-react';

export interface WhiteboardCanvasProps {
    socket?: React.RefObject<Socket | null>;
    roomId?: string;
    isDark?: boolean;
}

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
    socket,
    roomId,
    isDark = true,
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const lastPosRef = useRef<{ x: number; y: number } | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#3b82f6');
    const [lineWidth, setLineWidth] = useState(3);
    const [mode, setMode] = useState<'pen' | 'eraser'>('pen');

    // Handle incoming whiteboard updates from peers
    useEffect(() => {
        const s = socket?.current;
        if (!s) return;

        const handleWhiteboardUpdate = (data: any) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const elements = data?.elements || [];
            for (const el of elements) {
                if (el.type === 'clear') {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                } else if (el.type === 'draw' || el.fromX !== undefined || el.x !== undefined) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.strokeStyle = el.mode === 'eraser' ? (isDark ? '#111827' : '#ffffff') : (el.color || '#3b82f6');
                    ctx.lineWidth = el.mode === 'eraser' ? 20 : (el.lineWidth || 3);
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    const startX = el.fromX !== undefined ? el.fromX : el.x;
                    const startY = el.fromY !== undefined ? el.fromY : el.y;
                    const endX = el.toX !== undefined ? el.toX : el.x;
                    const endY = el.toY !== undefined ? el.toY : el.y;
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(endX, endY);
                    ctx.stroke();
                    ctx.restore();
                }
            }
        };

        s.on('whiteboard-update', handleWhiteboardUpdate);
        return () => {
            s.off('whiteboard-update', handleWhiteboardUpdate);
        };
    }, [socket, isDark]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set dimensions to match client bounding rect
        const resizeCanvas = () => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        lastPosRef.current = { x, y };
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const fromX = lastPosRef.current ? lastPosRef.current.x : x;
        const fromY = lastPosRef.current ? lastPosRef.current.y : y;
        lastPosRef.current = { x, y };

        ctx.strokeStyle = mode === 'eraser' ? (isDark ? '#111827' : '#ffffff') : color;
        ctx.lineWidth = mode === 'eraser' ? 20 : lineWidth;
        ctx.lineTo(x, y);
        ctx.stroke();

        if (socket?.current && roomId) {
            socket.current.emit('whiteboard-update', {
                roomId,
                elements: [{
                    type: 'draw',
                    fromX,
                    fromY,
                    toX: x,
                    toY: y,
                    x,
                    y,
                    color: ctx.strokeStyle,
                    lineWidth: ctx.lineWidth,
                    mode,
                }],
            });
        }
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        lastPosRef.current = null;
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (socket?.current && roomId) {
            socket.current.emit('whiteboard-update', {
                roomId,
                elements: [{ type: 'clear' }],
            });
        }
    };

    return (
        <div className={`relative flex flex-col h-full ${isDark ? 'bg-neutral-900 text-white' : 'bg-white text-slate-900'}`}>
            {/* Toolbar */}
            <div className={`flex items-center gap-3 px-4 py-2 border-b ${isDark ? 'border-neutral-800 bg-neutral-950' : 'border-slate-200 bg-slate-50'}`}>
                <button
                    onClick={() => setMode('pen')}
                    className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                        mode === 'pen' ? 'bg-blue-600 text-white' : 'hover:bg-neutral-800 text-neutral-400'
                    }`}
                >
                    <Pencil size={14} /> Pen
                </button>
                <button
                    onClick={() => setMode('eraser')}
                    className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                        mode === 'eraser' ? 'bg-blue-600 text-white' : 'hover:bg-neutral-800 text-neutral-400'
                    }`}
                >
                    <Eraser size={14} /> Eraser
                </button>
                <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                    title="Change Color"
                />
                <button
                    onClick={clearCanvas}
                    className="ml-auto p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-neutral-400 hover:text-red-400 transition"
                    title="Clear Whiteboard"
                >
                    <RotateCcw size={14} /> Clear
                </button>
            </div>

            {/* Drawing Canvas */}
            <div className="flex-1 relative cursor-crosshair">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="w-full h-full"
                />
            </div>
        </div>
    );
};

export default WhiteboardCanvas;
