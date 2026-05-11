import os
import pytest
from backend import config

def test_require_env_missing(monkeypatch):
    monkeypatch.delenv("TEST_VAR", raising=False)
    with pytest.raises(RuntimeError, match="Missing required environment variable: TEST_VAR"):
        config._require_env("TEST_VAR")

def test_require_any_env_missing(monkeypatch):
    monkeypatch.delenv("VAR1", raising=False)
    monkeypatch.delenv("VAR2", raising=False)
    with pytest.raises(RuntimeError, match="Missing required environment variable: VAR1 or VAR2"):
        config._require_any_env("VAR1", "VAR2")

def test_validate_required_env_prod_no_cors(monkeypatch):
    monkeypatch.setenv("MONGO_URI", "dummy")
    monkeypatch.setenv("JWT_SECRET", "secret")
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.delenv("CORS_ALLOW_ORIGINS", raising=False)
    with pytest.raises(RuntimeError, match="CORS_ALLOW_ORIGINS must be set in production"):
        config.validate_required_env()

def test_validate_required_env_prod_wildcard_cors(monkeypatch):
    monkeypatch.setenv("MONGO_URI", "dummy")
    monkeypatch.setenv("JWT_SECRET", "secret")
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("CORS_ALLOW_ORIGINS", "https://app.com, *")
    with pytest.raises(RuntimeError, match="Wildcard CORS origin is not allowed in production"):
        config.validate_required_env()

def test_validate_required_env_prod_valid(monkeypatch):
    monkeypatch.setenv("MONGO_URI", "dummy")
    monkeypatch.setenv("JWT_SECRET", "secret")
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("CORS_ALLOW_ORIGINS", "https://app.com")
    config.validate_required_env()  # Should not raise

def test_get_llm_reevaluate_model(monkeypatch):
    monkeypatch.setenv("LLM_DEFAULT_MODEL", "def")
    monkeypatch.setenv("LLM_REEVALUATE_MODEL", "reev")
    assert config.get_llm_reevaluate_model() == "reev"
