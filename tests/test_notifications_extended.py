import pytest
from unittest.mock import MagicMock, patch
from backend.services.notification import NotificationService

@patch("smtplib.SMTP")
def test_send_email_success(mock_smtp, monkeypatch):
    monkeypatch.setattr("backend.services.notification.get_smtp_config", lambda: {
        "host": "smtp.gmail.com",
        "port": 587,
        "user": "user@example.com",
        "password": "password",
        "sender": "sender@example.com"
    })
    
    # Mock SMTP instance
    instance = mock_smtp.return_value.__enter__.return_value
    
    success = NotificationService._send_email("to@example.com", "Subject", "Body")
    
    assert success is True
    instance.starttls.assert_called_once()
    instance.login.assert_called_once_with("user@example.com", "password")
    instance.send_message.assert_called_once()

@patch("smtplib.SMTP")
def test_send_email_failure(mock_smtp, monkeypatch):
    monkeypatch.setattr("backend.services.notification.get_smtp_config", lambda: {
        "host": "smtp.gmail.com",
        "port": 587,
        "user": "user@example.com",
        "password": "password",
        "sender": "sender@example.com"
    })
    
    # Mock SMTP instance to raise exception
    mock_smtp.side_effect = Exception("SMTP error")
    
    success = NotificationService._send_email("to@example.com", "Subject", "Body")
    
    assert success is False

def test_notify_via_sms_twilio_success(monkeypatch):
    monkeypatch.setattr("backend.services.notification.get_sms_config", lambda: {
        "provider": "twilio",
        "twilio_sid": "AC123",
        "twilio_token": "token",
        "twilio_number": "+12345"
    })
    
    mock_client = MagicMock()
    # Mocking twilio module
    mock_twilio = MagicMock()
    mock_twilio.rest.Client = MagicMock(return_value=mock_client)
    import sys
    monkeypatch.setitem(sys.modules, "twilio", mock_twilio)
    monkeypatch.setitem(sys.modules, "twilio.rest", mock_twilio.rest)

    res = NotificationService.notify_via_sms("+919999999999", "Test SMS")
    assert res["status"] == "sent"
    assert res["provider"] == "twilio"
    mock_client.messages.create.assert_called_once()

def test_notify_via_sms_twilio_failure(monkeypatch):
    monkeypatch.setattr("backend.services.notification.get_sms_config", lambda: {
        "provider": "twilio",
        "twilio_sid": "AC123",
        "twilio_token": "token",
        "twilio_number": "+12345"
    })
    
    # Mocking the twilio.rest.Client to raise exception during messages.create
    mock_client = MagicMock()
    mock_client.messages.create.side_effect = Exception("Twilio error")
    
    mock_twilio = MagicMock()
    mock_twilio.rest.Client = MagicMock(return_value=mock_client)
    import sys
    monkeypatch.setitem(sys.modules, "twilio", mock_twilio)
    monkeypatch.setitem(sys.modules, "twilio.rest", mock_twilio.rest)

    res = NotificationService.notify_via_sms("+919999999999", "Test SMS")
    assert res["status"] == "logged"
    assert res["provider"] == "logging"
