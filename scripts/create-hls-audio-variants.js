#!/usr/bin/env node

/*
 * Creates HLS playlists with one selectable rendition per embedded audio
 * track. Output is written beside each source as <video>.hls/master.m3u8.
 *
 * Usage: node scripts/create-hls-audio-variants.js /absolute/path/to/video.mp4
 *        node scripts/create-hls-audio-variants.js /absolute/path/to/course --recursive
 */
const fs = require('fs/promises');
const path = require('path');
const {spawn} = require('child_process');

const VIDEO_EXTENSIONS = new Set(['.mp4', '.m4v', '.mov', '.mkv', '.webm']);

function run(command, args) {
    return new Promise((resolve, reject) => {
        const process = spawn(command, args, {stdio: ['ignore', 'pipe', 'pipe']});
        let stderr = '';
        process.stderr.on('data', (chunk) => (stderr += chunk));
        process.on('error', reject);
        process.on('close', (code) =>
            code === 0 ? resolve() : reject(new Error(`${command} failed: ${stderr}`))
        );
    });
}

async function probe(file) {
    const process = spawn('ffprobe', [
        '-v', 'error', '-select_streams', 'a', '-show_entries',
        'stream=index:stream_tags=language,title', '-of', 'json', file,
    ]);
    let output = '';
    for await (const chunk of process.stdout) output += chunk;
    await new Promise((resolve, reject) => process.on('close', (code) =>
        code === 0 ? resolve() : reject(new Error(`ffprobe failed for ${file}`))
    ));
    return JSON.parse(output).streams || [];
}

async function convert(file) {
    const tracks = await probe(file);
    if (tracks.length < 2) return;
    const output = `${file}.hls`;
    await fs.mkdir(output, {recursive: true});
    await run('ffmpeg', ['-y', '-i', file, '-map', '0:v:0', '-c:v', 'copy',
        '-f', 'hls', '-hls_time', '6', '-hls_playlist_type', 'vod',
        '-hls_segment_filename', path.join(output, 'video-%03d.ts'), path.join(output, 'video.m3u8')]);

    const media = [];
    for (const [index, track] of tracks.entries()) {
        const language = track.tags?.language || 'und';
        const name = track.tags?.title || language.toUpperCase();
        await run('ffmpeg', ['-y', '-i', file, '-map', `0:a:${index}`, '-c:a', 'aac',
            '-f', 'hls', '-hls_time', '6', '-hls_playlist_type', 'vod',
            '-hls_segment_filename', path.join(output, `audio-${index}-%03d.ts`), path.join(output, `audio-${index}.m3u8`)]);
        media.push(`#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="${name}",LANGUAGE="${language}",DEFAULT=${index === 0 ? 'YES' : 'NO'},AUTOSELECT=YES,URI="audio-${index}.m3u8"`);
    }
    await fs.writeFile(path.join(output, 'master.m3u8'), [
        '#EXTM3U', '#EXT-X-VERSION:3', ...media,
        '#EXT-X-STREAM-INF:BANDWIDTH=4000000,CODECS="avc1.640028,mp4a.40.2",AUDIO="audio"', 'video.m3u8', '',
    ].join('\n'));
    console.log(`Created ${path.join(output, 'master.m3u8')}`);
}

async function filesAt(target, recursive) {
    const stat = await fs.stat(target);
    if (stat.isFile()) return [target];
    const entries = await fs.readdir(target, {withFileTypes: true});
    const nested = await Promise.all(entries.map((entry) => {
        const item = path.join(target, entry.name);
        return entry.isDirectory() && recursive ? filesAt(item, true) : [item];
    }));
    return nested.flat().filter((file) => VIDEO_EXTENSIONS.has(path.extname(file).toLowerCase()));
}

const [target, flag] = process.argv.slice(2);
if (!target) throw new Error('Provide a video file or directory.');
filesAt(path.resolve(target), flag === '--recursive').then((files) => Promise.all(files.map(convert)));
