from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

# Stage 1 — Intent Extraction Schema
class IntentSchema(BaseModel):
    app_name: str
    app_type: str
    entities: List[str] = Field(default_factory=list)
    features: List[str] = Field(default_factory=list)
    roles: List[str] = Field(default_factory=list)
    permissions: List[str] = Field(default_factory=list)
    pages: List[str] = Field(default_factory=list)
    workflows: List[str] = Field(default_factory=list)
    business_rules: List[str] = Field(default_factory=list)
    integrations: List[str] = Field(default_factory=list)
    assumptions: List[str] = Field(default_factory=list)

# Stage 2 — System Architecture Schema
class DatabaseDesign(BaseModel):
    tables: List[str] = Field(default_factory=list)

class ApiDesign(BaseModel):
    endpoints: List[str] = Field(default_factory=list)

class UiDesign(BaseModel):
    pages: List[str] = Field(default_factory=list)

class AuthDesign(BaseModel):
    roles: List[str] = Field(default_factory=list)
    permissions: List[str] = Field(default_factory=list)

class SystemDesignSchema(BaseModel):
    database_design: DatabaseDesign
    api_design: ApiDesign
    ui_design: UiDesign
    auth_design: AuthDesign
    application_flows: List[str] = Field(default_factory=list)

# Stage 3 — Database Schema
class ColumnSchema(BaseModel):
    name: str
    type: str  # text, integer, boolean, datetime, etc.
    nullable: bool = False
    primary_key: bool = False
    foreign_key: Optional[str] = None  # Format: "table.column" or None
    unique: bool = False

class TableSchema(BaseModel):
    table_name: str
    columns: List[ColumnSchema] = Field(default_factory=list)

class DatabaseSchema(BaseModel):
    tables: List[TableSchema] = Field(default_factory=list)

# Stage 4 — API Generation Schema
class ApiEndpointSchema(BaseModel):
    path: str
    method: str  # GET, POST, PUT, DELETE, PATCH
    request_schema: Dict[str, Any] = Field(default_factory=dict)
    response_schema: Dict[str, Any] = Field(default_factory=dict)
    auth_required: bool = True
    roles_allowed: List[str] = Field(default_factory=list)

class ApiSchema(BaseModel):
    apis: List[ApiEndpointSchema] = Field(default_factory=list)

# Stage 5 — UI Schema
class ComponentSchema(BaseModel):
    type: str  # form, table, card, chart, navbar, sidebar, modal, input, button
    id: str
    title: Optional[str] = None
    props: Dict[str, Any] = Field(default_factory=dict)
    children: Optional[List["ComponentSchema"]] = None

class PageSchema(BaseModel):
    name: str
    route: str
    components: List[ComponentSchema] = Field(default_factory=list)

class UiSchema(BaseModel):
    pages: List[PageSchema] = Field(default_factory=list)

# Resolve nested forward references for ComponentSchema
ComponentSchema.model_rebuild()

# Stage 6 — Validation Report Schema
class ValidationReport(BaseModel):
    valid: bool
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    repair_required: bool = False

# Stage 8 — Runtime Configuration Schema
class RouteSchema(BaseModel):
    path: str
    page_name: str

class BindingSchema(BaseModel):
    component_id: str
    api_path: str
    method: str
    event: str  # onLoad, onSubmit, onClick
    state_key: str  # State key to read or update

class RuntimeConfig(BaseModel):
    routes: List[RouteSchema] = Field(default_factory=list)
    components: List[ComponentSchema] = Field(default_factory=list)
    bindings: List[BindingSchema] = Field(default_factory=list)
    state: Dict[str, Any] = Field(default_factory=dict)

class RuntimeSchema(BaseModel):
    runtime: RuntimeConfig

# Full compiled application configuration
class FullAppConfig(BaseModel):
    app_name: str
    intent: Optional[IntentSchema] = None
    system_design: Optional[SystemDesignSchema] = None
    database: Optional[DatabaseSchema] = None
    api: Optional[ApiSchema] = None
    ui: Optional[UiSchema] = None
    runtime: Optional[RuntimeSchema] = None
