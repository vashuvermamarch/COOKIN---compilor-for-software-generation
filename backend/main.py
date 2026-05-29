import os
import sys
import uvicorn
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Body
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add workspace directory to PATH to enable relative imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend import config
from backend.agents.intent_agent import run_intent_agent
from backend.agents.architecture_agent import run_architecture_agent
from backend.agents.db_agent import run_db_agent
from backend.agents.api_agent import run_api_agent
from backend.agents.ui_agent import run_ui_agent

from backend.validators.schema_validator import (
    validate_intent_schema,
    validate_system_design_schema,
    validate_database_schema,
    validate_api_schema,
    validate_ui_schema
)
from backend.validators.consistency_validator import run_consistency_checks
from backend.repair.repair_engine import repair_config
from backend.runtime.runtime_builder import build_runtime_config
import json

CONFIG_FILE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "last_compiled_config.json")
active_compiled_config = None
if os.path.exists(CONFIG_FILE_PATH):
    try:
        with open(CONFIG_FILE_PATH, "r", encoding="utf-8") as f:
            active_compiled_config = json.load(f)
    except Exception as e:
        print(f"[Warning] Failed to load last compiled config: {e}")

app = FastAPI(
    title="AI Software Compiler API",
    description="Deterministic, multi-stage compiler pipeline for software application generation."
)

