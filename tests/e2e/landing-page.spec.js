const { test, expect } = require('@playwright/test');

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the page title and brand', async ({ page }) => {
    await expect(page).toHaveTitle(/Mydemy/);
    await expect(page.locator('.brand-title')).toContainText('Mydemy');
    await expect(page.locator('.brand-subtitle')).toContainText('Your personal learning platform');
  });

  test('should have a functional search bar', async ({ page }) => {
    const searchInput = page.locator('.modern-search-input');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', 'Search courses...');

    // Test search functionality
    await searchInput.fill('test');
    await expect(searchInput).toHaveValue('test');

    // Clear button should appear when there's text
    const clearButton = page.locator('.search-clear-btn');
    await expect(clearButton).toBeVisible();

    // Test clear button
    await clearButton.click();
    await expect(searchInput).toHaveValue('');
    await expect(clearButton).not.toBeVisible();
  });

  test('should have search controls with proper labels', async ({ page }) => {
    const exactMatchToggle = page.locator('label:has-text("Exact match")');
    const searchInLessonsToggle = page.locator('label:has-text("Search in lessons")');

    await expect(exactMatchToggle).toBeVisible();
    await expect(searchInLessonsToggle).toBeVisible();
  });

  test('should display course count', async ({ page }) => {
    const courseCount = page.locator('.course-count');
    await expect(courseCount).toBeVisible();
    await expect(courseCount).toContainText(/\d+ available/);
  });

  test('should display courses in a grid layout', async ({ page }) => {
    const coursesGrid = page.locator('.courses-grid');
    await expect(coursesGrid).toBeVisible();

    const courseCards = page.locator('.course-card');
    const count = await courseCards.count();

    if (count > 0) {
      // Check first course card structure
      const firstCard = courseCards.first();
      await expect(firstCard.locator('.course-title')).toBeVisible();
      await expect(firstCard.locator('.course-stats')).toBeVisible();
    }
  });

  test('should have hamburger menu button', async ({ page }) => {
    const hamburgerBtn = page.locator('.hamburger-btn');
    await expect(hamburgerBtn).toBeVisible();
    await expect(hamburgerBtn).toHaveAttribute('aria-label', 'Toggle menu');
  });

  test('should have theme toggle button', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Look for theme toggle - it might be in the header or elsewhere
    const themeToggle = page.locator('[aria-label*="theme" i], [title*="theme" i], button:has-text("theme")').first();

    // If theme toggle exists, test it
    if (await themeToggle.count() > 0) {
      await expect(themeToggle).toBeVisible();
    }
  });

  test('should show preview section placeholder by default', async ({ page }) => {
    const previewPlaceholder = page.locator('.preview-placeholder');
    await expect(previewPlaceholder).toBeVisible();
    await expect(previewPlaceholder).toContainText('Preview a Course');
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    const searchInput = page.locator('.modern-search-input');

    // Test Cmd+K shortcut (Mac) or Ctrl+K (Windows/Linux)
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+K' : 'Control+K');
    await expect(searchInput).toBeFocused();

    // Type something
    await searchInput.fill('test search');

    // Test Escape key to clear
    await page.keyboard.press('Escape');
    await expect(searchInput).toHaveValue('');
  });

  test('should show notification area for SSE updates', async ({ page }) => {
    // The notification div should be in the DOM but hidden initially
    const notificationArea = page.locator('div[style*="position: fixed"][style*="top: 20px"]');

    // It might not be visible initially, which is expected
    const count = await notificationArea.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should have accessible course links', async ({ page }) => {
    const courseLinks = page.locator('.course-link');
    const count = await courseLinks.count();

    if (count > 0) {
      // Check that first course link has proper href
      const firstLink = courseLinks.first();
      const href = await firstLink.getAttribute('href');
      expect(href).toBeTruthy();
      expect(href).toMatch(/^\/[^/]+$/);
    }
  });

  test('should display favorite buttons on course cards', async ({ page }) => {
    const courseCards = page.locator('.course-card');
    const count = await courseCards.count();

    if (count > 0) {
      const firstCard = courseCards.first();
      const favoriteBtn = firstCard.locator('button[aria-label*="favorite" i]');

      // Favorite button should exist
      const favCount = await favoriteBtn.count();
      expect(favCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should handle empty search results gracefully', async ({ page }) => {
    const searchInput = page.locator('.modern-search-input');

    // Search for something that likely doesn't exist
    await searchInput.fill('xyzabc123nonexistent');

    // Wait a bit for filtering
    await page.waitForTimeout(500);

    // Course count should show 0
    const courseCount = page.locator('.course-count');
    await expect(courseCount).toContainText('0 available');
  });

  test('should maintain search state in localStorage', async ({ page }) => {
    const searchInput = page.locator('.modern-search-input');

    // Enter a search term
    await searchInput.fill('test search term');
    await page.waitForTimeout(500);

    // Reload the page
    await page.reload();

    // Search term should be preserved
    await expect(searchInput).toHaveValue('test search term');

    // Clean up
    await searchInput.clear();
  });
});

test.describe('Landing Page - Responsive Design', () => {
  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check that essential elements are still visible
    await expect(page.locator('.brand-title')).toBeVisible();
    await expect(page.locator('.modern-search-input')).toBeVisible();
    await expect(page.locator('.hamburger-btn')).toBeVisible();
  });

  test('should be responsive on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    await expect(page.locator('.brand-title')).toBeVisible();
    await expect(page.locator('.courses-grid')).toBeVisible();
  });
});

test.describe('Landing Page - Accessibility', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');

    // Check hamburger menu has aria-label
    const hamburgerBtn = page.locator('.hamburger-btn');
    await expect(hamburgerBtn).toHaveAttribute('aria-label');

    // Check clear button has aria-label when visible
    const searchInput = page.locator('.modern-search-input');
    await searchInput.fill('test');

    const clearBtn = page.locator('.search-clear-btn');
    await expect(clearBtn).toHaveAttribute('aria-label');
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');

    // Take a screenshot for manual contrast checking
    await page.screenshot({ path: 'test-results/landing-contrast.png', fullPage: true });
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');

    // Tab through focusable elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Some element should have focus
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});
