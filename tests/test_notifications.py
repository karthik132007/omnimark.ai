import pytest
from backend.services.notification import NotificationService

def test_notification_service_placeholders(caplog):
    import logging
    caplog.set_level(logging.INFO)
    
    # Test session complete
    res = NotificationService.notify_session_complete("teacher@example.com", "sess_123", "Midterm")
    assert res["status"] == "logged"
    assert "SMTP credentials not configured. Logging email to teacher@example.com" in caplog.text
    
    # Test reevaluation update
    res = NotificationService.notify_reevaluation_update("student@example.com", "John Doe", "approved")
    assert res["status"] == "logged"
    assert "SMTP credentials not configured. Logging email to student@example.com" in caplog.text
    
    # Test SMS
    res = NotificationService.notify_via_sms("+1234567890", "Hello Student")
    assert res["status"] == "logged"
    assert "[NOTIFICATION][SMS to +1234567890]: Hello Student" in caplog.text
