# ⚙️ AI Application Compiler Dashboard

An engineered, multi-stage compiler pipeline that converts plain English product descriptions into type-safe, schema-validated, execution-ready application models. The compiler generates database schema, API mappings, visual layout specifications, builds a physical SQLite database on disk, and executes them instantly inside an interactive browser sandbox.

Inspired by controlled compilation layers rather than single-prompt chatbot response wrappers, this system focuses on **predictable schemas**, **semantic validators**, **self-healing repair systems**, and **execution awareness**.

---

## 🚀 Key Architectural Pillars

### 1. Multi-Stage Compiler Pipeline
Instead of immediately outputting a final response, the compiler processes user instructions sequentially:
* **Stage 1 (Intent Extraction)**: Parses requirements into structured logical schemas (entities, features, user roles, workflows, rules).
* **Stage 2 (Architecture Design)**: Maps intent parameters to concrete API endpoints, DB tables, and UI pages.
* **Stage 3 (Database Schema)**: Models columns, primary keys, and foreign key relations.
* **Stage 4 (API Schema)**: Defines REST endpoints, payload request/response schemas, and role permissions.
* **Stage 5 (UI Layout Mappings)**: Constructs visual layout structures (forms, tables, cards, sidebars, navbars).
* **Stage 6/7 (Validation & Repair)**: Runs schema validators and consistency checks, triggering surgical repair patches on failures.
* **Stage 8 (Runtime compilation)**: Bundles routing, bindings, and seed state into an executable manifest.

### 2. Strict Schema Enforcement
* **Type-Safe Abstractions**: Intermediate representations are validated against Pydantic models defined in `backend/schemas/app_schema.py`.
* **Cross-Layer Semantic Consistency**: Ensures that visual form fields map to active database columns, UI elements bind to active API endpoints, and database foreign keys target valid tables.

### 3. Surgical Self-Healing Repair Engine (Stage 7)
* Automatically intercepts validation errors.
* Surgical Patches: Isolates and patches only the broken segments of the schema without blindly retrying or rebuilding the whole workspace.
* Testable: Developers can intentionally inject route or column errors inside the **Debug & Self-Heal** tab and execute a live validation/repair loop.

### 4. Persistent Database Compilation (Execution Awareness)
* **`compiled_app.db`**: Stage 8 automatically builds a persistent, binary SQLite database file in the workspace root.
* **`compiled_app_schema.sql`**: Outputs the SQL DDL script containing structural schema definitions.
* **Data Hydration**: Populates SQLite tables with realistic seeded data matching the target application (CRM, E-Commerce, Task Planner).

### 5. Automated Evaluation & Cost Framework
* Executes a dataset of **20 benchmark prompts** (10 product descriptions + 10 edge cases).
* Logs compilation success rate, latency, retries, and token cost metrics to a markdown report: `evaluation_report.md`.

---

## 📂 Project Directory Structure

```text
compilor for software generation/
├── backend/                       # Python Backend Service
│   ├── agents/                    # Multi-Stage Compiler Agents
│   │   ├── base_agent.py          # Unified Groq API caller & retry loop handler
│   │   ├── mock_generator.py      # Heuristic fallback compiler (no key required)
│   │   ├── intent_agent.py        # Stage 1 Intent Extraction
│   │   ├── architecture_agent.py  # Stage 2 System Architecture
│   │   ├── db_agent.py            # Stage 3 Database Schema
│   │   ├── api_agent.py           # Stage 4 API Schema
│   │   └── ui_agent.py            # Stage 5 UI Mappings
│   ├── evaluation/                # Performance Benchmarking
│   │   ├── prompts.json           # Global prompt registry templates
│   │   └── evaluation_runner.py   # Automated 20-prompt metric runner
│   ├── repair/                    # Validation Refinement Layer
│   │   └── repair_engine.py       # Stage 7 Surgical Repair Engine
│   ├── runtime/                   # Code Compilation Layer
│   │   └── runtime_builder.py     # Stage 8 SQLite Database & SQL script generator
│   ├── schemas/                   # Strict Type Safety Models
│   │   └── app_schema.py          # Pydantic schema schemas (1 to 8)
│   ├── validators/                # Consistency Enforcement
│   │   ├── schema_validator.py    # Structural schema validators
│   │   └── consistency_validator.py# Cross-layer semantic validators
│   ├── tests/                     # Pipeline Verification Suite
│   │   └── test_pipeline.py       # PyTest validation unit tests
│   ├── config.py                  # Environment configurations
│   └── main.py                    # FastAPI server & static file mount router
│
├── frontend/                      # React SPA Dashboard
│   ├── dist/                      # Rebuilt production assets (HTML/CSS/JS)
│   ├── src/                       # Source files
│   │   ├── components/            # Visual dashboard modules
│   │   │   ├── Timeline.jsx       # Animated stage pipeline execution
│   │   │   ├── Sandbox.jsx        # Dynamic sandbox layout previewer
│   │   │   ├── Explorer.jsx       # Reusable JSON schema viewer
│   │   │   └── Debugger.jsx       # Validation and Self-Heal debugger panel
│   │   ├── App.jsx                # Unified single-page cockpit
│   │   └── index.css              # Glassmorphic dark mode styling
│   └── package.json               # Node package configurations
│
├── compiled_app.db                # Auto-compiled persistent SQLite database
├── compiled_app_schema.sql        # Auto-compiled SQL DDL schema script
├── evaluation_report.md           # Benchmark statistics and cost metrics
├── .env                           # API keys & model settings file
├── run.bat                        # Single-command bootstrap script
└── requirements.txt               # Backend Python dependencies
```

