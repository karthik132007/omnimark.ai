import pytest
import json
from unittest.mock import patch
from Engine.OMI import omi

@patch('Engine.OMI.omi.ollama.chat')
def test_explain_stats_mocked(mock_chat):
    mock_chat.return_value = {
        "message": {
            "content": json.dumps({
                "insights": ["Test insight"],
                "summary": "Test summary"
            })
        }
    }
    
    input_data = {"total_students": 50, "average_score": 75}
    result = omi.explain_stats(input_data)
    
    assert result is not None
    assert isinstance(result, str)
    parsed = json.loads(result)
    assert "insights" in parsed
    assert parsed["summary"] == "Test summary"
    mock_chat.assert_called_once()
