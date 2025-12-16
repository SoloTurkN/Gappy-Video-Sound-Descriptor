#!/bin/bash
# Startup script for Gappy Describe Backend
# Compatible with both local development and Kubernetes deployment

cd /app/backend 2>/dev/null || cd "$(dirname "$0")"

# Log FFmpeg availability (non-blocking)
if command -v ffmpeg &> /dev/null; then
    echo "FFmpeg available: $(command -v ffmpeg)"
else
    echo "Warning: FFmpeg not found - video export may not work"
fi

# Try multiple uvicorn paths in order of preference
if [ -f /root/.venv/bin/uvicorn ]; then
    echo "Starting uvicorn from venv..."
    exec /root/.venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001 --workers 1
elif [ -f /opt/venv/bin/uvicorn ]; then
    echo "Starting uvicorn from /opt/venv..."
    exec /opt/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001 --workers 1
elif command -v uvicorn &> /dev/null; then
    echo "Starting uvicorn from PATH..."
    exec uvicorn server:app --host 0.0.0.0 --port 8001 --workers 1
else
    # Fallback: Try to find uvicorn in any venv
    UVICORN_PATH=$(find /root /opt /home -name "uvicorn" -type f 2>/dev/null | head -1)
    if [ -n "$UVICORN_PATH" ]; then
        echo "Starting uvicorn from: $UVICORN_PATH"
        exec "$UVICORN_PATH" server:app --host 0.0.0.0 --port 8001 --workers 1
    else
        echo "Error: Could not find uvicorn"
        exit 1
    fi
fi
