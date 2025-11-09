# Canvas Tools Testing Guide

## Quick Test: Canvas Drawing & Labeling

### Setup
```bash
# Make sure pilot mode is enabled in .env
# VITE_PILOT_MODE=true should already be set

# Start dev server
pnpm dev
```

### What to Look For

When you run the app, you should see in the console:
```
🧪 PILOT MODE ENABLED
Features: canvasDrawingTool, canvasLabelTool, ...
[state] 🧪 Pilot mode: Adding pilot tools to lesson tools
[LessonCanvas] Editor mounted and connected to CanvasManipulationService
```

### Testing Canvas Tools

#### 1. Test `draw_on_canvas`

When Pi decides to draw (or you can prompt: "Can you show me how to divide this circle?"), look for:

**Console logs:**
```
[useLiveApi] 🎨 PILOT: Drawing on canvas
[CanvasManipulation] Drew line: {x1, y1, x2, y2}
```

**On screen:**
- Purple shapes appear on canvas
- Transcript shows: "🎨 Pi drew line: Demonstrating equal division"

**Test different shapes:**
- Lines (for dividing shapes)
- Circles (for examples)
- Rectangles (for partitioning demonstrations)
- Arrows (for pointing to specific parts)

#### 2. Test `add_canvas_label`

When Pi adds labels (e.g., labeling fractions "1/3", "1/3", "1/3"):

**Console logs:**
```
[useLiveApi] 🏷️ PILOT: Adding canvas label
[CanvasManipulation] Added text: {text, style, x, y}
```

**On screen:**
- Purple text appears on canvas
- Different styles: annotation (small), label (medium), celebration (large)
- Transcript shows: "🏷️ Pi added label: '1/3' (label)"

#### 3. Test `verify_student_work`

When Pi asks student to check their work with `highlightCanvas: true`:

**Console logs:**
```
[useLiveApi] ✅ PILOT: Verification prompt
[useLiveApi] Highlighted canvas for verification
[CanvasManipulation] Highlighted region
```

**On screen:**
- Canvas area gets highlighted (semi-transparent purple overlay)
- Highlight fades after 3 seconds
- Transcript shows: "✅ Pi asked for verification: 'Are these parts equal?'"

#### 4. Test Temporary Drawings

When Pi uses `temporary: true`:

**Behavior:**
- Shape/text appears normally
- After 5 seconds, it disappears automatically
- Good for hints and temporary guidance

**Console:**
```
[CanvasManipulation] Removed temporary shape: <shapeId>
```

### Manual Testing Steps

#### Test 1: Line Drawing
1. Start a lesson
2. Wait for Pi to suggest drawing or prompt: "Show me how to divide a circle into thirds"
3. Pi should draw lines from center to edge
4. Verify lines are purple (violet in TLDraw)

#### Test 2: Label Addition
1. Draw some shapes on canvas yourself
2. Ask: "Can you label these parts as fractions?"
3. Pi should add text labels like "1/3"
4. Verify text is purple and positioned correctly

#### Test 3: Verification Highlight
1. Draw some unequal parts
2. Pi asks: "Can you check if these are equal?"
3. Canvas should highlight briefly
4. Verify highlight appears and fades

#### Test 4: Temporary Hint
1. Struggle with a problem
2. Pi gives hint: "Let me show you..." with temporary drawing
3. Hint shape appears
4. After 5 seconds, it should disappear

### Error Scenarios

#### Canvas Not Ready
If you see:
```
[useLiveApi] Canvas not ready yet
```

**Fix:** Wait for canvas to mount. It takes ~1 second after app loads.

#### Shape Not Appearing
If tool is called but no shape appears:

**Check:**
1. Console for TLDraw errors
2. Coordinates are in valid range (0-800 for x, 0-600 for y typically)
3. CanvasManipulationService is connected: `isReady() === true`

#### Shapes in Wrong Position
If shapes appear but in wrong place:

**Note:** TLDraw uses canvas coordinates. Default canvas size is dynamic.
- Recommend testing with coordinates like `{x: 100, y: 100}` for visibility
- Adjust based on actual canvas size in your UI

### Debugging

**Check if service is ready:**
```javascript
// In browser console:
window.__CANVAS_SERVICE_READY = canvasManipulationService.isReady()
```

**Count Pi's drawings:**
```javascript
// In browser console (if exposed):
canvasManipulationService.temporaryShapeIds.size
```

**Force clear Pi's drawings:**
```javascript
canvasManipulationService.clearPiDrawings()
```

### Expected Tool Call Format

Pi will call tools like this:

**draw_on_canvas:**
```json
{
  "shapeType": "line",
  "coordinates": {"x1": 200, "y1": 100, "x2": 400, "y2": 100},
  "strokeWidth": 3,
  "purpose": "Showing equal division",
  "temporary": false
}
```

**add_canvas_label:**
```json
{
  "text": "1/3",
  "position": {"x": 250, "y": 80},
  "style": "label",
  "temporary": false
}
```

### Success Criteria

✅ **Canvas drawing works if:**
- Purple shapes appear on canvas when tool is called
- Shapes match requested type (line, circle, etc.)
- Console shows success messages
- Transcript logs tool usage

✅ **Canvas labels work if:**
- Purple text appears at correct position
- Text is readable and properly styled
- Labels can point to shapes (arrow feature)

✅ **Verification highlight works if:**
- Semi-transparent overlay appears
- Overlay covers canvas area
- Fades after ~3 seconds

✅ **Temporary drawings work if:**
- Shape appears normally
- Shape auto-removes after 5 seconds
- No errors in console

### Next Steps After Testing

Once canvas tools are working:
1. Test with actual lesson flow (fractions lesson)
2. Observe Pi's autonomous use of tools
3. Refine coordinates for better visual placement
4. Add emoji display component
5. Implement outcome tracking

### Known Limitations

- **No animation yet**: `animated: true` is acknowledged but not implemented
- **Fixed coordinates**: Pi needs to know canvas size for optimal placement
- **No undo for Pi's drawings**: Once Pi draws, student can't undo (by design)
- **Temporary drawing fade**: Instant delete, not gradual fade (TLDraw limitation)

### Troubleshooting

**Problem:** "Editor not available" warning
- **Solution:** Canvas hasn't mounted yet. Wait 1-2 seconds or ensure LessonCanvas is rendered

**Problem:** Shapes appear but in wrong color
- **Solution:** Check TLDraw color palette - we use 'violet' which may appear different based on theme

**Problem:** Text is too small/large
- **Solution:** Adjust `fontSize` parameter or use different `style` (celebration = larger)

**Problem:** Temporary shapes not disappearing
- **Solution:** Check console for deletion errors. May need to manually call `clearPiDrawings()`

### Testing Checklist

- [ ] Pilot mode enabled and confirmed in console
- [ ] Canvas mounts and service connects
- [ ] Line drawing works
- [ ] Circle drawing works
- [ ] Rectangle drawing works
- [ ] Arrow drawing works
- [ ] Text labels appear correctly
- [ ] Different text styles work
- [ ] Temporary drawings disappear after 5s
- [ ] Canvas highlight works on verification
- [ ] All tools log correctly to transcript
- [ ] Error handling works (try before canvas ready)

---

**Ready to test?** Run `pnpm dev` and start a lesson! Watch the console and canvas for Pi's purple drawings.
