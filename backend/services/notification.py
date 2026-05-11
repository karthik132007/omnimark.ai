import logging
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger(__name__)

class NotificationService:
    """
    A centralized service for handling system notifications.
    Currently logs to console. 
    Working on it: We intend to integrate SMTP, SendGrid, and SMS (Twilio/AWS SNS) in the future.
    """
    
    @staticmethod
    def notify_session_complete(email: str, session_id: str, session_name: str):
        """Notify teacher that session processing is complete via Email (Future Integration)."""
        message = f"Session '{session_name}' ({session_id}) has finished processing."
        # Placeholder for real mail logic
        logger.info(f"[NOTIFICATION][EMAIL to {email}]: {message}")
        return {"status": "dispatched", "at": datetime.now(timezone.utc).isoformat()}

    @staticmethod
    def notify_reevaluation_update(email: str, student_name: str, status: str):
        """Notify student about reevaluation request status update via Email (Future Integration)."""
        message = f"Your reevaluation request has been {status}."
        logger.info(f"[NOTIFICATION][EMAIL to {email}]: {message}")
        return {"status": "dispatched", "at": datetime.now(timezone.utc).isoformat()}

    @staticmethod
    def notify_via_sms(phone_number: str, message: str):
        """
        Notify user via SMS.
        Working on it: We intend to integrate a real SMS gateway in the future.
        """
        logger.info(f"[NOTIFICATION][SMS to {phone_number}]: {message}")
        return {"status": "dispatched", "at": datetime.now(timezone.utc).isoformat()}
