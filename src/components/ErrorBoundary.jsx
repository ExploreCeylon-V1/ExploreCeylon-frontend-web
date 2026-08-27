import React, { Component } from 'react';

/**
 * Global & Component-level ErrorBoundary
 * Catches JavaScript errors anywhere in its child component tree,
 * logs them, and displays a user-friendly UI with detailed stack trace inspection
 * instead of a blank white screen.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      copied: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleCopyError = () => {
    const errorDetails = `Error: ${this.state.error?.toString() || 'Unknown Error'}\n\nComponent Stack:\n${
      this.state.errorInfo?.componentStack || 'No component stack available'
    }\n\nStack Trace:\n${this.state.error?.stack || 'No stack trace available'}`;

    navigator.clipboard.writeText(errorDetails).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isGlobal = this.props.isGlobal || !this.props.title;

      if (isGlobal) {
        return (
          <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
            <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              {/* Top Accent Bar */}
              <div className="h-2 bg-gradient-to-r from-red-500 via-rose-500 to-amber-500" />

              <div className="p-6 sm:p-8">
                {/* Header Icon + Title */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center text-2xl font-bold shrink-0">
                    ⚠️
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                      {this.props.title || 'Something went wrong'}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium">
                      An unhandled runtime error occurred while rendering this page.
                    </p>
                  </div>
                </div>

                {/* Error Message Box */}
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6">
                  <p className="text-xs font-bold text-rose-900 uppercase tracking-wider mb-1">
                    Error Description
                  </p>
                  <p className="text-sm font-semibold text-rose-700 font-mono break-words">
                    {this.state.error?.message || this.state.error?.toString() || 'Unknown runtime error'}
                  </p>
                </div>

                {/* Stack Trace Accordion */}
                <div className="mb-6">
                  <button
                    type="button"
                    onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                    className="flex items-center justify-between w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-700 transition-colors border border-slate-200"
                  >
                    <span>{this.state.showDetails ? '▼ Hide Technical Details' : '▶ View Full Stack Trace & Debug Info'}</span>
                    <span className="text-3xs text-slate-400 font-normal">Click to toggle</span>
                  </button>

                  {this.state.showDetails && (
                    <div className="mt-2 p-4 bg-slate-950 text-slate-200 rounded-xl overflow-x-auto text-xs font-mono max-h-72 border border-slate-800 space-y-3">
                      <div>
                        <span className="text-rose-400 font-bold font-mono">Error: </span>
                        <span>{this.state.error?.toString()}</span>
                      </div>
                      {this.state.error?.stack && (
                        <div>
                          <span className="text-amber-400 font-bold font-mono">Stack: </span>
                          <pre className="text-3xs text-slate-300 whitespace-pre-wrap mt-1">
                            {this.state.error.stack}
                          </pre>
                        </div>
                      )}
                      {this.state.errorInfo?.componentStack && (
                        <div>
                          <span className="text-emerald-400 font-bold font-mono">Component Tree: </span>
                          <pre className="text-3xs text-slate-300 whitespace-pre-wrap mt-1">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={this.handleRetry}
                    className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                  >
                    🔄 Try Again
                  </button>
                  <button
                    type="button"
                    onClick={this.handleReload}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
                  >
                    🔁 Reload Page
                  </button>
                  <button
                    type="button"
                    onClick={this.handleGoHome}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
                  >
                    🏠 Go to Home
                  </button>
                  <button
                    type="button"
                    onClick={this.handleCopyError}
                    className="ml-auto text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors py-2 px-3 border border-slate-200 rounded-xl hover:bg-slate-50"
                  >
                    {this.state.copied ? '✅ Error Copied!' : '📋 Copy Error'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      }

      // Compact Component-level Fallback
      return (
        <div className="bg-white rounded-xl p-6 text-center border border-gray-200 my-4 shadow-sm">
          <div className="text-3xl mb-2">⚠️</div>
          <h3 className="text-base font-bold text-gray-800 mb-1">
            {this.props.title || 'Unable to load component'}
          </h3>
          <p className="text-xs text-gray-500 mb-2">
            {this.props.message || 'An unexpected error occurred while rendering this section.'}
          </p>
          {this.state.error?.message && (
            <p className="text-3xs text-rose-600 font-mono mb-4 bg-rose-50 py-1 px-2 rounded max-w-md mx-auto truncate">
              {this.state.error.message}
            </p>
          )}
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={this.handleRetry}
              className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
