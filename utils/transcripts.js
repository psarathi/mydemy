export function parseVttTimestamp(timestamp) {
    const [timePart] = String(timestamp).trim().split(/\s+/);
    const parts = timePart.split(':');
    if (parts.length < 2 || parts.length > 3) {
        return 0;
    }

    const secondsPart = parts.pop();
    const minutes = Number(parts.pop());
    const hours = parts.length ? Number(parts.pop()) : 0;
    const seconds = Number(secondsPart.replace(',', '.'));

    if ([hours, minutes, seconds].some((value) => Number.isNaN(value))) {
        return 0;
    }

    return hours * 3600 + minutes * 60 + seconds;
}

const cleanCueText = (text) =>
    text
        .replace(/<[^>]+>/g, '')
        .replace(/\{[^}]+\}/g, '')
        .replace(/\s+/g, ' ')
        .trim();

export function parseVttCues(vttText = '') {
    const blocks = String(vttText)
        .replace(/^\uFEFF/, '')
        .split(/\r?\n\r?\n/)
        .map((block) => block.trim())
        .filter(Boolean);

    return blocks.flatMap((block) => {
        const lines = block
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);
        const timingIndex = lines.findIndex((line) => line.includes('-->'));

        if (timingIndex < 0) {
            return [];
        }

        const [start, end] = lines[timingIndex]
            .split('-->')
            .map((part) => part.trim());
        const text = cleanCueText(lines.slice(timingIndex + 1).join(' '));

        if (!text) {
            return [];
        }

        return [
            {
                startSeconds: parseVttTimestamp(start),
                endSeconds: parseVttTimestamp(end),
                text,
            },
        ];
    });
}

export function searchTranscriptCues(cues = [], query = '') {
    const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);

    if (!terms.length) {
        return [];
    }

    return cues.filter((cue) => {
        const text = cue.text.toLowerCase();
        return terms.every((term) => text.includes(term));
    });
}
