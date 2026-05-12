"""
OmniMark AI - Engine Package
This package contains the core AI logic for grading, OCR, cheat detection, and OMI.
"""

# Explicitly expose major components to assist AI scanners in module discovery
from Engine.grade import nlp, llm
from Engine.OCR import ocr, ollama_ocr
from Engine.cheat_detection import main as cheat_detection
from Engine.OMI import omi
from Engine.QCP import qcp
from Engine.encoder import model as embedding_model
