FROM python:3.11-slim

# Install system dependencies (ffmpeg for pydub, libsndfile for librosa)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (for better caching)
COPY requirements.txt .
RUN pip install --no-cache-dir --prefer-binary -r requirements.txt

# Copy application code
COPY . .

# Make start script executable
RUN chmod +x start.sh

EXPOSE 10000

CMD ["./start.sh"]
