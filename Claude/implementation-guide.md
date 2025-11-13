# REVISED SYSTEM PROMPT - IMPLEMENTATION GUIDE

## 🎯 Key Changes from Original

### 1. **Pi's Role: From Assessor → Collaborative Explorer**

**Before:**
- "Your goal is... not teaching"
- Positioned as passive judge checking mastery criteria
- "Confused alien who needs teaching" (contradicts your core principle)

**After:**
- "Alien scientist studying how Earth kids understand math"
- Active discovery partner who thinks aloud
- Knowledgeable peer who explores Earth contexts together
- Maintains credibility while being genuinely curious

**Why this matters:** Children engage more deeply when they feel like co-investigators rather than test-takers.

---

### 2. **Conversation Flow: From Rigid Protocol → Natural Discovery**

**Before:**
```
Q1 (Observation) → Q2 (Explanation) → Judge → Optional Q3 → Decide
Max 3 questions, mechanical pattern
```

**After:**
```
Phase 1: Notice Together (open exploration)
Phase 2: Explore Thinking (probe deeper)  
Phase 3: Connect & Challenge (if needed)
Natural conversation rhythm, 3-4+ exchanges expected
```

**Why this matters:** Voice conversations feel robotic when following strict turn-taking rules. Natural discovery creates better engagement and more authentic assessment.

---

### 3. **Questions: From Funneling → Focusing**

**Before:**
- "If one piece was bigger, would they still be equal?" (YES/NO)
- "Would this still be [fraction] if we made the pieces different sizes?" (obvious answer)

**After:**
- "Tell me more about that"
- "What makes you think that?"
- "Hmm, so you're saying... [paraphrase their idea]"

**Why this matters:** Funneling questions lead students to predetermined answers. Focusing questions open up mathematical thinking.

---

### 4. **Tool Calling: From Ambiguous → Crystal Clear**

**Before:**
- Vague conditions ("GOT IT ✅")
- Unclear when to call vs when to wait
- No explicit examples

**After:**
- **5 explicit conditions** that must ALL be true before award_mastery_points
- **Specific scenarios** for when to call show_next_card
- **Code examples** showing exact function signatures
- **NEVER call if** anti-patterns explicitly listed

**Critical addition:**
```typescript
// Basic understanding
award_mastery_points({
  cardId: currentCard.id,
  points: 30,
  celebration: "Nice! You explained that clearly!"
})

// Advanced understanding (BOTH points together)
award_mastery_points({
  cardId: currentCard.id,
  points: 60, // basic + advanced combined
  celebration: "Whoa! You really understand this deeply!"
})
```

**Why this matters:** This was your #1 pain point. Explicit examples with exact parameters prevent tool calling unpredictability.

---

### 5. **Voice Interaction: Added Real-World Patterns**

**New additions:**
- Handling mid-thought pauses
- Unclear audio recovery
- Interruption handling (VAD)
- "I don't know" responses
- Response length guidelines (1-2 sentences max)

**Example pattern:**
```
If ${studentGreeting} pauses mid-thought:
- Stay silent for 2-3 seconds
- If still silent: "Take your time"
```

**Why this matters:** Gemini Live API is voice-first. These patterns make Pi feel natural in spoken conversation.

---

### 6. **Personality: From TikTok Creator → Curious Science Partner**

**Before:**
- "Casual and energetic (like a TikTok creator)"
- Could feel performative

**After:**
- "Curious science YouTuber meets enthusiastic lab partner"
- Genuine excitement about discoveries
- Think-aloud modeling built into personality

**Why this matters:** The science explorer metaphor aligns with your "alien studying Earth" narrative and feels more authentic for learning.

---

### 7. **Misconception Cards: Genuine Confusion vs Teaching Moment**

**Critical clarification added:**
```
IMPORTANT: On misconception cards, Pi is GENUINELY CONFUSED 
about the concept (not just pretending). You believe your 
wrong thinking until ${studentGreeting} explains why you're wrong.
```

**Why this matters:** This positions students as teachers without undermining Pi's mathematical credibility on other cards.

---

## 🔧 Technical Implementation Notes

### Gemini 2.5 Flash Optimizations

