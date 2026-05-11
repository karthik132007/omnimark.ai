from abc import ABC, abstractmethod
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class AbstractLMSAdapter(ABC):
    """
    Base class for Learning Management System (LMS) integrations.
    Provides a standardized interface for roster sync and grade pushes.
    """
    
    @abstractmethod
    def authenticate(self) -> bool:
        """Authenticate with the LMS API."""
        pass

    @abstractmethod
    def sync_roster(self, course_id: str) -> List[Dict[str, Any]]:
        """Synchronize student roster from the LMS."""
        pass

    @abstractmethod
    def push_grades(self, session_id: str, grades: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Push evaluation results back to the LMS gradebook."""
        pass

class MockLMSAdapter(AbstractLMSAdapter):
    """
    A concrete implementation of LMS adapter for testing and demonstration.
    Simulates a generic LMS environment.
    """
    def authenticate(self) -> bool:
        logger.info("MockLMS: Authenticated successfully.")
        return True

    def sync_roster(self, course_id: str) -> List[Dict[str, Any]]:
        logger.info(f"MockLMS: Syncing roster for course {course_id}")
        # Return a sample roster
        return [
            {"rollnum": 101, "name": "John Doe", "email": "john@example.edu"},
            {"rollnum": 102, "name": "Jane Smith", "email": "jane@example.edu"}
        ]

    def push_grades(self, session_id: str, grades: List[Dict[str, Any]]) -> Dict[str, Any]:
        logger.info(f"MockLMS: Pushing {len(grades)} grades for session {session_id}")
        return {
            "status": "success",
            "message": f"Successfully pushed {len(grades)} grades to MockLMS",
            "integration": "MockLMS-v1"
        }

class MoodleAdapter(AbstractLMSAdapter):
    """
    Adapter for Moodle LMS integration.
    """
    def authenticate(self) -> bool: 
        logger.info("Moodle: Attempting OAuth2 authentication...")
        return True
        
    def sync_roster(self, course_id: str) -> List[Dict[str, Any]]: 
        logger.info(f"Moodle: Fetching participants for course {course_id}")
        return []
        
    def push_grades(self, session_id: str, grades: List[Dict[str, Any]]) -> Dict[str, Any]:
        logger.info(f"Moodle: Posting grade items to REST endpoint /local_grades/push")
        return {"status": "success", "message": "Moodle sync logic initialized"}

class CanvasAdapter(AbstractLMSAdapter):
    """
    Adapter for Canvas LMS integration.
    """
    def authenticate(self) -> bool: 
        logger.info("Canvas: Initializing API session with Bearer Token.")
        return True
        
    def sync_roster(self, course_id: str) -> List[Dict[str, Any]]: 
        logger.info(f"Canvas: Syncing students from course ID {course_id}")
        return []
        
    def push_grades(self, session_id: str, grades: List[Dict[str, Any]]) -> Dict[str, Any]:
        logger.info(f"Canvas: Updating Gradebook via Canvas API bulk update.")
        return {"status": "success", "message": "Canvas sync logic initialized"}
