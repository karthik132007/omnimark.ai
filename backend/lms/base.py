from abc import ABC, abstractmethod
from typing import List, Dict, Any

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

class MoodleAdapter(AbstractLMSAdapter):
    """Placeholder for Moodle implementation."""
    def authenticate(self) -> bool: return True
    def sync_roster(self, course_id: str) -> List[Dict[str, Any]]: return []
    def push_grades(self, session_id: str, grades: List[Dict[str, Any]]) -> Dict[str, Any]:
        return {"status": "success", "message": "Moodle integration ready"}

class CanvasAdapter(AbstractLMSAdapter):
    """Placeholder for Canvas implementation."""
    def authenticate(self) -> bool: return True
    def sync_roster(self, course_id: str) -> List[Dict[str, Any]]: return []
    def push_grades(self, session_id: str, grades: List[Dict[str, Any]]) -> Dict[str, Any]:
        return {"status": "success", "message": "Canvas integration ready"}
