I sti# Browser Refresh Instructions

## The Problem
Browser is caching old JavaScript code. Console logs are minimal because old code is still running.

## Solution: Hard Refresh

### Chrome/Edge (Mac)
```
Cmd + Shift + R
```
Or:
1. Open DevTools (F12)
2. Right-click the refresh button
3. Click "Empty Cache and Hard Reload"

### Chrome/Edge (Windows)
```
Ctrl + Shift + R
```
Or:
1. Open DevTools (F12)
2. Right-click the refresh button
3. Click "Empty Cache and Hard Reload"

### Firefox (Mac)
```
Cmd + Shift + R
```

### Firefox (Windows)
```
Ctrl + F5
```

### Safari (Mac)
```
Cmd + Option + R
```

## Complete Cache Clear Steps

1. **Open DevTools** (F12 or Cmd+Option+I)
2. **Go to Network Tab**
3. **Check "Disable cache"** checkbox
4. **Hard refresh** (Cmd+Shift+R)
5. **Close all tabs** for localhost:5175
6. **Reopen** http://localhost:5175

## Verify New Code is Loaded

After refresh, you should see these logs:
```
[LiveAPIProvider] Initializing with API key: Present
[App] Minimal config set for: YourName
[ControlTray] Button clicked - calling connect()...
[useLiveApi] 🔌 connect() called
[useLiveApi] client.status: disconnected
[useLiveApi] config: {}
[useLiveApi] Calling client.connect()...
[GenAILiveClient] connect() called, status: disconnected
[GenAILiveClient] Setting status to connecting...
[GenAILiveClient] Calling this.client.live.connect()...
[GenAILiveClient] Model: gemini-2.0-flash-exp
[GenAILiveClient] Config: {}
```

If you only see 1-2 logs, the old code is still cached!

## Nuclear Option: Clear Everything

If hard refresh doesn't work:

### Chrome/Edge
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"
4. Then go to: Chrome Settings → Privacy → Clear browsing data
5. Select "Cached images and files"
6. Time range: "Last hour"
7. Click "Clear data"

### Firefox
1. Open DevTools (F12)
2. Go to: Firefox Menu → Settings → Privacy & Security
3. Click "Clear Data"
4. Check "Cached Web Content"
5. Click "Clear"

### Safari
1. Develop menu → Empty Caches
2. Or: Safari → Clear History → Last Hour

## Verify Dev Server Restarted

Check that new code was compiled:
```bash
# Should show dev server running on port 5175
lsof -ti:5175

# Should show recent timestamp
ls -la src/hooks/use-live-api.ts
```

## Test Fresh Load

1. Close ALL browser tabs for localhost:5175
2. Open new incognito/private window
3. Go to http://localhost:5175
4. Check console - should see MANY logs
