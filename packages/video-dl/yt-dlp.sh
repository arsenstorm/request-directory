#!/bin/bash

# Activate the virtual environment
. /app/.venv/bin/activate

# Install the package
uv pip install -e .

# Upgrade yt-dlp
uv pip install -U --pre yt-dlp
