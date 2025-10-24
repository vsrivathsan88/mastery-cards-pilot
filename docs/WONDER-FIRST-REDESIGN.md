# Wonder-First Lesson Redesign + Dynamic Image Switching

## Overview
Comprehensive proposal to redesign lesson narratives with a **wonder-first pedagogical approach** and implement **dynamic image switching** via Gemini function calls.

**Date:** October 24, 2024

---

## The Problems

### 1. Math-Heavy Upfront 🔢
**Current Equal Parts Challenge - Act 1:**
```
Pi: "Look at this picture of kids sharing a giant cookie. What do you notice 
about these pieces? Would you want the smallest one? How would you make all 
the pieces equal in size?"

❌ Uses "equal" immediately (math term)
❌ Analytical question before emotional connection
❌ Skips the "Why should I care?" hook
❌ Feels like a test, not an adventure
```

**Student Experience:**
- "This is math class again" 😐
- Analytical thinking required immediately
- No emotional investment in the problem
- Misses the natural curiosity trigger

### 2. Static Images 🖼️
**Current System:**
- Images change only when milestones advance
- No mid-conversation visual support
- Pi can't control when/what images show
- Limited storytelling capability

**Limitations:**
- Can't show image for "Wait, let me show you something..."
- Can't reveal images progressively during explanation
- No cover image hook at lesson start
- Rigid milestone-only switching

---

## The Solution: Two-Part Approach

### Part 1: Wonder-First Narrative Arc 🌟
### Part 2: Dynamic Image Switching Tool 🎬

---

## Part 1: Wonder-First Pedagogical Redesign

### The New Arc

```
┌─────────────────────────────────────────┐
│  PHASE 1: WONDER & CURIOSITY           │
│  ────────────────────────────           │
│  • Story-driven hook                    │
│  • Emotional connection                 │
│  • Everyday language only              │
│  • Open-ended questions                 │
│  • "What do YOU think?"                 │
│                                          │
│  GOAL: Make them CARE about the problem │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  PHASE 2: EXPLORATION & SENSEMAKING    │
│  ───────────────────────────────────    │
│  • Guide discovery through questions    │
│  • Build on intuitive observations      │
│  • Use analogies & comparisons          │
│  • Avoid technical terms                │
│  • "How could we fix this?"             │
│                                          │
│  GOAL: Develop intuition & understanding│
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  PHASE 3: NAMING & FORMALIZING         │
│  ──────────────────────────────         │
│  • Introduce math terminology           │
│  • Connect to what they discovered      │
│  • "We call this..."                    │
│  • Symbolic notation                    │
│  • Formal language as labels            │
│                                          │
│  GOAL: Name what they already understand│
└─────────────────────────────────────────┘
```

### Example: Redesigned Act 1

#### OLD APPROACH (Math-Heavy)
```
🖼️ IMAGE: Cookie with unequal parts

Pi: "Look at this picture of kids sharing a giant cookie. 
What do you notice about these pieces? Would you want the 
smallest one? How would you make all the pieces equal in size?"

Student response expected: "The pieces aren't equal"
→ Uses math term immediately
→ Analytical observation required
→ No emotional hook
```

#### NEW APPROACH (Wonder-First)
```
🎬 COVER IMAGE: Three kids at table, whole cookie in center, 
               anticipation on faces

Pi: "It's Luna's birthday party! 🎂 She baked the BIGGEST 
chocolate chip cookie ever - like, the size of a pizza! 
Her best friends Maya and Carlos come over... and they're 
all staring at this giant cookie. Three friends... 
one cookie... uh oh!"

[PAUSE - let student react]

Student: "They have to share it!"

Pi: "Exactly! But wait..." 

🎬 [SWITCH TO: Cookie cut into unequal pieces, kids' reactions]

Pi: "Luna tried to cut it! Look at everyone's faces. 
What do you see?"

Student: "One piece is HUGE!"

Pi: "Right?! And look at Carlos - see his face? 
Which piece do you think HE got?"

Student: "The tiny one! He looks sad!"

Pi: "Yeah! 😢 If YOU got the tiny piece and your friend 
got the giant one... how would YOU feel?"

Student: "Mad! Not fair!"

Pi: "NOT FAIR! Why isn't it fair?"

Student: "Because some got more!"

Pi: "Exactly! Everyone should get the SAME AMOUNT, right? 
That's what fair means. Same amount for everyone. 

So... if YOU were Luna, how would you cut the cookie 
so everyone's happy? What would you do different?"

[NOW they're invested in solving it]
```

