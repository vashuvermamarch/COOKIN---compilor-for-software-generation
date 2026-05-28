import copy
import re
import os
import sqlite3
from typing import Dict, Any, List

def build_runtime_config(validated_config: Dict[str, Any], user_input: str) -> Dict[str, Any]:
    """
    Translates schema specifications (DB, API, UI) into a unified renderable runtime setup.
    Sets up client routes, layout elements, event bindings, and hydratable state.
    """
    runtime_config = {
        "routes": [],
        "components": [],
        "bindings": [],
        "state": {}
    }
    
    ui_schema = validated_config.get("ui", {}) or {}
    db_schema = validated_config.get("database", {}) or {}
    
    # 1. Generate Hydratable Seed Data from DB schemas
    tables_list = db_schema.get("tables", []) or []
    seed_states = {}
    for table in tables_list:
        name = table.get("table_name", "")
        seed_states[name] = get_seed_data_for_table(name)
        
    runtime_config["state"] = seed_states
    
    # 2. Extract Routes and Component Layouts
    pages_list = ui_schema.get("pages", []) or []
    for page in pages_list:
        page_name = page.get("name")
        page_route = page.get("route")
        
        runtime_config["routes"].append({
            "path": page_route,
            "page_name": page_name
        })
        
        for comp in page.get("components", []):
            comp_copy = copy.deepcopy(comp)
            # Tag components with their originating route
            comp_copy.setdefault("props", {})["_page_route"] = page_route
            runtime_config["components"].append(comp_copy)
            
            c_type = comp_copy.get("type")
            c_id = comp_copy.get("id")
            props = comp_copy.get("props", {}) or {}
            
            # Map database bindings automatically
            if c_type == "table":
                api_endpoint = props.get("api_endpoint")
                if api_endpoint:
                    state_key = extract_state_key(api_endpoint)
                    runtime_config["bindings"].append({
                        "component_id": c_id,
                        "api_path": api_endpoint,
                        "method": "GET",
                        "event": "onLoad",
                        "state_key": state_key
                    })
                    
            elif c_type == "form":
                api_endpoint = props.get("api_endpoint")
                method = props.get("method", "POST").upper()
                if api_endpoint:
                    state_key = extract_state_key(api_endpoint)
                    runtime_config["bindings"].append({
                        "component_id": c_id,
                        "api_path": api_endpoint,
                        "method": method,
                        "event": "onSubmit",
                        "state_key": state_key
                    })
                    
    try:
        generate_physical_database(validated_config)
    except Exception as e:
        print(f"[Warning] Failed to generate physical database: {e}")
        
    return {"runtime": runtime_config}

def generate_physical_database(validated_config: Dict[str, Any]):
    db_schema = validated_config.get("database", {}) or {}
    tables = db_schema.get("tables", []) or []
    if not tables:
        return
        
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "compiled_app.db")
    sql_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "compiled_app_schema.sql")
    
    # Remove existing db file if exists to start fresh
    if os.path.exists(db_path):
        try:
            os.remove(db_path)
        except Exception:
            pass
            
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    ddl_statements = []
    
    # Enable foreign keys in SQLite
    cursor.execute("PRAGMA foreign_keys = ON;")
    
    for table in tables:
        table_name = table.get("table_name")
        columns_sql = []
        for col in table.get("columns", []):
            col_name = col.get("name")
            col_type = col.get("type", "TEXT").upper()
            if "INT" in col_type or col_type == "NUMBER":
                sqlite_type = "INTEGER"
            elif "BOOL" in col_type:
                sqlite_type = "INTEGER"
            else:
                sqlite_type = "TEXT"
                
            col_def = f"\"{col_name}\" {sqlite_type}"
            if col.get("primary_key"):
                col_def += " PRIMARY KEY"
            if not col.get("nullable", True):
                col_def += " NOT NULL"
            if col.get("unique"):
                col_def += " UNIQUE"
            columns_sql.append(col_def)
            
        for col in table.get("columns", []):
            fk = col.get("foreign_key")
            if fk:
                parts = fk.split(".", 1)
                if len(parts) == 2:
                    target_table, target_col = parts[0], parts[1]
                    columns_sql.append(f"FOREIGN KEY (\"{col.get('name')}\") REFERENCES \"{target_table}\"(\"{target_col}\")")
                    
        create_sql = f"CREATE TABLE IF NOT EXISTS \"{table_name}\" (\n  " + ",\n  ".join(columns_sql) + "\n);"
        ddl_statements.append(create_sql)
        
        try:
            cursor.execute(create_sql)
        except Exception as e:
            print(f"[Warning] Failed to execute DDL for table {table_name}: {e}")
            
        # Seed data
        seeds = get_seed_data_for_table(table_name)
        for row in seeds:
            valid_cols = [c.get("name") for c in table.get("columns", [])]
            row_data = {k: v for k, v in row.items() if k in valid_cols}
            
            if not row_data:
                continue
                
            cols_placeholder = ", ".join([f"\"{k}\"" for k in row_data.keys()])
            vals_placeholder = ", ".join(["?" for _ in row_data.values()])
            insert_sql = f"INSERT OR IGNORE INTO \"{table_name}\" ({cols_placeholder}) VALUES ({vals_placeholder});"
            try:
                cursor.execute(insert_sql, list(row_data.values()))
            except Exception as e:
                print(f"[Warning] Failed to insert seed into {table_name}: {e}")
                
    conn.commit()
    conn.close()
    
    # Save SQL schema script file
    with open(sql_path, "w", encoding="utf-8") as f:
        f.write("-- compiled_app_schema.sql\n")
        f.write("-- AI Generated database script\n\n")
        f.write("PRAGMA foreign_keys = ON;\n\n")
        f.write("\n\n".join(ddl_statements) + "\n")

