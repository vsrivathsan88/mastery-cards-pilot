# Wonder-First Approach - Quick Start Guide

## TL;DR

**Two Problems → Two Solutions:**

1. ❌ **Math-heavy upfront** → ✅ **Wonder-first narrative arc**
2. ❌ **Static images** → ✅ **Dynamic image switching tool**

---

## The New Narrative Arc

```
┌─────────────────────────────┐
│ 1. WONDER & CURIOSITY       │
│    Story → Emotion → Care   │
│    "Luna's birthday cookie!"│
│    NO math terms yet        │
└─────────────────────────────┘
           ↓
┌─────────────────────────────┐
│ 2. EXPLORATION & INTUITION  │
│    Questions → Discovery    │
│    "How would YOU cut it?"  │
│    Build understanding      │
└─────────────────────────────┘
           ↓
┌─────────────────────────────┐
│ 3. NAMING & FORMALIZING     │
│    Terms → Symbols          │
│    "We call this equal..."  │
│    Math labels last         │
└─────────────────────────────┘
```

---

## Before vs After

### ❌ OLD (Math-Heavy)
```
Pi: "Look at this picture of kids sharing a cookie. 
What do you notice about these pieces? Would you 
want the smallest one? How would you make all 
the pieces equal in size?"

→ Uses "equal" immediately
→ Analytical question
→ No emotional hook
→ Feels like a test
```

### ✅ NEW (Wonder-First)
```
🎬 COVER IMAGE: Birthday party, whole cookie, excited kids

Pi: "It's Luna's birthday! She made the BIGGEST 
chocolate chip cookie ever - like, pizza-sized! 
Her friends Maya and Carlos come over... 
Three friends, one cookie... uh oh!"

[Student reacts]

🎬 SWITCH TO: Unequal pieces, kids' reactions

Pi: "Luna tried to cut it! Look at Carlos's face... 
which piece do you think HE got?"

Student: "The tiny one! He looks sad!"

Pi: "Yeah! 😢 If YOU got the tiny piece, how would 
YOU feel?"

Student: "Mad! Not fair!"

Pi: "NOT FAIR! Why isn't it fair?"

Student: "Some got more!"

Pi: "Exactly! Everyone should get the SAME AMOUNT. 
That's what fair means."

[LATER, after intuition is built]

Pi: "You know what? Mathematicians call 'same amount' 
by a special word - they say 'equal.' Equal means 
same. You've been finding equal parts this whole time!"

→ Story creates emotion
→ "Fair" before "equal"
→ Student discovers problem
→ Math terms after intuition
```

---

## Dynamic Image Switching

### New Tool: `show_image`

**Pi can now control when images appear!**

```typescript
{
  name: 'show_image',
  description: 'Display an image to support explanation',
  parameters: {
    imageId: string,  // e.g., "unequal-cookie-kids"
    context: string   // Why showing this image
  }
}
```

### Usage Example
```
Pi: "It's Luna's birthday party!"
[show_image: "cover-birthday-party"]

Pi: "Look! Three friends, one cookie. Oh no!"
[show_image: "unequal-cookie-kids"]

Pi: "See their faces? Which piece would you want?"
```

### Cover Images
```json
{
  "coverImage": {
    "id": "cover-birthday-party",
    "url": "/assets/fractions/birthday-party-cover.svg",
    "description": "Hook image - kids excited around whole cookie"
  }
}
```

---

## Implementation Plan

### Phase A: Image Tool (1-2 weeks)
```
✅ Create show_image tool definition
✅ Add tool handler
✅ Update LessonImage component
✅ Add cover image support
✅ Test tool calling
```

### Phase B: Lesson Redesign (2-3 weeks)
```
✅ Rewrite Act 1 with wonder-first
✅ Create cover image assets
✅ Update all milestone prompts
✅ Add storytelling to system prompt
✅ Test full lesson flow
```

---

## System Prompt Additions

### Wonder-First Guidelines
```
# Teaching Philosophy: Wonder First, Math Second

1. WONDER PHASE
   - Start with story/scenario
   - Use names, emotions, stakes
   - Ask "How would YOU feel?"
   - Everyday language ONLY
   
2. EXPLORATION PHASE  
   - Guide discovery through questions
   - Let them try and adjust
   - Build intuitive understanding
   
3. NAMING PHASE
   - Introduce math terms LAST
   - Connect to what they discovered
   - "We call this..." not "This is called..."

BAD: "Let's learn about equal parts. Equal means..."
GOOD: "Luna's trying to share a cookie! But look what happened..."
```

