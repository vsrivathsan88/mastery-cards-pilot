# OpenAI Realtime Connection Troubleshooting

## Issue: WebSocket Not Connecting

If you see logs like:
```
[OpenAI] Connecting to Realtime API...
[OpenAI] Already connected or connecting (repeated)
```

But never see `[OpenAI] ✅ Connected`, try these steps:

### 1. Check API Key Type ⚠️

**Most Common Issue:** Project-scoped keys (`sk-proj-...`) may not have access to the Realtime API.

**Solution:**
- Go to https://platform.openai.com/api-keys
- Create a **new standard API key** (not project-scoped)
- The key should start with `sk-` (not `sk-proj-`)
- Update your `.env` file with the new key
- Restart the dev server

### 2. Check Realtime API Access

The Realtime API is in beta and may require:
- Tier 1 or higher API access
- Explicit beta program enrollment
- Valid payment method on file

**Check your access:**
- Go to https://platform.openai.com/settings/organization/limits
- Verify you have API access
- Check if "Realtime API" is enabled

### 3. Check Browser Console

Look for WebSocket errors in the browser console:
- Right-click → Inspect → Console tab
- Look for red WebSocket errors
- Check the Network tab → WS filter for WebSocket connections

Common errors:
- **401 Unauthorized** → API key invalid or lacks permissions
- **403 Forbidden** → API key doesn't have Realtime API access
- **Connection refused** → Network/firewall blocking WebSocket

### 4. Verify Environment Variables

```bash
# Check if keys are loaded
cat .env | grep OPENAI
```

Make sure:
- File is named `.env` (not `.env.template`)
- Located in the project root
- Dev server was restarted after changes

### 5. Test API Key

Test your API key with a simple fetch:
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Should return a list of models. If not, the key is invalid.

### 6. Network Issues

If behind a corporate firewall/proxy:
- WebSocket connections may be blocked
- Try from a different network
- Check browser console for CORS/security errors

## Success Signs ✅

When working correctly, you'll see:
```
[App] 🔧 Initializing OpenAI Realtime client...
[OpenAI] Connecting to Realtime API...
[OpenAI] WebSocket created, waiting for connection...
[OpenAI] ✅ Connected
[OpenAI] Session ready
[OpenAI] ✅ Microphone started
[App] ✅ OpenAI connected
[App] ✅ Microphone active
```

## Getting Help

If still stuck, check:
1. Console logs for specific error messages
2. Browser Network tab → WS connections
3. OpenAI API status: https://status.openai.com/
4. OpenAI Realtime API docs: https://platform.openai.com/docs/guides/realtime

## Recent Changes

Latest commit adds:
- Detailed connection logging
- API key format warnings
- 10-second connection timeout
- Better error messages

Refresh the page and check console for new diagnostic info.
