const { test, expect } = require('@playwright/test');

test.describe('Hamburger Menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should open and close hamburger menu', async ({ page }) => {
    const hamburgerBtn = page.locator('.hamburger-btn');
    const sidebar = page.locator('.hamburger-sidebar');
    const overlay = page.locator('.hamburger-overlay');

    // Initially closed
    await expect(sidebar).not.toHaveClass(/open/);

    // Open menu
    await hamburgerBtn.click();
    await expect(sidebar).toHaveClass(/open/);
    await expect(overlay).toBeVisible();

    // Close via close button
    const closeBtn = page.locator('.hamburger-close');
    await closeBtn.click();
    await expect(sidebar).not.toHaveClass(/open/);
  });

  test('should close menu when clicking overlay', async ({ page }) => {
    const hamburgerBtn = page.locator('.hamburger-btn');
    const sidebar = page.locator('.hamburger-sidebar');
    const overlay = page.locator('.hamburger-overlay');

    // Open menu
    await hamburgerBtn.click();
    await expect(sidebar).toHaveClass(/open/);

    // Close via overlay
    await overlay.click();
    await expect(sidebar).not.toHaveClass(/open/);
  });

  test('should display favorites section', async ({ page }) => {
    const hamburgerBtn = page.locator('.hamburger-btn');
    await hamburgerBtn.click();

    const favoritesSection = page.locator('h4:has-text("Favorites")');
    await expect(favoritesSection).toBeVisible();

    // Should show count
    await expect(favoritesSection).toContainText(/Favorites \(\d+\)/);
  });

  test('should display recently viewed section', async ({ page }) => {
    const hamburgerBtn = page.locator('.hamburger-btn');
    await hamburgerBtn.click();

    const historySection = page.locator('h4:has-text("Recently Viewed")');
    await expect(historySection).toBeVisible();

    // Should show count
    await expect(historySection).toContainText(/Recently Viewed \(\d+\)/);
  });

  test('should show empty state for favorites', async ({ page }) => {
    // Clear localStorage to ensure empty state
    await page.evaluate(() => {
      localStorage.removeItem('courseFavorites');
    });

    const hamburgerBtn = page.locator('.hamburger-btn');
    await hamburgerBtn.click();

    const emptyState = page.locator('.empty-state:has-text("No favorites yet")');
    await expect(emptyState).toBeVisible();
  });

  test('should show empty state for history', async ({ page }) => {
    // Clear localStorage to ensure empty state
    await page.evaluate(() => {
      localStorage.removeItem('courseHistory');
    });

    const hamburgerBtn = page.locator('.hamburger-btn');
    await hamburgerBtn.click();

    const emptyState = page.locator('.empty-state:has-text("No recent courses")');
    await expect(emptyState).toBeVisible();
  });

  test('should have clear history button when history exists', async ({ page }) => {
    // Add some history
    await page.evaluate(() => {
      const history = [
        { name: 'Test Course', viewedAt: new Date().toISOString() }
      ];
      localStorage.setItem('courseHistory', JSON.stringify(history));
    });

    await page.reload();

    const hamburgerBtn = page.locator('.hamburger-btn');
    await hamburgerBtn.click();

    const clearBtn = page.locator('.clear-btn[title="Clear history"]');
    await expect(clearBtn).toBeVisible();
  });

  test('should clear history when clear button clicked', async ({ page }) => {
    // Add some history
    await page.evaluate(() => {
      const history = [
        { name: 'Test Course', viewedAt: new Date().toISOString() }
      ];
      localStorage.setItem('courseHistory', JSON.stringify(history));
    });

    await page.reload();

    const hamburgerBtn = page.locator('.hamburger-btn');
    await hamburgerBtn.click();

    const clearBtn = page.locator('.clear-btn[title="Clear history"]');
    await clearBtn.click();

    // Wait a bit for state update
    await page.waitForTimeout(300);

    const emptyState = page.locator('.empty-state:has-text("No recent courses")');
    await expect(emptyState).toBeVisible();
  });

  test('should display auth button', async ({ page }) => {
    const hamburgerBtn = page.locator('.hamburger-btn');
    await hamburgerBtn.click();

    const authSection = page.locator('.auth-section');
    await expect(authSection).toBeVisible();
  });

  test('should have close button with proper aria-label', async ({ page }) => {
    const hamburgerBtn = page.locator('.hamburger-btn');
    await hamburgerBtn.click();

    const closeBtn = page.locator('.hamburger-close');
    await expect(closeBtn).toHaveAttribute('aria-label', 'Close menu');
  });

  test('should show favorite items with proper structure', async ({ page }) => {
    // Add a favorite
    await page.evaluate(() => {
      const favorites = [
        {
          name: 'Test Course',
          topics: [{ name: 'Topic 1' }, { name: 'Topic 2' }]
        }
      ];
      localStorage.setItem('courseFavorites', JSON.stringify(favorites));
    });

    await page.reload();

    const hamburgerBtn = page.locator('.hamburger-btn');
    await hamburgerBtn.click();

    const menuItem = page.locator('.menu-item').first();
    await expect(menuItem).toBeVisible();

    const menuLink = menuItem.locator('.menu-link');
    await expect(menuLink).toBeVisible();

    const favoriteBtn = menuItem.locator('.favorite-btn');
    await expect(favoriteBtn).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const hamburgerBtn = page.locator('.hamburger-btn');
    await hamburgerBtn.click();

    const sidebar = page.locator('.hamburger-sidebar');
    await expect(sidebar).toBeVisible();

    // Sidebar should take reasonable width on mobile
    const box = await sidebar.boundingBox();
    expect(box.width).toBeLessThanOrEqual(375);
  });

  test('should handle removing favorite from menu', async ({ page }) => {
    // Add a favorite
    await page.evaluate(() => {
      const favorites = [
        {
          name: 'Test Course',
          topics: [{ name: 'Topic 1' }]
        }
      ];
      localStorage.setItem('courseFavorites', JSON.stringify(favorites));
    });

    await page.reload();

    const hamburgerBtn = page.locator('.hamburger-btn');
    await hamburgerBtn.click();

    const favoriteBtn = page.locator('.menu-item .favorite-btn').first();
    await expect(favoriteBtn).toHaveAttribute('aria-label', 'Remove from favorites');

    await favoriteBtn.click();

    // Wait for state update
    await page.waitForTimeout(300);

    // Should show empty state
    const emptyState = page.locator('.empty-state:has-text("No favorites yet")');
    await expect(emptyState).toBeVisible();
  });
});
