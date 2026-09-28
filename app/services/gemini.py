"""
Gemini AI service for FitBuddy.
Integrates with Google's Gemini API to generate personalized 7-day workout plans,
nutrition & recovery recommendations, and iterative plan updates from user feedback.
"""

import os
import json
import logging
import urllib.request
import urllib.error
from typing import Dict, Any, Optional
from dotenv import load_dotenv
from app.schemas.workout import WorkoutPlanData

load_dotenv()

logger = logging.getLogger("fitbuddy.gemini")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
# gemini-3.8-flash is the recommended model for text tasks
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")


def _get_api_key() -> str:
    """Retrieve the Gemini API key from environment variables."""
    key = os.getenv("GEMINI_API_KEY", "").strip()
    if not key:
        raise ValueError(
            "GEMINI_API_KEY is not configured. Please set GEMINI_API_KEY in your .env file or environment."
        )
    return key


def _clean_json_text(text: str) -> str:
    """Clean markdown code fences and whitespace from Gemini response."""
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()


FALLBACK_MODELS = [
    GEMINI_MODEL,
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
]


def _call_gemini_api(prompt: str, json_mode: bool = True) -> str:
    """
    Direct HTTPS call to Google Gemini API with automatic retry and model fallback
    to gracefully handle high-demand traffic spikes.
    """
    import time
    api_key = _get_api_key()

    generation_config: Dict[str, Any] = {
        "temperature": 0.4,
        "maxOutputTokens": 4096,
    }
    if json_mode:
        generation_config["responseMimeType"] = "application/json"

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": generation_config
    }

    req_data = json.dumps(payload).encode("utf-8")
    last_error = ""

    for model_name in FALLBACK_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        
        # Retry up to 2 times per model if 503/429
        for attempt in range(2):
            req = urllib.request.Request(
                url,
                data=req_data,
                headers={"Content-Type": "application/json"},
                method="POST"
            )

            try:
                with urllib.request.urlopen(req, timeout=45) as response:
                    res_body = response.read().decode("utf-8")
                    res_json = json.loads(res_body)

                    candidates = res_json.get("candidates", [])
                    if not candidates:
                        raise ValueError("Gemini returned an empty candidates list.")

                    first_candidate = candidates[0]
                    finish_reason = first_candidate.get("finishReason", "")
                    if finish_reason in ["SAFETY", "RECITATION"]:
                        raise ValueError(f"Generation stopped due to Gemini policy: {finish_reason}")

                    parts = first_candidate.get("content", {}).get("parts", [])
                    if not parts:
                        raise ValueError("Gemini response candidate contained no text parts.")

                    return parts[0].get("text", "")

            except urllib.error.HTTPError as e:
                error_content = e.read().decode("utf-8", errors="ignore")
                logger.warning(f"Gemini API model {model_name} attempt {attempt+1} HTTP {e.code}: {error_content}")
                try:
                    err_json = json.loads(error_content)
                    msg = err_json.get("error", {}).get("message", error_content)
                except Exception:
                    msg = error_content
                last_error = f"(HTTP {e.code}): {msg}"

                # If transient high demand or rate limit, wait slightly or try fallback
                if e.code in (429, 503) and attempt == 0:
                    time.sleep(1.2)
                    continue
                break  # try next fallback model
            except urllib.error.URLError as e:
                logger.error(f"Gemini API Connection Error: {e.reason}")
                raise RuntimeError(f"Could not connect to Gemini API: {e.reason}")

    raise RuntimeError(f"Gemini API request failed across models: {last_error}")


