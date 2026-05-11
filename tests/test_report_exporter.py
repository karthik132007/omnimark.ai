import pytest
import io
import pandas as pd
from Engine.reports.exporter import ReportExporter

def test_report_exporter_csv():
    results = [
        {"student_name": "A", "marks": 85},
        {"student_name": "B", "marks": 90}
    ]
    csv_str = ReportExporter.to_csv(results)
    assert "student_name,marks" in csv_str
    assert "A,85" in csv_str
    assert "B,90" in csv_str

def test_report_exporter_csv_empty():
    assert ReportExporter.to_csv([]) == ""

def test_report_exporter_excel():
    results = [
        {"student_name": "A", "marks": 85},
        {"student_name": "B", "marks": 90}
    ]
    buffer = ReportExporter.to_excel_buffer(results)
    assert isinstance(buffer, io.BytesIO)
    # Basic check that it's a valid excel file
    df = pd.read_excel(buffer)
    assert df.shape == (2, 2)
    assert list(df["student_name"]) == ["A", "B"]
