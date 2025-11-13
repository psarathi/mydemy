# Mydemy Search - Quick Reference Guide

## File Locations

| File | Purpose | Lines |
|------|---------|-------|
| `/components/layout/Landing.js` | Main search UI & filtering logic | 357 |
| `/pages/index.js` | Home page, query param handling | 85 |
| `/hooks/useCourses.js` | Data fetching with SWR | 17 |
| `/pages/api/courses.js` | Course data API endpoint | 18 |
| `/pages/api/serverNotifier.js` | SSE notifications | 34 |
| `/utils/courseTracking.js` | History & favorites utils | 66 |
| `/components/common/HamburgerMenu.js` | History & favorites sidebar | 180+ |
| `/components/common/FavoriteButton.js` | Favorite toggle button | 47 |
| `/components/common/SwitchCheckbox.js` | Toggle switch component | 24 |
| `/styles/globals.css` | Search UI styles | (lines 1120-1225) |
| `/__tests__/components/layout/Landing.test.js` | Search tests | 279 |

## Key Code Snippets

### Starting Search Filtering
```javascript
// Landing.js - lines 52-89
useEffect(() => {
    if (!searchTerm) {
        setCourseList(courses);
    } else {
        let searchTermParts = searchTerm.trim().split(' ');
        const filterCourses = (c) => {
            // Partial or exact matching logic
            const courseNameMatch = !exactSearch
                ? searchTermParts.some(p => c.name.toLowerCase().indexOf(p.toLowerCase()) !== -1)
                : searchTermParts.every(p => c.name.toLowerCase().split(' ').includes(p.toLowerCase()));
            
            // Lesson search (if enabled and course doesn't match)
            if (searchInLessons && !courseNameMatch) {
                return c.topics?.some(topic =>
                    topic.files?.some(file => /* similar matching logic */)
                );
            }
            return courseNameMatch;
        };
        setCourseList(courses.filter(filterCourses));
    }
}, [searchTerm, exactSearch, searchInLessons, courses]);
```

### LocalStorage Preservation
```javascript
// Landing.js - lines 41-50
useEffect(() => {
    if (typeof window !== 'undefined') {
        if (searchTerm) {
            localStorage.setItem('lastSearchTerm', searchTerm);
        } else {
            localStorage.removeItem('lastSearchTerm');
        }
    }
}, [searchTerm]);
```

### Keyboard Shortcuts
```javascript
// Landing.js - lines 91-106
useEffect(() => {
    function handleKeyDown(e) {
        if (e.metaKey && (e.key === 'K' || e.key === 'k')) {
            searchField.current.focus();  // Cmd+K
        }
        if (e.key === 'Escape' && searchField.current === document.activeElement) {
            setSearchTerm('');  // Escape key
        }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
}, []);
```

### Data Fetching
```javascript
// useCourses.js
const fetcher = (url) => fetch(url).then((res) => res.json());
export function useCourses() {
    const {data, error, isLoading, mutate} = useSWR('/api/courses', fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 60000,
    });
    return {
        courses: data || [],
        isLoading,
        isError: error,
        mutate,
    };
}
```

### Course Tracking
```javascript
// utils/courseTracking.js
export const addToHistory = (course, session = null) => {
    const history = JSON.parse(localStorage.getItem('courseHistory') || '[]');
    const filteredHistory = history.filter(item => item.name !== course.name);
    const newHistory = [{...course, viewedAt: new Date().toISOString()}, ...filteredHistory];
    const trimmedHistory = newHistory.slice(0, 50);
    localStorage.setItem('courseHistory', JSON.stringify(trimmedHistory));
    window.dispatchEvent(new CustomEvent('courseHistoryUpdated', {
        detail: { course, history: trimmedHistory }
    }));
};
```

## API Endpoints

### GET /api/courses
Returns complete course list
```
Request:  GET /api/courses
Response: [{ name, topics: [{ name, files: [{ name, ext }] }] }]
Status:   200 (success) | 500 (error) | 405 (method not allowed)
```

### GET /api/serverNotifier
Server-Sent Events for notifications
```
Type:   SSE (text/event-stream)
Heartbeat: Every 30 seconds
Message: Sent on new course upload
Effect: Triggers useCourses.mutate() on client
```

## URL Query Parameters

```
/?q=searchterm          - Initialize with search term
/?exact=true            - Enable exact match on load
/?q=React&exact=true    - Combine both parameters
```

