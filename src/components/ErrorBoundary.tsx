'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props & { signOut: () => void; router: any }, State> {
  constructor(props: Props & { signOut: () => void; router: any }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Check if this is an authentication-related error
    const isAuthError = 
      error.message.includes('authentication') ||
      error.message.includes('unauthorized') ||
      error.message.includes('forbidden') ||
      error.message.includes('401') ||
      error.message.includes('403') ||
      error.message.includes('user not found') ||
      error.message.includes('session expired');

    if (isAuthError) {
      console.log('Authentication error detected in ErrorBoundary, logging out...');
      this.props.signOut();
      this.props.router.push('/sign-in');
    }
  }

  render() {
    if (this.state.hasError) {
      // Check if it's an auth error
      const isAuthError = this.state.error?.message?.includes('authentication') ||
                         this.state.error?.message?.includes('unauthorized') ||
                         this.state.error?.message?.includes('forbidden');

      if (isAuthError) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Authentication Error
              </h2>
              <p className="text-gray-600 mb-4">
                Your session has expired or there was an authentication issue.
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to login page...
              </p>
            </div>
          </div>
        );
      }

      // For other errors, show a generic error message
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-4">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper component to provide Clerk hooks to the class component
const ErrorBoundaryWrapper = ({ children }: Props) => {
  const { signOut } = useAuth();
  const router = useRouter();

  return (
    <ErrorBoundary signOut={signOut} router={router}>
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundaryWrapper; 