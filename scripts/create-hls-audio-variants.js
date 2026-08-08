#!/usr/bin/env node
const fs = require('fs/promises');
const path = require('path');
const {createHlsAudioVariants} = require('../utilities/hlsAudio');
const extensions = new Set(['.mp4', '.m4v', '.mov', '.mkv', '.webm']);

async function filesAt(target, recursive) {
    const stat = await fs.stat(target);
    if (stat.isFile()) return [target];
    const entries = await fs.readdir(target, {withFileTypes: true});
    const nested = await Promise.all(entries.map((entry) => {
        const item = path.join(target, entry.name);
        return entry.isDirectory() && recursive ? filesAt(item, true) : [item];
    }));
    return nested.flat().filter((file) => extensions.has(path.extname(file).toLowerCase()));
}

async function main() {
    const [target, flag] = process.argv.slice(2);
    if (!target) throw new Error('Provide a video file or directory.');
    for (const file of await filesAt(path.resolve(target), flag === '--recursive')) {
        const result = await createHlsAudioVariants(file);
        if (result.created) console.log(`Created ${file}.hls/master.m3u8`);
    }
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
