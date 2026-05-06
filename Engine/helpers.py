from sklearn.feature_extraction.text import TfidfVectorizer
from Engine.encoder import model
from nltk.stem import WordNetLemmatizer
# universal helper functions for grading
from sentence_transformers import util
import datetime
def similarity_score(text1, text2):
    model_embedding = model.encode(text1)
    student_embedding = model.encode(text2)
    similarity = util.cos_sim(model_embedding, student_embedding).item()
    return similarity


import nltk
from nltk.stem import WordNetLemmatizer
import re

nltk.download('wordnet', quiet=True)
lemmatizer = WordNetLemmatizer()

#NLP helper functions for grading
def remove_stop_words(text):
    stop_words = set(['the', 'is', 'in', 'and', 'to', 'of', 'a', 'that', 'it', 'with', 'as', 'for', 'was', 'on', 'are', 'by', 'this', 'be', 'or', 'from','.',',','!','?']) 
    return ' '.join([word for word in text.split() if word.lower() not in stop_words])

def get_key_words(text):
    cleaned_text = remove_stop_words(text)
    vectorizer = TfidfVectorizer()
    X = vectorizer.fit_transform([cleaned_text])
    scores = zip(vectorizer.get_feature_names_out(), X.toarray()[0])
    key_words = sorted(scores, key=lambda x: x[1], reverse=True)
    # Return up to 15 unique lemmatized keywords
    result = []
    for word, score in key_words:
        if score > 0:
            lemma = lemmatizer.lemmatize(word)
            if lemma not in result:
                result.append(lemma)
            if len(result) == 15:
                break
    return result

def get_lemmatized_words(text):
    words = re.findall(r'\b\w+\b', text.lower())
    return set(lemmatizer.lemmatize(word) for word in words)

#LLM based grading helper functions

def make_prompt(question_paper, teacher_model_answer, student_answer, preferences):
    prompt = f"""
    You are an expert examiner evaluating student answers fairly and strictly.
    Today's date is {datetime.date.today()}

    ## Input Data
    Question Paper:
    {question_paper}

    Teacher Model Answer:
    {teacher_model_answer}

    Student Answer:
    {student_answer}

    Grading Preferences:
    {preferences}

    ## Evaluation Rules
    1. Student answer was extracted using OCR, so minor spelling mistakes or OCR noise may exist.
    2. marks can be decimal values, not just integers.
    3. question paper may have multiple questions, so evaluate each question separately and assign marks accordingly.
    4. Marks for each Question is also provided in the question paper in square brackets, so respect the max marks for each question when assigning marks.
    5. Evaluate based on meaning, not exact wording.
    6. Alternate correct answers are allowed.
    7. Give partial marks where deserved.
    8. Compare answer completeness, accuracy, relevance, and key concepts.
    9. Penalize missing major points, incorrect facts, irrelevant filler, or very short incomplete answers.
    10. Respect max marks from grading preferences.
    11. If unsure due to OCR ambiguity, reduce confidence score.

    ## Output Rules
    Return ONLY valid JSON.
    No markdown.
    No explanation outside JSON.

    ## JSON Format

    {{
    "marks": {{
        "Question 1": 9,
        "Question 2": 7
    }},
    "question_feedback": {{
        "Question 1": "Good answer, missed one key point.",
        "Question 2": "Partially correct."
    }},
    "total_marks": 15,
    "evaluation_note": "Student demonstrates moderate understanding.",
    "confidence_score": 87,
    "other_info": {{
        "strengths": ["Good conceptual clarity"],
        "weaknesses": ["Missed definitions"],
        "ocr_issue_detected": true
    }}
    }}
    Importnat Note: 
    * select strengths from this list: ["Good conceptual clarity", "Accurate facts", "Relevant content", "Well-structured answer", "Good examples", "Comprehensive coverage", "Good language use", "Critical thinking", "Original insights", "Effective communication", "Formal definition", "Real-world applications", "Clear intuitive understanding", "Sound reasoning", "Correct method/process", "Correct units/notation", "Answers all sub-parts", "Concise and focused", "Well-justified claims"]
    * select weaknesses from this list: ["Missed definitions", "Inaccurate facts", "Irrelevant content", "Poor structure", "Lack of examples", "Incomplete answer", "Poor language use", "Lack of critical thinking", "Plagiarism detected", "Ineffective communication", "Lack of formal definition", "Lack of real-world applications", "Unclear intuitive understanding", "Weak reasoning", "Incorrect method/process", "Incorrect units/notation", "Missed sub-parts", "Overly verbose", "Poor justification"]
    * if there are only one or few weaknesses, you can try to cut mark in decimal like 0.5 or 0.25 instead of full mark cut.
    * There is no need to be harsh, if the answer is mostly correct but just missing one key point, you can give 9.5 out of 10 instead of 8.5 or 8.75. The goal is to be fair and accurate, not to be harsh.
    * Also there is no rule that no student can get full out of full marks. If the answer is truly perfect and complete, you can give full marks. The goal is to be fair and accurate, not to be harsh for the sake of being harsh.
    """
    return prompt