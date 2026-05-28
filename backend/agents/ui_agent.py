from backend.agents.base_agent import execute_agent_stage
from typing import Dict, Any

def run_ui_agent(user_input: str, api_json: Dict[str, Any], database_json: Dict[str, Any] = None) -> Dict[str, Any]:
    return execute_agent_stage(
        stage_num=5,
        stage_name="ui_schema",
        user_input=user_input,
        template_args={
            "API_JSON": api_json,
            "DATABASE_JSON": database_json or {}
        }
    )
