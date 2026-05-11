import pytest
import json
from unittest.mock import patch
from Engine.OMI import omi

@patch('Engine.OMI.omi.ollama.Client')
def test_explain_stats_mocked(mock_client_class):
    mock_client = mock_client_class.return_value
    mock_client.chat.return_value = {
        "message": {
            "content": json.dumps({
                "insights": ["Test insight"],
                "overview": "Test overview"
            })
        }
    }
    
    input_data = {"total_students": 50, "average_score": 75}
    result = omi.explain_stats(input_data)
    
    assert result is not None
    assert isinstance(result, str)
    parsed = json.loads(result)
    assert "insights" in parsed
    assert parsed["overview"] == "Test overview"
    mock_client.chat.assert_called_once()
