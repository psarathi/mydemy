# UI Issues Report - Mydemy Platform
Generated: 2025-11-13

## Summary
This report documents UI issues discovered through Playwright end-to-end testing and static code analysis.

---

## Critical Issues

### 1. **Page Crashes During Testing**
**Severity:** 🔴 Critical
**Location:** Multiple pages
**Description:** Browser pages are crashing during Playwright tests, particularly when waiting for network idle state. This indicates potential JavaScript errors or memory leaks.

**Affected Tests:**
- Course Page tests (11/12 tests crashed)
- Hamburger Menu tests (multiple crashes)
- Landing Page tests (multiple timeouts)

**Evidence:**
```
Error: page.waitForLoadState: Navigation failed because page crashed!
Error: locator.click: Target crashed
```

**Possible Causes:**
1. Infinite render loops in React components
2. Memory leaks in event listeners or state management
3. Issues with the EventSource connection in index.js:19 (SSE)
4. localStorage operations causing blocking or errors

**Recommendation:** Investigate JavaScript console errors and React component lifecycle issues.

---

### 2. **Invalid Next.js Configuration**
**Severity:** 🟡 Medium
**Location:** `next.config.js:29`
**Description:** The `optimizeFonts` option is deprecated/invalid in Next.js 15. This causes build warnings.

**Code:**
```javascript
// Line 29
optimizeFonts: true,
```

**Fix:** Remove this line as font optimization is now automatic in Next.js 15 with the App Router.

---

## CSS & Styling Issues

### 3. **Deprecated Flexbox Value - `start`**
**Severity:** 🟡 Medium
**Location:** Multiple CSS files
**Description:** Using `start` value for `align-items` and `justify-content` has mixed browser support. Should use `flex-start` for better compatibility.

**Affected Files:**

#### styles/Home.module.css:8
```css
.container {
    align-items: start; /* ❌ Should be flex-start */
}
```

#### styles/globals.css:785
```css
div.listingContainer {
    justify-content: start; /* ❌ Should be flex-start */
}
```

#### styles/globals.css:829
```css
div.previewContainer {
    justify-content: start; /* ❌ Should be flex-start */
}
```

**Browser Compatibility Impact:**
- May cause layout inconsistencies in older browsers
- Safari and Firefox have mixed support for `start` value
- Autoprefixer cannot automatically fix this

**Fix:** Replace all instances of `start` with `flex-start`

---

### 4. **Missing Class Attribute on Hamburger Sidebar**
**Severity:** 🟡 Medium
**Location:** `components/common/HamburgerMenu.js`
**Description:** The hamburger sidebar element receives an empty string `""` for its className instead of having a proper initial class. This causes test failures and may affect styling.

**Test Evidence:**
```
Locator: locator('.hamburger-sidebar')
Expected pattern: not /open/
Received string: ""  ← Empty string, should have a base class
```

**Current Implementation:**
```jsx
<div className={`hamburger-sidebar ${isOpen ? 'open' : ''}`}>
```

**Issue:** When `isOpen` is false, className becomes `"hamburger-sidebar "` (with trailing space), but tests show it resolves to empty string, suggesting CSS module issue or class name not being applied.

**Recommendation:**
1. Verify CSS module imports
2. Ensure `.hamburger-sidebar` class exists in the stylesheet
3. Consider using `clsx` or `classnames` library for conditional classes

---

## Performance Issues

### 5. **Test Timeouts (30-second threshold)**
**Severity:** 🟡 Medium
**Description:** Multiple tests are exceeding the 30-second timeout, indicating performance or infinite loop issues.

**Affected Operations:**
- `page.evaluate()` calls taking >30s
- `page.waitForLoadState('networkidle')` never completing
- localStorage operations blocking

**Examples:**
```
Test timeout of 30000ms exceeded.
Error: page.evaluate: Test timeout of 30000ms exceeded.
```

**Possible Causes:**
1. EventSource (SSE) connection never establishing properly in test environment
2. SWR hooks continuously refetching data
3. React component infinite re-render loops
4. LocalStorage synchronous operations blocking main thread

**Recommendations:**
1. Mock EventSource in test environment
2. Review React useEffect dependencies
3. Add error boundaries
4. Use debouncing for search inputs

---

## Accessibility Issues

### 6. **Inconsistent ARIA Labels**
**Severity:** 🟢 Low
**Description:** While most interactive elements have proper ARIA labels, some were flagged during testing.

