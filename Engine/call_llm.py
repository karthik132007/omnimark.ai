from openai import OpenAI
import os

client = OpenAI(api_key=os.environ.get("LLM_API_KEY"))

def grade_via_llm(prompt):
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are an expert examiner evaluating student answers based on the provided criteria."},
            {"role": "user", "content": prompt}
        ]
    )
    return response.choices[0].message.content

def explain_stats(stats):
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": """
             You are student teacher relation expert, you were give stats of a class,explain the teacher performance of his class.
             out a detailed report on the teacher's performance based on the provided class statistics. Analyze the data to identify strengths and areas for improvement in the teacher's approach, engagement, and effectiveness. Provide insights into how the teacher can enhance their teaching methods to better support student learning and overall class performance.
                "
             output in a clear json format onlym no need to explain the output, just give the json response.
             """},
             {"role": "user", "content": "Here are the stats of the class:"},
             {"role": "user", "content": stats}        ]
    )
    return response.choices[0].message.content
    