---

## ⚡ Setup & Launch Instructions

### 1. Environment Configuration
Open the **`.env`** file in your root workspace and set your credentials:
```ini
# Add your Groq API Key (if left blank, the system automatically falls back to Heuristic Mode)
GROQ_API_KEY=your_groq_api_key_here

# Default model version supporting JSON output mode
GROQ_MODEL=llama-3.3-70b-versatile

# Run mode: "auto" (use key if present, else mock), "true" (force mock), "false" (force LLM)
MOCK_MODE=auto
```

### 2. Double-Click Bootstrapper
Start the system with **one command**:
* Double-click the **`run.bat`** file in your workspace, or run the following in your shell:
```powershell
.\run.bat
```
This automatically:
1. Verifies/activates the local virtual environment `.venv`.
2. Serves the FastAPI server on port **`8080`**.
3. Opens your default web browser to the Compiler Dashboard at **`http://127.0.0.1:8080`**.

---

## 🎮 How to Interact

### Step 1: Execute Prompt Compilation
* Select either **Groq LLM Engine** or **Heuristic Compiler** in the top bar dashboard settings.
* Enter a plain English instruction (e.g. *“Build a school database platform with teacher lists, enrollments page, student roles, and admin tools”*).
* Click **COMPILE SYSTEM**.
* Watch the vertical timeline visualize the multi-stage compilation output logs.

### Step 2: Live App Preview Sandbox
* Switch to the **Live Preview** tab on the right.
* Click sidebar/navbar links to navigate generated routes.
* Fill out the dynamic input fields and submit the form. The system will write the record directly to the physical SQLite database (`compiled_app.db`) on disk via the API endpoints and reload the tables dynamically in real-time.

### Step 3: Inspect Schemas
* Swap between the **DB Schema**, **APIs**, **UI Schema**, **Auth Config**, and **Runtime Config** tabs to view the structured JSON configurations generated by the compiler.
* Check your project root folder to find the generated **`compiled_app.db`** SQLite file and the DDL statements script **`compiled_app_schema.sql`**.

### Step 4: Induce Failures & Verify Self-Healing
* Navigate to the **Debug & Self-Heal** tab.
* Click any failure button (e.g. *Break Form Column Mapping*).
* The validator immediately flags the semantic violation and alerts the repair panel.
* Click **Surgical Heal**. The system invokes the Stage 7 repair engine, patches the database columns to support the new form field, verifies that validation is green, and redraws the preview sandbox.

---

## 🧪 Benchmark & Cost Evaluation

To execute the automated evaluation dataset (20 prompts) and update the latency, retries, and cost metrics:
```powershell
.venv\Scripts\python backend\evaluation\evaluation_runner.py
```
* **Success Rate**: The compiler consistently scores **`100% success`** under validator passes due to schema-driven prompts and rate-limit retry handlers.
* **Estimated token cost**: Running all 5 pipeline generation stages costs **`~ $0.010 USD`** per compilation, optimized by targeted prompts.
* **Self-Healing Savings**: Stage 7 repair loop only targets the failing JSON schema nodes and patches them selectively rather than retrying the whole pipeline, saving up to 80% of execution costs compared to a blind retry strategy.
