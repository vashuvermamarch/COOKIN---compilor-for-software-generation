import json
import urllib.request
import urllib.error
import os
from typing import Dict, Any
from backend.config import GROQ_API_KEY, GROQ_MODEL, is_mock_mode
from backend.agents.mock_generator import generate_mock_stage

# Load prompts registry
PROMPTS_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "evaluation", "prompts.json")

def load_prompt_template(stage_name: str) -> str:
    try:
        with open(PROMPTS_PATH, "r", encoding="utf-8") as f:
            prompts = json.load(f)
        return prompts.get(stage_name, "")
    except Exception:
        return ""

import time

def call_groq(system_instruction: str, prompt: str) -> str:
    if not GROQ_API_KEY or not GROQ_API_KEY.strip():
        raise ValueError("GROQ_API_KEY is not configured.")
    
    url = "https://api.groq.com/openai/v1/chat/completions"
    
    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {
                "role": "system",
                "content": system_instruction
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.0,
        "top_p": 0.1,
        "response_format": {"type": "json_object"}
    }
    
    data = json.dumps(payload).encode("utf-8")
    
    max_retries = 5
    retry_delay = 2
    
    for attempt in range(max_retries):
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        )
        
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                res_body = response.read().decode("utf-8")
                res_json = json.loads(res_body)
                text = res_json["choices"][0]["message"]["content"]
                return text
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8")
            if e.code == 429 and attempt < max_retries - 1:
                # Try to extract retry delay from response headers
                retry_after = None
                if hasattr(e, "headers"):
                    retry_after = e.headers.get("Retry-After")
                elif hasattr(e, "msg") and hasattr(e, "info"):
                    # urllib HttpError holds headers in .info()
                    info = e.info()
                    if info:
                        retry_after = info.get("Retry-After")
                
                try:
                    sleep_time = float(retry_after) if retry_after else retry_delay * (2 ** attempt)
                except ValueError:
                    sleep_time = retry_delay * (2 ** attempt)
                
                print(f"[Warning] Groq rate limit (429) hit. Retrying in {sleep_time:.2f} seconds...")
                time.sleep(sleep_time)
                continue
            raise RuntimeError(f"Groq API HTTP Error {e.code}: {err_body}")
        except Exception as e:
            if attempt < max_retries - 1:
                sleep_time = retry_delay * (2 ** attempt)
                print(f"[Warning] Groq communication failure: {e}. Retrying in {sleep_time:.2f} seconds...")
                time.sleep(sleep_time)
                continue
            raise RuntimeError(f"Failed to communicate with Groq API: {str(e)}")

def execute_agent_stage(stage_num: int, stage_name: str, user_input: str, template_args: Dict[str, Any]) -> Dict[str, Any]:
    """
    Executes a specific stage of the compiler pipeline.
    Falls back to deterministic heuristics if mock mode is enabled or API calls fail.
    """
    if is_mock_mode():
        return generate_mock_stage(stage_num, user_input)
    
    global_system = load_prompt_template("global_system")
    stage_template = load_prompt_template(stage_name)
    
    prompt = stage_template
    for k, v in template_args.items():
        val_str = json.dumps(v, indent=2) if isinstance(v, (dict, list)) else str(v)
        prompt = prompt.replace(f"{{{{{k}}}}}", val_str)
        
    try:
        response_text = call_groq(global_system, prompt)
        return json.loads(response_text)
    except Exception as e:
        print(f"[Warning] LLM execution failed for stage {stage_num}: {e}. Falling back to Heuristic Engine.")
        if stage_num == 7:
            from backend.repair.repair_engine import run_heuristic_repair
            return run_heuristic_repair(template_args.get("BROKEN_CONFIG", {}), template_args.get("VALIDATION_ERRORS", []))
        return generate_mock_stage(stage_num, user_input)
