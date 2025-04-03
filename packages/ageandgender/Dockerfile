FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libgl1 \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libomp-dev \
    libopenblas-dev && \
    apt-get autoremove -y && apt-get clean

RUN pip install uv

COPY pyproject.toml .

COPY . .

EXPOSE 7003

ENV AGEANDGENDER_DEBUG=false
ENV AGEANDGENDER_PORT=7003

CMD ["uv", "run", "src/main.py"]
