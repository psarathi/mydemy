#!/usr/bin/env node

/**
 * Upload courses.json to CDN/remote server
 *
 * This script uploads the generated courses.json file to your CDN or remote server
 * so that desktop apps can fetch the latest course data without rebuilding.
 *
 * Usage:
 *   npm run upload-courses
 *
 * Configuration:
 *   Set COURSES_UPLOAD_METHOD in your .env file:
 *   - 'scp': Upload via SSH/SCP (default)
 *   - 'http': Upload via HTTP PUT request
 *   - 'custom': Use a custom upload function
 *
 * Environment Variables:
 *   COURSES_UPLOAD_METHOD=scp|http|custom
 *   COURSES_UPLOAD_ENDPOINT=your-server:/path/to/courses.json
 *   COURSES_UPLOAD_USER=username (for SCP)
 *   COURSES_UPLOAD_KEY=/path/to/ssh/key (optional, for SCP)
 *   COURSES_UPLOAD_AUTH=bearer_token (for HTTP)
 */

const fs = require('fs');
const path = require('path');
const { execSync, execFileSync } = require('child_process');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const COURSES_FILE = path.join(__dirname, 'courses.json');
const UPLOAD_METHOD = process.env.COURSES_UPLOAD_METHOD || 'scp';
const UPLOAD_ENDPOINT = process.env.COURSES_UPLOAD_ENDPOINT;
const UPLOAD_USER = process.env.COURSES_UPLOAD_USER;
const UPLOAD_KEY = process.env.COURSES_UPLOAD_KEY;
const UPLOAD_AUTH = process.env.COURSES_UPLOAD_AUTH;

/**
 * Resolve the SCP endpoint into { sshTarget, remoteFile } where remoteFile is
 * the absolute path of the live courses.json on the CDN host. The endpoint may
 * be a directory (trailing slash) or a full file path, and may contain
 * shell-escaped spaces (e.g. "Seagate\ Backup\ Plus\ Drive"); we unescape those
 * so the path can be safely re-quoted for the remote shell.
 */
function resolveScpTarget() {
    const colonIdx = UPLOAD_ENDPOINT.indexOf(':');
    if (colonIdx === -1) {
        throw new Error(`COURSES_UPLOAD_ENDPOINT must be of the form user@host:/path (got "${UPLOAD_ENDPOINT}")`);
    }
    const sshTarget = UPLOAD_ENDPOINT.slice(0, colonIdx);
    const rawPath = UPLOAD_ENDPOINT.slice(colonIdx + 1).replace(/\\(.)/g, '$1');
    const remoteFile = rawPath.endsWith('/') ? `${rawPath}courses.json` : rawPath;
    return { sshTarget, remoteFile };
}

/**
 * Before overwriting the CDN's courses.json, copy the current one to
 * courses.json.bak so a bad/empty upload can be rolled back. Uses cp (not mv)
 * so the live file is never missing, and is a no-op on the very first upload.
 * A backup failure is logged but never blocks the upload of a good file.
 */
function backupRemoteCourses({ sshTarget, remoteFile }) {
    const remoteBackup = `${remoteFile}.bak`;
    const remoteCmd =
        `if [ -f '${remoteFile}' ]; then ` +
        `cp -f '${remoteFile}' '${remoteBackup}' && ` +
        `echo "🛟 Backed up previous courses.json -> ${remoteBackup}"; ` +
        `else echo "ℹ️  No existing CDN courses.json to back up (first upload)"; fi`;

    const sshArgs = [];
    if (UPLOAD_KEY) sshArgs.push('-i', UPLOAD_KEY);
    sshArgs.push(sshTarget, remoteCmd);

    try {
        execFileSync('ssh', sshArgs, { stdio: 'inherit' });
    } catch (error) {
        console.warn(`⚠️  Could not back up the existing CDN courses.json: ${error.message}`);
        console.warn('   Proceeding with the upload anyway.');
    }
}

/**
 * Upload via SCP (SSH File Transfer)
 */
async function uploadViaSCP() {
    if (!UPLOAD_ENDPOINT) {
        throw new Error('COURSES_UPLOAD_ENDPOINT not configured (e.g., user@server:/var/www/courses.json)');
    }

    // Keep the previous CDN copy as a rollback before we overwrite it.
    backupRemoteCourses(resolveScpTarget());

    console.log(`📤 Uploading courses.json to ${UPLOAD_ENDPOINT} via SCP...`);

    let scpCommand = 'scp';

    // Add SSH key if specified
    if (UPLOAD_KEY) {
        scpCommand += ` -i ${UPLOAD_KEY}`;
    }

    scpCommand += ` ${COURSES_FILE} ${UPLOAD_ENDPOINT}`;

    try {
        execSync(scpCommand, { stdio: 'inherit' });
        console.log('✅ Upload successful!');
    } catch (error) {
        throw new Error(`SCP upload failed: ${error.message}`);
    }
}

