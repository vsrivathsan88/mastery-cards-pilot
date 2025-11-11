/**
 * Simple Express server for ephemeral token generation
 * This keeps API keys secure on the server side
 */
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Endpoint to generate ephemeral tokens for OpenAI Realtime API
app.post('/api/realtime/token', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY not configured on server' });
  }

  const sessionConfig = {
    model: 'gpt-4o-realtime-preview-2024-10-01',
    voice: 'sage',
    instructions: req.body.instructions || 'You are a helpful assistant.',
    modalities: ['text', 'audio'],
    input_audio_format: 'pcm16',
    output_audio_format: 'pcm16',
    input_audio_transcription: {
      model: 'whisper-1'
    },
    turn_detection: {
      type: 'server_vad',
      threshold: 0.5,
      prefix_padding_ms: 300,
      silence_duration_ms: 500
    },
    temperature: 0.8,
  };

  try {
    const response = await fetch(
      'https://api.openai.com/v1/realtime/sessions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionConfig),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'Failed to generate ephemeral token',
        details: errorText 
      });
    }

    const data = await response.json();
    
    // Return the ephemeral token
    res.json({
      client_secret: data.client_secret.value,
      expires_at: data.client_secret.expires_at,
    });
  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🚀 Token server running on http://localhost:${PORT}`);
  console.log(`📍 Ephemeral token endpoint: POST http://localhost:${PORT}/api/realtime/token`);
});