### Image Tool Guidelines
```
# Using Visual Aids

Use show_image to display images at key moments:
- Cover image at lesson start
- Story reveals ("look what happened!")
- Concept explanations ("let me show you...")
- Checkpoints ("compare these...")

Example:
Student: "I don't get what equal means"
You: "Let me show you..." [show_image: "equal-unequal-comparison"]
```

---

## Key Principles

### ✅ DO
- Start with story and emotion
- Use names (Luna, Carlos, Maya)
- Ask "How would YOU feel?"
- Build from fair/unfair to equal/unequal
- Let student discover concepts
- Math terms AFTER intuition
- Use show_image for storytelling

### ❌ DON'T
- Start with definitions
- Use math terms immediately
- Skip the emotional hook
- Tell instead of ask
- Rush to formalism
- Assume static images are enough

---

## Example Dialogue Flow

```
┌───────────────────────────────────────┐
│ 🎬 COVER IMAGE: Birthday party        │
│ Pi: "It's Luna's birthday..."         │
│ [Story builds anticipation]           │
└───────────────────────────────────────┘
              ↓
┌───────────────────────────────────────┐
│ 🎬 SWITCH: Unequal cookie pieces      │
│ Pi: "Look what happened!"             │
│ Student: "Not fair!"                  │
│ [Emotional investment created]        │
└───────────────────────────────────────┘
              ↓
┌───────────────────────────────────────┐
│ 📝 CANVAS: Draw your own              │
│ Pi: "How would YOU cut it?"           │
│ [Hands-on exploration]                │
└───────────────────────────────────────┘
              ↓
┌───────────────────────────────────────┐
│ 🎬 SWITCH: Comparison checkpoint      │
│ Pi: "Which shapes show equal parts?"  │
│ [Apply understanding]                 │
└───────────────────────────────────────┘
              ↓
┌───────────────────────────────────────┐
│ 🎬 SWITCH: Notation visual            │
│ Pi: "We write it as 1/3..."           │
│ [Formalize what they understand]      │
└───────────────────────────────────────┘
```

---

## Testing Checklist

### Technical
- [ ] show_image tool calls work
- [ ] Cover image displays on lesson start
- [ ] Image switching has no lag
- [ ] Invalid imageIds handled gracefully
- [ ] Tool responses sent correctly

### Pedagogical
- [ ] Pi uses story language naturally
- [ ] Math terms come later in conversation
- [ ] Images switch at appropriate moments
- [ ] Student engagement is higher
- [ ] Concepts stick better

---

## Quick Comparison

| Aspect | Old Approach | New Approach |
|--------|-------------|--------------|
| **Start** | "Look at these pieces. What do you notice?" | "Luna's birthday! Cookie disaster!" |
| **Language** | Equal, fractions, partitioning | Fair, same amount, sharing |
| **Order** | Math terms → Examples | Story → Intuition → Math terms |
| **Images** | Static per milestone | Dynamic via tool calls |
| **Feel** | Test/lesson | Adventure/story |
| **Engagement** | Analytical | Emotional |
| **Understanding** | Memorize terms | Discover concepts |

---

## Benefits

### For Students 🧒
- ✅ Emotional investment in problem
- ✅ Natural curiosity triggered
- ✅ Discover concepts themselves
- ✅ Math doesn't feel scary
- ✅ Deep intuitive understanding

### For Pi 🤖
- ✅ More engaging conversations
- ✅ Dynamic visual control
- ✅ Flexible pacing
- ✅ Natural language use
- ✅ Better storytelling

### For Learning 📚
- ✅ Deeper understanding
- ✅ Better retention
- ✅ Concepts transfer
- ✅ Positive associations
- ✅ Real-world connection

---

## Next Steps

### This Week
1. Review and approve approach
2. Prioritize image tool vs redesign
3. Decide on implementation timeline

### Next 1-2 Weeks
1. Implement show_image tool
2. Create birthday party cover image
3. Rewrite Act 1 with wonder-first
4. Test revised dialogue

### Next 3-4 Weeks
1. Complete full lesson redesign
2. Update system prompt
3. Test with users (if possible)
4. Iterate based on feedback

---

## Resources

**Full Documentation:**
- `docs/WONDER-FIRST-REDESIGN.md` - Complete 781-line guide

**Key Sections:**
- Part 1: Wonder-First Pedagogical Redesign
- Part 2: Dynamic Image Switching via Tool Calls
- Example: Complete redesigned lesson
- Implementation: Technical details
- Testing: Validation strategy

---

## Summary

**Core Philosophy:**
> "Make them CARE before you make them LEARN."

**The Formula:**
```
Story + Emotion = Wonder
Wonder + Questions = Curiosity  
Curiosity + Discovery = Understanding
Understanding + Terms = Mastery
```

**Ready to make learning feel like an adventure!** 🚀✨
