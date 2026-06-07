import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Re-process the course catalog on demand from the UI.
 *
 * Runs the same pipeline as `npm run update:courses`, but invokes the scripts
 * with the running Node binary directly (no dependency on `npm` being on PATH
 * under pm2/systemd):
 *   1. fetchCoursesScript.js   — re-scan the video library, write courses.json
 *   2. copy courses.json -> public/courses.json   — sync the served copy
 *   3. uploadCoursesToCDN.js   — back up the CDN copy, then upload the new one
 *
 * The scan can take a few minutes, so the request is held open until it
 * finishes. Guarded against concurrent runs.
 */
function runNodeScript(script, cwd) {
    return new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [script], { cwd, env: process.env });

        let stderrTail = '';
        child.stdout.on('data', (d) => process.stdout.write(`[refresh-courses] ${d}`));
        child.stderr.on('data', (d) => {
            stderrTail = (stderrTail + d).slice(-1000);
            process.stderr.write(`[refresh-courses] ${d}`);
        });

        child.on('error', reject);
        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(Object.assign(new Error(`${script} exited with code ${code}`), {
                    detail: stderrTail.trim().slice(-400),
                }));
            }
        });
    });
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (global.coursesRefreshInProgress) {
        return res.status(409).json({ error: 'A course refresh is already running. Please wait for it to finish.' });
    }
    global.coursesRefreshInProgress = true;

    // The pipeline (scan + backup + upload) can run for minutes; don't let the
    // socket time out while it works.
    req.socket?.setTimeout(0);

    const root = process.cwd();
    console.log('[refresh-courses] Started');

    try {
        await runNodeScript('fetchCoursesScript.js', root);
        await fs.copyFile(path.join(root, 'courses.json'), path.join(root, 'public', 'courses.json'));
        await runNodeScript('uploadCoursesToCDN.js', root);

        console.log('[refresh-courses] Completed successfully');
        res.status(200).json({ success: true });
    } catch (err) {
        console.error('[refresh-courses] Failed:', err);
        res.status(500).json({
            error: 'Course refresh failed. Check the server logs.',
            detail: err.detail || err.message,
        });
    } finally {
        global.coursesRefreshInProgress = false;
    }
}
