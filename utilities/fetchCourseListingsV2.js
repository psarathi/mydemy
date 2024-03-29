const fs = require('fs').promises;
const path = require('path');
const topicNameSorter = require('./topicNameSorter');
const topicFileNameSorter = require('./topicFileNameSorter');
const UNNECESSARY_FILE_EXTENSIONS = ['.url', '', '.DS_Store'];

async function listDirectoriesWithTopics(
    directoryPath,
    sorted = true,
    logCourseDetails = true
) {
    const courses = [];

    try {
        const items = await fs.readdir(directoryPath, {withFileTypes: true});

        for (const item of items) {
            if (
                item.isDirectory() &&
                item.name !== '0. Websites you may like'
            ) {
                const course = {name: item.name, topics: []};
                const coursePath = path.join(directoryPath, item.name);
                let courseItems = await fs.readdir(coursePath, {
                    withFileTypes: true,
                });
                const subItems = courseItems.filter(
                    (i) =>
                        i.isDirectory() && i.name !== '0. Websites you may like'
                );

                if (subItems.length === 0) {
                    // const files = await fs.readdir(coursePath);
                    const files = courseItems
                        .filter((c) => c.isFile())
                        .map((c) => c.name);
                    const topicObj = {
                        name: item.name,
                        files: [],
                        isTopicLess: true,
                    };

                    for (const file of files) {
                        const fileInfo = path.parse(file);
                        const fileObj = {
                            fileName: file,
                            name: fileInfo.name,
                            ext: fileInfo.ext,
                        };
                        if (UNNECESSARY_FILE_EXTENSIONS.includes(fileObj.ext)) {
                            continue;
                        }
                        topicObj.files.push(fileObj);
                    }
                    course.topics.push(topicObj);
                } else {
                    await Promise.all(
                        subItems.map(async (subItem) => {
                            if (
                                subItem.isDirectory() &&
                                subItem.name !== '0. Websites you may like'
                            ) {
                                const topicObj = {
                                    name: subItem.name,
                                    files: [],
                                };
                                const topicPath = path.join(
                                    coursePath,
                                    subItem.name
                                );
                                const files = await fs.readdir(topicPath);

                                for (const file of files) {
                                    const fileInfo = path.parse(file);
                                    const fileObj = {
                                        fileName: file,
                                        name: fileInfo.name,
                                        ext: fileInfo.ext,
                                    };
                                    if (
                                        UNNECESSARY_FILE_EXTENSIONS.includes(
                                            fileObj.ext
                                        )
                                    ) {
                                        continue;
                                    }
                                    topicObj.files.push(fileObj);
                                }

                                course.topics.push(topicObj);
                            }
                        })
                    );
                }
                courses.push(course);
                if (logCourseDetails) {
                    console.log(
                        `processing course: ${course.name} topics found:${course.topics.length}`
                    );
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
    } catch (err) {
        console.error('Error:', err);
    }
    return courses;
}

module.exports = listDirectoriesWithTopics;
