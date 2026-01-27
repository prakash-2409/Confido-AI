FROM python:3.10-slim

WORKDIR /app

# Install system dependencies (GCC needed for some python libraries)
RUN apt-get update && apt-get install -y gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Download NLTK data during build
RUN python -m nltk.downloader punkt stopwords

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
