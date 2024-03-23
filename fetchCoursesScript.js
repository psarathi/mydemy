const fs = require('fs');
const path = require('path');
const COURSES_FOLDER = require('./constants').COURSES_FOLDER;
const fetchCourseListings = require('./utilities/fetchCourseListings');
const fetchCourseListingsV2 = require('./utilities/fetchCourseListingsV2');
const colors = require('colors');
const COLOR_THEME = require('./constants').CONSOLE_COLOR_THEME;

colors.setTheme(COLOR_THEME);

console.log('fetching courses...'.info);
const currentDirectory = path.join(COURSES_FOLDER);
fetchCourseListingsV2(currentDirectory).then((courses) => {
    console.log(`${courses.length} courses were found`);
    fs.writeFileSync('courses.json', JSON.stringify(courses));
    console.log('courses fetched and file created'.info);
});
