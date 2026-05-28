from backend.agents.base_agent import execute_agent_stage
from typing import Dict, Any

def run_db_agent(user_input: str, system_design_json: Dict[str, Any]) -> Dict[str, Any]:
    return execute_agent_stage(
        stage_num=3,
        stage_name="database_schema",
        user_input=user_input,
        template_args={"SYSTEM_DESIGN_JSON": system_design_json}
    )
