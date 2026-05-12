from Engine.encoder import model
from Engine.helpers import remove_stop_words
from Engine.helpers import get_key_words
from Engine.helpers import get_lemmatized_words
from Engine.helpers import similarity_score
from Engine.grade.base import AbstractGradingEngine

class NLPGradingEngine(AbstractGradingEngine):
    """
    Hybrid NLP Grading Engine utilizing semantic embeddings and deterministic linguistic signals.
    
    This engine follows a weighted composition strategy:
    1. Semantic Similarity (80%): Measures conceptual alignment using Sentence-Transformers (all-MiniLM-L6-v2).
    2. Keyword Overlap (15%): Ensures essential technical terminology is present via TF-IDF extraction.
    3. Length Adequacy (5%): Penalizes overly brief responses that fail to meet institutional minimums.
    """
    def grade(self, question_paper: str, teacher_model_answer: str, student_answer: str, preferences: dict, **kwargs) -> dict:
        return Correct_NLP(student_answer, teacher_model_answer, preferences, kwargs.get('key_points'))

def Correct_NLP(Student_Response,Teacher_model_answer,preferences,key_points=None): 
    """
    Core implementation of the NLP grading algorithm.
    
    Mathematical Model:
    Score = (Sim * 0.80) + (Keywords * 0.15) + (Length * 0.05)
    
    The weights are biased toward Semantic Similarity to reward understanding over rote memorization.
    """
    marks = 0
    max_marks = preferences.get('max_marks', 100)

    if preferences.get('language_exam', False) == False:
        student_response = remove_stop_words(Student_Response)
        model_answer = remove_stop_words(Teacher_model_answer)
        answer_length = len(str(student_response).split()) #word count
        model_answer_length = len(str(model_answer).split()) #word
    else:
        answer_length = len(str(Student_Response).split()) #word count
        model_answer_length = len(str(Teacher_model_answer).split()) #word count
        student_response = Student_Response
        model_answer = Teacher_model_answer

    
    min_length = preferences.get('min_answer_length', preferences.get('length', 250))
    length_factor = min(answer_length / min_length, 1)
    # if answer_length >= min_length:
    #    length_diff = model_answer_length - answer_length
    #    if length_diff > 0:
    #         if length_diff > 30:
    #             length_factor = 1
    #         elif length_diff > 20:
    #             length_factor = 0.3
    #         elif length_diff > 10:
    #             length_factor = 0.6
    #         else:
    #             length_factor = 1

    
    key_words = get_key_words(model_answer)
    count=0
    student_words = get_lemmatized_words(student_response)
    for word in key_words:
        if word in student_words:
            count+=1
    x_factor_score = count / len(key_words) if len(key_words) > 0 else 0
    
    
    
    
    similarity = similarity_score(model_answer, student_response)

    #80% similarity, 15% key words, 05% length factor
    score = (
    similarity * 0.80 +
    x_factor_score * 0.15 +
    length_factor * 0.05
    )
    marks = round(score * max_marks,2)
    if similarity > 0.9:
        marks += 0.25
    marks = max(0, marks)
    marks = min(marks, max_marks)

    return {
        "marks": marks,
        "similarity": similarity,
        "keyword_score": x_factor_score,
        "length_score": length_factor
    }
