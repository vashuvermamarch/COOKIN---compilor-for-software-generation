import copy
import re
from typing import Dict, Any, List
from backend.agents.base_agent import execute_agent_stage
from backend.config import is_mock_mode

def repair_config(broken_config: Dict[str, Any], errors: List[str], user_input: str) -> Dict[str, Any]:
    """
    Repairs broken configs based on validation reports.
    Uses either Gemini's LLM Stage 7 prompt or programmatic fixes in mock mode.
    """
    if is_mock_mode():
        return run_heuristic_repair(broken_config, errors)
    
    # LLM-based repair (Stage 7)
    repaired_json = execute_agent_stage(
        stage_num=7,
        stage_name="repair_engine",
        user_input=user_input,
        template_args={
            "VALIDATION_ERRORS": errors,
            "BROKEN_CONFIG": broken_config
        }
    )
    return repaired_json

def run_heuristic_repair(broken_config: Dict[str, Any], errors: List[str]) -> Dict[str, Any]:
    """
    Surgically fixes validation issues programmatically to ensure a green build.
    """
    repaired = copy.deepcopy(broken_config)
    
    for err in errors:
        # UI-API endpoint mismatches
        if "UI-API mismatch" in err:
            api = repaired.setdefault("api", {"apis": []}) or {"apis": []}
            if not isinstance(api, dict):
                api = {"apis": []}
                repaired["api"] = api
            apis_list = api.setdefault("apis", [])
            
            # Find the missing API route: Table / Form submits to 'METHOD ROUTE'
            parts = err.split("non-existent API endpoint '")
            if len(parts) > 1:
                endpoint_spec = parts[1].rstrip("'.")
                spec_parts = endpoint_spec.split(" ", 1)
                if len(spec_parts) == 2:
                    method, path = spec_parts[0], spec_parts[1]
                    exists = any(a.get("path") == path and a.get("method") == method for a in apis_list)
                    if not exists:
                        apis_list.append({
                            "path": path,
                            "method": method,
                            "request_schema": {"type": "object", "properties": {}},
                            "response_schema": {"type": "object", "properties": {}},
                            "auth_required": True,
                            "roles_allowed": ["Admin", "Customer", "Member"]
                        })
                        
        # UI Form to DB Column mismatches
        elif "UI-DB mismatch" in err:
            parts = err.split("Form field '")
            if len(parts) > 1:
                f_name = parts[1].split("'")[0]
                table_part = err.split("target database table '")
                if len(table_part) > 1:
                    t_name = table_part[1].rstrip("'.")
                    
                    db = repaired.setdefault("database", {"tables": []}) or {"tables": []}
                    if not isinstance(db, dict):
                        db = {"tables": []}
                        repaired["database"] = db
                    tables = db.setdefault("tables", [])
                    for table in tables:
                        if table.get("table_name") == t_name:
                            cols = table.setdefault("columns", [])
                            exists = any(c.get("name") == f_name for c in cols)
                            if not exists:
                                cols.append({
                                    "name": f_name,
                                    "type": "text",
                                    "nullable": True,
                                    "primary_key": False,
                                    "foreign_key": None,
                                    "unique": False
                                })
                                
        # DB Foreign Key relations
        elif "DB inconsistency: Column" in err and "references non-existent" in err:
            if "table '" in err:
                t_name = err.split("table '")[1].split("'")[0]
                db = repaired.setdefault("database", {"tables": []}) or {"tables": []}
                if not isinstance(db, dict):
                    db = {"tables": []}
                    repaired["database"] = db
                tables = db.setdefault("tables", [])
                exists = any(t.get("table_name") == t_name for t in tables)
                if not exists:
                    tables.append({
                        "table_name": t_name,
                        "columns": [
                            {"name": "id", "type": "integer", "nullable": False, "primary_key": True, "unique": True}
                        ]
                    })
                    
    return repaired