def generate_workout_plan_ai(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate a personalized 7-day workout plan using Gemini AI.
    Validates input and response against WorkoutPlanData Pydantic schema.
    """
    name = user_data.get("name", "Athlete")
    age = user_data.get("age", 25)
    weight = user_data.get("weight", 70)
    goal = user_data.get("goal", "General Fitness")
    intensity = user_data.get("intensity", "Medium")
    experience = user_data.get("experience", "Beginner")

    prompt = f"""
You are FitBuddy's master certified fitness coach and exercise physiologist.
Create a personalized, scientifically sound, and safe 7-day workout plan for this individual:

User Profile:
- Name: {name}
- Age: {age}
- Weight: {weight} kg
- Primary Fitness Goal: {goal}
- Target Workout Intensity: {intensity}
- Experience Level: {experience}

Safety Directives:
1. Do NOT provide dangerous, extreme, or contraindicated exercises.
2. Tailor exercise complexity, volume, sets, and rest strictly to their experience level ({experience}) and intensity ({intensity}).
3. For beginners, emphasize foundational compound movements, proper form, and adequate recovery.
4. Include appropriate rest days or active recovery days as suitable for a 7-day cycle.

Return ONLY a valid JSON object matching this exact structure:
{{
  "plan_title": "7-Day {goal} Plan for {name}",
  "overview": "Clear 2-3 sentence overview explaining how this routine achieves {name}'s {goal} goal given their {experience} level.",
  "safety_guidelines": "Warm-up guidelines, hydration recommendations, and injury prevention advice.",
  "days": [
    {{
      "day": "Day 1",
      "focus": "e.g. Upper Body Push & Core or Full Body Strength",
      "exercises": [
        {{
          "exercise": "Exercise name",
          "sets": "e.g. 3 sets",
          "reps": "e.g. 10-12 reps or 45 seconds",
          "rest": "e.g. 60-90 sec"
        }}
      ],
      "rest_recovery": "Specific recovery protocol or cooldown notes for this day"
    }},
    {{
      "day": "Day 2",
      "focus": "...",
      "exercises": [...],
      "rest_recovery": "..."
    }},
    {{
      "day": "Day 3",
      "focus": "...",
      "exercises": [...],
      "rest_recovery": "..."
    }},
    {{
      "day": "Day 4",
      "focus": "...",
      "exercises": [...],
      "rest_recovery": "..."
    }},
    {{
      "day": "Day 5",
      "focus": "...",
      "exercises": [...],
      "rest_recovery": "..."
    }},
    {{
      "day": "Day 6",
      "focus": "...",
      "exercises": [...],
      "rest_recovery": "..."
    }},
    {{
      "day": "Day 7",
      "focus": "...",
      "exercises": [...],
      "rest_recovery": "..."
    }}
  ]
}}
Ensure exactly 7 days are provided (Day 1 through Day 7). Do not include text outside the JSON object.
"""

    raw_response = _call_gemini_api(prompt, json_mode=True)
    cleaned = _clean_json_text(raw_response)

    try:
        plan_dict = json.loads(cleaned)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to decode Gemini JSON response: {cleaned}")
        raise ValueError(f"AI response could not be parsed as JSON: {str(e)}")

    # Validate with Pydantic model
    try:
        validated_plan = WorkoutPlanData.model_validate(plan_dict)
        return validated_plan.model_dump()
    except Exception as e:
        logger.error(f"Gemini response failed schema validation: {e}")
        raise ValueError(f"AI output did not match required workout plan structure: {str(e)}")


def generate_nutrition_tip_ai(goal: str, name: Optional[str] = None) -> str:
    """
    Generate a short, practical nutrition or recovery tip based on fitness goal.
    Does not provide medical diagnosis or treatment.
    """
    user_context = f" for {name}" if name else ""
    prompt = f"""
You are FitBuddy's sports nutrition and recovery advisor.
Provide a concise, practical, and science-grounded general nutrition or recovery tip{user_context} whose primary goal is "{goal}".

Guidelines:
- Keep it to 1 to 3 friendly sentences.
- Focus on macronutrient balance, whole foods, hydration, or sleep/rest relevant to {goal}.
- Do NOT provide medical diagnosis, prescription, or clinical treatment advice.
- Return plain text only (no JSON, no markdown formatting).

Example output format:
"Prioritize lean protein sources at every meal and ensure at least 7-8 hours of restful sleep to optimize muscle protein synthesis and tissue repair."
"""

    raw_response = _call_gemini_api(prompt, json_mode=False)
    tip = raw_response.strip().strip('"').strip("'")
    return tip


def regenerate_workout_plan_ai(
    user_data: Dict[str, Any],
    current_plan: Dict[str, Any],
    feedback_text: str
) -> Dict[str, Any]:
    """
    Regenerate/update a 7-day workout plan based on user feedback.
    """
    name = user_data.get("name", "Athlete")
    goal = user_data.get("goal", "General Fitness")
    experience = user_data.get("experience", "Beginner")
    intensity = user_data.get("intensity", "Medium")

    prompt = f"""
You are FitBuddy's master certified fitness coach.
A user has provided specific feedback regarding their current 7-day workout plan.
Your task is to adapt their workout plan according to their feedback while maintaining scientific safety and balance.

User Profile:
- Name: {name}
- Age: {user_data.get('age', 25)}
- Weight: {user_data.get('weight', 70)} kg
- Goal: {goal}
- Intensity: {intensity}
- Experience: {experience}

Current Workout Plan Summary:
{json.dumps(current_plan, indent=2)}

User Feedback:
"{feedback_text}"

Instructions:
1. Revise the 7-day workout schedule directly addressing the feedback (e.g. if they asked for more cardio, more rest days, lower intensity, focus on legs, etc.).
2. Maintain safe progression and avoid hazardous or excessive strain.
3. Keep the 7-day structure (Day 1 through Day 7).
4. Update the overview to explain how this updated version incorporates their feedback: "{feedback_text}".

Return ONLY a valid JSON object matching the exact WorkoutPlanData schema:
{{
  "plan_title": "Updated 7-Day Plan for {name} ({goal})",
  "overview": "Explanation of changes made based on user feedback.",
  "safety_guidelines": "Updated safety guidance.",
  "days": [
    {{
      "day": "Day 1",
      "focus": "...",
      "exercises": [
        {{
          "exercise": "...",
          "sets": "...",
          "reps": "...",
          "rest": "..."
        }}
      ],
      "rest_recovery": "..."
    }},
    ... (Day 2 through Day 7)
  ]
}}
Ensure exactly 7 days are provided. Do not include markdown code fences or explanatory text outside the JSON.
"""

    raw_response = _call_gemini_api(prompt, json_mode=True)
    cleaned = _clean_json_text(raw_response)

    try:
        plan_dict = json.loads(cleaned)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to decode updated Gemini JSON: {cleaned}")
        raise ValueError(f"AI updated response could not be parsed as JSON: {str(e)}")

    try:
        validated_plan = WorkoutPlanData.model_validate(plan_dict)
        return validated_plan.model_dump()
    except Exception as e:
        logger.error(f"Updated Gemini response failed schema validation: {e}")
        raise ValueError(f"Updated plan did not match required structure: {str(e)}")