def extract_state_key(api_path: str) -> str:
    """
    Extracts the root entity identifier from the API path.
    e.g. /api/products -> products
    """
    parts = [p for p in api_path.split("/") if p and p != "api"]
    if parts:
        return re.sub(r'\{.*?\}', '', parts[0]).strip()
    return "app_state"

def get_seed_data_for_table(table_name: str) -> List[Dict[str, Any]]:
    """
    Supplies realistic mock structures matching table names to hydrate UI previews.
    """
    name_lower = table_name.lower()
    
    if "user" in name_lower:
        return [
            {"id": 1, "email": "admin@compiler.ai", "name": "Admin Supervisor", "role": "Admin"},
            {"id": 2, "email": "developer@compiler.ai", "name": "Lead Engineer", "role": "Member"}
        ]
    elif "task" in name_lower:
        return [
            {"id": 1, "title": "Configure project dependencies", "status": "Done", "priority": "High", "project_id": 1},
            {"id": 2, "title": "Write semantic compilation validators", "status": "In Progress", "priority": "High", "project_id": 1},
            {"id": 3, "title": "Implement visual rendering engine", "status": "Todo", "priority": "Medium", "project_id": 1}
        ]
    elif "project" in name_lower:
        return [
            {"id": 1, "title": "Compiler System Core", "owner_id": 1},
            {"id": 2, "title": "Visual Dashboard Frontend", "owner_id": 2}
        ]
    elif "product" in name_lower:
        return [
            {"id": 101, "title": "Precision Gaming Mouse", "price": 49, "stock_count": 85},
            {"id": 102, "title": "RGB Mechanical Keyboard", "price": 119, "stock_count": 22},
            {"id": 103, "title": "Ultra-wide Curved Monitor", "price": 349, "stock_count": 8}
        ]
    elif "order" in name_lower:
        return [
            {"id": 1, "user_id": 1, "total_price": 168, "status": "Delivered"}
        ]
    elif "lead" in name_lower:
        return [
            {"id": 1, "company": "Stark Industries", "status": "New Lead", "owner_id": 1},
            {"id": 2, "company": "Wayne Enterprises", "status": "Contacted", "owner_id": 2},
            {"id": 3, "company": "Oscorp Corp", "status": "Qualified", "owner_id": 1}
        ]
    elif "deal" in name_lower:
        return [
            {"id": 1, "title": "Enterprise License Agreement", "value": 50000, "stage": "Proposal", "lead_id": 1}
        ]
        
    return [
        {"id": 1, "name": "Item A", "details": "Initial seed element A"},
        {"id": 2, "name": "Item B", "details": "Initial seed element B"}
    ]
