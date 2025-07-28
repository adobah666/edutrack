'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AuthErrorHandlerProps {
  children: React.ReactNode;
}

const AuthErrorHandler = ({ children }: AuthErrorHandlerProps) => {
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only run this effect on the client side
    if (typeof window === 'undefined') return;

    const handleAuthError = async () => {
      try {
        // Check if there's an authentication error by trying to get user info
        if (isLoaded && !isSignedIn) {
          // User is not signed in, redirect to sign-in page
          router.push('/sign-in');
          return;
        }

        // If user is signed in but there might be an error, try to validate the session
        if (isSignedIn) {
          // Try to make a simple API call to test authentication
          const response = await fetch('/api/auth/test', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            // If the API call fails, it might be due to authentication issues
            console.log('Authentication error detected, logging out...');
            await signOut({ redirectUrl: '/sign-in' });
            return;
          }
        }
      } catch (error) {
        console.error('Auth error handler error:', error);
        // If there's any error, sign out the user
        await signOut({ redirectUrl: '/sign-in' });
      }
    };

    // Run the check when the component mounts
    handleAuthError();

    // Also listen for unhandled promise rejections that might be auth-related
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorMessage = event.reason?.message?.toLowerCase() || '';
      const errorStatus = event.reason?.status;
      
      const isAuthError = 
        errorMessage.includes('authentication') || 
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('forbidden') ||
        errorMessage.includes('user not found') ||
        errorMessage.includes('session expired') ||
        errorMessage.includes('invalid token') ||
        errorMessage.includes('token expired') ||
        errorStatus === 401 ||
        errorStatus === 403;

      if (isAuthError) {
        console.log('Unhandled auth error detected, logging out...');
        signOut({ redirectUrl: '/sign-in' });
      }
    };

    // Listen for global errors that might be auth-related
    const handleGlobalError = (event: ErrorEvent) => {
      const errorMessage = event.message?.toLowerCase() || '';
      
      const isAuthError = 
        errorMessage.includes('authentication') || 
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('forbidden') ||
        errorMessage.includes('user not found') ||
        errorMessage.includes('session expired') ||
        errorMessage.includes('invalid token') ||
        errorMessage.includes('token expired');

      if (isAuthError) {
        console.log('Global auth error detected, logging out...');
        signOut({ redirectUrl: '/sign-in' });
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleGlobalError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleGlobalError);
    };
  }, [isLoaded, isSignedIn, signOut, router]);

  return <>{children}</>;
};

export default AuthErrorHandler; 