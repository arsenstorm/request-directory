FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libgl1 \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libomp-dev \
    libopenblas-dev \
    wget && \
    wget https://github.com/notAI-tech/NudeNet/releases/download/v3.4-weights/640m.onnx && \
    apt-get remove -y wget && apt-get autoremove -y && apt-get clean

RUN pip install uv

COPY pyproject.toml .

COPY . .

EXPOSE 7001

ENV NUDENET_USE_640M=false
ENV NUDENET_DEBUG=false
ENV NUDENET_PORT=7001

CMD ["uv", "run", "src/main.py"]
