# Mydemy Search Functionality - Documentation Index

This directory contains comprehensive documentation of the search implementation in the Mydemy learning platform.

## Documents Overview

### 1. SEARCH_IMPLEMENTATION.md (19 KB)
**Comprehensive Technical Documentation**

This is the main technical documentation covering:
- How search is implemented (frontend & backend)
- All components involved in search
- Types of search (partial, exact, lesson-level)
- Data being searched
- UI implementation details
- API endpoints and query parameters
- Libraries and technologies used
- Search results display and ranking
- Optimizations and advanced features
- Git history of search changes
- File structure and code examples
- Testing coverage

**Best for**: Understanding the complete search system, implementation details, and architecture decisions.

### 2. SEARCH_ARCHITECTURE.txt (24 KB)
**Visual Architecture Diagrams**

Contains:
- User interaction flow diagram
- React state management layer
- Search filtering logic layer
- Persistence & side effects layer
- Display & rendering layer
- Data fetching & caching layer
- Backend API layer
- Data storage & persistence layer
- Search flow diagram
- Component dependency tree
- Key features map
- Performance characteristics

**Best for**: Visual learners, understanding data flow, system architecture overview.

### 3. SEARCH_QUICK_REFERENCE.md (8.9 KB)
**Practical Quick Reference Guide**

Includes:
- File locations table
- Key code snippets
- API endpoint reference
- URL query parameters
- LocalStorage keys
- Component props
- Search modes explanation
- Custom events
- State variables
- Common tasks & code patterns
- Testing guide
- Common issues & solutions
- Debug checklist
- Browser compatibility
- Future enhancement ideas

**Best for**: Developers working on the code, quick lookups, troubleshooting.

## Quick Start Guide

### For Understanding the System
1. Start with SEARCH_ARCHITECTURE.txt for visual overview
2. Read SEARCH_IMPLEMENTATION.md for detailed technical information
3. Use SEARCH_QUICK_REFERENCE.md for code snippets and API details

### For Modifying Search Functionality
1. Refer to SEARCH_QUICK_REFERENCE.md for file locations
2. Find the relevant code in component files
3. Check SEARCH_IMPLEMENTATION.md section 3-9 for specific feature logic
4. Review test cases in SEARCH_QUICK_REFERENCE.md Testing section

### For Debugging Issues
1. Check SEARCH_QUICK_REFERENCE.md "Common Issues & Solutions"
2. Use the Debug Checklist in SEARCH_QUICK_REFERENCE.md
3. Review SEARCH_ARCHITECTURE.txt flow diagrams
4. Examine code in relevant component from SEARCH_QUICK_REFERENCE.md

## Key Files Reference

### Core Components
- `/components/layout/Landing.js` - Main search UI & filtering (357 lines)
- `/pages/index.js` - Home page, query parameter handling (85 lines)
- `/hooks/useCourses.js` - Data fetching with SWR (17 lines)

### Supporting Components
- `/components/common/HamburgerMenu.js` - Favorites & history sidebar
- `/components/common/FavoriteButton.js` - Favorite toggle
- `/components/common/SwitchCheckbox.js` - Toggle control

### APIs & Data
- `/pages/api/courses.js` - Course data endpoint
- `/pages/api/serverNotifier.js` - SSE notifications
- `/utils/courseTracking.js` - History & favorites utilities
- `/styles/globals.css` - Search UI styles (lines 1120-1225)

### Tests
- `/__tests__/components/layout/Landing.test.js` - Search tests (279 lines)

## Key Features Summary

### Search Capabilities
- Real-time filtering (as user types)
- Partial/fuzzy matching (default)
- Exact word matching (toggle)
- Lesson-level search (toggle)
- Case-insensitive search
- Multi-word search support

### User Experience
- Auto-focus search input on page load
- Keyboard shortcut: Cmd+K to focus search
- Escape key to clear search
- Visual clear button (X icon)
- Search term persistence (localStorage)
- Course history tracking (max 50 items)
- Favorites system