## LocalStorage Keys

| Key | Type | Max Size | Purpose |
|-----|------|----------|---------|
| `lastSearchTerm` | String | ~100 chars | Last search query |
| `courseHistory` | JSON Array | 50 items | Recently viewed courses |
| `courseFavorites` | JSON Array | Unlimited | Favorite courses |

## Component Props

### Landing
```javascript
<Landing 
  search_term={string}      // Initial search term from URL
  exact={boolean}           // Enable exact search from URL
  refreshCoursesRef={ref}   // Ref for course refresh function
/>
```

## Search Modes

### Partial Matching (Default)
- Match if ANY word appears in course name
- Case-insensitive substring search
- Example: "Java" matches "JavaScript Advanced"

### Exact Matching
- Match if ALL words are complete words in course name
- Case-insensitive
- Example: "Java" does NOT match "JavaScript Advanced"

### Lesson Search
- Searches lesson file names if course name doesn't match
- Uses same partial/exact logic as course names
- Only searches topics and files structure

## Custom Events

```javascript
// Dispatched when history changes
window.addEventListener('courseHistoryUpdated', (event) => {
    console.log(event.detail.history);
});

// Dispatched when favorites change
window.addEventListener('courseFavoritesUpdated', (event) => {
    console.log(event.detail.isFavorite);
});
```

## State Variables in Landing Component

```javascript
const [searchTerm, setSearchTerm] = useState('')         // Current search
const [courseList, setCourseList] = useState([])         // Filtered results
const [exactSearch, setExactSearch] = useState(false)    // Exact mode
const [searchInLessons, setSearchInLessons] = useState(false)  // Lesson mode
const [previewCourse, setPreviewCourse] = useState({})   // Preview panel
const searchField = useRef(null)                         // Input ref
```

## Common Tasks

### Clear Search
```javascript
const clearSearch = () => {
    setSearchTerm('');
    searchField.current?.focus();
};
```

### Get Recently Viewed Courses
```javascript
const viewHistory = JSON.parse(localStorage.getItem('courseHistory') || '[]');
```

### Get Favorite Courses
```javascript
const favorites = JSON.parse(localStorage.getItem('courseFavorites') || '[]');
```

### Manually Refresh Courses
```javascript
const {courses, isLoading, mutate} = useCourses();
// Later...
mutate();  // Refresh without new fetch
```

## Testing

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npm test -- Landing.test.js
```

### Test Coverage Areas
- Search filtering by term
- Exact match toggle
- Case-insensitive matching
- Multi-word search
- Keyboard shortcuts
- History tracking
- Favorites management

## Performance Tips

1. **Client-side filtering is fast** - No server requests per keystroke
2. **SWR caching prevents duplicates** - 60-second deduplication window
3. **LocalStorage is quick** - Persistent search without network calls
4. **Lazy evaluation** - useEffect dependencies prevent unnecessary recalculations

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Search doesn't persist | Check localStorage in browser dev tools |
| Exact match not working | Ensure toggle is enabled, try whole words |
| Keyboard shortcut not working | Only works with Cmd key (Mac) or Meta key (Windows) |
| Courses not loading | Check SSE connection in Network tab, verify /api/courses |
| Preview panel not showing | Hover over course card (desktop only) |

## Debug Checklist

- [ ] Check if /api/courses returns data
- [ ] Verify localStorage has 'lastSearchTerm'
- [ ] Check if SSE connection is active (Network tab)
- [ ] Verify searchTermParts split correctly (add console.log)
- [ ] Check if exactSearch/searchInLessons are affecting results
- [ ] Ensure case-insensitive comparison in filterCourses
- [ ] Verify courses array is populated from useCourses hook

## Recent Changes

| Commit | Change |
|--------|--------|
| e4bec77 | Search term preservation with localStorage |
| c062fac | Search in lessons feature |
| c1d67f4 | Search clear functionality (X button, Escape key) |

## Browser Compatibility

- Modern browsers with ES6 support
- LocalStorage required for persistence
- SSE support for notifications
- CSS Grid for responsive layout
- SVG for icons

## Future Enhancement Ideas

1. Add search result ranking/scoring
2. Implement autocomplete suggestions
3. Add search analytics/popular searches
4. Full-text search across lesson content
5. Advanced filters (difficulty, duration, etc.)
6. Saved searches feature
7. Search within search results
8. Keyboard navigation through results

