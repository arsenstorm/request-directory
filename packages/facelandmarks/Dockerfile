FROM python:3.12-slim

WORKDIR /app

ENV USE_NNPACK=0

RUN pip install uv

COPY pyproject.toml .

COPY . .

RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    libgl1 \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libomp-dev \
    libopenblas-dev \
    && rm -rf /var/lib/apt/lists/*

EXPOSE 7002

ENV FACELANDMARKS_DEBUG=false
ENV FACELANDMARKS_PORT=7002

CMD ["uv", "run", "src/main.py"]
