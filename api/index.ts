// DashInsight - Vercel Serverless Entry Point
// File ini di-import oleh Vercel untuk menjalankan Express app sebagai serverless function.
// Database: Neon PostgreSQL (via environment variable DATABASE_URL)

import app from '../server/src/app.js';

export default app;
