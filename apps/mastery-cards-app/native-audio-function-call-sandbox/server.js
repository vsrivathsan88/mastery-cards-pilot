/**
 * Cloud Run Production Server
 * Serves static frontend + provides secure Gemini API access
 * 
 * NO API KEY NEEDED - Uses Google service account authentication!
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Trust proxy (Cloud Run sits behind Google's load balancer)
app.set('trust proxy', true);

// Enable CORS for all origins (adjust in production if needed)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Parse JSON bodies
app.use(express.json());

// Health check endpoint (required for Cloud Run)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'mastery-cards',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// API endpoint to get Gemini credentials
// In Cloud Run, this will use Application Default Credentials (service account)
// No API key needed!
app.post('/api/gemini-token', async (req, res) => {
  try {
    // Check if we're running in Google Cloud (has metadata server)
    const isGoogleCloud = process.env.GOOGLE_CLOUD_PROJECT || 
                          process.env.K_SERVICE || 
                          process.env.FUNCTION_NAME;

    if (isGoogleCloud) {
      // Use service account authentication (secure!)
      const { GoogleAuth } = require('google-auth-library');
      const auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
      });
      
      const client = await auth.getClient();
      const accessToken = await client.getAccessToken();
      
      res.json({
        success: true,
        useServiceAccount: true,
        token: accessToken.token,
        expiresIn: 3600 // 1 hour
      });
    } else {
      // Fallback for local development - use API key from env
      const apiKey = process.env.VITE_GEMINI_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({
          success: false,
          error: 'No authentication available. Set VITE_GEMINI_API_KEY for local dev.'
        });
      }
      
      res.json({
        success: true,
        useServiceAccount: false,
        apiKey: apiKey
      });
    }
  } catch (error) {
    console.error('[Server] Auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get authentication',
      details: error.message
    });
  }
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1d', // Cache static assets for 1 day
  etag: true
}));

// SPA fallback - serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════╗
║   🚀 Mastery Cards Production Server  ║
╠════════════════════════════════════════╣
║  Port:        ${PORT.toString().padEnd(25)}║
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(25)}║
║  Frontend:    Static files from /dist ║
║  Auth:        Service Account (secure)║
║  Status:      ✅ Running               ║
╚════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
