// DashInsight - Server Configuration
import dotenv from 'dotenv';
dotenv.config();

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] || fallback;
  if (!value) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`[FATAL] Environment variable ${name} is required in production`);
    }
    console.warn(`[WARN] ${name} not set, using default`);
  }
  return value || '';
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  jwtSecret: requireEnv('JWT_SECRET', 'dashinsight-dev-secret-change-in-production'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
} as const;
