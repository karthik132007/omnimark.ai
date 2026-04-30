from sklearn.feature_extraction.text import TfidfVectorizer

# universal helper functions for grading

def similarity_score(text1, text2):
    vectorizer = TfidfVectorizer()
    vectors = vectorizer.fit_transform([text1, text2])
    similarity = (vectors * vectors.T).A[0, 1]
    return similarity


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
    return [word for word, score in key_words if score > 0]

#LLM based grading helper functions

def make_prompt(question_paper, teacher_model_answer, student_answer, preferences):
    prompt = f"""
    You are an expert examiner evaluating student answers fairly and strictly.

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
    2. Evaluate based on meaning, not exact wording.
    3. Alternate correct answers are allowed.
    4. Give partial marks where deserved.
    5. Compare answer completeness, accuracy, relevance, and key concepts.
    6. Penalize missing major points, incorrect facts, irrelevant filler, or very short incomplete answers.
    7. Respect max marks from grading preferences.
    8. If unsure due to OCR ambiguity, reduce confidence score.

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
    """
    return prompt