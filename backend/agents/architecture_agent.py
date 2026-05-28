from backend.agents.base_agent import execute_agent_stage
from typing import Dict, Any

def run_architecture_agent(user_input: str, intent_json: Dict[str, Any]) -> Dict[str, Any]:
    return execute_agent_stage(
        stage_num=2,
        stage_name="system_design",
        user_input=user_input,
        template_args={"INTENT_JSON": intent_json}
    )
