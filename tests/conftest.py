import os
import sys
import types

import numpy as np
import pytest


os.environ.setdefault("MONGO_URI", "mongodb://localhost:27017")
os.environ.setdefault("JWT_SECRET", "test_jwt_secret_with_at_least_32_chars")
os.environ.setdefault("LLM_BASE_URL", "https://example.invalid/v1")
os.environ.setdefault("APP_ENV", "test")


class _DummySentenceModel:
    def encode(self, texts, normalize_embeddings=False):
        if isinstance(texts, str):
            return np.array([1.0, 0.0, 0.0], dtype=float)

        vectors = []
        for text in texts:
            text = str(text or "")
            vectors.append(
                np.array(
                    [
                        float(len(text)),
                        float(text.count("the")),
                        float(len(text.split())),
                    ],
                    dtype=float,
                )
            )
        matrix = np.vstack(vectors) if vectors else np.zeros((0, 3), dtype=float)
        if normalize_embeddings and matrix.size:
            norms = np.linalg.norm(matrix, axis=1, keepdims=True)
            norms[norms == 0] = 1.0
            matrix = matrix / norms
        return matrix


# Keep unit tests fast and offline by stubbing the heavy embedding model import.
encoder_stub = types.ModuleType("Engine.encoder")
encoder_stub.model = _DummySentenceModel()
sys.modules.setdefault("Engine.encoder", encoder_stub)


@pytest.fixture(scope="session", autouse=True)
def _required_env_for_tests():
    yield