**Notice the difference:**
- ✅ Story creates emotional connection
- ✅ Uses names (Luna, Maya, Carlos) - makes it real
- ✅ Asks about feelings, not math
- ✅ "Fair" is introduced as emotional concept first
- ✅ Student naturally discovers the problem
- ✅ Math terminology comes LATER, after intuition

---

## Part 2: Dynamic Image Switching via Tool Calls

### Technical Implementation

#### 1. New Tool: `show_image`

**Tool Definition:**
```typescript
// apps/tutor-app/lib/tools/lesson-tools.ts

export const lessonTools: FunctionCall[] = [
  {
    name: 'show_image',
    description: `Display a specific image to the student to support your explanation. 
Use this to show visual examples, reveal story moments, or illustrate concepts. 
Only use images that are available in the current lesson's assets.`,
    parameters: {
      type: 'object',
      properties: {
        imageId: {
          type: 'string',
          description: 'ID of the image asset to display (e.g., "unequal-cookie-kids", "notation-visual")',
        },
        context: {
          type: 'string',
          description: 'Brief note about why you\'re showing this image (for logging)',
        },
      },
      required: ['imageId'],
    },
    isEnabled: true,
  },
];
```

#### 2. Tool Handler

**Hook into existing tool call system:**
```typescript
// apps/tutor-app/hooks/media/use-live-api.ts

const onToolCall = useCallback((toolCall: LiveServerToolCall) => {
  console.log('[useLiveApi] 🔧 Tool call received:', toolCall.functionCalls);
  
  toolCall.functionCalls.forEach(async (fc) => {
    if (fc.name === 'show_image') {
      const { imageId, context } = fc.args;
      
      console.log(`[useLiveApi] 🖼️ Showing image: ${imageId}`, context);
      
      // Update lesson store with current image
      useLessonStore.getState().setCurrentImage(imageId);
      
      // Send success response back to Gemini
      client.sendToolResponse({
        functionResponses: [{
          name: fc.name,
          id: fc.id,
          response: {
            success: true,
            imageId,
            message: `Image "${imageId}" is now displayed to the student.`
          }
        }]
      });
    }
  });
}, [client]);
```

#### 3. State Management

**Update lesson store:**
```typescript
// apps/tutor-app/lib/state.ts

interface LessonState {
  currentLesson?: LessonData;
  progress?: LessonProgress;
  celebrationMessage?: string;
  currentImage?: string;  // NEW: Currently displayed image ID
  celebrate: (message: string) => void;
  clearCelebration: () => void;
  setCurrentImage: (imageId: string) => void;  // NEW
}

export const useLessonStore = create<LessonState>((set) => ({
  currentLesson: undefined,
  progress: undefined,
  celebrationMessage: undefined,
  currentImage: undefined,  // NEW
  celebrate: (message: string) => {
    set({ celebrationMessage: message });
    setTimeout(() => set({ celebrationMessage: undefined }), 3000);
  },
  clearCelebration: () => set({ celebrationMessage: undefined }),
  setCurrentImage: (imageId: string) => set({ currentImage: imageId }),  // NEW
}));
```

#### 4. Component Update

**LessonImage component:**
```typescript
// apps/tutor-app/components/LessonImage.tsx

