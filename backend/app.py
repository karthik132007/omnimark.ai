from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()
app.title = "Omnimark Ai"

@app.get("/health")
def health_check():
    return {"status": "ok"}

