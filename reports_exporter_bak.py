import pandas as pd
from typing import List, Dict, Any
import io

class ReportExporter:
    """
    Base utility for transforming evaluation data into institutional reports.
    Supports CSV and Excel (XLSX) formats.
    """
    
    @staticmethod
    def to_csv(results: List[Dict[str, Any]]) -> str:
        """Convert list of results to CSV string."""
        if not results:
            return ""
        df = pd.json_normalize(results)
        return df.to_csv(index=False)

    @staticmethod
    def to_excel_buffer(results: List[Dict[str, Any]]) -> io.BytesIO:
        """Convert list of results to Excel file buffer."""
        df = pd.json_normalize(results)
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Evaluation Results')
        output.seek(0)
        return output