export function LessonImage({ lessonId, milestoneIndex }: LessonImageProps) {
  const { currentLesson, currentImage } = useLessonStore();  // Add currentImage
  
  const getCurrentImage = (): { url: string; alt: string; caption: string } | null => {
    if (!currentLesson?.assets) return null;
    
    // PRIORITY 1: If Pi explicitly set an image via tool call, show that
    if (currentImage) {
      const explicitAsset = currentLesson.assets.find((asset: any) => asset.id === currentImage);
      if (explicitAsset) {
        return {
          url: explicitAsset.url,
          alt: explicitAsset.alt || 'Lesson visual',
          caption: explicitAsset.description || explicitAsset.alt || ''
        };
      }
    }
    
    // PRIORITY 2: Milestone-based image (existing logic)
    if (milestoneIndex !== undefined && currentLesson.milestones?.[milestoneIndex]) {
      // ... existing milestone matching logic
    }
    
    // PRIORITY 3: Default to first asset
    // ... existing fallback logic
  };
  
  // ... rest of component
}
```

### Usage Examples

#### Example 1: Story-Driven Reveal
```
Pi: "It's Luna's birthday! She made the biggest cookie ever..."

[Pi calls show_image("cover-birthday-party")]

Pi: "Look! Three friends, one giant cookie. Oh no!"

[Pi calls show_image("unequal-cookie-kids")]

Pi: "Luna tried to cut it... but look at their faces!"
```

#### Example 2: Mid-Explanation Visual
```
Pi: "So when we divide something into 3 equal parts, each part 
has a special name. Want to see what that looks like?"

[Pi calls show_image("1-3-notation-visual")]

Pi: "See this? The bottom number 3 tells us how many equal parts..."
```

#### Example 3: Checkpoint Comparison
```
Pi: "Okay, challenge time! I'm going to show you three shapes. 
Tell me which ones show equal parts."

[Pi calls show_image("equal-unequal-comparison")]

Pi: "Look carefully at all three shapes. Which ones are cut fairly?"
```

### Cover Image System

**New Lesson Field:**
```json
{
  "id": "equal-parts-challenge",
  "title": "The Equal Parts Challenge",
  "coverImage": {
    "id": "cover-birthday-party",
    "url": "/assets/fractions/birthday-party-cover.svg",
    "alt": "Three kids excited around a giant cookie",
    "description": "Hook image showing Luna's birthday party setup - anticipation before the cookie cutting"
  },
  "assets": [
    // ... other lesson images
  ]
}
```

**Auto-Display:**
```typescript
// When lesson loads, show cover image first
useEffect(() => {
  if (currentLesson?.coverImage) {
    useLessonStore.getState().setCurrentImage(currentLesson.coverImage.id);
  }
}, [currentLesson]);
```

---

## Complete Redesigned Lesson Example

### Equal Parts Challenge - Wonder-First Version

#### Phase 1: Wonder & Curiosity (5-7 min)

**COVER IMAGE: Birthday party setup**

```
Pi: "Hey! Want to hear about Luna's birthday disaster? 🎂

Luna's turning 8, and she decided to bake the BIGGEST chocolate 
chip cookie ever. Like, pizza-sized! Her best friends Maya and 
Carlos are coming over and they're SO excited.

But then... Luna realizes... three friends, ONE cookie. 
Uh oh! What do you think happens next?"

Student: "They have to share it!"

Pi: "Yep! Luna's got this huge cookie and she needs to cut it 
for three people. Have YOU ever had to share something with friends?"

Student: "Yeah, like at lunch!"

Pi: "Right! Okay so Luna gets her knife out and..."

[show_image: "unequal-cookie-kids"]

Pi: "...LOOK what happened! 😬 Check out everyone's faces. 
What do you notice?"

Student: "One piece is WAY bigger!"

Pi: "WAY bigger! And who do you think got the tiny piece?"

Student: "The boy on the left!"

Pi: "That's Carlos! Look at his face. How do you think he feels?"

