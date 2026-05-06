import ollama
def set_paper(difficulty:str,max_marks:int,no_of_ques:int,course:str,choice_aval:bool,choice_type:str,relavent_docs:str,custom_prompt:str):
    prompt = f"""
    You are a highly experienced university-level question paper setter and subject expert in {course}.

    Your task is to generate a well-structured, balanced, and academically appropriate examination paper based on the provided requirements.

    ========================
    EXAM CONFIGURATION
    ========================

    1. Course/Subject:
    {course}

    2. Difficulty Level:
    {difficulty}
    Possible Levels:
    - Easy
    - Doable
    - Medium
    - Hard
    - Extreme

    3. Maximum Marks:
    {max_marks}

    4. Number of Questions:
    {no_of_ques}

    5. Choice Available:
    {choice_aval}

    6. Choice Type:
    {choice_type}
    Possible Types:
    - Internal Choice
    - External Choice

    7. Reference Materials / Relevant Documents:
    {relavent_docs}

    ========================
    TEACHER INSTRUCTIONS
    ========================

    {custom_prompt}

    ========================
    QUESTION PAPER RULES
    ========================

    - Questions must strictly belong to the subject syllabus.
    - Maintain academic quality and clarity.
    - Avoid ambiguous or poorly framed questions.
    - Ensure grammatical correctness.
    - Questions should test:
      - Conceptual understanding
      - Analytical thinking
      - Application skills
      - Problem-solving ability
    - Distribute marks fairly across chapters/topics.
    - Match question complexity with the selected difficulty level.
    - Include real-world or practical questions wherever appropriate.
    - Avoid repeating similar questions.
    - If choices are enabled, generate proper alternative questions.
    - Mention marks clearly for every question.
    - Generate descriptive, meaningful, and exam-quality questions.
    - Prefer a university examination style format.

    ========================
    OUTPUT FORMAT RULES
    ========================

    Return ONLY valid JSON.
    Do NOT include markdown.
    Do NOT include explanations.
    Do NOT include extra text before or after JSON.

    JSON Structure:
    {{
    "exam_title": "Mid Exam / Final Exam / etc",
      "course": "{course}",
      "difficulty": "{difficulty}",
      "total_marks": {max_marks},
      "questions": {{
    "Chapter 1": [
          {{
    "question_no": 1,
            "question": "Explain underfitting with a suitable example.",
            "marks": 5,
            "difficulty": "Easy"
          }},
          {{
    "question_no": 2,
            "question": "Differentiate clustering and classification with examples.",
            "marks": 5,
            "difficulty": "Medium"
          }}
        ],
        "Chapter 2": [
          {{
    "question_no": 3,
            "question": "Compare Machine Learning and Deep Learning. Is Data Mining the same as Machine Learning? Justify your answer.",
            "marks": 10,
            "difficulty": "Hard"
          }}
        ]
      }}
    }}

    Ensure:
    - JSON is syntactically valid.
    - Question numbering is sequential.
    - Total marks approximately equal {max_marks}.
    - Number of generated questions equals {no_of_ques}.
    """
    response = ollama.chat(
        model="qwen3-coder-next:cloud",
        format="json",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    content = response['message']['content']
    
    # Try to extract JSON if it's wrapped in markdown or tags
    import re
    import json
    
    match = re.search(r'\{[\s\S]*\}', content)
    if match:
        json_str = match.group(0)
        try:
            parsed = json.loads(json_str)
            return json.dumps(parsed, indent=2)
        except json.JSONDecodeError:
            return content
            
    return content