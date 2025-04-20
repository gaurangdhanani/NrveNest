from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import openai
import os
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FormData(BaseModel):
    age: str
    personality: str
    hobbies: str
    music: str
    emotionalNeeds: str
    moods: str
    learningStyle: str

@app.post("/generate_emotional_profile")
def generate_emotional_profile(form: FormData):
    prompt = f"""
    A user has filled out the following emotional profile form:
    - Age: {form.age}
    - Personality Traits: {form.personality}
    - Hobbies: {form.hobbies}
    - Music Preferences: {form.music}
    - Emotional Needs: {form.emotionalNeeds}
    - Common Moods: {form.moods}
    - Learning Style: {form.learningStyle}

    Based on this information:
    - Write how easily they can be emotionally triggered and what their emotional triggers might be.
    - Write how easily they get overwhelmed and anxious 
    - Suggest 3 exercises to improve emotional resilience.
    - Suggest 2 types of games or activities that would suit their personality.
    - Suggest how NrveNest can help them.

    Return the result as a thoughtful paragraph.
    """

    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a helpful mental wellness assistant."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        max_tokens=600
    )

    return {"profile": response['choices'][0]['message']['content'].strip()}
