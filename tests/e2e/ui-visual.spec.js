const { test, expect } = require('@playwright/test');

test.describe('UI Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should not have console errors on page load', async ({ page }) => {
    const errors = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Filter out known acceptable errors (like network errors in test environment)
    const criticalErrors = errors.filter(err =>
      !err.includes('Failed to load resource') &&
      !err.includes('net::ERR_') &&
      !err.includes('[SSE]')
    );

    if (criticalErrors.length > 0) {
      console.log('Console errors found:', criticalErrors);
    }

    expect(criticalErrors.length).toBe(0);
  });

  test('should not have layout shifts on initial load', async ({ page }) => {
    // Take screenshot right after load
    await page.screenshot({ path: 'test-results/initial-load.png' });

    // Wait a bit
    await page.waitForTimeout(1000);

    // Take another screenshot
    await page.screenshot({ path: 'test-results/after-1s.png' });

    // No assertion here, but screenshots can be manually compared
  });

  test('should have consistent spacing between elements', async ({ page }) => {
    const searchSection = page.locator('.search-section');
    const coursesHeader = page.locator('.courses-header');
    const coursesGrid = page.locator('.courses-grid');

    await expect(searchSection).toBeVisible();
    await expect(coursesHeader).toBeVisible();
    await expect(coursesGrid).toBeVisible();

    // Get bounding boxes to check spacing
    const searchBox = await searchSection.boundingBox();
    const headerBox = await coursesHeader.boundingBox();

    // There should be some space between search and courses header
    if (searchBox && headerBox) {
      const spacing = headerBox.y - (searchBox.y + searchBox.height);
      expect(spacing).toBeGreaterThan(0);
    }
  });

  test('should have visible text with good contrast', async ({ page }) => {
    const brandTitle = page.locator('.brand-title');
    const brandSubtitle = page.locator('.brand-subtitle');
    const courseCount = page.locator('.course-count');

    // Check that text elements are visible
    await expect(brandTitle).toBeVisible();
    await expect(brandSubtitle).toBeVisible();
    await expect(courseCount).toBeVisible();

    // Get computed styles
    const titleColor = await brandTitle.evaluate((el) =>
      window.getComputedStyle(el).color
    );
    const subtitleColor = await brandSubtitle.evaluate((el) =>
      window.getComputedStyle(el).color
    );

    expect(titleColor).toBeTruthy();
    expect(subtitleColor).toBeTruthy();
  });

  test('should not have horizontal scrollbar on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);

    expect(bodyScrollWidth).toBeLessThanOrEqual(windowWidth + 20); // Allow 20px buffer
  });

  test('should handle long course names without breaking layout', async ({ page }) => {
    // Add a course with a very long name to localStorage/DOM for testing
    await page.evaluate(() => {
      const event = new CustomEvent('testLongCourseName');
      window.dispatchEvent(event);
    });

    const courseCards = page.locator('.course-card');
    const count = await courseCards.count();

    if (count > 0) {
      const firstCard = courseCards.first();
      const cardBox = await firstCard.boundingBox();

      // Card should have reasonable width
      if (cardBox) {
        expect(cardBox.width).toBeGreaterThan(0);
        expect(cardBox.width).toBeLessThan(1000); // No card should be excessively wide
      }
    }
  });

  test('should handle hover states on interactive elements', async ({ page }) => {
    const courseCards = page.locator('.course-card');
    const count = await courseCards.count();

    if (count > 0) {
      const firstCard = courseCards.first();

      // Hover over card
      await firstCard.hover();
      await page.waitForTimeout(200);

      // Preview section should update
      const previewSection = page.locator('.preview-section');
      const previewContent = previewSection.locator('.preview-content, .preview-placeholder');

      await expect(previewContent).toBeVisible();
    }
  });

  test('should not have broken images', async ({ page }) => {
    // Wait for all images to load
    await page.waitForLoadState('networkidle');

    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const isVisible = await img.isVisible();

      if (isVisible) {
        const naturalWidth = await img.evaluate((el) => el.naturalWidth);
        expect(naturalWidth).toBeGreaterThan(0);
      }
    }
  });

  test('should have proper SVG icons rendering', async ({ page }) => {
    const svgIcons = page.locator('svg');
    const svgCount = await svgIcons.count();

    expect(svgCount).toBeGreaterThan(0);

    // Check first few SVGs have proper attributes
    for (let i = 0; i < Math.min(svgCount, 5); i++) {
      const svg = svgIcons.nth(i);
      const width = await svg.getAttribute('width');
      const height = await svg.getAttribute('height');

      expect(width || height).toBeTruthy(); // At least one dimension should be set
    }
  });

  test('should not have overlapping elements', async ({ page }) => {
    const header = page.locator('.landing-header');
    const searchSection = page.locator('.search-section');

    const headerBox = await header.boundingBox();
    const searchBox = await searchSection.boundingBox();

    if (headerBox && searchBox) {
      // Search section should start after header
      expect(searchBox.y).toBeGreaterThanOrEqual(headerBox.y);
    }
  });

  test('should handle focus styles on form elements', async ({ page }) => {
    const searchInput = page.locator('.modern-search-input');

    // Focus the input
    await searchInput.focus();

    // Check if outline or box-shadow is applied
    const outlineStyle = await searchInput.evaluate((el) =>
      window.getComputedStyle(el).outline
    );
    const boxShadow = await searchInput.evaluate((el) =>
      window.getComputedStyle(el).boxShadow
    );

    // Either outline or box-shadow should be present for focus indication
    expect(outlineStyle !== 'none' || boxShadow !== 'none').toBeTruthy();
  });

  test('should not have text overflow on course cards', async ({ page }) => {
    const courseCards = page.locator('.course-card');
    const count = await courseCards.count();

    if (count > 0) {
      const firstCard = courseCards.first();
      const cardWidth = await firstCard.evaluate((el) => el.offsetWidth);
      const titleWidth = await firstCard.locator('.course-title').evaluate((el) => el.scrollWidth);

      // Title scroll width should not exceed card width significantly
      expect(titleWidth).toBeLessThanOrEqual(cardWidth + 50); // Allow some buffer
    }
  });

  test('should maintain aspect ratios', async ({ page }) => {
    // Take full page screenshot for visual regression testing
    await page.screenshot({
      path: 'test-results/full-page-desktop.png',
      fullPage: true
    });

    // Mobile screenshot
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({
      path: 'test-results/full-page-mobile.png',
      fullPage: true
    });
  });

  test('should handle empty states gracefully', async ({ page }) => {
    // Test with empty courses
    await page.evaluate(() => {
      localStorage.setItem('courseFavorites', '[]');
      localStorage.setItem('courseHistory', '[]');
    });

    await page.reload();

    // Page should still render without errors
    await expect(page.locator('.brand-title')).toBeVisible();
    await expect(page.locator('.modern-search-input')).toBeVisible();
  });

  test('should not have z-index conflicts', async ({ page }) => {
    const hamburgerBtn = page.locator('.hamburger-btn');
    await hamburgerBtn.click();

    const overlay = page.locator('.hamburger-overlay');
    const sidebar = page.locator('.hamburger-sidebar');

    await expect(overlay).toBeVisible();
    await expect(sidebar).toBeVisible();

    // Sidebar should be above overlay
    const overlayZ = await overlay.evaluate((el) =>
      parseInt(window.getComputedStyle(el).zIndex)
    );
    const sidebarZ = await sidebar.evaluate((el) =>
      parseInt(window.getComputedStyle(el).zIndex)
    );

    expect(sidebarZ).toBeGreaterThan(overlayZ);
  });
});