1. **Prompt Structure:**
   - Used clear section headers (# ## ###) for better parsing
   - Bullet points and code blocks for structure
   - Total length: ~2800 words (well within Flash's capacity)

2. **Context Window Management:**
   - Current card details injected dynamically
   - Points/level status included for continuity
   - Previous conversation maintained by Live API session

3. **Function Calling Specifics:**
   ```typescript
   // Define functions in your client code
   const tools = [
     {
       name: "award_mastery_points",
       description: "Award points when student demonstrates understanding",
       parameters: {
         type: "object",
         properties: {
           cardId: { type: "string" },
           points: { type: "number" },
           celebration: { type: "string" }
         },
         required: ["cardId", "points", "celebration"]
       }
     },
     {
       name: "show_next_card",
       description: "Move to next learning image",
       parameters: { type: "object", properties: {} }
     }
   ];
   ```

4. **Voice Configuration:**
   ```typescript
   const config = {
     responseModalities: ["AUDIO"],
     speechConfig: {
       voiceConfig: {
         prebuiltVoiceConfig: {
           voiceName: "Puck" // or your chosen voice
         }
       },
       languageCode: "en-US"
     },
     // Enable thinking for hybrid reasoning
     thinkingConfig: {
       thinkingBudget: 1024,
       includeThoughts: false // keep thoughts internal
     }
   };
   ```

---

## 📊 Expected Behavior Changes

### Tool Calling Predictability

**Before:** Inconsistent timing, sometimes calling show_next_card immediately

**After:** 
- Minimum 2-3 exchanges before any tool call
- award_mastery_points ALWAYS called before show_next_card (when understanding demonstrated)
- Clear decision tree prevents premature progression

**Metric to track:** Average exchanges per card (should be 3-5, not 1-2)

---

### Conversation Quality

**Before:** Could feel like interrogation with yes/no questions

**After:**
- Open-ended exploration
- Think-aloud modeling from Pi
- Natural follow-up questions
- Collaborative discovery language

**Metric to track:** 
- Child's average utterance length (should increase)
- Spontaneous elaborations (child volunteers more without prompting)

---

### Engagement Signals

**Before:** Transactional assessment feel

**After:**
- Mission narrative creates stakes
- Pi's genuine curiosity models enthusiasm
- "Discovering together" language creates partnership

**Metric to track:**
- Session completion rate
- Child re-engagement in subsequent sessions
- Spontaneous questions/comments from child

---

## ⚠️ Potential Issues & Mitigations

### Issue 1: Pi Being Too "Preachy"

**Risk:** Gemini 2.5 Flash known for preachy tone in model card

**Mitigation in prompt:**
- Explicit personality guidelines emphasize brevity
- Examples show short, punchy responses
- "NOT like this" anti-patterns included
- 1-2 sentence maximum reinforced multiple times

**Monitor:** If Pi gives long explanations, add this to system instructions:
```
CRITICAL: Keep every response to 1-2 sentences maximum. 
If your response is more than 2 sentences, stop and rephrase shorter.
```

---

### Issue 2: Tool Calling on Wrong Signals

**Risk:** Model calls tools before sufficient evidence

**Mitigation in prompt:**
- 5-point checklist before award_mastery_points
- Explicit "NEVER call if" conditions
- Code examples with exact parameters
- Minimum exchange requirement (2-3 back-and-forths)

**Monitor:** Track tool calls per card:
- If award_mastery_points called after 1 exchange → prompt needs strengthening
- If show_next_card called without award_mastery_points → check if child was stuck (OK) or premature (needs fix)

---

### Issue 3: Not Probing Deeply Enough

**Risk:** Accepting surface-level responses

**Mitigation in prompt:**
- Evidence keywords must be mentioned
- "WHY or HOW" requirement explicit
- "Tell me more" / "What makes you think that?" modeled
- Phase 2 (Explore Thinking) is mandatory part of flow

**Monitor:** 
- Review transcripts for depth of child explanations
- If children consistently getting points without reasoning → strengthen evidence requirements

---

### Issue 4: Voice Conversation Flow Issues

**Risk:** Awkward pauses, unclear audio, interruption handling

**Mitigation in prompt:**
- Explicit voice patterns section
- Pause handling: "Stay silent 2-3 seconds, then 'Take your time'"
- Unclear audio: "I didn't quite catch that"
- VAD handling: Stop immediately when interrupted

**Additional implementation needed:**
```typescript
// In your client code
session.on('interrupted', () => {
  // Stop audio playback immediately
  stopAudioPlayback();
  // Pi's response will be truncated by VAD
});

session.on('unclear_audio', () => {
  // Handle in application layer if needed
  // Pi will ask for clarification naturally
});
```

---

## 🎯 Success Criteria

### Immediate (Week 1-2):
- [ ] Tool calls happen after 2+ exchanges (not 1)
- [ ] award_mastery_points called before show_next_card when understanding shown
- [ ] Response length averages 1-2 sentences
- [ ] Open-ended questions used (not yes/no)

### Short-term (Week 3-4):
- [ ] Children explain WHY, not just WHAT
- [ ] Average 3-5 exchanges per card
- [ ] Natural conversation flow (children interrupt, elaborate spontaneously)
- [ ] Pi uses think-aloud language ("Hmm, I'm noticing...")

### Long-term (Month 2-3):
- [ ] Session completion rates increase
- [ ] Children demonstrate deeper conceptual understanding
- [ ] Natural re-engagement in future sessions
- [ ] Parents/teachers report increased math confidence

---

## 🔄 Iteration Points

Based on real usage data, consider tuning:

1. **Evidence keyword lists** - Are they too strict? Too loose?
2. **Point thresholds** - Do advanced points need adjustment?
3. **Misconception card frequency** - Too many? Too few?
4. **Pi's personality** - Too enthusiastic? Not enough?
5. **Think-aloud frequency** - Does Pi model enough? Too much?

---

## 🚀 Deployment Checklist

Before production:

- [ ] Test with 5-10 real children across grade levels
- [ ] Verify tool calling happens at right moments
- [ ] Check average session length (target: 15-20 min)
- [ ] Confirm gem awards align with demonstrated understanding
- [ ] Test voice interruption handling
- [ ] Verify unclear audio recovery
- [ ] Check for "preachy" tone issues
- [ ] Measure response brevity (should be 1-2 sentences)
- [ ] Test misconception card teaching moments
- [ ] Verify mission narrative engagement

---

## 📚 Additional Resources

**Gemini 2.5 Flash Documentation:**
- Model card: https://storage.googleapis.com/model-cards/documents/gemini-2.5-flash.pdf
- Function calling: https://ai.google.dev/gemini-api/docs/function-calling
- Live API: https://ai.google.dev/gemini-api/docs/live

**Voice Interaction Best Practices:**
- Live API capabilities: https://ai.google.dev/gemini-api/docs/live-guide
- Voice Activity Detection: https://cloud.google.com/vertex-ai/generative-ai/docs/live-api/streamed-conversations

**Your Core Principles (from memory):**
- Pi as knowledgeable peer, not confused learner
- Focusing questions (open thinking) not funneling questions (lead to answer)
- Collaborative exploration through think-aloud strategies
- Mission-based narrative with interconnected problems
- Misconception-based learning at advanced levels

---

## 💡 Pro Tips

1. **For tool calling predictability:** Log every tool call with the conversation context that triggered it. Build a dataset of good/bad calls to further tune.

2. **For voice naturalness:** Record 10 sessions and listen for awkward moments. Where does conversation flow break? Add those patterns to prompt.

3. **For engagement:** Track where children drop off. Is it after certain cards? Specific interaction patterns? Use this to refine.

4. **For assessment validity:** Compare Pi's judgments with expert human assessment. Where do they diverge? Those are prompt tuning opportunities.

5. **For scalability:** Once stable, consider creating card-type templates (e.g., "equal parts template", "fraction comparison template") to accelerate content creation.

---

**Final note:** This prompt is designed to grow with your understanding. Treat it as a living document - every weird interaction is data for making Pi better. The structure is there for predictability; the personality is there for engagement. Balance both.

🛸 Good luck with Pi! Let me know what you discover in testing.
