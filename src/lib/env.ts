import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  
  // Authentication
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
  
  // OAuth Providers
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  
  // External APIs
  PODCAST_API_KEY: z.string().min(1),
  PODCAST_API_URL: z.string().url(),
  
  // Optional: Analytics
  ANALYTICS_ID: z.string().optional(),
  
  // Optional: Image Storage
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

type EnvSchema = z.infer<typeof envSchema>;

/**
 * Parse and validate environment variables
 * Throws an error if any required variables are missing
 */
function validateEnv(): EnvSchema {
  try {
    const parsed = envSchema.parse({
      DATABASE_URL: process.env.DATABASE_URL,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      PODCAST_API_KEY: process.env.PODCAST_API_KEY,
      PODCAST_API_URL: process.env.PODCAST_API_URL,
      ANALYTICS_ID: process.env.ANALYTICS_ID,
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    });
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((e) => e.path.join('.')).join(', ');
      throw new Error(`❌ Missing or invalid environment variables: ${missingVars}`);
    }
    throw error;
  }
}

/**
 * Validated environment variables
 */
export const env = validateEnv(); 