from abc import ABC, abstractmethod
from typing import Any, Dict

class AbstractGradingEngine(ABC):
    """
    Abstract Base Class for all grading engines in OmniMark.
    Ensures a consistent interface across different grading strategies (NLP, LLM, etc.)
    """

    @abstractmethod
    def grade(self, question_paper: str, teacher_model_answer: str, student_answer: str, preferences: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        """
        Evaluate a student's answer and return the grading result.
        
        Args:
            question_paper (str): The text of the question paper.
            teacher_model_answer (str): The teacher's provided answer key.
            student_answer (str): The text of the student's answer.
            preferences (Dict[str, Any]): Grading preferences (max_marks, strictness, etc.).
            **kwargs: Additional parameters specific to the grading engine.
            
        Returns:
            Dict[str, Any]: A dictionary containing 'marks', 'feedback', etc.
        """
        pass