Student: "Sad! Mad!"

Pi: "Yeah! 😢 If YOU got that tiny piece and your friend got 
the HUGE one... how would you feel?"

Student: "Mad! That's not fair!"

Pi: "NOT FAIR! Why isn't it fair?"

Student: "Because they got more! It should be the same!"

Pi: "Oooh! 'It should be the same' - I love that! You're saying 
everyone should get the SAME AMOUNT, right?"

Student: "Yes!"

Pi: "That's what FAIR means - everyone gets the same amount. 
Same amount = fair. Makes sense?

So here's the big question: If YOU were Luna, how would you 
cut the cookie so everyone's happy? What would you do different?"

Student: "Cut it the same size!"

Pi: "Cut it the same size! But HOW? That's the tricky part, right? 
Want to try figuring it out together?"
```

**KEY ELEMENTS:**
- ✅ Names and story (Luna, Maya, Carlos)
- ✅ Emotional stakes (birthday disaster)
- ✅ Asks about student's experience
- ✅ "Fair" introduced as emotional concept
- ✅ Student discovers the problem themselves
- ✅ "Same amount" = intuitive understanding
- ✅ Math terms come later

---

#### Phase 2: Exploration & Sensemaking (8-10 min)

```
Pi: "Okay! Let's experiment. I want you to draw a circle on 
your canvas - that'll be our practice cookie. Make it nice 
and big!"

[Student draws circle]

Pi: "Perfect! Now, you need to cut this for THREE friends. 
Remember - everyone needs the SAME AMOUNT so it's fair. 
How would you cut it?"

Student: "Draw lines?"

Pi: "Yeah! What kind of lines? Where would they go?"

Student: "Um... from the middle?"

Pi: "Interesting! Like slicing a pizza from the center? Try it! 
Draw some lines from the center."

[Student draws lines]

Pi: "Okay! Now look at the pieces you made. Would YOU be happy 
if you got any of those pieces? Or would you say 'Hey, not fair!'?"

Student: "This one is bigger..."

Pi: "Aha! So how could we fix it? What needs to change?"

[Exploration continues...]

Pi: "You know what you just discovered? You figured out that to 
be FAIR, all the pieces need to be the SAME SIZE. Not just 
'kinda the same' - EXACTLY the same. Pretty cool, right?"
```

**KEY ELEMENTS:**
- ✅ Hands-on exploration (draw it yourself)
- ✅ Questions guide discovery
- ✅ "Fair" remains the anchor concept
- ✅ Student evaluates their own work
- ✅ Still no fraction terminology

---

#### Phase 3: Naming & Formalizing (5-7 min)

```
Pi: "Okay, you've been working with this idea that pieces need 
to be the SAME SIZE to be fair. Guess what? Mathematicians have 
a special word for 'same size' - they call it EQUAL.

Equal = same size. When pieces are equal, everyone gets the 
same amount. Same thing you've been doing!"

Student: "Oh, equal!"

Pi: "Yeah! So when you cut your circle into three equal parts - 
three pieces that are the SAME SIZE - each piece has a special 
name. We call each piece 'one-third.'

One-third means one piece out of three equal pieces. Make sense?"

[show_image: "1-3-notation-visual"]

Pi: "Look at this! See how we WRITE one-third? We use this 
symbol: 1/3. The bottom number 3 tells us how many equal pieces 
total. The top number 1 tells us we're talking about one of them.

