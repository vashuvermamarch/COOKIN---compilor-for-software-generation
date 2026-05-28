import os
from dotenv import load_dotenv

load_dotenv()

# Configuration variables for Groq API
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

# Toggle to force mock heuristic generation for local testing
MOCK_MODE = os.getenv("MOCK_MODE", "auto")  # "auto", "true", or "false"

def is_mock_mode() -> bool:
    if MOCK_MODE == "true":
        return True
    if MOCK_MODE == "false":
        return False
    # "auto": mock if Groq API key is not configured
    return len(GROQ_API_KEY.strip()) == 0
