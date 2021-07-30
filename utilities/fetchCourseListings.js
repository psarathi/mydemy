const fs = require('fs');
const path = require('path');
const topicFileNameSorter = require('./topicFileNameSorter');
const topicNameSorter = require('./topicNameSorter');

let rootCourseFolder = null;
let courses = [];

// This recursive function just goes 2 level deep, courses -> course name -> course topics -> topic files
const fetchCourseListings = (dirPath, sorted = true) => {
    rootCourseFolder = rootCourseFolder || dirPath;
    for (const item of fs.readdirSync(dirPath)) {
        const fullPath = path.join(dirPath, item);
        if (fs.statSync(fullPath).isDirectory()) {
            // if we're under the main course folder create a new course object
            if (dirPath === rootCourseFolder) {
                courses.push({name: item, topics: []});
                fetchCourseListings(fullPath);
            } else {
                //    if we're not under the main folder then we must be under a course folder
                const topicDetails = path.parse(fullPath);
                const courseName = topicDetails.dir.split('/').pop();
                //    get the course object using the course name
                const courseIndex = courses.findIndex(
                    (course) => course.name === courseName
                );
                courses[courseIndex].topics.push({
                    name: topicDetails.base,
                    files: [],
                });
                fetchCourseListings(fullPath);
            }
        } else {
            // ignore any files under the main course folder
            if (dirPath === rootCourseFolder) {
                continue;
            }
            //    we're inside one of the topic folders
            const topicDetails = path.parse(fullPath);
            const pathSegments = topicDetails.dir.split('/');
            const topicName = pathSegments.pop();
            const courseName = pathSegments.pop();
            //    get the course object using the course name
            const courseIndex = courses.findIndex(
                (course) => course.name === courseName
            );
            const topicIndex = courses[courseIndex].topics.findIndex(
                (topic) => topic.name === topicName
            );
            //don't include anything other than the video and the subtitle files
            if (topicDetails.ext.match(/.srt|.mp4/g)) {
                courses[courseIndex].topics[topicIndex].files.push({
                    fileName: `${topicDetails.base}`,
                    name: `${topicDetails.name}`,
                    ext: `${topicDetails.ext}`,
                });
            }
        }
    }
    if (sorted) {
        // sort the topic names and files in proper serial order
        courses.forEach((c) => {
            c.topics = c.topics.sort(topicNameSorter);
            c.topics.forEach((t) => {
                t.files = t.files.sort(topicFileNameSorter);
            });
        });
    }
    return courses;
};

module.exports = fetchCourseListings;
