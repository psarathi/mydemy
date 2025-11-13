# Mydemy Search Functionality - Comprehensive Documentation

## Executive Summary
The Mydemy application implements a **client-side, real-time search system** for courses and lessons. It combines multiple search modes (partial and exact matching), supports lesson-level search, and includes advanced features like search term preservation, history tracking, and keyboard shortcuts.

---

## 1. How is Search Implemented?

### Frontend Implementation (Client-Side)
- **Type**: Client-side filtering (No server-side search requests)
- **Architecture**: Real-time, reactive search using React hooks
- **Data Source**: In-memory course data fetched from backend
- **Filtering Logic**: JavaScript array methods (filter, map, some, every)

### Backend Implementation
- **API Endpoint**: `/api/courses` (GET)
- **Response**: Complete course data including topics and lessons
- **Caching**: SWR (Stale-While-Revalidate) with 60-second deduplication interval

### Key Technologies
1. **React Hooks**: useState, useEffect, useRef
2. **Next.js**: Router, dynamic routes, static generation
3. **SWR**: Data fetching and caching library
4. **LocalStorage**: Search persistence and history tracking
5. **Next-Auth**: Session management for history tracking

---

## 2. Components Involved in Search Feature

### Core Components

#### Landing Component (`/components/layout/Landing.js`)
- **Size**: 357 lines
- **Role**: Main search UI and filtering logic
- **Key Features**:
  - Search input field with real-time filtering
  - Exact match toggle
  - Search in lessons toggle
  - Course grid display with filtering
  - Course preview panel
  - Keyboard shortcuts (Cmd+K)
  - Clear search functionality

#### Landing Page (`/pages/index.js`)
- **Size**: 85 lines
- **Role**: Page wrapper and query parameter handling
- **Key Features**:
  - Passes URL query parameters to Landing component
  - Server-Sent Events (SSE) connection for notifications
  - Auto-refresh courses on new uploads
  - Notification display for course updates

#### useCourses Hook (`/hooks/useCourses.js`)
- **Size**: 17 lines
- **Role**: Data fetching hook using SWR
- **Key Features**:
  - Fetches courses from `/api/courses`
  - Caches data with 60-second deduplication
  - Provides mutate function for manual refresh
  - Returns loading state and error handling

### Supporting Components

#### HamburgerMenu (`/components/common/HamburgerMenu.js`)
- **Size**: 180+ lines
- **Features**:
  - Display favorites (searchable sidebar)
  - Display recently viewed courses (history)
  - History clearing functionality
  - localStorage integration

#### FavoriteButton (`/components/common/FavoriteButton.js`)
- **Size**: 47 lines
- **Features**:
  - Toggle course favorite status
  - Event listener for favorite updates
  - Visual feedback for favorited courses

#### SwitchCheckbox (`/components/common/SwitchCheckbox.js`)
- **Size**: 24 lines
- **Role**: Toggle component for search modes
- **Usage**: Exact match toggle, search in lessons toggle

---

## 3. Type of Search Implementation

### Search Modes

#### 1. Partial/Fuzzy Matching (Default)
```javascript
searchTermParts.some(p => 
    c.name.toLowerCase().indexOf(p.toLowerCase()) !== -1
)
```
- **Behavior**: Matches if ANY search term word appears in course name
- **Case-insensitive**: Yes
- **Example**: Search "Java" matches "JavaScript Advanced"

#### 2. Exact Matching
```javascript
searchTermParts.every(p =>
    c.name.toLowerCase().split(' ').includes(p.toLowerCase())
)
```
- **Behavior**: Matches if ALL search terms appear as whole words
- **Case-insensitive**: Yes
- **Example**: Search "Java" does NOT match "JavaScript Advanced"

#### 3. Lesson-Level Search
- **Scope**: Searches within lesson file names if course name doesn't match
- **Feature**: Toggle "Search in lessons" to enable
- **Logic**: Only activates if course name doesn't match the search term
- **Implementation**: Nested filtering through topics and files

### Search Characteristics
- **Real-time**: Filters as user types
- **Client-side**: All filtering happens in browser
- **No Network Calls**: Uses pre-fetched data
- **Multi-word Support**: Handles space-separated search terms
- **Case-insensitive**: Converts all comparisons to lowercase

---

## 4. Data Being Searched

### Data Structure
```javascript
{
  name: string,           // Course name
  topics: [
    {
      name: string,       // Topic name
      files: [
        {
          name: string,   // Lesson/file name
          fileName: string,
          ext: string     // File extension (e.g., '.mp4')
        }
      ]
    }
  ]
}
```