### Performance
- Client-side filtering (instant results)
- SWR caching (60-second deduplication)
- No server requests per keystroke
- Optimized array filtering
- Responsive UI

## Technology Stack

- **Framework**: Next.js 15.0.0
- **UI Library**: React 18.3.0
- **Data Fetching**: SWR 2.3.6
- **Authentication**: Next-Auth 4.24.11
- **Styling**: CSS with custom properties
- **State Management**: React Hooks
- **Storage**: Browser LocalStorage
- **Events**: Custom DOM events

## Recent Changes

| Commit | Description |
|--------|-------------|
| e4bec77 | Add search term preservation with localStorage |
| c062fac | Add search in lessons feature |
| c1d67f4 | Add search clear functionality with Escape key and X button |

## Typical Search Flow

1. User types in search input
2. onChange event updates React state (searchTerm)
3. useEffect with dependencies triggers
4. Filter algorithm runs:
   - Splits search term by spaces
   - Applies exact/partial matching
   - Checks course names
   - Optionally checks lesson names
5. Results stored in courseList state
6. Component re-renders with filtered courses
7. Search term saved to localStorage
8. Course count updated

## Common Customizations

### To Add Ranking
Modify the filter logic in `/components/layout/Landing.js` lines 52-89 to return objects with relevance scores instead of just filtered courses.

### To Add Autocomplete
Create a new component that listens to searchTerm state and suggests completions from course names.

### To Change Search Scope
Modify the filterCourses function to include/exclude topic names or other fields in the search.

### To Add Advanced Filters
Add new toggle switches alongside exactSearch and searchInLessons, then modify the filter logic to check additional conditions.

### To Implement Server-Side Search
Replace the client-side filtering with an API call to a new `/api/search` endpoint that performs database queries.

## Performance Characteristics

- **Time Complexity**: O(n * m) where n = courses, m = search terms
- **Space Complexity**: O(n) for filtered results
- **Typical Response**: <50ms for search keystroke

## Testing Coverage

The test file `Landing.test.js` includes 15+ test cases covering:
- Search filtering
- Exact match toggle
- Case-insensitive matching
- Multi-word search
- Clear functionality
- Keyboard shortcuts
- History tracking
- Favorites integration

## Browser Compatibility

Requires:
- Modern browser with ES6 support
- LocalStorage support
- SSE (Server-Sent Events) support for notifications
- CSS Grid support
- SVG support

## Future Enhancement Ideas

1. Search result ranking/relevance scoring
2. Autocomplete suggestions
3. Search analytics/popular searches
4. Full-text search across lesson content
5. Advanced filters (difficulty, duration, instructor)
6. Saved searches feature
7. Search within search results
8. Keyboard navigation through results
9. Voice search
10. Fuzzy matching improvements

## Troubleshooting Quick Links

- **Search not working**: Check `/api/courses` endpoint
- **Results not updating**: Verify searchTermParts split logic
- **Keyboard shortcut not responding**: Ensure Cmd key (Mac) or Meta key
- **History not persisting**: Check localStorage in DevTools
- **Preview panel not showing**: Only visible on desktop/hover

## Contributing

When modifying search functionality:
1. Update relevant documentation files
2. Run test suite: `npm test`
3. Test both search modes (partial and exact)
4. Verify localStorage persistence
5. Check keyboard shortcuts still work
6. Update test cases if behavior changes

## Questions or Issues?

Refer to the appropriate documentation:
- **"How do I...?"** → SEARCH_QUICK_REFERENCE.md
- **"Why is it designed this way?"** → SEARCH_IMPLEMENTATION.md
- **"What's the overall flow?"** → SEARCH_ARCHITECTURE.txt

---

**Last Updated**: 2025-11-13
**Documentation Version**: 1.0
**Search Implementation Status**: Production Ready
