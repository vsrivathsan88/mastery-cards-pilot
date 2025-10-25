# Onboarding Integration Guide

## Overview

The onboarding flow captures the child's name and avatar, which are then persisted and used throughout the entire lesson experience.

## Data Flow

```
Onboarding → localStorage → App State → UserContext → All Components
```

### 1. **Onboarding Capture** (`components/onboarding/`)

- `NameInput.tsx`: Captures child's name (max 20 chars)
- `AvatarSelection.tsx`: Child selects an emoji avatar
- `Onboarding.tsx`: Saves data to localStorage as `simili_user`

**Stored Data Structure:**
```typescript
{
  name: string,
  avatar: string (emoji),
  hasCompletedOnboarding: boolean
}
```

### 2. **App State Management** (`App.tsx`)

- Loads `simili_user` from localStorage on mount
- Creates `UserProvider` with userData
- Prevents access to lessons until onboarding complete
- Provides Reset button for debugging

### 3. **User Context** (`contexts/UserContext.tsx`)

Provides userData globally to all components:
```typescript
const { userData, updateUserData } = useUser();
// userData: { name, avatar, hasCompletedOnboarding }
```

## Integration Points

### ✅ Visual Display

**GameHeader** (`components/game/GameHeader.tsx`)
- Shows child's avatar in a circular badge
- Displays child's name prominently
- Replaces generic "SIMILI TUTOR" branding when user data available

```tsx
{userData && (
  <div>
    <div>{userData.avatar}</div>
    <div>{userData.name}</div>
  </div>
)}
```

### ✅ AI Personalization

**PromptBuilder** (`services/PromptBuilder.ts`)
- Static method `setStudentName(name)` replaces "the student" with child's name
- System prompts automatically personalized
- Example: "Guide the student..." → "Guide Alex..."

**StreamingConsole** (`components/demo/streaming-console/StreamingConsole.tsx`)
- Calls `PromptBuilder.setStudentName()` on mount with userData
- Pi will refer to child by name in conversations

```tsx
useEffect(() => {
  if (userData?.name) {
    PromptBuilder.setStudentName(userData.name);
  }
}, [userData?.name]);
```

## How to Use in New Components

### Access User Data

```tsx
import { useUser } from '@/contexts/UserContext';

function MyComponent() {
  const { userData } = useUser();
  
  if (!userData) return null;
  
  return (
    <div>
      <span>{userData.avatar}</span>
      <h1>Welcome, {userData.name}!</h1>
    </div>
  );
}
```

### Update User Data

```tsx
const { userData, updateUserData } = useUser();

// Update avatar
updateUserData({ avatar: '🦄' });

// Updates both state and localStorage
```

## Features

✅ **Persistent across sessions** - Data saved to localStorage
✅ **Avatar visible in header** - Shows throughout lesson
✅ **Name in AI prompts** - Pi uses child's name naturally
✅ **Reset available** - Top-right reset button for debugging
✅ **Type-safe** - Full TypeScript support

## Future Enhancements

- [ ] Show avatar in Teacher Panel
- [ ] Add name to celebration messages
- [ ] Store learning preferences
- [ ] Track progress per child (multi-user support)
- [ ] Add profile editing screen

## Testing

1. Complete onboarding with name "Alex" and avatar "🦊"
2. Check GameHeader shows "🦊 Alex"
3. Check console for: `[StreamingConsole] Student name set for prompts: Alex`
4. Verify Pi says "Alex" in conversations
5. Click Reset button - should return to onboarding
6. Refresh page - data should persist

## Architecture Diagram

```
┌─────────────────┐
│   Onboarding    │
│  (Name/Avatar)  │
└────────┬────────┘
         │ saves
         ▼
┌─────────────────┐
│  localStorage   │
│  'simili_user'  │
└────────┬────────┘
         │ loads
         ▼
┌─────────────────┐
│     App.tsx     │
│  (Main State)   │
└────────┬────────┘
         │ provides
         ▼
┌─────────────────┐
│  UserContext    │
│   (Provider)    │
└────────┬────────┘
         │ consumed by
    ┌────┴────┬────────────┬──────────────┐
    ▼         ▼            ▼              ▼
GameHeader  PiPrompt   Components   TeacherPanel
```

## Related Files

- `contexts/UserContext.tsx` - Context provider
- `App.tsx` - Root state management
- `components/onboarding/` - Onboarding flow
- `components/game/GameHeader.tsx` - Header display
- `services/PromptBuilder.ts` - AI personalization
- `components/demo/streaming-console/StreamingConsole.tsx` - Main lesson component
