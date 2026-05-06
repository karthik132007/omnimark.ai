import sys
from unittest.mock import patch
sys.path.append("/home/electron/Documents/GitHub/omnimark.ai")

from Engine.Dashbord_data.eda import get_teacher_stats, get_session_stats
import pandas as pd

mock_sessions = [
    {
        "session_id": "test_session_123",
        "teacher_email": "test@teacher.com",
        "marks": [85, 90, 78, 92, 88, 65, 100]
    },
    {
        "session_id": "test_session_456",
        "teacher_email": "test@teacher.com",
        "marks": [70, 75, 80]
    }
]

print("DF DESCRIBE:", pd.DataFrame(mock_sessions).describe())

