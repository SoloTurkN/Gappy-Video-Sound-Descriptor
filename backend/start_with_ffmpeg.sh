#!/bin/bash
# Startup script for Gappy Describe Backend
# Works in both local development and Kubernetes deployment

cd /app/backend 2>/dev/null || cd "$(dirname "$0")"

# Log FFmpeg availability (non-blocking)
if command -v ffmpeg &> /dev/null; then
    echo "FFmpeg available: $(command -v ffmpeg)"
else
    echo "Warning: FFmpeg not found - video export may not work"
fi

# Start uvicorn using python -m (most portable)
exec python -m uvicorn server:app --host 0.0.0.0 --port 8001 --workers 1
