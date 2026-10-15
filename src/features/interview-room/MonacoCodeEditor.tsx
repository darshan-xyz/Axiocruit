import React from 'react';
import Editor from '@monaco-editor/react';
import { Code, Maximize2, Minimize2 } from 'lucide-react';

export interface MonacoCodeEditorProps {
    code: string;
    language?: string;
    onChange: (value: string | undefined) => void;
    onLanguageChange?: (lang: string) => void;
    isEditorFocused: boolean;
    onToggleFocus: () => void;
    editorContainerRef: React.RefObject<HTMLDivElement | null>;
    isDark?: boolean;
    isHost?: boolean;
    adaptiveSession?: any;
    evaluating?: boolean;
    onStartAdaptiveTest?: () => void;
    children?: React.ReactNode;
}

export const MonacoCodeEditor: React.FC<MonacoCodeEditorProps> = ({
    code,
    language = 'python',
    onChange,
    onLanguageChange,
    isEditorFocused,
    onToggleFocus,
    editorContainerRef,
    isDark = true,
    isHost = false,
    adaptiveSession,
    evaluating = false,
    onStartAdaptiveTest,
    children,
}) => {
    return (
        <div
            ref={editorContainerRef}
            className={`flex flex-col transition-all duration-500 ${isEditorFocused ? 'flex-[3]' : 'flex-[2]'}`}
            style={{ minWidth: 0 }}
        >
            {/* Editor Header */}
            <div className={`h-10 border-b flex items-center justify-between px-4 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-2">
                    <Code size={14} className="text-blue-600 dark:text-blue-400" />
                    <span className={`text-xs font-medium ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>Coding Sandbox</span>

                    {isHost && (!adaptiveSession || adaptiveSession.status === 'completed') && onStartAdaptiveTest && (
                        <button
                            onClick={onStartAdaptiveTest}
                            disabled={evaluating}
                            className="ml-4 bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/40 border border-blue-500/30 px-3 py-1 rounded text-xs font-semibold transition cursor-pointer"
                        >
                            {evaluating ? 'Starting...' : adaptiveSession ? 'Restart Test' : 'Start Adaptive Test'}
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={language}
                        onChange={(e) => onLanguageChange && onLanguageChange(e.target.value)}
                        disabled={!onLanguageChange}
                        className={`border text-xs rounded px-2 py-1 outline-none font-medium transition ${!onLanguageChange ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer hover:border-blue-500'} ${isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-200' : 'bg-blue-50 border-blue-200 text-blue-700'}`}
                    >
                        <option value="python">Python</option>
                        <option value="javascript">JavaScript</option>
                        <option value="typescript">TypeScript</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                    </select>
                    <button
                        onClick={onToggleFocus}
                        className={`transition-colors p-1 ${isDark ? 'text-neutral-500 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                        title={isEditorFocused ? 'Minimize editor' : 'Maximize editor'}
                    >
                        {isEditorFocused ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    </button>
                </div>
            </div>

            {/* Injected Adaptive Test Panel */}
            {children}

            {/* Monaco Editor Surface */}
            <div className="flex-1 relative">
                <Editor
                    height="100%"
                    language={language === 'nodejs' ? 'javascript' : (language === 'c++' ? 'cpp' : language)}
                    theme={isDark ? 'vs-dark' : 'light'}
                    value={code}
                    onChange={onChange}
                    options={{
                        fontSize: 14,
                        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        padding: { top: 16 },
                        lineNumbers: 'on',
                        renderWhitespace: 'selection',
                        bracketPairColorization: { enabled: true },
                        cursorBlinking: 'smooth',
                        smoothScrolling: true,
                        wordWrap: 'on',
                    }}
                />
            </div>
        </div>
    );
};

export default MonacoCodeEditor;
