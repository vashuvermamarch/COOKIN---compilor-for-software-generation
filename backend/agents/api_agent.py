from backend.agents.base_agent import execute_agent_stage
from typing import Dict, Any

def run_api_agent(user_input: str, database_json: Dict[str, Any], system_design: Dict[str, Any] = None) -> Dict[str, Any]:
    return execute_agent_stage(
        stage_num=4,
        stage_name="api_generation",
        user_input=user_input,
        template_args={
            "DATABASE_JSON": database_json,
            "SYSTEM_DESIGN_JSON": system_design or {}
        }
    )