**Good Examples:**
- Hamburger button: `aria-label="Toggle menu"`
- Close button: `aria-label="Close menu"`
- Clear search: `aria-label="Clear search"`

**Areas to Review:**
- Preview buttons on course cards
- Favorite buttons (verify all have labels)
- Video player controls

---

## UI/UX Issues Detected

### 7. **Horizontal Scrollbar Potential**
**Severity:** 🟢 Low
**Location:** Desktop viewport (1920x1080)
**Description:** Test indicates potential for horizontal scrollbar on some layouts. Body scrollWidth may exceed viewport width.

**Test Result:**
```javascript
expect(bodyScrollWidth).toBeLessThanOrEqual(windowWidth + 20);
```

**Recommendation:** Review responsive container widths and ensure proper `max-width` usage.

---

### 8. **Z-Index Layering**
**Severity:** 🟢 Low
**Location:** Hamburger menu components
**Description:** Tests verify overlay and sidebar z-index stacking but values should be documented.

**Current Behavior:** Sidebar z-index > Overlay z-index ✅

**Recommendation:** Document z-index scale in a CSS variables file for consistency:
```css
:root {
  --z-overlay: 1000;
  --z-modal: 1010;
  --z-sidebar: 1020;
  --z-notification: 1030;
}
```

---

## Test Infrastructure

### 9. **Empty `courses.json` File**
**Severity:** 🟡 Medium
**Location:** Root directory
**Description:** The courses.json file contains only `[]` which causes many course-related tests to fail or timeout.

**Impact:**
- Course page tests cannot find valid courses to test
- Preview functionality tests fail
- Video player tests cannot run

**Recommendation:** Add test fixtures with mock course data for testing purposes.

---

## Passing Tests ✅

The following UI elements passed validation:
- ✅ Search bar functionality and clear button
- ✅ Search controls (Exact match, Search in lessons toggles)
- ✅ Course count display
- ✅ Course grid layout structure
- ✅ Hamburger menu button visibility
- ✅ Preview section placeholder
- ✅ Keyboard shortcuts (Cmd/Ctrl+K for search, Escape to clear)
- ✅ localStorage persistence for search terms
- ✅ Theme toggle functionality (when present)
- ✅ Responsive design on mobile (375px) and tablet (768px) viewports
- ✅ SVG icons rendering correctly
- ✅ Focus styles on form elements

---

## Priority Fixes

### High Priority
1. 🔴 Investigate and fix page crashes (critical for stability)
2. 🔴 Fix empty courses.json or add test fixtures
3. 🟡 Remove invalid `optimizeFonts` from Next.js config

### Medium Priority
4. 🟡 Replace CSS `start` values with `flex-start` (3 instances)
5. 🟡 Fix hamburger sidebar className issue
6. 🟡 Add timeouts and error handling for EventSource

### Low Priority
7. 🟢 Document z-index scale
8. 🟢 Review horizontal scrollbar on wide viewports
9. 🟢 Complete ARIA label audit

---

## Testing Commands

### Run E2E Tests
```bash
# Run all Playwright tests
npm run test:e2e

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run with UI mode
npm run test:e2e:ui
```

### Test Coverage
- **Total Tests:** 63
- **Landing Page:** 19 tests
- **Course Page:** 12 tests
- **Hamburger Menu:** 14 tests
- **UI/Visual:** 18 tests

---

## Files Created

This analysis created the following Playwright test files:

1. `tests/e2e/landing-page.spec.js` - Landing page tests
2. `tests/e2e/course-page.spec.js` - Course detail page tests
3. `tests/e2e/hamburger-menu.spec.js` - Navigation menu tests
4. `tests/e2e/ui-visual.spec.js` - Visual regression and UI tests
5. `playwright.config.js` - Playwright configuration
6. `.env` - Test environment configuration

---

## Next Steps

1. **Fix Critical Issues:** Address page crashes before other issues
2. **Update Dependencies:** Ensure all packages are compatible with Next.js 15
3. **Add Test Data:** Create test fixtures for courses
4. **CSS Fixes:** Apply flexbox compatibility fixes
5. **Performance Audit:** Profile React components for re-render issues
6. **Re-run Tests:** After fixes, re-run Playwright suite to verify

---

**Report Generated By:** Playwright UI Testing Suite
**Test Environment:** Node.js + Next.js 15 + Chromium
**Date:** 2025-11-13
