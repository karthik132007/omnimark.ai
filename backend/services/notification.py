import logging
import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timezone
from typing import Optional
from backend.config import get_smtp_config, get_sms_config

logger = logging.getLogger(__name__)

class NotificationService:
    """
    A centralized service for handling system notifications.
    Supports SMTP email and logging/Twilio SMS (pluggable).
    """
    
    @staticmethod
    def _send_email(to_email: str, subject: str, body: str):
        config = get_smtp_config()
        if not config["user"] or not config["password"]:
            logger.warning(f"SMTP credentials not configured. Logging email to {to_email}: {subject}")
            return False

        try:
            msg = MIMEText(body)
            msg["Subject"] = subject
            msg["From"] = config["sender"]
            msg["To"] = to_email

            with smtplib.SMTP(config["host"], config["port"]) as server:
                server.starttls()
                server.login(config["user"], config["password"])
                server.send_message(msg)
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False

    @staticmethod
    def notify_session_complete(email: str, session_id: str, session_name: str):
        """Notify teacher that session processing is complete."""
        subject = f"OmniMark AI: Processing Complete - {session_name}"
        body = f"Hello,\n\nThe evaluation session '{session_name}' (ID: {session_id}) has finished processing.\n\nYou can now view the results and analytics in your dashboard.\n\nBest regards,\nOmniMark AI Team"
        
        success = NotificationService._send_email(email, subject, body)
        return {
            "status": "sent" if success else "logged", 
            "at": datetime.now(timezone.utc).isoformat()
        }

    @staticmethod
    def notify_reevaluation_update(email: str, student_name: str, status: str):
        """Notify student about reevaluation request status update."""
        subject = f"OmniMark AI: Reevaluation Update"
        body = f"Hello {student_name},\n\nYour reevaluation request has been {status}.\n\nPlease check your student dashboard for details.\n\nBest regards,\nOmniMark AI Team"
        
        success = NotificationService._send_email(email, subject, body)
        return {
            "status": "sent" if success else "logged", 
            "at": datetime.now(timezone.utc).isoformat()
        }

    @staticmethod
    def notify_via_sms(phone_number: str, message: str):
        """Notify user via SMS using Twilio if configured, else fallback to logging."""
        config = get_sms_config()
        
        if config["provider"] == "twilio" and config["twilio_sid"]:
            try:
                from twilio.rest import Client
                client = Client(config["twilio_sid"], config["twilio_token"])
                client.messages.create(
                    body=message,
                    from_=config["twilio_number"],
                    to=phone_number
                )
                logger.info(f"SMS sent via Twilio to {phone_number}")
                return {"status": "sent", "provider": "twilio", "at": datetime.now(timezone.utc).isoformat()}
            except Exception as e:
                logger.error(f"Twilio SMS failed: {str(e)}")

        # Fallback to logging
        logger.info(f"[NOTIFICATION][SMS to {phone_number}]: {message}")
        return {"status": "logged", "provider": "logging", "at": datetime.now(timezone.utc).isoformat()}