# Enable CORS for local testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Disable browser caching of assets during development
@app.middleware("http")
async def add_no_cache_headers(request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

# Input data schemas for API requests
class CompileRequest(BaseModel):
    prompt: str
    groq_api_key: Optional[str] = None
    mock_mode: Optional[str] = None # "true", "false", "auto"

class RepairRequest(BaseModel):
    broken_config: Dict[str, Any]
    errors: List[str]
    prompt: str

class SettingsRequest(BaseModel):
    groq_api_key: str
    mock_mode: str

@app.post("/api/settings")
def update_settings(settings: SettingsRequest):
    """
    Updates the active configuration dynamically.
    """
    config.GROQ_API_KEY = settings.groq_api_key
    config.MOCK_MODE = settings.mock_mode
    return {
        "status": "success",
        "groq_api_key_configured": len(config.GROQ_API_KEY.strip()) > 0,
        "mock_mode": config.MOCK_MODE,
        "active_mode_is_mock": config.is_mock_mode()
    }

@app.get("/api/settings")
def get_settings():
    """
    Retrieves the current configurations.
    """
    return {
        "groq_api_key_configured": len(config.GROQ_API_KEY.strip()) > 0,
        "mock_mode": config.MOCK_MODE,
        "active_mode_is_mock": config.is_mock_mode()
    }

@app.post("/api/compile")
def compile_app(req: CompileRequest):
    """
    Executes the multi-stage compiler pipeline from prompt to verified runtime configuration.
    """
    # Override settings if provided in request
    if req.groq_api_key is not None:
        config.GROQ_API_KEY = req.groq_api_key
    if req.mock_mode is not None:
        config.MOCK_MODE = req.mock_mode

    prompt = req.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="User prompt cannot be empty.")

    trace = {}
    
    # --- STAGE 1: Intent Extraction ---
    intent_data = run_intent_agent(prompt)
    is_valid, errs = validate_intent_schema(intent_data)
    repairs = []
    if not is_valid:
        intent_data = repair_config(intent_data, errs, prompt)
        is_valid, errs = validate_intent_schema(intent_data)
        repairs.append("Intent JSON schema repaired.")
        
    trace["stage_1_intent"] = {
        "output": intent_data,
        "valid": is_valid,
        "errors": errs,
        "repairs": repairs
    }
    
    # --- STAGE 2: System Architecture Design ---
    design_data = run_architecture_agent(prompt, intent_data)
    is_valid, errs = validate_system_design_schema(design_data)
    repairs = []
    if not is_valid:
        design_data = repair_config(design_data, errs, prompt)
        is_valid, errs = validate_system_design_schema(design_data)
        repairs.append("System Design JSON schema repaired.")
        
    trace["stage_2_system_design"] = {
        "output": design_data,
        "valid": is_valid,
        "errors": errs,
        "repairs": repairs
    }
    
    # --- STAGE 3: Database Schema Generation ---
    db_data = run_db_agent(prompt, design_data)
    is_valid, errs = validate_database_schema(db_data)
    repairs = []
    if not is_valid:
        db_data = repair_config(db_data, errs, prompt)
        is_valid, errs = validate_database_schema(db_data)
        repairs.append("Database JSON schema repaired.")
        
    trace["stage_3_database"] = {
        "output": db_data,
        "valid": is_valid,
        "errors": errs,
        "repairs": repairs
    }
    
    # --- STAGE 4: API Generation ---
    api_data = run_api_agent(prompt, db_data, design_data)
    is_valid, errs = validate_api_schema(api_data)
    repairs = []
    if not is_valid:
        api_data = repair_config(api_data, errs, prompt)
        is_valid, errs = validate_api_schema(api_data)
        repairs.append("API JSON schema repaired.")
        
    trace["stage_4_api"] = {
        "output": api_data,
        "valid": is_valid,
        "errors": errs,
        "repairs": repairs
    }
    
    # --- STAGE 5: UI Generation ---
    ui_data = run_ui_agent(prompt, api_data, db_data)
    is_valid, errs = validate_ui_schema(ui_data)
    repairs = []
    if not is_valid:
        ui_data = repair_config(ui_data, errs, prompt)
        is_valid, errs = validate_ui_schema(ui_data)
        repairs.append("UI JSON schema repaired.")
        
    trace["stage_5_ui"] = {
        "output": ui_data,
        "valid": is_valid,
        "errors": errs,
        "repairs": repairs
    }
    
    # --- STAGE 6: Consistency Verification ---
    full_config = {
        "intent": intent_data,
        "system_design": design_data,
        "database": db_data,
        "api": api_data,
        "ui": ui_data
    }
    
    consistency_errors = run_consistency_checks(full_config)
    consistency_repairs = []
    
    if consistency_errors:
        repaired_config = repair_config(full_config, consistency_errors, prompt)
        consistency_errors = run_consistency_checks(repaired_config)
        
        intent_data = repaired_config.get("intent", intent_data)
        design_data = repaired_config.get("system_design", design_data)
        db_data = repaired_config.get("database", db_data)
        api_data = repaired_config.get("api", api_data)
        ui_data = repaired_config.get("ui", ui_data)
        
        consistency_repairs.append("Cross-layer consistency constraints verified and patched.")
        
    trace["stage_6_consistency"] = {
        "valid": len(consistency_errors) == 0,
        "errors": consistency_errors,
        "repairs": consistency_repairs
    }
    
    validated_config = {
        "intent": intent_data,
        "system_design": design_data,
        "database": db_data,
        "api": api_data,
        "ui": ui_data
    }
    
    # --- STAGE 8: Runtime Builder ---
    runtime_data = build_runtime_config(validated_config, prompt)
    
    # Attach runtime data to the final config so the frontend can receive it!
    validated_config["runtime"] = runtime_data.get("runtime", {})
    
    trace["stage_8_runtime"] = {
        "output": runtime_data,
        "valid": True,
        "errors": []
    }
    
    app_name = intent_data.get("app_name", "AI Compiled Application")
    
    global active_compiled_config
    active_compiled_config = {
        "app_name": app_name,
        "compilation_success": len(consistency_errors) == 0,
        "trace": trace,
        "final_config": {
            "app_name": app_name,
            **validated_config,
            **runtime_data
        }
    }
    
    try:
        with open(CONFIG_FILE_PATH, "w", encoding="utf-8") as f:
            json.dump(active_compiled_config, f, indent=2)
    except Exception as e:
        print(f"[Warning] Failed to save active config: {e}")
        
    return active_compiled_config

@app.get("/api/compile")
def get_last_compile():
    """
    Returns the last successfully compiled application layout/configuration.
    """
    if active_compiled_config is None:
        return {}
    return active_compiled_config

@app.post("/api/validate")
def validate_configuration(full_config: Dict[str, Any] = Body(...)):
    """
    Validates a completed configuration layout against all structural and logical rules.
    """
    errors = []
    
    if "intent" in full_config:
        _, sub_errs = validate_intent_schema(full_config["intent"])
        errors.extend(sub_errs)
    if "system_design" in full_config:
        _, sub_errs = validate_system_design_schema(full_config["system_design"])
        errors.extend(sub_errs)
    if "database" in full_config:
        _, sub_errs = validate_database_schema(full_config["database"])
        errors.extend(sub_errs)
    if "api" in full_config:
        _, sub_errs = validate_api_schema(full_config["api"])
        errors.extend(sub_errs)
    if "ui" in full_config:
        _, sub_errs = validate_ui_schema(full_config["ui"])
        errors.extend(sub_errs)
        
    semantic_errs = run_consistency_checks(full_config)
    errors.extend(semantic_errs)
    
    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "repair_required": len(errors) > 0
    }

