FROM python:3.13-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    cron \
    curl \
    ffmpeg \
    wget \
    && rm -rf /var/lib/apt/lists/*

RUN pip install uv

COPY pyproject.toml .

COPY . .

RUN uv venv \
    && . .venv/bin/activate \
    && uv pip install -e . \
    && uv pip install -U --pre yt-dlp

RUN mkdir -p src/downloads

RUN chmod +x /app/src/update_ytdlp.py

EXPOSE 7005

ENV VIDEODL_DEBUG=false \
    VIDEODL_PORT=7005 \
    R2_ENDPOINT="" \
    R2_BUCKET="" \
    R2_PUBLIC_URL="" \
    PATH="/app/.venv/bin:${PATH}"

COPY <<EOF /app/start.sh
#!/bin/bash
# Start the yt-dlp updater in the background
python /app/src/update_ytdlp.py &

# Start the main application
exec uv run src/main.py
EOF

RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]
