import pytest
import nltk
from sentence_transformers import SentenceTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
import torch

def test_ai_libraries_imports():
    """Verify that all AI-related libraries are properly installed and can be imported."""
    import sentence_transformers
    import nltk
    import sklearn
    import openai
    import ollama
    
    assert sentence_transformers.__version__ is not None
    assert nltk.__version__ is not None
    assert sklearn.__version__ is not None

def test_sentence_transformer_runtime():
    """Verify that the sentence-transformer model can be loaded and used."""
    from Engine.encoder import model
    # Note: In test environment, this is a _DummySentenceModel from conftest.py
    assert hasattr(model, "encode")
    
    emb = model.encode("This is a test sentence.")
    assert emb.size > 0

def test_nltk_lemmatization():
    """Verify NLTK lemmatization works."""
    from Engine.helpers import lemmatizer
    assert lemmatizer.lemmatize("running") == "running" # defaults to noun
    assert lemmatizer.lemmatize("running", pos="v") == "run"

def test_tfidf_vectorizer():
    """Verify sklearn TF-IDF works as expected by our helper."""
    from Engine.helpers import get_key_words
    text = "Machine learning is a field of artificial intelligence."
    keywords = get_key_words(text)
    assert len(keywords) > 0
    assert "machine" in [k.lower() for k in keywords]
