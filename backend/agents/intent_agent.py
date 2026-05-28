from backend.agents.base_agent import execute_agent_stage
from typing import Dict, Any

def run_intent_agent(user_input: str) -> Dict[str, Any]:
    return execute_agent_stage(
        stage_num=1,
        stage_name="intent_extraction",
        user_input=user_input,
        template_args={"USER_INPUT": user_input}
    )
