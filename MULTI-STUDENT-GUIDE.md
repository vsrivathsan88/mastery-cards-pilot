# Multi-Student Session Management Guide

## ✅ Build Status: SUCCESS (551KB)

---

## 🎯 Overview

The system now tracks multiple students and multiple sessions per student, with comprehensive session history and analytics.

---

## 📝 Filename Format

**New Format:** `{StudentName}-session{N}-{YYYY-MM-DD}-{HH-MM-SS}.json`

**Examples:**
```
Emma-session1-2025-11-09-14-30-45.json
Emma-session2-2025-11-09-15-22-10.json
Liam-session1-2025-11-09-14-35-20.json
Sophia-session1-2025-11-10-09-15-33.json
```

**Benefits:**
- ✅ Clear student identification
- ✅ Session number visible in filename
- ✅ Sortable by date/time
- ✅ No collision even if same student tests multiple times
- ✅ Easy to find specific sessions

---

## 💾 localStorage Tracking

**What's Stored:**

```javascript
// Session count per student
localStorage['session-count-Emma'] = "2"
localStorage['session-count-Liam'] = "1"

// Session history per student
localStorage['sessions-Emma'] = [
  "Emma-session1-1699545045123",
  "Emma-session2-1699545732456"
]
```

**Why localStorage:**
- ✅ Persists across page refreshes
- ✅ Tracks session numbers automatically
- ✅ Enables session history lookup
- ✅ Works in browser without server

---

## 📊 Enhanced JSON Structure

**New Fields Added:**

```json
{
  "sessionId": "Emma-session2-1699545732456",
  "sessionNumber": 2,
  "studentName": "Emma",
  
  "startTimeFormatted": "2025-11-09T14:30:45.123Z",
  "endTimeFormatted": "2025-11-09T14:42:15.789Z",
  "durationMinutes": 12,
  "averageTimePerCard": 90000,
  
  "totalTurns": 45,
  "studentResponses": 22,
  "piResponses": 18,
  "systemBlocks": 2,
  "pointsAwarded": 5,
  
  "previousSessionCount": 1,
  "previousSessionIds": [
    "Emma-session1-1699545045123"
  ],
  
  "transcript": [...]
}
```

**Key Additions:**
- **sessionNumber**: Which attempt is this for this student?
- **previousSessionCount**: How many times has this student practiced before?
- **previousSessionIds**: References to all their past sessions
- **Quality metrics**: Blocks, turns, responses
- **Time metrics**: Duration, average per card

---

## 🔍 TranscriptManager API

**Access in browser console:**

```javascript
// Get all students who have tested
TranscriptManager.getAllStudents()
// Returns: [{studentName: "Emma", sessionCount: 2, ...}, ...]

// Get session count for specific student
TranscriptManager.getSessionCount("Emma")
// Returns: 2

// Get all session IDs for specific student
TranscriptManager.getStudentSessions("Emma")
// Returns: ["Emma-session1-...", "Emma-session2-..."]

// Get global statistics
TranscriptManager.getGlobalStats()
// Returns: {
//   totalStudents: 5,
//   totalSessions: 12,
//   averageSessionsPerStudent: 2.4,
//   mostActiveStudent: {...},
//   studentNames: ["Emma", "Liam", ...]
// }

// Export summary of all sessions
TranscriptManager.exportSummary()
// Downloads: session-summary-2025-11-09.json

// Clear data for one student
TranscriptManager.clearStudentData("Emma")

// Clear all data
TranscriptManager.clearAllData()
```

---

## 🧪 Testing Scenarios

### Scenario 1: Multiple Students, One Session Each

**Test:**
1. Emma enters name → completes session
2. Liam enters name → completes session
3. Sophia enters name → completes session

**Expected Files:**
```
Emma-session1-2025-11-09-14-30-45.json
Liam-session1-2025-11-09-14-35-20.json
Sophia-session1-2025-11-09-14-40-12.json
```

**localStorage:**
```javascript
session-count-Emma: "1"
session-count-Liam: "1"
session-count-Sophia: "1"
sessions-Emma: ["Emma-session1-..."]
sessions-Liam: ["Liam-session1-..."]
sessions-Sophia: ["Sophia-session1-..."]
```

