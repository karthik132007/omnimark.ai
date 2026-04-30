from encoder import model
from helpers import remove_stop_words
from helpers import get_key_words
from helpers import similarity_score
def Correct_NLP(Student_Response,Teacher_model_answer,preferences,key_points):
    marks = 0
    max_marks = preferences['max_marks']

    if preferences['language_exam'] == False:
        student_response = remove_stop_words(Student_Response)
        model_answer = remove_stop_words(Teacher_model_answer)
        answer_length = len(str(student_response).split()) #word count
        model_answer_length = len(str(model_answer).split()) #word
    else:
        answer_length = len(str(Student_Response).split()) #word count
        model_answer_length = len(str(Teacher_model_answer).split()) #word count
        student_response = Student_Response
        model_answer = Teacher_model_answer

    
    min_lenth = preferences['length']
    length_factor = 1
    if answer_length < min_lenth:
       length_diff = model_answer_length - answer_length
       if length_diff > 0:
            if length_diff > 30:
                length_factor = 0
            elif length_diff > 20:
                length_factor = 0.3
            elif length_diff > 10:
                length_factor = 0.6
            else:
                length_factor = 1

    
    key_words = get_key_words(model_answer)
    count=0
    student_words = set(student_response.lower().split())
    for word in key_words:
        if word in student_words:
            count+=1
    x_factor_score = count / len(key_words) if len(key_words) > 0 else 0
    
    
    model_embedding = model.encode(model_answer)
    student_embedding = model.encode(student_response)
    similarity = similarity_score(model_answer, student_response)

    #50% similarity, 30% key words, 20% length factor
    score = (similarity * 0.5) + (x_factor_score * 0.3) + (length_factor * 0.2)
    marks = round(score * max_marks,2)
    marks = max(0, marks)
    marks = min(marks, max_marks)

    return {
        "marks": marks,
        "similarity": similarity,
        "keyword_score": x_factor_score,
        "length_score": length_factor
    }
