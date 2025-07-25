// Environment configuration helper
export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = process.env.NODE_ENV === 'development';

// Clerk environment detection
export const isClerkProduction = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_live_');
export const isClerkDevelopment = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_test_');

// Environment info for debugging
export const envInfo = {
  nodeEnv: process.env.NODE_ENV,
  isProduction,
  isDevelopment,
  clerkMode: isClerkProduction ? 'production' : 'development',
  clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 20) + '...',
};

// Log environment info in development
if (isDevelopment) {
  console.log('🌍 Environment Info:', envInfo);
}