You've been making thirds this whole time! Now you just know 
what to call them. Pretty neat, huh?"
```

**KEY ELEMENTS:**
- ✅ Math terms introduced AFTER intuition
- ✅ "Equal" connected to "same size" they already know
- ✅ "We call it..." not "This is called..."
- ✅ Notation as a label for what they understand
- ✅ Student feels smart ("I've been doing this!")

---

## Implementation Checklist

### Phase A: Dynamic Image Switching (1-2 weeks)
- [ ] Create `show_image` tool definition
- [ ] Add tool handler in `use-live-api.ts`
- [ ] Update `useLessonStore` with `currentImage` state
- [ ] Modify `LessonImage` component to prioritize tool-set images
- [ ] Add cover image support to lesson JSON schema
- [ ] Test tool calling with simple examples
- [ ] Handle edge cases (invalid imageId, missing assets)

### Phase B: Lesson Redesign (2-3 weeks)
- [ ] Redesign Equal Parts Challenge with wonder-first arc
- [ ] Create new cover image assets
- [ ] Rewrite all milestone prompts with narrative flow
- [ ] Update system prompt to encourage storytelling
- [ ] Add "everyday language first" guideline to prompt
- [ ] Test full lesson flow with revised dialogue
- [ ] Validate with kids (if possible)

### Phase C: System Prompt Updates
- [ ] Add image switching guidance to system prompt
- [ ] Include wonder-first pedagogical guidelines
- [ ] Provide example dialogues for Pi to follow
- [ ] Add "avoid math terminology upfront" instruction
- [ ] Include storytelling best practices

---

## System Prompt Additions

### For Dynamic Images
```
# Using Visual Aids

You have access to images that support the lesson. Use the show_image 
tool to display images at key moments:

- At the start of a lesson (cover image)
- When telling a story ("look what happened!")
- When explaining a concept ("let me show you...")
- For checkpoints ("compare these shapes...")

IMPORTANT: Only use imageIds that exist in the current lesson's assets. 
Check the lesson context for available images.

Example:
Student: "I don't get what equal means"
You: "Let me show you an example..." [show_image: "equal-unequal-comparison"]
You: "Look at these three shapes. Can you spot which ones are equal?"
```

### For Wonder-First Pedagogy
```
# Teaching Philosophy: Wonder First, Math Second

ALWAYS follow this progression:

1. WONDER PHASE (Start here!)
   - Begin with a story or real scenario
   - Use names, emotions, stakes
   - Ask "How would YOU feel?"
   - Build curiosity: "Uh oh! What happens next?"
   - Use everyday language only
   
2. EXPLORATION PHASE
   - Guide discovery through questions
   - "What do you notice?" not "What is..."
   - Let them try and adjust
   - Build on intuitive understanding
   - Use familiar comparisons (pizza, sharing, fair/unfair)
   
3. NAMING PHASE (Only after intuition is solid)
   - Introduce math terminology
   - Connect to what they already discovered
   - "We call this..." not "This is called..."
   - Math words as labels for concepts they understand

BAD: "Let's learn about fractions. A fraction is..."
GOOD: "Luna's trying to share a cookie! But look what happened..."

BAD: "Equal parts means same size"
GOOD: "If you got the tiny piece, how would you feel? Not fair, right? 
       Everyone should get the SAME AMOUNT. That's what fair means!"
