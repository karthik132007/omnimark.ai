FROM python:3.13-slim

WORKDIR /app

# System deps: gcc for native builds, poppler for pdf2image, libGL for PaddleOCR
RUN apt-get update && apt-get install -y \
    gcc g++ \
    poppler-utils \
    libglib2.0-0 \
    libgl1-mesa-glx \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps from requirements.txt (in repo root)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download NLTK data needed by the NLP grading engine
RUN python -c "import nltk; nltk.download('stopwords'); nltk.download('wordnet'); nltk.download('punkt'); nltk.download('punkt_tab')"

# Copy entire project (backend, Engine, etc.)
COPY . .

EXPOSE 8000

CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8000"]
