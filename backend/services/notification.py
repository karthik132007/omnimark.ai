import logging
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger(__name__)

class NotificationService:
    """
    A centralized service for handling system notifications.
    Currently logs to console, ready for SMTP, SendGrid, or SMS integration.
    """
    
    @staticmethod
    def notify_session_complete(email: str, session_id: str, session_name: str):
        """Notify teacher that session processing is complete."""
        message = f"Session '{session_name}' ({session_id}) has finished processing."
        # Placeholder for real mail/SMS logic
        logger.info(f"[NOTIFICATION][EMAIL to {email}]: {message}")
        return {"status": "dispatched", "at": datetime.now(timezone.utc).isoformat()}

    @staticmethod
    def notify_reevaluation_update(email: str, student_name: str, status: str):
        """Notify student about reevaluation request status update."""
        message = f"Your reevaluation request has been {status}."
        logger.info(f"[NOTIFICATION][EMAIL to {email}]: {message}")
        return {"status": "dispatched", "at": datetime.now(timezone.utc).isoformat()}
