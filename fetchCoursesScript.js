// Load environment variables from .env files (supports .env.local, .env.production, etc.)
require('dotenv').config({ path: ['.env.local', '.env'] });

const fs = require('fs');
const path = require('path');
const COURSES_FOLDER = require('./lib/constants').COURSES_FOLDER;
const colors = require('colors');
const fetchCourses = require('./lib/courses/fetchCourses');
const COLOR_THEME = require('./lib/constants').CONSOLE_COLOR_THEME;

colors.setTheme(COLOR_THEME);

fetchCourses([], true);
