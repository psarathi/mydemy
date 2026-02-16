#!/bin/bash
# convert-ts-to-mp4.sh
# Remuxes .ts video files to .mp4 (no re-encoding, just container change)
# This is fast because it copies the streams as-is.
#
# Usage: ./convert-ts-to-mp4.sh [directory]
# Default directory: /media/psarathi/Seagate Backup Plus Drive/Videos

set -euo pipefail

VIDEOS_DIR="${1:-/media/psarathi/Seagate Backup Plus Drive/Videos}"
CONVERTED=0
FAILED=0
SKIPPED=0

echo "============================================="
echo "  Convert .ts Video Files to .mp4"
echo "============================================="
echo "Directory: $VIDEOS_DIR"
echo ""

# Only find .ts files > 500KB to avoid TypeScript source files
mapfile -t TS_FILES < <(find "$VIDEOS_DIR" -name '*.ts' -type f -size +500k)

TOTAL=${#TS_FILES[@]}
echo "Found $TOTAL .ts video files to convert"
echo ""

if [ "$TOTAL" -eq 0 ]; then
    echo "No .ts video files found. Exiting."
    exit 0
fi

for ts_file in "${TS_FILES[@]}"; do
    mp4_file="${ts_file%.ts}.mp4"
    
    # Skip if .mp4 already exists
    if [ -f "$mp4_file" ]; then
        echo "  SKIP: $(basename "$ts_file") (mp4 already exists)"
        SKIPPED=$((SKIPPED + 1))
        continue
    fi
    
    echo -n "  Converting: $(basename "$ts_file") ... "
    
    if ffmpeg -y -i "$ts_file" -c copy -movflags +faststart "$mp4_file" -loglevel error 2>/dev/null; then
        # Verify the output file is valid (non-zero size)
        if [ -s "$mp4_file" ]; then
            rm "$ts_file"
            echo "OK (original removed)"
            CONVERTED=$((CONVERTED + 1))
        else
            rm -f "$mp4_file"
            echo "FAILED (output empty, original kept)"
            FAILED=$((FAILED + 1))
        fi
    else
        rm -f "$mp4_file"
        echo "FAILED (ffmpeg error, original kept)"
        FAILED=$((FAILED + 1))
    fi
done

echo ""
echo "============================================="
echo "  Conversion Summary"
echo "============================================="
echo "  Total:     $TOTAL"
echo "  Converted: $CONVERTED"
echo "  Skipped:   $SKIPPED"
echo "  Failed:    $FAILED"
echo "============================================="
