import re
from typing import Dict, Any

def extract_keywords(user_input: str) -> str:
    input_lower = user_input.lower()
    if any(k in input_lower for k in ["shop", "store", "product", "e-commerce", "cart", "order"]):
        return "ecommerce"
    if any(k in input_lower for k in ["crm", "lead", "sales", "deal", "pipeline", "customer"]):
        return "crm"
    if any(k in input_lower for k in ["lms", "course", "education", "student", "learning"]):
        return "lms"
    if "calculator" in input_lower or "math" in input_lower:
        return "calculator"
    # Default to task manager
    return "taskmanager"

def generate_mock_stage(stage: int, user_input: str, previous_stages_data: Dict[str, Any] = None) -> Dict[str, Any]:
    app_type = extract_keywords(user_input)
    
    # Extract app name if possible, else default
    app_name_match = re.search(r'(?:create|build|make)\s+(?:a|an)?\s*([\w\s\-]+?)(?:\s+app|\s+website|\s+system|\.|$)', user_input, re.IGNORECASE)
    app_name = app_name_match.group(1).strip().title() if app_name_match else "Custom App Builder"
    if not app_name:
        app_name = "Task Tracker Pro" if app_type == "taskmanager" else ("SaaS CRM Suite" if app_type == "crm" else ("LMS Portal" if app_type == "lms" else ("Smart Calculator" if app_type == "calculator" else "E-Shop Digital")))

    if stage == 1: # Intent Extraction
        if app_type == "ecommerce":
            return {
                "app_name": app_name,
                "app_type": "E-Commerce Platform",
                "entities": ["Product", "Category", "Order", "OrderItem", "User"],
                "features": ["Browse Products", "Shopping Cart", "Checkout API", "Order Tracking", "Product Management"],
                "roles": ["Customer", "Merchant", "Admin"],
                "permissions": ["browse_products", "manage_cart", "place_orders", "manage_inventory", "manage_users"],
                "pages": ["Home / Products", "Product Details", "Shopping Cart", "Order History", "Merchant Dashboard"],
                "workflows": ["Order placement pipeline", "Inventory reconciliation", "Refund handling"],
                "business_rules": ["Orders above $50 get free shipping", "Only admins can modify user roles"],
                "integrations": ["Stripe Payment Gateway", "FedEx Shipping API"],
                "assumptions": ["Guest checkout is disabled; user authentication is required", "Stock counts are updated post-checkout"]
            }
        elif app_type == "crm":
            return {
                "app_name": app_name,
                "app_type": "Customer Relationship Management",
                "entities": ["Lead", "Contact", "Deal", "Activity", "User"],
                "features": ["Lead Scoring", "Pipeline Stage Tracker", "Meeting Logs", "Deal Forecasting", "Analytics Insights"],
                "roles": ["Sales Agent", "Sales Manager", "Admin"],
                "permissions": ["view_leads", "edit_leads", "manage_deals", "view_reports", "configure_crm"],
                "pages": ["Leads Dashboard", "Deals Board", "Contact Directory", "Activities Logger", "Settings Panel"],
                "workflows": ["Lead assignment automation", "Deal stage transition rules"],
                "business_rules": ["Deals value cannot be negative", "Leads idle for 30 days are automatically reassigned"],
                "integrations": ["HubSpot API Sync", "Google Calendar Sync"],
                "assumptions": ["All contacts must be associated with a Lead or Deal", "Base currency is USD"]
            }
        else: # taskmanager
            return {
                "app_name": app_name,
                "app_type": "Project Task Manager",
                "entities": ["Project", "Task", "Comment", "User"],
                "features": ["Task Board", "Project Templates", "Due Date Reminders", "Activity Log", "Priority Tags"],
                "roles": ["Viewer", "Member", "Owner"],
                "permissions": ["view_tasks", "create_tasks", "update_tasks", "delete_tasks", "manage_members"],
                "pages": ["Projects Dashboard", "Task Details Overview", "Team Calendar", "Activity feed"],
                "workflows": ["Status progression (Todo -> In Progress -> Done)", "Notification email trigger"],
                "business_rules": ["Subtasks must be completed before main task is closed", "Only members can edit tasks"],
                "integrations": ["Slack Webhook Alerts", "GitHub Issue Sync"],
                "assumptions": ["Default project created for every new user", "Tasks must belong to a project"]
            }

    elif stage == 2: # System Design
        if app_type == "ecommerce":
            return {
                "database_design": {
                    "tables": ["users", "products", "categories", "orders", "order_items"]
                },
                "api_design": {
                    "endpoints": [
                        "GET /api/products", "GET /api/products/{id}",
                        "POST /api/cart/checkout",
                        "GET /api/orders", "GET /api/orders/{id}"
                    ]
                },
                "ui_design": {
                    "pages": ["products", "product-detail", "cart", "orders", "dashboard"]
                },
                "auth_design": {
                    "roles": ["Customer", "Merchant", "Admin"],
                    "permissions": ["browse_products", "place_orders", "manage_inventory", "manage_users"]
                },
                "application_flows": [
                    "User adds item to cart -> Proceeds to checkout -> Invokes checkout API -> Creates order records -> Decrements product stock"
                ]
            }
        elif app_type == "crm":
            return {
                "database_design": {
                    "tables": ["users", "leads", "contacts", "deals", "activities"]
                },
                "api_design": {
                    "endpoints": [
                        "GET /api/leads", "POST /api/leads", "PUT /api/leads/{id}",
                        "GET /api/deals", "POST /api/deals",
                        "GET /api/activities", "POST /api/activities"
                    ]
                },
                "ui_design": {
                    "pages": ["leads", "deals", "contacts", "activities"]
                },
                "auth_design": {
                    "roles": ["Sales Agent", "Sales Manager", "Admin"],
                    "permissions": ["view_leads", "edit_leads", "manage_deals", "view_reports"]
                },
                "application_flows": [
                    "Agent captures lead info -> Creates lead endpoint -> Triggers deal assignment workflow -> Moves deal through pipeline pipeline stages"
                ]
            }
        else: # taskmanager
            return {
                "database_design": {
                    "tables": ["users", "projects", "tasks", "comments"]
                },
                "api_design": {
                    "endpoints": [
                        "GET /api/projects", "POST /api/projects",
                        "GET /api/tasks", "POST /api/tasks", "PUT /api/tasks/{id}", "DELETE /api/tasks/{id}",
                        "GET /api/comments", "POST /api/comments"
                    ]
                },
                "ui_design": {
                    "pages": ["dashboard", "project-view", "task-detail"]
                },
                "auth_design": {
                    "roles": ["Viewer", "Member", "Owner"],
                    "permissions": ["view_tasks", "create_tasks", "update_tasks", "delete_tasks", "manage_members"]
                },
                "application_flows": [
                    "Member creates task -> Invokes POST /api/tasks -> Records activity -> Triggers updates on task board UI"
                ]
            }

    elif stage == 3: # Database Schema
        if app_type == "ecommerce":
            return {
                "tables": [
                    {
                        "table_name": "users",
                        "columns": [
                            {"name": "id", "type": "integer", "nullable": False, "primary_key": True, "foreign_key": None, "unique": True},
                            {"name": "email", "type": "text", "nullable": False, "primary_key": False, "foreign_key": None, "unique": True},
                            {"name": "password_hash", "type": "text", "nullable": False, "primary_key": False, "foreign_key": None, "unique": False},
                            {"name": "role", "type": "text", "nullable": False, "primary_key": False, "foreign_key": None, "unique": False}
                        ]
                    },
                    {
                        "table_name": "products",
                        "columns": [
                            {"name": "id", "type": "integer", "nullable": False, "primary_key": True, "foreign_key": None, "unique": True},
                            {"name": "title", "type": "text", "nullable": False, "primary_key": False, "foreign_key": None, "unique": False},
                            {"name": "price", "type": "integer", "nullable": False, "primary_key": False, "foreign_key": None, "unique": False},
                            {"name": "stock_count", "type": "integer", "nullable": False, "primary_key": False, "foreign_key": None, "unique": False}
                        ]
                    },
                    {
                        "table_name": "orders",
                        "columns": [
                            {"name": "id", "type": "integer", "nullable": False, "primary_key": True, "foreign_key": None, "unique": True},
                            {"name": "user_id", "type": "integer", "nullable": False, "primary_key": False, "foreign_key": "users.id", "unique": False},
                            {"name": "total_price", "type": "integer", "nullable": False, "primary_key": False, "foreign_key": None, "unique": False},
                            {"name": "status", "type": "text", "nullable": False, "primary_key": False, "foreign_key": None, "unique": False}
                        ]
                    }
                ]
            }
        elif app_type == "crm":
            return {
                "tables": [
                    {
                        "table_name": "users",
                        "columns": [
                            {"name": "id", "type": "integer", "nullable": False, "primary_key": True, "foreign_key": None, "unique": True},
                            {"name": "email", "type": "text", "nullable": False, "primary_key": False, "foreign_key": None, "unique": True},
                            {"name": "name", "type": "text", "nullable": False, "primary_key": False, "foreign_key": None, "unique": False},
                            {"name": "role", "type": "text", "nullable": False, "primary_key": False, "foreign_key": None, "unique": False}
                        ]
                    },
                    {
                        "table_name": "leads",
                        "columns": [
                            {"name": "id", "type": "integer", "nullable": False, "primary_key": True, "foreign_key": None, "unique": True},
                            {"name": "company", "type": "text", "nullable": False, "primary_key": False, "foreign_key": None, "unique": False},
                            {"name": "status", "type": "text", "nullable": False, "primary_key": False, "foreign_key": None, "unique": False},
                            {"name": "owner_id", "type": "integer", "nullable": False, "primary_key": False, "foreign_key": "users.id", "unique": False}
                        ]
                    },
                    {
                        "table_name": "deals",
                        "columns": [
                            {"name": "id", "type": "integer", "nullable": False, "primary_key": True, "foreign_key": None, "unique": True},
                            {"name": "title", "type": "text", "nullable": False, "primary_key": False, "foreign_key": None, "unique": False},
                            {"name": "value", "type": "integer", "nullable": False, "primary_key": False, "foreign_key": None, "unique": False},
                            {"name": "stage", "type": "text", "nullable": False, "primary_key": False, "foreign_key": None, "unique": False},
                            {"name": "lead_id", "type": "integer", "nullable": True, "primary_key": False, "foreign_key": "leads.id", "unique": False}
                        ]
                    }
                ]
            }
        else: # taskmanager
            return {
                "tables": [
                    {
                        "table_name": "users",
                        "columns": [
                            {"name": "id", "type": "integer", "nullable": False, "primary_key": True, "foreign_key": None, "unique": True},
                            {"name": "email", "type": "text", "nullable": False, "primary_key": False, "foreign_key": None, "unique": True},
                            {"name": "name", "type": "text", "nullable": False, "primary_key": False, "foreign_key": None, "unique": False},
                            {"name": "role", "type": "text", "nullable": False, "primary_key": False, "foreign_key": None, "unique": False}
                        ]
                    },
                    {
                        "table_name": "projects",
                        "columns": [
                            {"name": "id", "type": "integer", "nullable": False, "primary_key": True, "foreign_key": None, "unique": True},
                            {"name": "title", "type": "text", "nullable": False, "primary_key": False, "foreign_key": None, "unique": False},
                            {"name": "owner_id", "type": "integer", "nullable": False, "primary_key": False, "foreign_key": "users.id", "unique": False}
                        ]
                    },
                    {
                        "table_name": "tasks",
                        "columns": [
                            {"name": "id", "type": "integer", "nullable": False, "primary_key": True, "foreign_key": None, "unique": True},
                            {"name": "title", "type": "text", "nullable": False, "primary_key": False, "foreign_key": None, "unique": False},
                            {"name": "status", "type": "text", "nullable": False, "primary_key": False, "foreign_key": None, "unique": False},
                            {"name": "priority", "type": "text", "nullable": False, "primary_key": False, "foreign_key": None, "unique": False},
                            {"name": "project_id", "type": "integer", "nullable": False, "primary_key": False, "foreign_key": "projects.id", "unique": False}
                        ]
                    }
                ]
            }

    elif stage == 4: # API Generation
        if app_type == "ecommerce":
            return {
                "apis": [
                    {
                        "path": "/api/products",
                        "method": "GET",
                        "request_schema": {},
                        "response_schema": {"type": "array", "items": {"type": "object", "properties": {"id": {"type": "integer"}, "title": {"type": "string"}, "price": {"type": "integer"}, "stock_count": {"type": "integer"}}}},
                        "auth_required": False,
                        "roles_allowed": ["Customer", "Merchant", "Admin"]
                    },
                    {
                        "path": "/api/orders",
                        "method": "POST",
                        "request_schema": {"type": "object", "required": ["product_id", "quantity"], "properties": {"product_id": {"type": "integer"}, "quantity": {"type": "integer"}}},
                        "response_schema": {"type": "object", "properties": {"id": {"type": "integer"}, "status": {"type": "string"}, "total_price": {"type": "integer"}}},
                        "auth_required": True,
                        "roles_allowed": ["Customer", "Admin"]
                    },
                    {
                        "path": "/api/orders",
                        "method": "GET",
                        "request_schema": {},
                        "response_schema": {"type": "array", "items": {"type": "object", "properties": {"id": {"type": "integer"}, "total_price": {"type": "integer"}, "status": {"type": "string"}}}},
                        "auth_required": True,
                        "roles_allowed": ["Customer", "Admin"]
                    }
                ]
            }
        elif app_type == "crm":
            return {
                "apis": [
                    {
                        "path": "/api/leads",
                        "method": "GET",
                        "request_schema": {},
                        "response_schema": {"type": "array", "items": {"type": "object", "properties": {"id": {"type": "integer"}, "company": {"type": "string"}, "status": {"type": "string"}}}},
                        "auth_required": True,
                        "roles_allowed": ["Sales Agent", "Sales Manager", "Admin"]
                    },
                    {
                        "path": "/api/leads",
                        "method": "POST",
                        "request_schema": {"type": "object", "required": ["company", "status"], "properties": {"company": {"type": "string"}, "status": {"type": "string"}}},
                        "response_schema": {"type": "object", "properties": {"id": {"type": "integer"}, "company": {"type": "string"}, "status": {"type": "string"}}},
                        "auth_required": True,
                        "roles_allowed": ["Sales Agent", "Sales Manager", "Admin"]
                    },
                    {
                        "path": "/api/deals",
                        "method": "GET",
                        "request_schema": {},
                        "response_schema": {"type": "array", "items": {"type": "object", "properties": {"id": {"type": "integer"}, "title": {"type": "string"}, "value": {"type": "integer"}, "stage": {"type": "string"}}}},
                        "auth_required": True,
                        "roles_allowed": ["Sales Agent", "Sales Manager", "Admin"]
                    }
                ]
            }
        else: # taskmanager
            return {
                "apis": [
                    {
                        "path": "/api/projects",
                        "method": "GET",
                        "request_schema": {},
                        "response_schema": {"type": "array", "items": {"type": "object", "properties": {"id": {"type": "integer"}, "title": {"type": "string"}}}},
                        "auth_required": True,
                        "roles_allowed": ["Viewer", "Member", "Owner"]
                    },
                    {
                        "path": "/api/tasks",
                        "method": "GET",
                        "request_schema": {},
                        "response_schema": {"type": "array", "items": {"type": "object", "properties": {"id": {"type": "integer"}, "title": {"type": "string"}, "status": {"type": "string"}, "priority": {"type": "string"}, "project_id": {"type": "integer"}}}},
                        "auth_required": True,
                        "roles_allowed": ["Viewer", "Member", "Owner"]
                    },
                    {
                        "path": "/api/tasks",
                        "method": "POST",
                        "request_schema": {"type": "object", "required": ["title", "project_id"], "properties": {"title": {"type": "string"}, "project_id": {"type": "integer"}, "priority": {"type": "string"}, "status": {"type": "string"}}},
                        "response_schema": {"type": "object", "properties": {"id": {"type": "integer"}, "title": {"type": "string"}, "status": {"type": "string"}}},
                        "auth_required": True,
                        "roles_allowed": ["Member", "Owner"]
                    }
                ]
            }

    elif stage == 5: # UI Schema
        if app_type == "ecommerce":
            return {
                "pages": [
                    {
                        "name": "Products Page",
                        "route": "/products",
                        "components": [
                            {
                                "type": "navbar",
                                "id": "shop_nav",
                                "title": app_name,
                                "props": {"links": [{"label": "Shop", "href": "/products"}, {"label": "Orders", "href": "/orders"}]}
                            },
                            {
                                "type": "table",
                                "id": "product_grid",
                                "title": "Available Products",
                                "props": {"api_endpoint": "/api/products", "columns": ["id", "title", "price", "stock_count"]}
                            }
                        ]
                    },
                    {
                        "name": "Checkout Page",
                        "route": "/checkout",
                        "components": [
                            {
                                "type": "form",
                                "id": "checkout_form",
                                "title": "Complete Your Order",
                                "props": {
                                    "api_endpoint": "/api/orders",
                                    "method": "POST",
                                    "fields": [
                                        {"name": "product_id", "label": "Product ID", "type": "integer", "required": True},
                                        {"name": "quantity", "label": "Quantity", "type": "integer", "required": True}
                                    ]
                                }
                            }
                        ]
                    }
                ]
            }
        elif app_type == "crm":
            return {
                "pages": [
                    {
                        "name": "Leads Dashboard",
                        "route": "/leads",
                        "components": [
                            {
                                "type": "sidebar",
                                "id": "crm_side",
                                "title": "CRM Console",
                                "props": {"items": [{"label": "Leads", "route": "/leads"}, {"label": "Deals", "route": "/deals"}]}
                            },
                            {
                                "type": "form",
                                "id": "add_lead_form",
                                "title": "Capture New Lead",
                                "props": {
                                    "api_endpoint": "/api/leads",
                                    "method": "POST",
                                    "fields": [
                                        {"name": "company", "label": "Company Name", "type": "text", "required": True},
                                        {"name": "status", "label": "Lead Status", "type": "text", "required": True}
                                    ]
                                }
                            },
                            {
                                "type": "table",
                                "id": "leads_table",
                                "title": "Active Leads",
                                "props": {"api_endpoint": "/api/leads", "columns": ["id", "company", "status"]}
                            }
                        ]
                    },
                    {
                        "name": "Deals Board",
                        "route": "/deals",
                        "components": [
                            {
                                "type": "sidebar",
                                "id": "crm_side_deals",
                                "title": "CRM Console",
                                "props": {"items": [{"label": "Leads", "route": "/leads"}, {"label": "Deals", "route": "/deals"}]}
                            },
                            {
                                "type": "form",
                                "id": "add_deal_form",
                                "title": "Create New Deal",
                                "props": {
                                    "api_endpoint": "/api/deals",
                                    "method": "POST",
                                    "fields": [
                                        {"name": "title", "label": "Deal Title", "type": "text", "required": True},
                                        {"name": "value", "label": "Value ($)", "type": "integer", "required": True},
                                        {"name": "stage", "label": "Stage", "type": "text", "required": True}
                                    ]
                                }
                            },
                            {
                                "type": "table",
                                "id": "deals_table",
                                "title": "Active Deals",
                                "props": {"api_endpoint": "/api/deals", "columns": ["id", "title", "value", "stage"]}
                            }
                        ]
                    }
                ]
            }
        else: # taskmanager
            return {
                "pages": [
                    {
                        "name": "Dashboard",
                        "route": "/dashboard",
                        "components": [
                            {
                                "type": "navbar",
                                "id": "task_nav",
                                "title": app_name,
                                "props": {"links": [{"label": "Dashboard", "href": "/dashboard"}, {"label": "Projects", "href": "/projects"}]}
                            },
                            {
                                "type": "form",
                                "id": "new_task_form",
                                "title": "Create a Task",
                                "props": {
                                    "api_endpoint": "/api/tasks",
                                    "method": "POST",
                                    "fields": [
                                        {"name": "title", "label": "Task Title", "type": "text", "required": True},
                                        {"name": "project_id", "label": "Project ID", "type": "integer", "required": True},
                                        {"name": "priority", "label": "Priority (High/Med/Low)", "type": "text", "required": False}
                                    ]
                                }
                            },
                            {
                                "type": "table",
                                "id": "tasks_list",
                                "title": "My Tasks",
                                "props": {"api_endpoint": "/api/tasks", "columns": ["id", "title", "status", "priority", "project_id"]}
                            }
                        ]
                    },
                    {
                        "name": "Projects",
                        "route": "/projects",
                        "components": [
                            {
                                "type": "navbar",
                                "id": "task_nav_projects",
                                "title": app_name,
                                "props": {"links": [{"label": "Dashboard", "href": "/dashboard"}, {"label": "Projects", "href": "/projects"}]}
                            },
                            {
                                "type": "form",
                                "id": "new_project_form",
                                "title": "Create a Project",
                                "props": {
                                    "api_endpoint": "/api/projects",
                                    "method": "POST",
                                    "fields": [
                                        {"name": "title", "label": "Project Title", "type": "text", "required": True},
                                        {"name": "owner_id", "label": "Owner ID", "type": "integer", "required": True}
                                    ]
                                }
                            },
                            {
                                "type": "table",
                                "id": "projects_list",
                                "title": "All Projects",
                                "props": {"api_endpoint": "/api/projects", "columns": ["id", "title", "owner_id"]}
                            }
                        ]
                    }
                ]
            }

    elif stage == 8: # Runtime Configuration
        if app_type == "ecommerce":
            return {
                "runtime": {
                    "routes": [
                        {"path": "/products", "page_name": "Products Page"},
                        {"path": "/checkout", "page_name": "Checkout Page"}
                    ],
                    "components": [
                        {
                            "type": "navbar",
                            "id": "shop_nav",
                            "title": app_name,
                            "props": {"links": [{"label": "Shop", "href": "/products"}, {"label": "Orders", "href": "/orders"}]}
                        },
                        {
                            "type": "table",
                            "id": "product_grid",
                            "title": "Available Products",
                            "props": {"api_endpoint": "/api/products", "columns": ["id", "title", "price", "stock_count"]}
                        },
                        {
                            "type": "form",
                            "id": "checkout_form",
                            "title": "Complete Your Order",
                            "props": {
                                "api_endpoint": "/api/orders",
                                "method": "POST",
                                "fields": [
                                    {"name": "product_id", "label": "Product ID", "type": "integer", "required": True},
                                    {"name": "quantity", "label": "Quantity", "type": "integer", "required": True}
                                ]
                            }
                        }
                    ],
                    "bindings": [
                        {"component_id": "product_grid", "api_path": "/api/products", "method": "GET", "event": "onLoad", "state_key": "products"},
                        {"component_id": "checkout_form", "api_path": "/api/orders", "method": "POST", "event": "onSubmit", "state_key": "orders"}
                    ],
                    "state": {
                        "products": [
                            {"id": 101, "title": "Wireless Headphones", "price": 89, "stock_count": 45},
                            {"id": 102, "title": "Mechanical Keyboard", "price": 120, "stock_count": 12},
                            {"id": 103, "title": "Ergonomic Mouse", "price": 55, "stock_count": 120}
                        ],
                        "orders": []
                    }
                }
            }
        elif app_type == "calculator":
            calc_html = """
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f8fafc; }
  .calc-container { width: 320px; background: #ffffff; border-radius: 16px; padding: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
  .display { width: 100%; height: 80px; background: #f1f5f9; border-radius: 12px; margin-bottom: 20px; text-align: right; padding: 20px; font-size: 2.5rem; font-weight: 600; color: #1e293b; box-sizing: border-box; overflow: hidden; border: none; }
  .buttons { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  button { padding: 15px; font-size: 1.25rem; font-weight: 600; border: none; border-radius: 10px; cursor: pointer; transition: all 0.2s; background: #e2e8f0; color: #334155; }
  button:hover { background: #cbd5e1; }
  .op { background: #e0e7ff; color: #4f46e5; }
  .op:hover { background: #c7d2fe; }
  .eq { background: #a855f7; color: white; grid-column: span 2; }
  .eq:hover { background: #9333ea; }
  .clear { background: #fee2e2; color: #ef4444; }
  .clear:hover { background: #fecaca; }
</style>
</head>
<body>
<div class="calc-container">
  <input type="text" class="display" id="display" disabled value="0" />
  <div class="buttons">
    <button class="clear" onclick="clearDisplay()">C</button>
    <button onclick="append('(')">(</button>
    <button onclick="append(')')">)</button>
    <button class="op" onclick="append('/')">÷</button>
    <button onclick="append('7')">7</button>
    <button onclick="append('8')">8</button>
    <button onclick="append('9')">9</button>
    <button class="op" onclick="append('*')">×</button>
    <button onclick="append('4')">4</button>
    <button onclick="append('5')">5</button>
    <button onclick="append('6')">6</button>
    <button class="op" onclick="append('-')">−</button>
    <button onclick="append('1')">1</button>
    <button onclick="append('2')">2</button>
    <button onclick="append('3')">3</button>
    <button class="op" onclick="append('+')">+</button>
    <button onclick="append('0')">0</button>
    <button onclick="append('.')">.</button>
    <button class="eq" onclick="calculate()">=</button>
  </div>
</div>
<script>
  const display = document.getElementById('display');
  function append(char) {
    if(display.value === '0' || display.value === 'Error') display.value = char;
    else display.value += char;
  }
  function clearDisplay() {
    display.value = '0';
  }
  function calculate() {
    try {
      display.value = eval(display.value) || '0';
    } catch(e) {
      display.value = 'Error';
    }
  }
</script>
</body>
</html>
"""
            return {
                "runtime": {
                    "routes": [{"path": "/calculator", "page_name": "Calculator"}],
                    "components": [
                        {
                            "type": "html_widget",
                            "id": "smart_calculator",
                            "title": "Smart Calculator Widget",
                            "props": {"html": calc_html, "_page_route": "/calculator"}
                        }
                    ],
                    "bindings": [],
                    "state": {}
                }
            }
        elif app_type == "lms":
            return {
                "runtime": {
                    "routes": [
                        {"path": "/dashboard", "page_name": "LMS DASHBOARD"}
                    ],
                    "components": [
                        {
                            "type": "sidebar",
                            "id": "lms_side",
                            "title": "LMS DASHBOARD",
                            "props": {"items": [{"label": "My Courses", "route": "/dashboard"}], "_page_route": "/dashboard"}
                        },
                        {
                            "type": "metric",
                            "id": "lms_metric",
                            "title": "Total Courses",
                            "props": {"label": "Total Courses", "value": "12", "_page_route": "/dashboard"}
                        },
                        {
                            "type": "header",
                            "id": "my_courses_header",
                            "title": "My Courses",
                            "props": {"label": "My Courses", "_page_route": "/dashboard"}
                        },
                        {
                            "type": "list",
                            "id": "courses_list",
                            "title": "Course List",
                            "props": {
                                "items": [
                                    "Python Basics",
                                    "FastAPI Masterclass",
                                    "Data Structures",
                                    "System Design Algorithms"
                                ],
                                "_page_route": "/dashboard"
                            }
                        },
                        {
                            "type": "button",
                            "id": "view_course_btn",
                            "title": "View Course",
                            "props": {"label": "View Course", "_page_route": "/dashboard"}
                        }
                    ],
                    "bindings": [],
                    "state": {}
                }
            }
        elif app_type == "crm":
            return {
                "runtime": {
                    "routes": [
                        {"path": "/dashboard", "page_name": "Dashboard"},
                        {"path": "/contacts", "page_name": "Contacts"},
                        {"path": "/analytics", "page_name": "Analytics"}
                    ],
                    "components": [
                        {
                            "type": "sidebar",
                            "id": "crm_side",
                            "title": "CRM APPLICATION",
                            "props": {"items": [{"label": "Dashboard", "route": "/dashboard"}, {"label": "Contacts", "route": "/contacts"}, {"label": "Analytics", "route": "/analytics"}], "_page_route": "/dashboard"}
                        },
                        {
                            "type": "header",
                            "id": "dash_header",
                            "title": "Dashboard",
                            "props": {"label": "Overview Dashboard", "_page_route": "/dashboard"}
                        },
                        {
                            "type": "metric",
                            "id": "metric_1",
                            "title": "Total Contacts",
                            "props": {"label": "Total Contacts", "value": "150", "_page_route": "/dashboard"}
                        },
                        {
                            "type": "metric",
                            "id": "metric_2",
                            "title": "Active Users",
                            "props": {"label": "Active Users", "value": "12", "_page_route": "/dashboard"}
                        },
                        {
                            "type": "button",
                            "id": "add_contact_btn",
                            "title": "Add Contact",
                            "props": {"label": "Add Contact", "_page_route": "/dashboard"}
                        },
                        {
                            "type": "sidebar",
                            "id": "crm_side_contacts",
                            "title": "CRM APPLICATION",
                            "props": {"items": [{"label": "Dashboard", "route": "/dashboard"}, {"label": "Contacts", "route": "/contacts"}, {"label": "Analytics", "route": "/analytics"}], "_page_route": "/contacts"}
                        },
                        {
                            "type": "header",
                            "id": "contacts_header",
                            "title": "Contacts",
                            "props": {"label": "Contact Directory", "_page_route": "/contacts"}
                        },
                        {
                            "type": "list",
                            "id": "contacts_list",
                            "title": "Contacts List",
                            "props": {
                                "items": [
                                    "John Doe - john@gmail.com (Active)",
                                    "Jane Smith - jane@gmail.com (Pending)",
                                    "Michael Scott - mscott@dundermifflin.com (Closed)",
                                    "Pam Beesly - pam@dundermifflin.com (Active)"
                                ],
                                "_page_route": "/contacts"
                            }
                        },
                        {
                            "type": "form",
                            "id": "add_contact_form",
                            "title": "New Contact",
                            "props": {
                                "api_endpoint": "/api/contacts",
                                "method": "POST",
                                "fields": [
                                    {"name": "name", "label": "Full Name", "type": "text", "required": True},
                                    {"name": "email", "label": "Email Address", "type": "email_input", "required": True}
                                ],
                                "_page_route": "/contacts"
                            }
                        },
                        {
                            "type": "sidebar",
                            "id": "crm_side_analytics",
                            "title": "CRM APPLICATION",
                            "props": {"items": [{"label": "Dashboard", "route": "/dashboard"}, {"label": "Contacts", "route": "/contacts"}, {"label": "Analytics", "route": "/analytics"}], "_page_route": "/analytics"}
                        },
                        {
                            "type": "chart",
                            "id": "analytics_chart",
                            "title": "Sales Analytics Overview",
                            "props": {"_page_route": "/analytics"}
                        }
                    ],
                    "bindings": [
                        {"component_id": "add_contact_form", "api_path": "/api/contacts", "method": "POST", "event": "onSubmit", "state_key": "contacts"}
                    ],
                    "state": {
                        "contacts": [
                            {"id": 1, "name": "John Doe", "email": "john@gmail.com"},
                            {"id": 2, "name": "Jane Smith", "email": "jane@gmail.com"}
                        ]
                    }
                }
            }
        else: # taskmanager
            return {
                "runtime": {
                    "routes": [
                        {"path": "/tasks", "page_name": "Task Manager"}
                    ],
                    "components": [
                        {
                            "type": "sidebar",
                            "id": "task_side",
                            "title": "TASK MANAGER",
                            "props": {"items": [{"label": "My Tasks", "route": "/tasks"}], "_page_route": "/tasks"}
                        },
                        {
                            "type": "button",
                            "id": "new_task_btn",
                            "title": "New Task",
                            "props": {"label": "+ New Task", "_page_route": "/tasks"}
                        },
                        {
                            "type": "list",
                            "id": "task_list_component",
                            "title": "Task List",
                            "props": {
                                "items": [
                                    "✓ Learn FastAPI",
                                    "✓ Build AI Compiler",
                                    "□ Submit Assignment",
                                    "□ Fix Docker Build",
                                    "✓ Send Email to Mentor"
                                ],
                                "_page_route": "/tasks"
                            }
                        },
                        {
                            "type": "form",
                            "id": "new_task_form",
                            "title": "Add Task",
                            "props": {
                                "api_endpoint": "/api/tasks",
                                "method": "POST",
                                "fields": [
                                    {"name": "title", "label": "Task Description", "type": "text", "required": True}
                                ],
                                "_page_route": "/tasks"
                            }
                        }
                    ],
                    "bindings": [
                        {"component_id": "new_task_form", "api_path": "/api/tasks", "method": "POST", "event": "onSubmit", "state_key": "tasks"}
                    ],
                    "state": {
                        "tasks": [
                            {"id": 1, "title": "Learn FastAPI", "status": "Completed"},
                            {"id": 2, "title": "Submit Assignment", "status": "Pending"}
                        ]
                    }
                }
            }

    return {}