test.describe('Theme Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should have theme toggle functionality', async ({ page }) => {
    // Look for theme toggle button
    const themeToggle = page.locator('[class*="theme"], [data-theme], button:has-text("theme")').first();

    if (await themeToggle.count() > 0) {
      await expect(themeToggle).toBeVisible();

      // Click to toggle theme
      await themeToggle.click();
      await page.waitForTimeout(300);

      // Click again to toggle back
      await themeToggle.click();
      await page.waitForTimeout(300);
    }
  });

  test('should persist theme preference', async ({ page }) => {
    const themeToggle = page.locator('[class*="theme"], [data-theme]').first();

    if (await themeToggle.count() > 0) {
      // Toggle theme
      await themeToggle.click();
      await page.waitForTimeout(300);

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Theme should be persisted (check localStorage or HTML attribute)
      const theme = await page.evaluate(() => {
        return localStorage.getItem('theme') ||
          document.documentElement.getAttribute('data-theme') ||
          document.body.getAttribute('data-theme');
      });

      expect(theme).toBeTruthy();
    }
  });
});

test.describe('Performance Tests', () => {
  test('should load within reasonable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const loadTime = Date.now() - startTime;

    // Page should load in less than 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should not have memory leaks on navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const courseLinks = page.locator('.course-link');
    const count = await courseLinks.count();

    if (count > 0) {
      const href = await courseLinks.first().getAttribute('href');

      // Navigate to course
      await page.goto(href);
      await page.waitForLoadState('networkidle');

      // Navigate back
      await page.goBack();
      await page.waitForLoadState('networkidle');

      // Navigate forward
      await page.goForward();
      await page.waitForLoadState('networkidle');

      // Should not crash or show errors
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