---

### Scenario 2: Same Student, Multiple Sessions

**Test:**
1. Emma completes session #1 at 2:30pm
2. Emma completes session #2 at 3:15pm
3. Emma completes session #3 at 4:00pm

**Expected Files:**
```
Emma-session1-2025-11-09-14-30-45.json
Emma-session2-2025-11-09-15-15-22.json
Emma-session3-2025-11-09-16-00-18.json
```

**Session 3 JSON includes:**
```json
{
  "sessionNumber": 3,
  "previousSessionCount": 2,
  "previousSessionIds": [
    "Emma-session1-1699545045123",
    "Emma-session2-1699549522456"
  ]
}
```

**Analysis Use Case:**
- Compare Emma's 1st attempt vs 3rd attempt
- Did she improve? (points, time, blocks)
- Is she gaming the system? (patterns)

---

### Scenario 3: Same Name, Different Days

**Test:**
1. Emma tests on Monday → session 1
2. Emma tests on Wednesday → session 2

**Expected:**
- Session numbers continue (not reset)
- Monday: `Emma-session1-2025-11-09-14-30-45.json`
- Wednesday: `Emma-session2-2025-11-11-09-20-10.json`

**If you want fresh start:**
```javascript
// Reset Emma's history
TranscriptManager.clearStudentData("Emma")
```

---

## 📈 Analysis Examples

### Compare First vs Later Attempts

**Emma's Session 1:**
```json
{
  "sessionNumber": 1,
  "durationMinutes": 15,
  "totalPoints": 120,
  "systemBlocks": 5,
  "studentResponses": 25
}
```

**Emma's Session 3:**
```json
{
  "sessionNumber": 3,
  "durationMinutes": 10,
  "totalPoints": 180,
  "systemBlocks": 0,
  "studentResponses": 20
}
```

**Analysis:**
- ✅ Improved: Points up 50%, blocks eliminated
- ✅ More efficient: 5 minutes faster, fewer turns needed
- **Conclusion:** Emma learned and improved

---

### Detect Gaming Patterns

**Suspicious Session:**
```json
{
  "sessionNumber": 5,
  "durationMinutes": 3,
  "totalPoints": 200,
  "systemBlocks": 0,
  "studentResponses": 16,
  "averageTimePerCard": 22500
}
```

**Red Flags:**
- 🚩 3 minutes total (too fast)
- 🚩 22.5 seconds per card average (rushing)
- 🚩 Session 5 (has practice)
- 🚩 Zero blocks (knows how to avoid detection)

**Action:** Review transcript to see if responses are substantive

---

### Cohort Analysis

**Use TranscriptManager.exportSummary():**

```json
{
  "exportDate": "2025-11-09T18:00:00.000Z",
  "totalStudents": 5,
  "totalSessions": 12,
  "students": [
    {
      "name": "Emma",
      "sessionCount": 3,
      "lastSession": "2025-11-09T16:00:18.000Z"
    },
    {
      "name": "Liam",
      "sessionCount": 2,
      "lastSession": "2025-11-09T15:30:45.000Z"
    },
    ...
  ]
}
```

**Questions You Can Answer:**
- Who practiced most?
- Who hasn't tested recently?
- Average sessions per student?
- Total testing volume?

---

## 🧹 Data Management

### Clear One Student's Data

**When:**
- Student name was misspelled
- Want to reset their session count
- Testing with fake names

**How:**
```javascript
TranscriptManager.clearStudentData("TestStudent")
```

**Effect:**
- Removes session count
- Removes session history
- Future sessions start at session 1
- Previous JSON files still exist in Downloads

---

### Clear All Data

**When:**
- End of testing period
- Fresh start for new cohort
- Development testing cleanup

**How:**
```javascript
TranscriptManager.clearAllData()
```

**Effect:**
- Clears all localStorage data
- All students reset to session 1
- Previous JSON files still exist in Downloads

---

### Organize Downloaded Files

**Manual Organization:**

