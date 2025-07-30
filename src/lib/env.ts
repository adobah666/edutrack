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

// Environment variables with validation
export const env = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL!,
  
  // Clerk
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY!,
  
  // Cloudinary
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
  NEXT_PUBLIC_CLOUDINARY_API_KEY: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET!,
  
  // Email
  RESEND_API_KEY: process.env.RESEND_API_KEY!,
  
  // Payment
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY!,
  
  // SMS
  HUBTEL_CLIENT_ID: process.env.HUBTEL_CLIENT_ID!,
  HUBTEL_CLIENT_SECRET: process.env.HUBTEL_CLIENT_SECRET!,
  HUBTEL_SMS_FROM: process.env.HUBTEL_SMS_FROM || 'SchoolApp',
};

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'HUBTEL_CLIENT_ID',
  'HUBTEL_CLIENT_SECRET',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Log environment info in development
if (isDevelopment) {
  console.log('🌍 Environment Info:', envInfo);
}