const fs = require('node:fs/promises');
const path = require('path');
const {COURSES_FOLDER, COURSES_FILE_NAME} = require('./constants');
const fetchCourseListingsV2 = require('./utilities/fetchCourseListingsV2');
const fetchCourseListingsV3 = require('./utilities/fetchCourseListingsV3');
const {createHlsAudioVariants} = require('./utilities/hlsAudio');

async function generateHlsAudio(courses) {
    const videoPaths = courses.flatMap((course) =>
        course.topics.flatMap((topic) => topic.files.map((file) =>
            topic.isTopicLess
                ? path.join(COURSES_FOLDER, course.name, file.fileName)
                : path.join(COURSES_FOLDER, course.name, topic.name, file.fileName)
        ))
    );
    let generated = 0;
    for (const videoPath of videoPaths) {
        try {
            const result = await createHlsAudioVariants(videoPath);
            if (result.created) generated += 1;
        } catch (error) {
            console.warn(`⚠️  Could not generate HLS audio for ${videoPath}: ${error.message}`);
        }
    }
    if (generated) console.log(`✓ Generated HLS audio playlists for ${generated} videos`);
}
const fetchCourses = async (
    coursesToProcess = [],
    logCourseDetails = false
) => {
    console.log('fetching courses...');
    const currentDirectory = path.join(COURSES_FOLDER);
    let courses = await fetchCourseListingsV3(
        currentDirectory,
        coursesToProcess,
        true,
        logCourseDetails
    );
    console.log(`${courses.length} courses were found`);

    // Remuxing is CPU and disk intensive, so ordinary catalog refreshes skip
    // it. Set GENERATE_HLS_AUDIO=true when a refresh should create missing
    // multi-language HLS playlists.
    if (process.env.GENERATE_HLS_AUDIO === 'true') {
        await generateHlsAudio(courses);
    } else {
        console.log('⏭️  Skipping HLS audio generation (set GENERATE_HLS_AUDIO=true to enable)');
    }

    // If no courses found, check if we should preserve existing file
    if (courses.length === 0) {
        try {
            // Try to read existing courses.json
            const existingData = await fs.readFile(COURSES_FILE_NAME, 'utf-8');
            const existingCourses = JSON.parse(existingData);

            if (existingCourses.length > 0) {
                console.warn('⚠️  No courses fetched from CDN, but preserving existing courses.json with', existingCourses.length, 'courses');
                return; // Don't overwrite existing file
            }
        } catch (err) {
            // No existing file or invalid JSON
        }

        // No courses found and no valid existing file - this is an error
        console.error('❌ No courses found and no existing courses.json to fall back to!');
        console.error('   Please check:');
        console.error('   1. CDN is accessible at:', process.env.NEXT_PUBLIC_BASE_CDN_PATH || 'http://192.168.1.141:5555');
        console.error('   2. COURSES_FOLDER exists:', COURSES_FOLDER);
        process.exit(1);
    }

    if (coursesToProcess.length > 0) {
        let existingCourses = JSON.parse(
            await fs.readFile(COURSES_FILE_NAME, 'utf-8')
        );
        courses = [...existingCourses, ...courses];
    }
    await fs.writeFile(COURSES_FILE_NAME, JSON.stringify(courses));
    console.log('✓ courses fetched and file updated');
};

module.exports = fetchCourses;
