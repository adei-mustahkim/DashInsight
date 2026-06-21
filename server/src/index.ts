// DashInsight - Local Dev Server Entry Point
// (Untuk production/Vercel, gunakan /api/index.ts di root project)
import { config } from './config/index.js';
import app from './app.js';

// Start server (local dev only)
app.listen(config.port, () => {
  console.log(`[DashInsight] Server running on port ${config.port}`);
  console.log(`[DashInsight] Environment: ${config.nodeEnv}`);
});
