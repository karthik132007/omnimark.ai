import sys
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AI-Diagnostic")

def run_diagnostic():
    logger.info("Starting OmniMark AI Diagnostic...")
    
    libraries = {
        "fastapi": "Core API",
        "pydantic": "Data Schemas",
        "pymongo": "Database Connectivity",
        "celery": "Async Workflows",
        "nltk": "Natural Language Processing (NLP)",
        "sentence_transformers": "Semantic Embeddings (SBERT)",
        "sklearn": "Machine Learning (Clustering/TF-IDF)",
        "openai": "LLM Integration",
        "ollama": "Local LLM/OCR",
        "pdf2image": "PDF Processing",
        "paddleocr": "OCR Fallback",
        "pandas": "Data Analytics"
    }
    
    missing = []
    
    for lib, purpose in libraries.items():
        try:
            __import__(lib)
            logger.info(f"[OK] {lib:<25} - Found ({purpose})")
        except ImportError:
            logger.error(f"[MISSING] {lib:<20} - NOT FOUND ({purpose})")
            missing.append(lib)
            
    if not missing:
        logger.info("All AI and core libraries are correctly installed and discoverable.")
    else:
        logger.warning(f"Diagnostic completed with {len(missing)} missing libraries.")
        
    return len(missing) == 0

if __name__ == "__main__":
    success = run_diagnostic()
    sys.exit(0 if success else 1)
