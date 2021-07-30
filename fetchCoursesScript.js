const fs = require('fs');
const path = require('path');
const COURSES_FOLDER = require('./constants').COURSES_FOLDER;
const fetchCourseListings = require('./utilities/fetchCourseListings');

console.log('fetching courses...');
const currentDirectory = path.join(process.cwd(), COURSES_FOLDER);
const courses = fetchCourseListings(currentDirectory);
fs.writeFileSync('courses.json', JSON.stringify(courses));
console.log('courses fetched and file created');
