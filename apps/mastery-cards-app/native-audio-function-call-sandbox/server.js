/**
 * Cloud Run Server
 * Serves frontend + provides secure Gemini API access
 */

const express = require('express');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');

const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS and JSON parsing
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check endpoint (required for Cloud Run)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'mastery-cards-app',
    timestamp: new Date().toISOString()
  });
});

// API endpoint to get authenticated Gemini access
app.post('/api/gemini-auth', async (req, res) => {
  try {
    // Use service account authentication (no API key needed!)
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    
    res.json({
      success: true,
      // Send token to frontend - it's short-lived (1 hour) and scoped
      accessToken: accessToken.token
    });
  } catch (error) {
    console.error('[Server] Auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to authenticate with Gemini API'
    });
  }
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback - serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════╗
║   🚀 Mastery Cards on Cloud Run       ║
╠════════════════════════════════════════╣
║  Port:     ${PORT}                        ║
║  Frontend: Static files from /dist    ║
║  Auth:     Service Account (no key!)  ║
║  Status:   ✅ Running                  ║
╚════════════════════════════════════════╝
  `);
});
