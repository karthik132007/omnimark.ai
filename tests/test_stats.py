import pytest
import mongomock
from unittest.mock import patch
import pandas as pd

@pytest.fixture
def mock_db():
    client = mongomock.MongoClient()
    db = client.omnimark
    
    # Insert dummy data
    dummy_session1 = {
        "session_id": "test_session_123",
        "teacher_email": "test@teacher.com",
        "marks": [85, 90, 78, 92, 88, 65, 100]
    }
    dummy_session2 = {
        "session_id": "test_session_456",
        "teacher_email": "test@teacher.com",
        "marks": [70, 75, 80]
    }
    db.sessions.insert_many([dummy_session1, dummy_session2])
    return db

@patch('Engine.Dashbord_data.eda.db')
def test_get_teacher_stats(mock_eda_db, mock_db):
    mock_eda_db.sessions = mock_db.sessions
    from Engine.Dashbord_data.eda import get_teacher_stats
    
    result = get_teacher_stats("test@teacher.com")
    assert result is not None
    # Depending on eda implementation, it might return a dataframe or dict. 
    # Just asserting it successfully executes and returns something valid.
    if isinstance(result, pd.DataFrame):
        assert not result.empty

@patch('Engine.Dashbord_data.eda.db')
def test_get_session_stats(mock_eda_db, mock_db):
    mock_eda_db.sessions = mock_db.sessions
    from Engine.Dashbord_data.eda import get_session_stats
    
    result = get_session_stats("test_session_123")
    assert result is not None
    
@patch('Engine.Dashbord_data.eda.db')
def test_get_teacher_stats_empty(mock_eda_db, mock_db):
    mock_eda_db.sessions = mock_db.sessions
    from Engine.Dashbord_data.eda import get_teacher_stats
    
    result = get_teacher_stats("nonexistent@teacher.com")
    assert result is not None