```bash
# Create folder structure
mkdir -p transcripts/2025-11-09
mkdir -p transcripts/2025-11-10

# Move files by date
mv Emma-session1-2025-11-09-*.json transcripts/2025-11-09/
mv Emma-session2-2025-11-10-*.json transcripts/2025-11-10/

# Or organize by student
mkdir -p transcripts/Emma
mkdir -p transcripts/Liam
mv Emma-*.json transcripts/Emma/
mv Liam-*.json transcripts/Liam/
```

---

## 🎓 Use Cases

### Use Case 1: Classroom Testing

**Setup:**
- 25 students in class
- Each tests once during period

**Expected:**
- 25 JSON files download (one per student)
- Each file: `{Name}-session1-{date}-{time}.json`
- Run `TranscriptManager.getGlobalStats()` for class summary

**Analysis:**
- Which students struggled? (high block count)
- Which students rushed? (low duration)
- Average class performance? (mean points)

---

### Use Case 2: Individual Progress Tracking

**Setup:**
- 5 students doing multiple practice sessions
- Track improvement over time

**Expected:**
- Multiple files per student
- Session numbers increment automatically
- Each session references previous sessions

**Analysis:**
- Compare session 1 vs session 3 for each student
- Did points improve?
- Did blocks decrease?
- Did time decrease? (efficiency)

---

### Use Case 3: System Validation

**Setup:**
- Researchers testing robustness
- Multiple sessions with different strategies

**Expected:**
- Clear session numbering for each test strategy
- Full transcripts for pattern analysis
- Block counts showing detection working

**Analysis:**
- Which attacks got through? (low blocks, high points)
- Which attacks were caught? (high blocks)
- False positive rate?

---

## 📊 Console Logging

**When session completes, console shows:**

```javascript
[App] 💾 Transcript saved: Emma-session2-2025-11-09-15-15-22.json

[App] 📊 Session stats: {
  sessionNumber: 2,
  duration: "12 minutes",
  points: 150,
  blocks: 1,
  responses: 22
}

[App] 🌍 Global stats: {
  totalStudents: 3,
  totalSessions: 5,
  averageSessionsPerStudent: 1.7,
  mostActiveStudent: {
    studentName: "Emma",
    sessionCount: 2
  },
  studentNames: ["Emma", "Liam", "Sophia"]
}
```

---

## 🔧 Troubleshooting

### Problem: Student's session number seems wrong

**Check:**
```javascript
TranscriptManager.getSessionCount("Emma")
```

**Fix:**
```javascript
// Clear and restart
TranscriptManager.clearStudentData("Emma")
```

---

### Problem: Too many test sessions cluttering data

**Check:**
```javascript
TranscriptManager.getAllStudents()
// See all stored students
```

**Fix:**
```javascript
// Clear specific test accounts
TranscriptManager.clearStudentData("Test1")
TranscriptManager.clearStudentData("Test2")

// Or clear everything
TranscriptManager.clearAllData()
```

---

### Problem: Can't find specific transcript file

**Solution:**
- Check Downloads folder
- Search by student name: `Emma-session*.json`
- Check date: `*2025-11-09*.json`
- Check console logs for exact filename

---

## 🎯 Best Practices

### 1. Name Consistency
- Use consistent spelling/capitalization
- "Emma" vs "emma" are different students
- "Emma Smith" vs "Emma" are different

### 2. Regular Cleanup
- Clear test data before real students
- Export summary periodically
- Archive old transcripts

### 3. Analysis Workflow
1. Collect all sessions (let them download)
2. Export summary for overview
3. Review individual transcripts for details
4. Clear test data
5. Repeat for next testing session

### 4. Privacy
- Student names are stored in localStorage
- Transcripts include student names
- Clear data after analysis if needed
- Consider using student IDs instead of full names

---

## ✅ Summary

**What Changed:**
- ✅ Filenames include student name, session number, date, time
- ✅ Session numbers tracked per student in localStorage
- ✅ Each JSON includes previous session references
- ✅ Enhanced metrics (blocks, turns, average time)
- ✅ TranscriptManager API for analysis
- ✅ Global stats logged after each session
- ✅ No collisions even with multiple sessions

**Multiple students testing? No problem.**
**Same student testing multiple times? Tracked automatically.**
**Need to analyze patterns? Full data available.**

**The system is ready for classroom-scale testing.**
