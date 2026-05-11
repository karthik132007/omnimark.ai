import unittest
import io
import pandas as pd
from Engine.reports.exporter import ReportExporter

class TestReportExporter(unittest.TestCase):
    def setUp(self):
        self.sample_results = [
            {
                "session_id": "session_1",
                "student_name": "John Doe",
                "student_rollnum": 101,
                "result": {"marks": 85, "similarity": 0.8},
                "answer_text": "Sample answer 1"
            },
            {
                "session_id": "session_1",
                "student_name": "Jane Smith",
                "student_rollnum": 102,
                "result": {"marks": 92, "similarity": 0.9},
                "answer_text": "Sample answer 2"
            }
        ]

    def test_to_csv(self):
        csv_data = ReportExporter.to_csv(self.sample_results)
        self.assertIn("John Doe", csv_data)
        self.assertIn("Jane Smith", csv_data)
        self.assertIn("marks", csv_data)
        
        # Verify it can be loaded back into pandas
        df = pd.read_csv(io.StringIO(csv_data))
        self.assertEqual(len(df), 2)
        self.assertEqual(df.iloc[0]["student_name"], "John Doe")

    def test_to_excel(self):
        buffer = ReportExporter.to_excel_buffer(self.sample_results)
        self.assertIsInstance(buffer, io.BytesIO)
        
        # Verify it can be loaded back into pandas
        df = pd.read_excel(buffer)
        self.assertEqual(len(df), 2)
        self.assertEqual(df.iloc[1]["student_name"], "Jane Smith")

if __name__ == "__main__":
    unittest.main()
