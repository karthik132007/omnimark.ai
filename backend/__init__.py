"""
OmniMark AI - Backend Package
"""
# Expose routers and services for discovery
from backend import app, auth, sessions, students, reevaluation, analytics
from backend.services import notification
from backend.worker import work
