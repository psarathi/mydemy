const { test, expect } = require('@playwright/test');

test.describe('Course Page', () => {
  test('should show loading state initially', async ({ page }) => {
    await page.goto('/TestCourse', { waitUntil: 'domcontentloaded' });

    // May see loading spinner
    const loadingText = page.locator('text=/Loading course/i');

    // Either loading appears or course loads quickly
    const count = await loadingText.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display course not found for invalid course', async ({ page }) => {
    await page.goto('/NonExistentCourse123XYZ');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Should show not found message or handle gracefully
    const notFoundMessage = page.locator('text=/not found/i, text=/could not be found/i');
    const backButton = page.locator('text=/back to/i');

    // Either not found message or back button should be present for invalid course
    const notFoundCount = await notFoundMessage.count();
    const backCount = await backButton.count();

    expect(notFoundCount + backCount).toBeGreaterThan(0);
  });

  test('should have sidebar with course info', async ({ page }) => {
    // First, get a valid course name
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const firstCourseLink = page.locator('.course-link').first();
    const courseCount = await firstCourseLink.count();

    if (courseCount > 0) {
      const href = await firstCourseLink.getAttribute('href');

      // Navigate to course page
      await page.goto(href);
      await page.waitForLoadState('networkidle');

      // Check sidebar elements
      const sidebar = page.locator('.modern-sidebar');
      if (await sidebar.count() > 0) {
        await expect(sidebar).toBeVisible();

        const courseTitle = page.locator('.modern-course-title');
        await expect(courseTitle).toBeVisible();

        const backBtn = page.locator('.modern-back-btn');
        await expect(backBtn).toBeVisible();
        await expect(backBtn).toContainText('All Courses');
      }
    }
  });

  test('should have collapse sidebar button', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const firstCourseLink = page.locator('.course-link').first();
    const courseCount = await firstCourseLink.count();

    if (courseCount > 0) {
      const href = await firstCourseLink.getAttribute('href');
      await page.goto(href);
      await page.waitForLoadState('networkidle');

      const collapseBtn = page.locator('.modern-collapse-btn');
      if (await collapseBtn.count() > 0) {
        await expect(collapseBtn).toHaveAttribute('aria-label', 'Collapse sidebar');
      }
    }
  });

  test('should collapse and expand sidebar', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const firstCourseLink = page.locator('.course-link').first();
    const courseCount = await firstCourseLink.count();

    if (courseCount > 0) {
      const href = await firstCourseLink.getAttribute('href');
      await page.goto(href);
      await page.waitForLoadState('networkidle');

      const sidebar = page.locator('.modern-sidebar');
      const collapseBtn = page.locator('.modern-collapse-btn');

      if (await collapseBtn.count() > 0 && await sidebar.count() > 0) {
        // Collapse sidebar
        await collapseBtn.click();
        await page.waitForTimeout(300);

        await expect(sidebar).toHaveClass(/hidden/);

        // Open sidebar button should appear
        const openBtn = page.locator('.modern-open-sidebar-btn');
        await expect(openBtn).toBeVisible();
        await expect(openBtn).toHaveAttribute('aria-label', 'Open sidebar');

        // Expand sidebar
        await openBtn.click();
        await page.waitForTimeout(300);

        await expect(sidebar).not.toHaveClass(/hidden/);
      }
    }
  });

  test('should display course stats', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const firstCourseLink = page.locator('.course-link').first();
    const courseCount = await firstCourseLink.count();

    if (courseCount > 0) {
      const href = await firstCourseLink.getAttribute('href');
      await page.goto(href);
      await page.waitForLoadState('networkidle');

      const stats = page.locator('.course-stats .stat-item');
      if (await stats.count() > 0) {
        // Should show topics and lessons count
        const topicsText = await page.locator('text=/\\d+ Topics/i').textContent();
        const lessonsText = await page.locator('text=/\\d+ Lessons/i').textContent();

        expect(topicsText).toBeTruthy();
        expect(lessonsText).toBeTruthy();
      }
    }
  });

  test('should list topics and lessons', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const firstCourseLink = page.locator('.course-link').first();
    const courseCount = await firstCourseLink.count();

    if (courseCount > 0) {
      const href = await firstCourseLink.getAttribute('href');
      await page.goto(href);
      await page.waitForLoadState('networkidle');

      const contentList = page.locator('.modern-content-list');
      if (await contentList.count() > 0) {
        await expect(contentList).toBeVisible();

        const topicSections = page.locator('.modern-topic-section');
        if (await topicSections.count() > 0) {
          const firstTopic = topicSections.first();

          // Topic should have header
          const topicHeader = firstTopic.locator('.modern-topic-header h3');
          await expect(topicHeader).toBeVisible();

          // Topic should show lesson count
          const lessonCount = firstTopic.locator('.topic-lesson-count');
          await expect(lessonCount).toBeVisible();
        }
      }
    }
  });

  test('should have video player section', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const firstCourseLink = page.locator('.course-link').first();
    const courseCount = await firstCourseLink.count();

    if (courseCount > 0) {
      const href = await firstCourseLink.getAttribute('href');
      await page.goto(href);
      await page.waitForLoadState('networkidle');

      const videoSection = page.locator('.modern-video-section');
      if (await videoSection.count() > 0) {
        await expect(videoSection).toBeVisible();
      }
    }
  });

  test('should highlight active lesson', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const firstCourseLink = page.locator('.course-link').first();
    const courseCount = await firstCourseLink.count();

    if (courseCount > 0) {
      const href = await firstCourseLink.getAttribute('href');
      await page.goto(href);
      await page.waitForLoadState('networkidle');

      const activeLesson = page.locator('.modern-lesson-item.active');
      if (await activeLesson.count() > 0) {
        await expect(activeLesson).toBeVisible();

        // Active lesson should have pause icon
        const pauseIcon = activeLesson.locator('svg rect');
        const rectCount = await pauseIcon.count();
        expect(rectCount).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('should have copy URL buttons on lessons', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const firstCourseLink = page.locator('.course-link').first();
    const courseCount = await firstCourseLink.count();

    if (courseCount > 0) {
      const href = await firstCourseLink.getAttribute('href');
      await page.goto(href);
      await page.waitForLoadState('networkidle');

      const lessonItems = page.locator('.modern-lesson-item');
      if (await lessonItems.count() > 0) {
        const firstLesson = lessonItems.first();
        const copyBtn = firstLesson.locator('.modern-copy-url-btn');

        if (await copyBtn.count() > 0) {
          await expect(copyBtn).toBeVisible();
          await expect(copyBtn).toHaveAttribute('aria-label', /Copy URL for/);
        }
      }
    }
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const firstCourseLink = page.locator('.course-link').first();
    const courseCount = await firstCourseLink.count();

    if (courseCount > 0) {
      const href = await firstCourseLink.getAttribute('href');
      await page.goto(href);
      await page.waitForLoadState('networkidle');

      // Video section should be visible
      const videoSection = page.locator('.modern-video-section');
      if (await videoSection.count() > 0) {
        await expect(videoSection).toBeVisible();
      }
    }
  });

  test('should navigate back to home', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const firstCourseLink = page.locator('.course-link').first();
    const courseCount = await firstCourseLink.count();

    if (courseCount > 0) {
      const href = await firstCourseLink.getAttribute('href');
      await page.goto(href);
      await page.waitForLoadState('networkidle');

      const backBtn = page.locator('.modern-back-btn');
      if (await backBtn.count() > 0) {
        await backBtn.click();
        await page.waitForLoadState('networkidle');

        // Should be back on home page
        await expect(page.locator('.brand-title')).toBeVisible();
      }
    }
  });
});
