/**
 * Simple Express server for ephemeral token generation
 * This keeps API keys secure on the server side
 */
import 'dotenv/config'; // Load .env file
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Claude API proxy for mastery evaluation
app.post('/api/claude/evaluate', async (req, res) => {
  const claudeKey = process.env.CLAUDE_API_KEY;
  
  if (!claudeKey) {
    return res.status(500).json({ error: 'CLAUDE_API_KEY not configured on server' });
  }

  try {
    const response = await fetch(
      'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',
        headers: {
          'x-api-key': claudeKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify(req.body),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'Claude API error',
        details: errorText 
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Claude evaluation error:', error);
    res.status(500).json({ error: 'Failed to evaluate with Claude' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Claude API health check
app.get('/api/claude/health', async (req, res) => {
  const claudeKey = process.env.CLAUDE_API_KEY;
  
  if (!claudeKey) {
    return res.status(500).json({ 
      status: 'error',
      error: 'CLAUDE_API_KEY not configured' 
    });
  }

  try {
    // Test with a minimal request
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': claudeKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({
        status: 'error',
        error: `Claude API returned ${response.status}`,
        details: errorText
      });
    }

    res.json({ 
      status: 'ok',
      message: 'Claude API connection successful' 
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: 'Failed to connect to Claude API',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

app.listen(PORT, async () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📍 Claude proxy endpoint: POST http://localhost:${PORT}/api/claude/evaluate`);
  console.log(`📍 Claude health check: GET http://localhost:${PORT}/api/claude/health`);
  
  // Test Claude API connection on startup
  console.log('\n🔍 Testing Claude API connection...');
  const claudeKey = process.env.CLAUDE_API_KEY;
  
  if (!claudeKey) {
    console.error('❌ CLAUDE_API_KEY not configured!');
    console.error('⚠️  Claude evaluation will not work. Add CLAUDE_API_KEY to .env file.');
    return;
  }
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': claudeKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }]
      })
    });

    if (response.ok) {
      console.log('✅ Claude API connection successful!');
    } else {
      const errorText = await response.text();
      console.error(`❌ Claude API test failed: ${response.status}`);
      console.error('Details:', errorText);
      console.error('⚠️  Claude evaluation will not work properly.');
    }
  } catch (error) {
    console.error('❌ Failed to connect to Claude API:', error instanceof Error ? error.message : error);
    console.error('⚠️  Check your internet connection and API key.');
  }
  
  console.log('');
});