### Search Scope
1. **Course names** - Primary search target
2. **Lesson names** - Optional (when "Search in lessons" is enabled)
3. **Topic names** - Indirectly (via lesson search)

### Data Source
- **File**: `/courses.json` (generated at build time)
- **API Endpoint**: `/api/courses`
- **Size**: Variable (dynamically loaded from file system)
- **Caching**: 60-second SWR deduplication

---

## 5. Search UI Implementation

### Search Input Area
**Location**: Top of landing page

**HTML Structure**:
```html
<div class="search-section">
  <div class="search-bar">
    <svg class="search-icon" />
    <input class="modern-search-input" placeholder="Search courses..." />
    <button class="search-clear-btn" aria-label="Clear search" />
  </div>
  <div class="search-controls">
    <label class="exact-search-toggle">
      <SwitchCheckbox /> Exact match
    </label>
    <label class="exact-search-toggle">
      <SwitchCheckbox /> Search in lessons
    </label>
  </div>
</div>
```

### CSS Styling
**File**: `/styles/globals.css` (lines 1120-1225)

**Key Styles**:
- `.search-bar`: Flex container with search icon and clear button
- `.modern-search-input`: Styled input with blur effect
- `.search-controls`: Toggle switches for exact search and lesson search
- `.search-clear-btn`: Positioned absolute button on right
- `.search-icon`: Positioned absolute icon on left

### Features
1. **Search Icon**: Left-aligned magnifying glass (visual indicator)
2. **Clear Button**: Right-aligned X button (appears when searching)
3. **Placeholder Text**: "Search courses..."
4. **Auto-focus**: Search input auto-focuses on page load
5. **Keyboard Shortcut**: Cmd+K to focus search input
6. **Escape Key**: Clear search when input is focused

### Results Display
- **Format**: Grid of course cards
- **Count**: Displays "X available" courses below search bar
- **Filtering**: Dynamic, updates as user types
- **Empty State**: Shows message when no courses match

---

## 6. Search-Related APIs & Endpoints

### API Endpoints

#### GET `/api/courses`
- **Method**: GET
- **Response**: JSON array of all courses
- **Status Codes**:
  - 200: Success
  - 500: Error reading courses file
  - 405: Method not allowed (non-GET requests)

**Implementation**: `/pages/api/courses.js` (18 lines)
```javascript
- Reads from courses.json
- Parses JSON and returns data
- Error handling for file read failures
```

#### GET `/api/serverNotifier`
- **Method**: GET
- **Type**: Server-Sent Events (SSE)
- **Purpose**: Notify client of new course uploads
- **Features**:
  - Heartbeat every 30 seconds
  - Triggers auto-refresh of course list
  - Keeps SSE connection alive

### Query Parameters

#### URL Query Parameters (Home Page)
- `?q=searchterm` - Initial search term
- `?exact=true` - Enable exact search mode on load

**Example**: `/?q=React&exact=true`

**Implementation**: `/pages/index.js` passes params to Landing component:
```javascript
<Landing 
  search_term={router.query?.q}
  exact={router.query?.exact}
/>
```

---

## 7. Libraries & Technologies Used

### Core Framework
- **Next.js 15.0.0**: Full-stack React framework
- **React 18.3.0**: UI library and hooks

### Data Management
- **SWR 2.3.6**: 
  - Real-time data fetching
  - Automatic caching and deduplication
  - Mutation support for manual refresh

### Authentication & Sessions
- **Next-Auth 4.24.11**:
  - Session management
  - User tracking for history

### State Management
- **React Hooks**:
  - useState: Search term, exact match toggle, search in lessons
  - useEffect: Filtering logic, keyboard shortcuts, localStorage sync
  - useRef: Search input focus

### Storage
- **Browser LocalStorage**:
  - `lastSearchTerm`: Preserves last search
  - `courseHistory`: Tracks viewed courses (max 50)
  - `courseFavorites`: Tracks favorite courses

### Event System
- **Custom Events**:
  - `courseHistoryUpdated`: Dispatched when history changes
  - `courseFavoritesUpdated`: Dispatched when favorites change

### Styling
- **CSS (Custom Properties)**:
  - Modern design system with CSS variables
  - Responsive grid layout
  - Theme support (light/dark via ThemeContext)

---

## 8. Search Results Display & Ranking

