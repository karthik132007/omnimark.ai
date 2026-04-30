from helpers import remove_stop_words, similarity_score

def check_cheat(student1, student2):

    answer1 = remove_stop_words(student1)
    answer2 = remove_stop_words(student2)

    # Semantic similarity
    sim_sus_score = similarity_score(answer1, answer2)

    # Length similarity
    length_diff = abs(len(answer1.split()) - len(answer2.split()))

    if length_diff <= 5:
        len_sus_score = 1.0
    elif length_diff <= 15:
        len_sus_score = 0.6
    elif length_diff <= 25:
        len_sus_score = 0.3
    else:
        len_sus_score = 0.0

    # Final weighted score
    total_sus_score = (sim_sus_score * 0.7) + (len_sus_score * 0.3)

    threshold = 0.75

    return {
        "suspicious": total_sus_score >= threshold,
        "similarity_score": round(total_sus_score * 100, 2)
    }