/**
 * Vercel Serverless Function - Claude Evaluation API
 * 
 * Proxies Claude API requests to keep API key secure on server-side.
 * This runs as a serverless function on Vercel infrastructure.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate API key is configured
  if (!process.env.CLAUDE_API_KEY) {
    console.error('[Claude API] Missing CLAUDE_API_KEY environment variable');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const { model, max_tokens, temperature, messages } = req.body;

  // Validate request body
  if (!model || !messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  try {
    console.log('[Claude API] Evaluating mastery...');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens,
        temperature,
        messages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Claude API] Error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'Claude API request failed',
        details: errorText 
      });
    }

    const data = await response.json();
    console.log('[Claude API] Evaluation complete');
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('[Claude API] Exception:', error);
    return res.status(500).json({ 
      error: 'Evaluation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