### Display Format
**Layout**: CSS Grid with responsive columns
**File**: `/styles/globals.css` (lines 1255-1299)

### Course Card Display
```
┌─────────────────────────┐
│ Course Title            │
│ 5 topics  |  20 lessons │
│ ❤️ Preview Button       │
└─────────────────────────┘
```

### Result Ranking/Sorting
- **No explicit ranking**: Results displayed in original order
- **No relevance scoring**: All matches treated equally
- **No sorting**: Preserves order from courses.json

### Course Preview
- **Feature**: Hover on desktop to preview course structure
- **Content Shown**:
  - Course title
  - Topic count
  - Topic names and lesson counts
  - Direct links to topics/lessons
  - Lesson navigation

### Course Count Display
- **Location**: Next to "Courses" heading
- **Format**: "X available"
- **Updates**: Real-time as search filters results

### Results Interaction
1. **Click Course**: Navigate to course detail page
2. **Preview Course**: Hover to expand right panel
3. **Favorite Course**: Star icon to save favorites
4. **Direct Navigation**: Preview panel allows direct topic/lesson access

---

## 9. Existing Optimizations & Features

### Performance Optimizations

#### 1. SWR Caching
- **Deduplication**: 60-second window prevents duplicate requests
- **Revalidation**: Disabled on focus (`revalidateOnFocus: false`)
- **Mutate Function**: Allows manual cache refresh without new fetch

#### 2. Client-Side Filtering
- **Benefit**: No server round-trips per keystroke
- **Speed**: Instant search results
- **Scalability**: Works well up to thousands of courses

#### 3. LocalStorage Preservation
- **Feature**: Last search term saved
- **Benefit**: Restores search on page reload
- **Persistence**: Browser-level storage

### Advanced Search Features

#### 1. Exact Match Toggle
- **Default**: OFF (partial matching)
- **Enabled**: Requires all words as complete matches
- **UI**: Switch checkbox with label

#### 2. Search in Lessons
- **Default**: OFF (course-level only)
- **Enabled**: Searches through lesson file names
- **Behavior**: Only activates if course name doesn't match
- **UI**: Switch checkbox with label

#### 3. Keyboard Shortcuts
- **Cmd+K / Cmd+k**: Focus search input (Mac/CMD key)
- **Escape**: Clear search (when input is focused)

#### 4. Search Clear Button
- **Visual**: X icon appears when searching
- **Action**: Clears search term and refocuses input
- **Style**: Hover effects with error color

#### 5. Search Term Preservation
- **Feature**: Saves last search to localStorage
- **Key**: `lastSearchTerm`
- **Behavior**: 
  - If URL has `?q=term`, uses that
  - Otherwise loads from localStorage
  - Clears storage when search is cleared

### User Experience Features

#### 1. Course History Tracking
- **Storage**: localStorage `courseHistory`
- **Limit**: Last 50 viewed courses
- **Timestamp**: Records when course was viewed
- **Display**: Sidebar menu showing recent courses
- **Clearing**: Manual clear button in menu

#### 2. Favorites System
- **Storage**: localStorage `courseFavorites`
- **Persistence**: No limit
- **Timestamp**: Records when favorited
- **Visual Feedback**: Filled star for favorites
- **Display**: Sidebar menu showing favorites
- **Availability**: Works for all users (logged in or not)

#### 3. Mobile-Responsive Design
- **Layouts**: Adapts to different screen sizes
- **Navigation**: Hamburger menu for mobile
- **Search Bar**: Full-width responsive
- **Course Grid**: Responsive columns (CSS Grid)

#### 4. Real-Time Notifications
- **Feature**: SSE connection for upload notifications
- **Trigger**: Auto-refresh courses when new uploads detected
- **Display**: Toast notification on new courses
- **Duration**: 3-second auto-dismiss

#### 5. Course Details
- **On Hover**: Shows topics and lesson counts
- **Preview Panel**: Right sidebar with full course structure
- **Navigation**: Direct links to specific lessons
- **URL Sharing**: Links include topic/lesson parameters

---

## 10. Search History & Recent Changes

### Recent Git Commits
1. **e4bec77**: Add search term preservation with localStorage
   - Added automatic save/load of last search term

2. **c062fac**: Add search in lessons feature
   - Enabled searching within lesson file names
   - Added toggle switch for feature

3. **c1d67f4**: Add search clear functionality with Escape key and X button
   - X button in search input
   - Escape key to clear search
   - Refocus input after clearing

---

## 11. File Structure Summary

