import os
from celery import Celery

# Local development defaults to SQLite so the app runs without Redis/RabbitMQ.
# Production should set CELERY_BROKER_URL and CELERY_RESULT_BACKEND to Redis,
# RabbitMQ, or another managed broker/backend supported by Celery.
broker_url = os.environ.get("CELERY_BROKER_URL", "sqla+sqlite:///celerydb.sqlite")
result_backend = os.environ.get("CELERY_RESULT_BACKEND", "db+sqlite:///celery_results.sqlite")

celery_app = Celery(
    "omnimark_worker",
    broker=broker_url,
    backend=result_backend,
    include=["backend.worker.work"]
)

# Optional: process tasks synchronously during local debugging if a broker is not available.
# celery_app.conf.task_always_eager = True

celery_app.conf.update(
    broker_connection_retry_on_startup=True,
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)
