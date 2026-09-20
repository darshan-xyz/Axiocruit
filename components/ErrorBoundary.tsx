import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-blue-500/30 mb-6">
            !
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Something unexpected happened</h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-md mb-6 text-sm sm:text-base">
            An application error occurred. We have logged the incident and our team is monitoring system health.
          </p>

          {this.state.error && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 max-w-lg w-full mb-6 text-left overflow-auto max-h-32 text-xs font-mono text-slate-700 dark:text-slate-300">
              {this.state.error.message}
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={this.handleReload}
              className="px-5 py-2.5 rounded-lg font-medium text-sm bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white shadow-md shadow-blue-500/25 transition-all"
            >
              Reload Page
            </button>
            <button
              onClick={this.handleGoHome}
              className="px-5 py-2.5 rounded-lg font-medium text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all shadow-xs"
            >
              Return Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
