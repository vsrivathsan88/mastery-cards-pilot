import { test, expect } from '@playwright/test';

test.describe('3rd Grade Student Experience', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start fresh
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('Onboarding - Can a 3rd grader complete it?', async ({ page }) => {
    await page.goto('/');

    // Step 1: Parent Consent
    await expect(page.locator('text=Parent').or(page.locator('text=consent').or(page.locator('text=permission')))).toBeVisible({ timeout: 10000 });
    
    // Find and click "Begin the Adventure" button using test ID
    const agreeButton = page.getByTestId('parent-consent-button');
    await expect(agreeButton).toBeVisible();
    
    // Check if button text is readable for parents
    const buttonText = await agreeButton.textContent();
    console.log('✅ Parent consent button text:', buttonText);
    
    await agreeButton.click();

    // Step 2: Avatar Selection
    // Wait for avatar picker
    await page.waitForTimeout(1000);
    
    // Check if avatars are visible and clickable using test IDs
    const avatarGrid = page.getByTestId('avatar-grid');
    await expect(avatarGrid).toBeVisible({ timeout: 5000 });
    
    const firstAvatar = page.getByTestId('avatar-option-adventurer-1');
    await expect(firstAvatar).toBeVisible();
    
    const avatarButtons = page.locator('[data-testid^="avatar-option-"]');
    const avatarCount = await avatarButtons.count();
    console.log(`✅ Found ${avatarCount} avatar options`);
    
    await firstAvatar.click();

    // Step 3: Name Input
    await page.waitForTimeout(1000);
    
    // Find the name input field using test ID
    const nameInput = page.getByTestId('name-input');
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    
    // Check if input is large enough for kids to use
    const inputBox = await nameInput.boundingBox();
    if (inputBox) {
      console.log(`✅ Name input size: ${inputBox.width}x${inputBox.height}px`);
      if (inputBox.height < 40) {
        console.warn(`⚠️ Input field might be too small for 3rd graders (height: ${inputBox.height}px)`);
      }
    }
    
    await nameInput.fill('Alex');
    
    // Find and click submit/continue button using test ID
    const submitButton = page.getByTestId('name-submit-button');
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // Step 4: Welcome Animation - MEET PI!
    await page.waitForTimeout(2000);
    
    // Check if we see Pi introduction
    const piIntro = page.locator('text=/I\'m Pi|Pi.*learning companion/i');
    const hasPiIntro = await piIntro.count() > 0;
    console.log(hasPiIntro ? '✅ Pi introduction displayed' : '⚠️ No Pi introduction found');
    
    // Check if Pi image is visible
    const piImage = page.locator('img[alt="Pi"], img[src*="pi.png"]');
    const piImageVisible = await piImage.isVisible().catch(() => false);
    console.log(piImageVisible ? '✅ Pi character image visible' : '⚠️ Pi image not visible');
    
    // Check if student's name is shown
    const nameGreeting = page.locator(`text=/Hello.*Alex/i`);
    const hasNameGreeting = await nameGreeting.count() > 0;
    console.log(hasNameGreeting ? '✅ Personal greeting with student name' : '⚠️ No personal greeting');
    
    // Take screenshot of Pi introduction
    await page.screenshot({ path: 'tests/screenshots/pi-introduction.png', fullPage: true });
    console.log('📸 Pi introduction screenshot saved');

    // Wait for onboarding to complete (or click "Start Learning" button)
    const startButton = page.getByTestId('start-learning-button');
    const hasStartButton = await startButton.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasStartButton) {
      console.log('✅ Found "Start Learning" button - clicking...');
      await startButton.click();
      // Wait for state update and transition
      await page.waitForTimeout(2000);
    } else {
      await page.waitForTimeout(3000);
    }
    
    // Should now be in the main app
    const mainApp = page.getByTestId('main-app');
    await expect(mainApp).toBeVisible({ timeout: 10000 });
    console.log('✅ Successfully reached main app');
  });

  test('Main Interface - Is it kid-friendly?', async ({ page }) => {
    // Skip onboarding by setting localStorage
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('simili_user', JSON.stringify({
        name: 'Alex',
        avatar: 'avatar1',
        hasCompletedOnboarding: true
      }));
    });
    await page.reload();
    
    // Wait for main interface
    await page.waitForTimeout(2000);

    // Check for key elements that should be visible
    const checks = {
      'Pi/Tutor Character': page.locator('[class*="character"], [class*="avatar"], [alt*="pi" i], [alt*="tutor" i]'),
      'Canvas/Drawing Area': page.locator('canvas, [class*="canvas"], [class*="tldraw"]'),
      'Microphone/Talk Button': page.locator('button').filter({ hasText: /talk|mic|speak/i }),
    };

    console.log('\n📊 Kid-Friendly Interface Check:');
    for (const [name, locator] of Object.entries(checks)) {
      const isVisible = await locator.isVisible().catch(() => false);
      console.log(`  ${isVisible ? '✅' : '❌'} ${name}`);
    }

    // Check for overwhelming text/clutter
    const allText = await page.locator('body').textContent();
    const wordCount = allText?.split(/\s+/).length || 0;
    console.log(`\n📝 Visible text complexity: ${wordCount} words`);
    if (wordCount > 500) {
      console.warn('⚠️ Too much text on screen - might overwhelm a 3rd grader');
    }

    // Take a screenshot for manual review
    await page.screenshot({ path: 'tests/screenshots/main-interface.png', fullPage: true });
    console.log('📸 Screenshot saved to tests/screenshots/main-interface.png');
  });

  test('Buttons and Controls - Are they big enough?', async ({ page }) => {
    // Set up user
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('simili_user', JSON.stringify({
        name: 'Alex',
        avatar: 'avatar1',
        hasCompletedOnboarding: true
      }));
    });
    await page.reload();
    await page.waitForTimeout(2000);

    // Find all interactive buttons
    const buttons = page.locator('button:visible');
    const buttonCount = await buttons.count();
    
    console.log(`\n🎯 Found ${buttonCount} visible buttons`);
    
    const smallButtons: string[] = [];
    const goodButtons: string[] = [];
    
    for (let i = 0; i < Math.min(buttonCount, 20); i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();
      const text = await button.textContent();
      
      if (box) {
        const minDimension = Math.min(box.width, box.height);
        const label = text?.trim() || `Button ${i}`;
        
        if (minDimension < 40) {
          smallButtons.push(`${label} (${Math.round(box.width)}x${Math.round(box.height)}px)`);
        } else {
          goodButtons.push(`${label} (${Math.round(box.width)}x${Math.round(box.height)}px)`);
        }
      }
    }
    
    console.log(`\n✅ Appropriately sized buttons (≥40px): ${goodButtons.length}`);
    goodButtons.slice(0, 5).forEach(b => console.log(`  - ${b}`));
    
    if (smallButtons.length > 0) {
      console.log(`\n⚠️ Buttons that might be too small for 3rd graders (<40px): ${smallButtons.length}`);
      smallButtons.forEach(b => console.log(`  - ${b}`));
    }
  });

  test('Text Readability - Font sizes', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('simili_user', JSON.stringify({
        name: 'Alex',
        avatar: 'avatar1',
        hasCompletedOnboarding: true
      }));
    });
    await page.reload();
    await page.waitForTimeout(2000);

    // Check font sizes of main text elements
    const textElements = await page.locator('p, span, div, h1, h2, h3, button').all();
    
    const fontSizes: { [key: string]: number } = {};
    
    for (const element of textElements.slice(0, 50)) {
      const fontSize = await element.evaluate(el => {
        const style = window.getComputedStyle(el);
        return parseFloat(style.fontSize);
      });
      
      if (fontSize > 0) {
        const range = fontSize < 14 ? '<14px (too small)' :
                     fontSize < 16 ? '14-16px (small)' :
                     fontSize < 20 ? '16-20px (good)' :
                     '20+px (excellent)';
        
        fontSizes[range] = (fontSizes[range] || 0) + 1;
      }
    }
    
    console.log('\n📏 Font Size Distribution:');
    Object.entries(fontSizes).sort().forEach(([range, count]) => {
      const icon = range.includes('too small') ? '❌' : 
                   range.includes('small') ? '⚠️' : '✅';
      console.log(`  ${icon} ${range}: ${count} elements`);
    });
  });

  test('Reset Button - Can student restart easily?', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('simili_user', JSON.stringify({
        name: 'Alex',
        avatar: 'avatar1',
        hasCompletedOnboarding: true
      }));
    });
    await page.reload();
    await page.waitForTimeout(2000);

    // Look for reset button (should be visible per App.tsx)
    const resetButton = page.locator('button').filter({ hasText: /🔄|reset/i });
    const isVisible = await resetButton.isVisible();
    
    console.log(isVisible ? '✅ Reset button found' : '⚠️ Reset button not easily discoverable');
    
    if (isVisible) {
      const box = await resetButton.boundingBox();
      if (box) {
        console.log(`  Position: bottom-left, Size: ${Math.round(box.width)}x${Math.round(box.height)}px`);
      }
    }
  });

  test('Loading States - Does the app show what\'s happening?', async ({ page }) => {
    await page.goto('/');
    
    // Check initial loading
    const loadingText = page.locator('text=/loading|wait|connecting/i');
    const loadingClass = page.locator('[class*="loading"], [class*="spinner"]');
    
    const hasLoadingText = await loadingText.count() > 0;
    const hasLoadingClass = await loadingClass.count() > 0;
    const hasLoadingState = hasLoadingText || hasLoadingClass;
    
    console.log(hasLoadingState ? 
      '✅ Loading state visible - good UX' : 
      '⚠️ No obvious loading indicators - kids might think app is broken');
  });
});