@app.post("/api/repair")
def repair_configuration(req: RepairRequest):
    """
    Invokes Stage 7 Repair Engine to fix failing configuration blocks.
    """
    repaired = repair_config(req.broken_config, req.errors, req.prompt)
    return {
        "repaired_config": repaired
    }

@app.get("/api/execute/{table_name}")
def get_database_records(table_name: str):
    """
    Fetches records dynamically from the compiled SQLite database.
    """
    import sqlite3
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "compiled_app.db")
    if not os.path.exists(db_path):
        if active_compiled_config and "final_config" in active_compiled_config:
            try:
                from backend.runtime.runtime_builder import generate_physical_database
                generate_physical_database(active_compiled_config["final_config"])
            except Exception as e:
                print(f"[Warning] Failed to auto-generate missing database on GET: {e}")
                
    if not os.path.exists(db_path):
        return []
        
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    try:
        cursor.execute(f"SELECT * FROM \"{table_name}\" ORDER BY id DESC;")
        rows = cursor.fetchall()
        result = [dict(row) for row in rows]
        return result
    except Exception as e:
        print(f"[Warning] Failed to fetch from {table_name}: {e}")
        return []
    finally:
        conn.close()

@app.post("/api/execute/{table_name}")
def insert_database_record(table_name: str, record: Dict[str, Any] = Body(...)):
    """
    Inserts a record dynamically into the compiled SQLite database.
    """
    import sqlite3
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "compiled_app.db")
    if not os.path.exists(db_path):
        if active_compiled_config and "final_config" in active_compiled_config:
            try:
                from backend.runtime.runtime_builder import generate_physical_database
                generate_physical_database(active_compiled_config["final_config"])
            except Exception as e:
                print(f"[Warning] Failed to auto-generate missing database on POST: {e}")
                
    if not os.path.exists(db_path):
        raise HTTPException(status_code=400, detail="Database file compiled_app.db not found.")
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    if "id" in record and (record["id"] is None or isinstance(record["id"], str) and record["id"].strip() == ""):
        del record["id"]
        
    # --- Self-Heal Missing Required NOT NULL Columns ---
    try:
        cursor.execute(f"PRAGMA table_info(\"{table_name}\");")
        table_info = cursor.fetchall()
        cursor.execute(f"PRAGMA foreign_key_list(\"{table_name}\");")
        fkeys = cursor.fetchall()
        
        fk_map = {}
        for fk in fkeys:
            # fk[3] is the local column name, fk[2] is referenced table, fk[4] is referenced column
            fk_map[fk[3]] = (fk[2], fk[4])
            
        for col in table_info:
            col_name = col[1]
            col_type = col[2].upper()
            not_null = col[3] == 1
            has_default = col[4] is not None
            is_pk = col[5] == 1
            
            if col_name not in record and not is_pk and not_null and not has_default:
                if col_name in fk_map:
                    ref_table, ref_col = fk_map[col_name]
                    try:
                        # Grab the first available ID/record in the referenced table to satisfy foreign key constraint
                        cursor.execute(f"SELECT \"{ref_col}\" FROM \"{ref_table}\" LIMIT 1;")
                        ref_row = cursor.fetchone()
                        if ref_row:
                            record[col_name] = ref_row[0]
                        else:
                            record[col_name] = 1 # Fallback ID
                    except Exception:
                        record[col_name] = 1
                else:
                    if "INT" in col_type or col_type == "NUMBER":
                        record[col_name] = 1
                    else:
                        record[col_name] = "Default Value"
    except Exception as e:
        print(f"[Warning] Failed to self-heal missing columns: {e}")
        
    cols = list(record.keys())
    vals = list(record.values())
    
    if not cols:
        conn.close()
        return {"status": "success", "record": {}}
        
    cols_str = ", ".join([f"\"{c}\"" for c in cols])
    placeholders = ", ".join(["?" for _ in cols])
    
    insert_sql = f"INSERT INTO \"{table_name}\" ({cols_str}) VALUES ({placeholders});"
    
    try:
        cursor.execute(insert_sql, vals)
        conn.commit()
        inserted_id = cursor.lastrowid
        record["id"] = inserted_id
        return {"status": "success", "record": record}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Database Insertion Error: {str(e)}")
    finally:
        conn.close()

# Mount static UI assets from the built distribution directory within the container
frontend_dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend_dist"))
if os.path.isdir(frontend_dist_dir):
    app.mount("/", StaticFiles(directory=frontend_dist_dir, html=True), name="frontend")
else:
    print("[Warning] Frontend distribution not found; static files not mounted.")

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8080, reload=True)
