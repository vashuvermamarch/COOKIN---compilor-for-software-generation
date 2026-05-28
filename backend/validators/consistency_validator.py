import re
from typing import Dict, Any, List

def run_consistency_checks(full_config: Dict[str, Any]) -> List[str]:
    """
    Checks semantic relationships between configurations:
    1. Database relations (foreign key columns exist)
    2. API-to-Database mapping (roles, paths)
    3. UI-to-API validation (form submissions, table endpoints, columns mapping)
    """
    errors = []
    
    intent = full_config.get("intent", {}) or {}
    system_design = full_config.get("system_design", {}) or {}
    database = full_config.get("database", {}) or {}
    api = full_config.get("api", {}) or {}
    ui = full_config.get("ui", {}) or {}
    
    # 1. Build role index
    valid_roles = set()
    if intent and isinstance(intent, dict):
        roles_list = intent.get("roles", []) or []
        if isinstance(roles_list, list):
            for r in roles_list:
                if isinstance(r, dict):
                    valid_roles.add(r.get("name") or r.get("role") or str(r))
                elif isinstance(r, str):
                    valid_roles.add(r)
    if system_design and isinstance(system_design, dict):
        auth_design = system_design.get("auth_design", {}) or {}
        if isinstance(auth_design, dict):
            roles_list = auth_design.get("roles", []) or []
            if isinstance(roles_list, list):
                for r in roles_list:
                    if isinstance(r, dict):
                        valid_roles.add(r.get("name") or r.get("role") or str(r))
                    elif isinstance(r, str):
                        valid_roles.add(r)
            
    # 2. Build DB Table and Column index
    db_tables = {}
    if database and isinstance(database, dict) and "tables" in database:
        tables_list = database.get("tables", []) or []
        if isinstance(tables_list, list):
            for table in tables_list:
                if isinstance(table, dict):
                    table_name = table.get("table_name")
                    cols_list = table.get("columns", []) or []
                    columns = {}
                    if isinstance(cols_list, list):
                        for col in cols_list:
                            if isinstance(col, dict):
                                name = col.get("name")
                                if name:
                                    columns[name] = col
                    if table_name:
                        db_tables[table_name] = columns
            
    # Validate DB Foreign Keys
    if database and "tables" in database:
        for table in (database.get("tables", []) or []):
            table_name = table.get("table_name")
            for col in (table.get("columns", []) or []):
                fk = col.get("foreign_key")
                if fk:
                    if "." not in fk:
                        errors.append(
                            f"DB inconsistency: Column '{table_name}.{col.get('name')}' foreign key '{fk}' is not in 'table.column' format."
                        )
                    else:
                        target_table, target_col = fk.split(".", 1)
                        if target_table not in db_tables:
                            errors.append(
                                f"DB inconsistency: Column '{table_name}.{col.get('name')}' references non-existent table '{target_table}'."
                            )
                        elif target_col not in db_tables[target_table]:
                            errors.append(
                                f"DB inconsistency: Column '{table_name}.{col.get('name')}' references non-existent column '{target_table}.{target_col}'."
                            )
                            
    # 3. Build API endpoint index
    api_endpoints = {}
    if api and "apis" in api:
        for endpoint in (api.get("apis", []) or []):
            path = endpoint.get("path")
            method = endpoint.get("method", "GET").upper()
            api_endpoints[(path, method)] = endpoint
            
    # Validate API-to-DB mapping & role assignments
    if api and "apis" in api:
        for endpoint in (api.get("apis", []) or []):
            path = endpoint.get("path", "")
            method = endpoint.get("method", "GET").upper()
            
            # Extract target table from path
            path_parts = [p for p in path.split("/") if p and p != "api"]
            if path_parts:
                possible_table = path_parts[0]
                possible_table = re.sub(r'\{.*?\}', '', possible_table).strip()
                # Check mapping if db_tables is not empty
                if db_tables and possible_table and possible_table not in db_tables:
                    errors.append(
                        f"API-DB warning: API Endpoint '{method} {path}' refers to path '{possible_table}' which has no matching table in database schema."
                    )
            
            # Validate roles
            for role in (endpoint.get("roles_allowed", []) or []):
                if valid_roles and role not in valid_roles:
                    errors.append(
                        f"API-Auth inconsistency: Endpoint '{method} {path}' allows undefined role '{role}'."
                    )
                    
    # 4. Check UI to API & Database consistency
    if ui and "pages" in ui:
        for page in (ui.get("pages", []) or []):
            page_name = page.get("name", "Unknown Page")
            
            def check_component(c):
                if not c:
                    return
                c_type = c.get("type")
                c_id = c.get("id")
                props = c.get("props", {}) or {}
                
                if c_type == "table":
                    api_endpoint = props.get("api_endpoint")
                    if api_endpoint:
                        if (api_endpoint, "GET") not in api_endpoints:
                            errors.append(
                                f"UI-API mismatch: Table component '{c_id}' on page '{page_name}' binds to non-existent API endpoint 'GET {api_endpoint}'."
                            )
                            
                elif c_type == "form":
                    api_endpoint = props.get("api_endpoint")
                    method = props.get("method", "POST").upper()
                    if api_endpoint:
                        if (api_endpoint, method) not in api_endpoints:
                            errors.append(
                                f"UI-API mismatch: Form component '{c_id}' on page '{page_name}' submits to non-existent API endpoint '{method} {api_endpoint}'."
                            )
                        else:
                            # Check form fields match DB columns of the target table
                            fields = props.get("fields", []) or []
                            path_parts = [p for p in api_endpoint.split("/") if p and p != "api"]
                            if path_parts:
                                target_table = path_parts[0]
                                if target_table in db_tables:
                                    cols = db_tables[target_table]
                                    for field in fields:
                                        f_name = field.get("name")
                                        if f_name not in cols and f_name != "id":
                                            errors.append(
                                                f"UI-DB mismatch: Form field '{f_name}' in form '{c_id}' does not exist in target database table '{target_table}'."
                                            )
                                            
                # Check children
                children = c.get("children", [])
                if children and isinstance(children, list):
                    for child in children:
                        check_component(child)
            
            for comp in (page.get("components", []) or []):
                check_component(comp)
                
    return errors
