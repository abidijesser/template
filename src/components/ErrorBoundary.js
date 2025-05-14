import React, { Component } from 'react';
import { CAlert, CButton } from '@coreui/react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="p-4">
          <CAlert color="danger">
            <h4>Something went wrong</h4>
            <p>An error occurred in the application. Please try refreshing the page.</p>
            {this.state.error && (
              <details style={{ whiteSpace: 'pre-wrap' }}>
                <summary>Error Details</summary>
                <p>{this.state.error.toString()}</p>
                <p>{this.state.errorInfo?.componentStack}</p>
              </details>
            )}
            <div className="mt-3">
              <CButton color="primary" onClick={this.handleReset}>
                Try Again
              </CButton>
              <CButton 
                color="secondary" 
                className="ms-2" 
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </CButton>
            </div>
          </CAlert>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