### Key Files
```
/home/user/mydemy/
├── components/layout/
│   └── Landing.js                    (357 lines) - Main search UI
├── components/common/
│   ├── HamburgerMenu.js             (180+ lines) - Favorites & history
│   ├── FavoriteButton.js            (47 lines) - Favorite toggle
│   └── SwitchCheckbox.js            (24 lines) - Toggle control
├── pages/
│   ├── index.js                     (85 lines) - Home page wrapper
│   ├── [courseName].js              (326 lines) - Course details
│   └── api/
│       ├── courses.js               (18 lines) - Course API
│       └── serverNotifier.js        (34 lines) - SSE notifications
├── hooks/
│   └── useCourses.js               (17 lines) - Data fetching hook
├── utils/
│   └── courseTracking.js           (66 lines) - History & favorites utils
├── styles/
│   └── globals.css                  (Search styles: lines 1120-1225)
└── __tests__/
    └── components/layout/
        └── Landing.test.js          (279 lines) - Search tests
```

---

## 12. Code Examples

### Search Filtering Logic
**File**: `/components/layout/Landing.js` (lines 52-89)

```javascript
useEffect(() => {
    if (!searchTerm) {
        setCourseList(courses);
    } else {
        let searchTermParts = searchTerm.trim().split(' ');

        const filterCourses = (c) => {
            // Course name matching
            const courseNameMatch = !exactSearch
                ? searchTermParts.some(
                      (p) => c.name.toLowerCase().indexOf(p.toLowerCase()) !== -1
                  )
                : searchTermParts.every((p) =>
                      c.name.toLowerCase().split(' ').includes(p.toLowerCase())
                  );

            // Lesson-level search (if enabled and course doesn't match)
            if (searchInLessons && !courseNameMatch) {
                const hasMatchingLesson = c.topics?.some((topic) =>
                    topic.files?.some((file) =>
                        !exactSearch
                            ? searchTermParts.some(
                                  (p) => file.name.toLowerCase().indexOf(p.toLowerCase()) !== -1
                              )
                            : searchTermParts.every((p) =>
                                  file.name.toLowerCase().split(' ').includes(p.toLowerCase())
                              )
                    )
                );
                return hasMatchingLesson;
            }

            return courseNameMatch;
        };

        setCourseList(courses.filter(filterCourses));
    }
}, [searchTerm, exactSearch, searchInLessons, courses]);
```

### LocalStorage Preservation
**File**: `/components/layout/Landing.js` (lines 16-50)

```javascript
const getInitialSearchTerm = () => {
    if (search_term) return search_term;
    if (typeof window !== 'undefined') {
        return localStorage.getItem('lastSearchTerm') || '';
    }
    return '';
};

// ... later ...

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
**File**: `/components/layout/Landing.js` (lines 91-106)

```javascript
useEffect(() => {
    function handleKeyDown(e) {
        // Cmd+K to focus search
        if (e.metaKey && (e.key === 'K' || e.key === 'k')) {
            searchField.current.focus();
        }
        // Escape to clear search
        if (e.key === 'Escape' && searchField.current === document.activeElement) {
            setSearchTerm('');
        }
    }

    document.addEventListener('keydown', handleKeyDown);
    return function cleanup() {
        document.removeEventListener('keydown', handleKeyDown);
    };
}, []);
```

---

## 13. Testing Coverage

### Test File
**Location**: `/home/user/mydemy/__tests__/components/layout/Landing.test.js`
**Total Tests**: 15+

### Key Test Cases
1. Search filtering by term
2. Exact search toggle behavior
3. Case-insensitive matching
4. Multi-word search handling
5. Clear search functionality
6. Keyboard shortcuts (Cmd+K)
7. Course count display
8. Favorite button integration
9. History tracking on course click
10. Initialization with URL parameters
11. Hamburger menu integration

---

## Summary Table

| Aspect | Details |
|--------|---------|
| **Search Type** | Client-side, real-time filtering |
| **Data Source** | In-memory courses from /api/courses |
| **Matching Modes** | Partial (fuzzy) and Exact |
| **Search Scope** | Course names, optionally lesson names |
| **Performance** | O(n) filtering with instant results |
| **Persistence** | localStorage (search term, history, favorites) |
| **UI Components** | Landing, HamburgerMenu, FavoriteButton |
| **Libraries** | React, Next.js, SWR, Next-Auth |
| **Keyboard Support** | Cmd+K to focus, Escape to clear |
| **Special Features** | History tracking, Favorites, SSE notifications |

