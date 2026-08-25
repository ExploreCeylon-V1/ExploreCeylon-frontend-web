import { Component } from 'react';

/**
 * Reusable React ErrorBoundary
 * Catches JavaScript errors anywhere in its child component tree,
 * logs them, and displays a user-friendly fallback UI instead of a blank white screen.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="bg-white rounded-xl p-6 text-center border border-gray-200 my-4 shadow-sm">
          <div className="text-3xl mb-2">⚠️</div>
          <h3 className="text-base font-bold text-gray-800 mb-1">
            {this.props.title || 'Unable to load component'}
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            {this.props.message || 'An unexpected error occurred while rendering this section.'}
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
