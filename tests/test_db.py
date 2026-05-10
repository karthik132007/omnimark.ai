import pytest
import mongomock
from unittest.mock import patch

@pytest.fixture(autouse=True)
def mock_mongo():
    with patch('backend.db.client', new=mongomock.MongoClient()):
        with patch('backend.db.db', new=mongomock.MongoClient().omnimark):
            yield

def test_db_connection_and_insert():
    from backend.db import db
    # Test simple insert and find
    result = db.results.insert_one({"test_key": "test_value"})
    assert result.inserted_id is not None
    
    fetched = db.results.find_one({"test_key": "test_value"})
    assert fetched is not None
    assert fetched["test_key"] == "test_value"

def test_db_find_empty():
    from backend.db import db
    result = db.results.find_one({"non_existent": True})
    assert result is None
