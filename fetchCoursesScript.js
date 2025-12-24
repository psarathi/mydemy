// Load environment variables from .env files (supports .env.local, .env.production, etc.)
require('dotenv').config({ path: ['.env.local', '.env'] });

const fs = require('fs');
const path = require('path');
const COURSES_FOLDER = require('./constants').COURSES_FOLDER;
const fetchCourseListings = require('./utilities/fetchCourseListings');
const fetchCourseListingsV2 = require('./utilities/fetchCourseListingsV2');
const colors = require('colors');
const fetchCourses = require('./fetchCourses');
const COLOR_THEME = require('./constants').CONSOLE_COLOR_THEME;

colors.setTheme(COLOR_THEME);

// Allow skipping course fetch for Tauri builds or when CDN is not accessible
// Set SKIP_COURSE_FETCH=true to preserve existing courses.json
if (process.env.SKIP_COURSE_FETCH === 'true') {
    console.log('⏭️  Skipping course fetch (SKIP_COURSE_FETCH=true)');

    // Verify courses.json exists
    const coursesFile = require('./constants').COURSES_FILE_NAME;
    if (fs.existsSync(coursesFile)) {
        const courses = JSON.parse(fs.readFileSync(coursesFile, 'utf-8'));
        console.log(`✓ Using existing ${coursesFile} with ${courses.length} courses`);
        process.exit(0);
    } else {
        console.error(`❌ SKIP_COURSE_FETCH is set but ${coursesFile} does not exist!`);
        console.error('   Please either:');
        console.error('   1. Create a courses.json file, or');
        console.error('   2. Unset SKIP_COURSE_FETCH to fetch from CDN');
        process.exit(1);
    }
}

const enableLogging = process.env.ENABLE_LOGGING === 'true';
fetchCourses([], enableLogging);
