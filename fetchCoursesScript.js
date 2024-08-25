const fs = require('fs');
const path = require('path');
const COURSES_FOLDER = require('./constants').COURSES_FOLDER;
const fetchCourseListings = require('./utilities/fetchCourseListings');
const fetchCourseListingsV2 = require('./utilities/fetchCourseListingsV2');
const colors = require('colors');
const fetchCourses = require('./fetchCourses');
const COLOR_THEME = require('./constants').CONSOLE_COLOR_THEME;

colors.setTheme(COLOR_THEME);

fetchCourses([], true);
