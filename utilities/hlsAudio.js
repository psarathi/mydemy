const fs = require('fs/promises');
const path = require('path');
const {spawn} = require('child_process');
const {isEnglishAudioLanguage} = require('./audioLanguage');

function run(command, args) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {stdio: ['ignore', 'pipe', 'pipe']});
        let stderr = '';
        child.stderr.on('data', (chunk) => (stderr += chunk));
        child.on('error', reject);
        child.on('close', (code) =>
            code === 0 ? resolve() : reject(new Error(`${command} failed: ${stderr}`))
        );
    });
}

async function getAudioTracks(file) {
    const child = spawn('ffprobe', [
        '-v', 'error', '-select_streams', 'a', '-show_entries',
        'stream=index:stream_disposition=default:stream_tags=language,title', '-of', 'json', file,
    ]);
    let output = '';
    for await (const chunk of child.stdout) output += chunk;
    await new Promise((resolve, reject) => child.on('close', (code) =>
        code === 0 ? resolve() : reject(new Error(`ffprobe failed for ${file}`))
    ));
    return JSON.parse(output).streams || [];
}

async function createHlsAudioVariants(file, {force = false} = {}) {
    const output = `${file}.hls`;
    const master = path.join(output, 'master.m3u8');
    try {
        await fs.access(master);
        if (!force) return {created: false, hasHls: true};
    } catch (_) {
        // Continue: this video has not been processed yet.
    }

    const tracks = await getAudioTracks(file);
    if (tracks.length < 2) return {created: false, hasHls: false};

    await fs.rm(output, {recursive: true, force: true});
    await fs.mkdir(output, {recursive: true});
    await run('ffmpeg', ['-y', '-i', file, '-map', '0:v:0', '-c:v', 'copy',
        '-f', 'hls', '-hls_time', '6', '-hls_playlist_type', 'vod',
        '-hls_segment_filename', path.join(output, 'video-%03d.ts'), path.join(output, 'video.m3u8')]);

    const sourceDefaultTrackIndex = tracks.findIndex(
        (track) => track.disposition?.default === 1
    );
    const englishTrackIndex = tracks.findIndex((track) =>
        isEnglishAudioLanguage(track.tags?.language)
    );
    const selectedDefault =
        englishTrackIndex >= 0
            ? englishTrackIndex
            : sourceDefaultTrackIndex >= 0
            ? sourceDefaultTrackIndex
            : 0;
    const media = [];
    for (const [index, track] of tracks.entries()) {
        const language = track.tags?.language || 'und';
        const name = track.tags?.title || language.toUpperCase();
        await run('ffmpeg', ['-y', '-i', file, '-map', `0:a:${index}`, '-c:a', 'aac',
            '-f', 'hls', '-hls_time', '6', '-hls_playlist_type', 'vod',
            '-hls_segment_filename', path.join(output, `audio-${index}-%03d.ts`), path.join(output, `audio-${index}.m3u8`)]);
        media.push(`#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="${name}",LANGUAGE="${language}",DEFAULT=${index === selectedDefault ? 'YES' : 'NO'},AUTOSELECT=YES,URI="audio-${index}.m3u8"`);
    }
    await fs.writeFile(master, ['#EXTM3U', '#EXT-X-VERSION:3', ...media,
        '#EXT-X-STREAM-INF:BANDWIDTH=4000000,CODECS="avc1.640028,mp4a.40.2",AUDIO="audio"', 'video.m3u8', '',
    ].join('\n'));
    return {created: true, hasHls: true};
}

module.exports = {createHlsAudioVariants};
