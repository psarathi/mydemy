const fs = require('node:fs/promises');
const path = require('path');
const {COURSES_FOLDER, COURSES_FILE_NAME} = require('./constants');
const fetchCourseListingsV2 = require('./utilities/fetchCourseListingsV2');
const fetchCourses = async (
    coursesToProcess = [],
    logCourseDetails = false
) => {
    console.log('fetching courses...');
    const currentDirectory = path.join(COURSES_FOLDER);
    let courses = await fetchCourseListingsV2(
        currentDirectory,
        coursesToProcess,
        true,
        logCourseDetails
    );
    console.log(`${courses.length} courses were found`);
    if (coursesToProcess.length > 0) {
        let existingCourses = JSON.parse(
            await fs.readFile(COURSES_FILE_NAME, 'utf-8')
        );
        courses = [...existingCourses, ...courses];
    }
    await fs.writeFile(COURSES_FILE_NAME, JSON.stringify(courses));
    console.log('courses fetched and file updated');
};

module.exports = fetchCourses;
