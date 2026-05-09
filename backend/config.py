import os


def _require_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def validate_required_env() -> None:
    _require_env("MONGO_URI")
    _require_env("JWT_SECRET")

    app_env = get_app_env()
    if app_env == "production":
        origins = get_cors_allow_origins()
        if not origins:
            raise RuntimeError("CORS_ALLOW_ORIGINS must be set in production")
        if "*" in origins:
            raise RuntimeError("Wildcard CORS origin is not allowed in production")


def get_app_env() -> str:
    return os.getenv("APP_ENV", "development").strip().lower()


def get_cors_allow_origins() -> list[str]:
    raw = os.getenv("CORS_ALLOW_ORIGINS", "")
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


def get_jwt_secret() -> str:
    return _require_env("JWT_SECRET")


def get_mongo_uri() -> str:
    return _require_env("MONGO_URI")


def get_llm_base_url() -> str:
    return os.getenv("LLM_BASE_URL", "https://api.openai.com/v1").strip()


def get_ollama_ocr_model() -> str:
    return os.getenv("OLLAMA_OCR_MODEL", "gemma4:31b-cloud")


def get_omi_model() -> str:
    return os.getenv("OMI_MODEL", "qwen3-coder-next:cloud")


def get_qcp_model() -> str:
    return os.getenv("QCP_MODEL", "qwen3-coder-next:cloud")


def get_llm_default_model() -> str:
    return os.getenv("LLM_DEFAULT_MODEL", "gpt-oss:120b-cloud")


def get_llm_reevaluate_model() -> str:
    return os.getenv("LLM_REEVALUATE_MODEL", get_llm_default_model())
