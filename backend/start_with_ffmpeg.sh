#!/bin/bash
set -e

cd /app/backend

# Try to ensure FFmpeg is available (may fail silently in some environments)
if ! command -v ffmpeg &> /dev/null; then
    echo "FFmpeg not found in PATH, checking common locations..."
    if [ -f /usr/bin/ffmpeg ]; then
        echo "Found FFmpeg at /usr/bin/ffmpeg"
    elif [ -f /usr/local/bin/ffmpeg ]; then
        echo "Found FFmpeg at /usr/local/bin/ffmpeg"
    else
        echo "Warning: FFmpeg not found. Video export features may not work."
    fi
else
    echo "FFmpeg is available: $(which ffmpeg)"
fi

# Start uvicorn - try different paths
if [ -f /root/.venv/bin/uvicorn ]; then
    echo "Starting uvicorn from venv..."
    exec /root/.venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001 --workers 1
elif command -v uvicorn &> /dev/null; then
    echo "Starting uvicorn from PATH..."
    exec uvicorn server:app --host 0.0.0.0 --port 8001 --workers 1
else
    echo "Starting with python -m uvicorn..."
    exec python -m uvicorn server:app --host 0.0.0.0 --port 8001 --workers 1
fi
