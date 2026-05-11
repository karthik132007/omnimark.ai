import os


def _require_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def _require_any_env(*names: str) -> str:
    for name in names:
        value = os.getenv(name, "").strip()
        if value:
            return value
    joined_names = " or ".join(names)
    raise RuntimeError(f"Missing required environment variable: {joined_names}")


def validate_required_env() -> None:
    _require_env("MONGO_URI")
    _require_any_env("JWT_SECRET", "SECRET_KEY")

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
    return _require_any_env("JWT_SECRET", "SECRET_KEY")


def get_mongo_uri() -> str:
    return _require_env("MONGO_URI")


def get_llm_base_url() -> str:
    return os.getenv("LLM_BASE_URL", "https://api.openai.com/v1").strip()


def get_ollama_host() -> str:
    return os.getenv("OLLAMA_HOST", "http://localhost:11434").strip()


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

FEATURE_FLAGS = {
    "generative_synthetic_dataset_augmentation": os.getenv("FEATURE_SYNTHETIC_DATASET", "false").lower() == "true",
    "self_supervised_handwriting_recognition": os.getenv("FEATURE_SELF_SUPERVISED_HR", "false").lower() == "true",
    "xai_grading_reports": os.getenv("FEATURE_XAI_REPORTS", "false").lower() == "true",
    "federated_learning": os.getenv("FEATURE_FEDERATED_LEARNING", "false").lower() == "true",
}
