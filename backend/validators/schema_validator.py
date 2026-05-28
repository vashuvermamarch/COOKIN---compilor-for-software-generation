from typing import Dict, Any, Tuple
from pydantic import ValidationError
from backend.schemas.app_schema import (
    IntentSchema,
    SystemDesignSchema,
    DatabaseSchema,
    ApiSchema,
    UiSchema,
    RuntimeSchema
)

def validate_intent_schema(data: Dict[str, Any]) -> Tuple[bool, list]:
    try:
        IntentSchema.model_validate(data)
        return True, []
    except ValidationError as e:
        return False, [f"Intent Schema Error: {err['loc']}: {err['msg']}" for err in e.errors()]

def validate_system_design_schema(data: Dict[str, Any]) -> Tuple[bool, list]:
    try:
        SystemDesignSchema.model_validate(data)
        return True, []
    except ValidationError as e:
        return False, [f"System Design Schema Error: {err['loc']}: {err['msg']}" for err in e.errors()]

def validate_database_schema(data: Dict[str, Any]) -> Tuple[bool, list]:
    try:
        DatabaseSchema.model_validate(data)
        return True, []
    except ValidationError as e:
        return False, [f"Database Schema Error: {err['loc']}: {err['msg']}" for err in e.errors()]

def validate_api_schema(data: Dict[str, Any]) -> Tuple[bool, list]:
    try:
        ApiSchema.model_validate(data)
        return True, []
    except ValidationError as e:
        return False, [f"API Schema Error: {err['loc']}: {err['msg']}" for err in e.errors()]

def validate_ui_schema(data: Dict[str, Any]) -> Tuple[bool, list]:
    try:
        UiSchema.model_validate(data)
        return True, []
    except ValidationError as e:
        return False, [f"UI Schema Error: {err['loc']}: {err['msg']}" for err in e.errors()]

def validate_runtime_schema(data: Dict[str, Any]) -> Tuple[bool, list]:
    try:
        RuntimeSchema.model_validate(data)
        return True, []
    except ValidationError as e:
        return False, [f"Runtime Schema Error: {err['loc']}: {err['msg']}" for err in e.errors()]