/**
 * Upload via HTTP PUT request
 */
async function uploadViaHTTP() {
    if (!UPLOAD_ENDPOINT) {
        throw new Error('COURSES_UPLOAD_ENDPOINT not configured (e.g., https://cdn.example.com/courses.json)');
    }

    console.log(`📤 Uploading courses.json to ${UPLOAD_ENDPOINT} via HTTP...`);

    const coursesData = fs.readFileSync(COURSES_FILE, 'utf-8');

    // Use node-fetch if available, otherwise use curl
    try {
        const fetch = require('node-fetch');

        const headers = {
            'Content-Type': 'application/json',
        };

        if (UPLOAD_AUTH) {
            headers['Authorization'] = `Bearer ${UPLOAD_AUTH}`;
        }

        const response = await fetch(UPLOAD_ENDPOINT, {
            method: 'PUT',
            headers,
            body: coursesData,
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        console.log('✅ Upload successful!');
    } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
            // Fallback to curl if node-fetch not available
            console.log('node-fetch not found, using curl...');

            let curlCommand = `curl -X PUT "${UPLOAD_ENDPOINT}"`;
            curlCommand += ` -H "Content-Type: application/json"`;

            if (UPLOAD_AUTH) {
                curlCommand += ` -H "Authorization: Bearer ${UPLOAD_AUTH}"`;
            }

            curlCommand += ` --data @${COURSES_FILE}`;

            execSync(curlCommand, { stdio: 'inherit' });
            console.log('✅ Upload successful!');
        } else {
            throw new Error(`HTTP upload failed: ${error.message}`);
        }
    }
}

/**
 * Custom upload function
 * Modify this function to implement your own upload logic
 */
async function uploadCustom() {
    console.log('📤 Using custom upload method...');

    // Example: Upload to AWS S3
    // const AWS = require('aws-sdk');
    // const s3 = new AWS.S3();
    // const fileContent = fs.readFileSync(COURSES_FILE);
    // const params = {
    //     Bucket: 'your-bucket-name',
    //     Key: 'courses.json',
    //     Body: fileContent,
    //     ContentType: 'application/json',
    // };
    // await s3.upload(params).promise();

    // Example: Upload to Azure Blob Storage
    // const { BlobServiceClient } = require('@azure/storage-blob');
    // const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
    // const containerClient = blobServiceClient.getContainerClient('your-container');
    // const blockBlobClient = containerClient.getBlockBlobClient('courses.json');
    // await blockBlobClient.uploadFile(COURSES_FILE);

    throw new Error('Custom upload method not implemented. Edit uploadCoursesToCDN.js to add your custom logic.');
}

/**
 * Main upload function
 */
async function uploadCourses() {
    // Check if courses.json exists
    if (!fs.existsSync(COURSES_FILE)) {
        console.error('❌ courses.json not found. Run "npm run build" first to generate it.');
        process.exit(1);
    }

    // Get file stats
    const stats = fs.statSync(COURSES_FILE);
    const coursesData = JSON.parse(fs.readFileSync(COURSES_FILE, 'utf-8'));
    const courseCount = coursesData.length;

    console.log('\n📊 Upload Summary:');
    console.log(`   Courses: ${courseCount}`);
    console.log(`   File size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`   Method: ${UPLOAD_METHOD.toUpperCase()}\n`);

    try {
        switch (UPLOAD_METHOD.toLowerCase()) {
            case 'scp':
                await uploadViaSCP();
                break;
            case 'http':
                await uploadViaHTTP();
                break;
            case 'custom':
                await uploadCustom();
                break;
            default:
                throw new Error(`Unknown upload method: ${UPLOAD_METHOD}. Use 'scp', 'http', or 'custom'`);
        }

        console.log('\n✨ Courses are now available at:');
        console.log(`   ${process.env.NEXT_PUBLIC_COURSES_ENDPOINT || UPLOAD_ENDPOINT}\n`);
    } catch (error) {
        console.error(`\n❌ Upload failed: ${error.message}\n`);
        console.log('💡 Configuration help:');
        console.log('   1. Set COURSES_UPLOAD_METHOD=scp|http|custom in .env');
        console.log('   2. Set COURSES_UPLOAD_ENDPOINT to your server/URL');
        console.log('   3. For SCP: COURSES_UPLOAD_ENDPOINT=user@server:/path/to/courses.json');
        console.log('   4. For HTTP: COURSES_UPLOAD_ENDPOINT=https://cdn.example.com/courses.json');
        console.log('   5. See uploadCoursesToCDN.js for more options\n');
        process.exit(1);
    }
}

// Run upload
uploadCourses();
