FROM python:3.13-slim

WORKDIR /app

RUN apt-get update && apt-get install -y gcc g++

COPY pyproject.toml uv.lock ./

RUN pip install uv
RUN uv sync --frozen

COPY . .

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]