```

---

## Benefits of This Approach

### For Students
✅ **Emotional engagement** - They care about Luna's problem
✅ **Natural curiosity** - "What happens next?"
✅ **Intuitive understanding** - Fair/unfair before equal/unequal
✅ **Empowerment** - They discover concepts themselves
✅ **No math anxiety** - Doesn't feel like "math class"
✅ **Visual storytelling** - Images enhance narrative
✅ **Real-world connection** - Sharing cookies is relatable

### For Pi (AI Tutor)
✅ **More engaging conversations** - Story-driven, not test-driven
✅ **Dynamic visual control** - Show images when needed
✅ **Flexible pacing** - Can adapt based on student responses
✅ **Better scaffolding** - Build from familiar to formal
✅ **Natural language** - Conversational, not instructional

### For Learning Outcomes
✅ **Deeper understanding** - Intuition before formalism
✅ **Better retention** - Emotional memories stick
✅ **Transfer capability** - "Fair sharing" applies everywhere
✅ **Conceptual fluency** - Not just memorizing terms
✅ **Positive associations** - Math feels fun, not scary

---

## Testing Strategy

### Phase 1: Technical Testing
1. Test `show_image` tool with various imageIds
2. Verify priority system (tool > milestone > default)
3. Test cover image auto-display on lesson load
4. Handle edge cases (missing images, invalid IDs)
5. Check performance (image switching lag)

### Phase 2: Dialogue Testing
1. Run through redesigned lesson with test prompts
2. Check if Pi uses story language naturally
3. Verify math terms come later in conversation
4. Test if Pi calls show_image at appropriate moments
5. Validate emotional engagement hooks

### Phase 3: User Testing (If Possible)
1. Test with 3-5 kids (age 7-9)
2. Record which version engages them more
3. Ask: "Did you like the cookie story?"
4. Observe: When do they lose interest?
5. Measure: Do they remember concepts better?

---

## Risks & Mitigations

### Risk 1: Pi Doesn't Use Tool
**Problem:** Gemini might not call show_image when expected

**Mitigation:**
- Provide clear examples in system prompt
- Use few-shot examples showing tool usage
- Monitor logs and adjust prompt if needed
- Fallback to milestone-based images

### Risk 2: Too Story-Heavy
**Problem:** Story might distract from learning goals

**Mitigation:**
- Keep stories brief and focused
- Always tie back to concept
- Use story as hook, not the whole lesson
- Test engagement vs. learning balance

### Risk 3: Longer Time
**Problem:** Wonder phase might extend lesson duration

**Mitigation:**
- Budget 5-7 minutes for wonder phase
- Can be shortened if student already engaged
- Benefits (deeper learning) outweigh time cost
- Monitor overall lesson completion times

---

## Example Tool Call Sequence

```
Lesson Start:
┌──────────────────────────────────────┐
│ 1. Auto-display cover image         │
│    show_image("cover-birthday-party")│
└──────────────────────────────────────┘
         ↓
┌──────────────────────────────────────┐
│ 2. Pi tells story                    │
│    "It's Luna's birthday..."         │
└──────────────────────────────────────┘
         ↓
┌──────────────────────────────────────┐
│ 3. Reveal problem                    │
│    show_image("unequal-cookie-kids") │
└──────────────────────────────────────┘
         ↓
┌──────────────────────────────────────┐
│ 4. Discussion (no image change)      │
│    "How would you feel?"             │
└──────────────────────────────────────┘
         ↓
┌──────────────────────────────────────┐
│ 5. Checkpoint                        │
│    show_image("equal-unequal-comp")  │
└──────────────────────────────────────┘
         ↓
┌──────────────────────────────────────┐
│ 6. Teaching notation                 │
│    show_image("1-3-notation-visual") │
└──────────────────────────────────────┘
```

---

## Next Steps

### Immediate (This Week)
1. **Get feedback** on this proposal
2. **Decide** if approach aligns with vision
3. **Prioritize** image tool vs. lesson redesign

### Short Term (1-2 Weeks)
1. Implement `show_image` tool
2. Create cover image for Equal Parts Challenge
3. Rewrite Act 1 with wonder-first approach
4. Test with revised dialogue

### Medium Term (3-4 Weeks)
1. Complete full lesson redesign
2. Update system prompt with pedagogy guidelines
3. Create additional cover images
4. Validate with user testing

---

## Conclusion

**This two-part approach solves both problems:**

1. ✅ **Math-heavy upfront** → Wonder-first narrative arc
2. ✅ **Static images** → Dynamic image switching via tool calls

**Core Philosophy:**
> "Make them CARE before you make them LEARN. 
> Stories create wonder. Wonder creates curiosity. 
> Curiosity creates deep understanding."

**Students learn best when:**
- They're emotionally invested in the problem
- They discover concepts through exploration
- Math terms label what they already understand
- Visuals enhance the narrative at key moments

**Ready to implement when you are!** 🚀
