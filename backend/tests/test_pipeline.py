import unittest
import sys
import os

# Adjust path to import local modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.validators.schema_validator import (
    validate_intent_schema,
    validate_database_schema
)
from backend.validators.consistency_validator import run_consistency_checks
from backend.repair.repair_engine import run_heuristic_repair
from backend.runtime.runtime_builder import build_runtime_config

class TestCompilerPipeline(unittest.TestCase):
    
    def test_schema_validator_correct(self):
        # Valid Stage 1 Intent schema
        valid_intent = {
            "app_name": "Task Planner",
            "app_type": "Project Management",
            "entities": ["projects", "tasks"],
            "features": ["create tasks"],
            "roles": ["admin"],
            "permissions": ["all"],
            "pages": ["dashboard"],
            "workflows": [],
            "business_rules": [],
            "integrations": [],
            "assumptions": []
        }
        valid, errs = validate_intent_schema(valid_intent)
        self.assertTrue(valid)
        self.assertEqual(len(errs), 0)
        
    def test_schema_validator_malformed(self):
        # Malformed Stage 1 Intent schema (missing field 'app_name')
        invalid_intent = {
            "app_type": "Project Management",
            "entities": ["projects"],
            "features": ["create tasks"]
        }
        valid, errs = validate_intent_schema(invalid_intent)
        self.assertFalse(valid)
        self.assertTrue(any("Field required" in err or "missing" in err.lower() for err in errs))

    def test_consistency_validator_valid(self):
        # A fully consistent config block
        consistent_config = {
            "intent": {
                "app_name": "Task Tracker",
                "app_type": "Task Management",
                "roles": ["Owner", "Member"]
            },
            "database": {
                "tables": [
                    {
                        "table_name": "tasks",
                        "columns": [
                            {"name": "id", "type": "integer", "primary_key": True},
                            {"name": "title", "type": "text", "primary_key": False}
                        ]
                    }
                ]
            },
            "api": {
                "apis": [
                    {
                        "path": "/api/tasks",
                        "method": "GET",
                        "roles_allowed": ["Owner"]
                    }
                ]
            },
            "ui": {
                "pages": [
                    {
                        "name": "Dashboard Page",
                        "route": "/dashboard",
                        "components": [
                            {
                                "type": "table",
                                "id": "tasks_list",
                                "props": {"api_endpoint": "/api/tasks"}
                            }
                        ]
                    }
                ]
            }
        }
        errs = run_consistency_checks(consistent_config)
        self.assertEqual(len(errs), 0)

    def test_consistency_validator_invalid(self):
        # Inconsistent configuration where UI table maps to a non-existent API
        inconsistent_config = {
            "intent": {"roles": ["Admin"]},
            "database": {"tables": []},
            "api": {"apis": []},
            "ui": {
                "pages": [
                    {
                        "name": "Dashboard Page",
                        "route": "/dashboard",
                        "components": [
                            {
                                "type": "table",
                                "id": "tasks_list",
                                "props": {"api_endpoint": "/api/tasks"} # Endpoint doesn't exist in 'api'
                            }
                        ]
                    }
                ]
            }
        }
        errs = run_consistency_checks(inconsistent_config)
        self.assertTrue(len(errs) > 0)
        self.assertTrue(any("UI-API mismatch" in err for err in errs))

    def test_heuristic_repair_api_mismatch(self):
        # Configuration with UI table mapping to a non-existent API endpoint
        broken_config = {
            "api": {"apis": []},
            "ui": {
                "pages": [
                    {
                        "name": "Dashboard Page",
                        "route": "/dashboard",
                        "components": [
                            {
                                "type": "table",
                                "id": "tasks_list",
                                "props": {"api_endpoint": "/api/tasks"}
                            }
                        ]
                    }
                ]
            }
        }
        
        errors = ["UI-API mismatch: Table component 'tasks_list' binds to non-existent API endpoint 'GET /api/tasks'."]
        repaired = run_heuristic_repair(broken_config, errors)
        
        # Verify the endpoint GET /api/tasks is auto-created in repaired api schema
        apis = repaired.get("api", {}).get("apis", [])
        self.assertEqual(len(apis), 1)
        self.assertEqual(apis[0]["path"], "/api/tasks")
        self.assertEqual(apis[0]["method"], "GET")

    def test_runtime_builder_bindings(self):
        # Complete validated schema
        validated_schema = {
            "database": {
                "tables": [
                    {
                        "table_name": "projects",
                        "columns": [{"name": "id", "type": "integer", "primary_key": True}]
                    }
                ]
            },
            "ui": {
                "pages": [
                    {
                        "name": "Projects",
                        "route": "/projects",
                        "components": [
                            {
                                "type": "table",
                                "id": "project_grid",
                                "props": {"api_endpoint": "/api/projects"}
                            }
                        ]
                    }
                ]
            }
        }
        
        runtime_pkg = build_runtime_config(validated_schema, "build projects list")
        runtime = runtime_pkg.get("runtime", {})
        
        # Verify routes, bindings, and states exist
        self.assertEqual(len(runtime.get("routes", [])), 1)
        self.assertEqual(runtime["routes"][0]["path"], "/projects")
        self.assertEqual(len(runtime.get("bindings", [])), 1)
        self.assertEqual(runtime["bindings"][0]["component_id"], "project_grid")
        self.assertEqual(runtime["bindings"][0]["api_path"], "/api/projects")
        self.assertTrue("projects" in runtime.get("state", {}))
        
if __name__ == "__main__":
    unittest.main()
