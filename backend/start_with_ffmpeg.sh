#!/bin/bash

# Ensure FFmpeg is installed before starting the backend
if ! command -v ffmpeg &> /dev/null; then
    echo "FFmpeg not found. Installing..."
    apt-get update -qq && apt-get install -y -qq ffmpeg > /dev/null 2>&1
    echo "FFmpeg installed successfully"
else
    echo "FFmpeg is already installed"
fi

# Start the uvicorn server
exec /root/.venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001 --workers 1 --reload
