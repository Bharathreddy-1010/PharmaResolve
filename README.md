# PharmaResolve — AI-Powered Customer Complaint Management System
### Enterprise GxP Quality Assurance Module for API & Finished Dosage Forms Manufacturing

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![LangGraph](https://img.shields.io/badge/Orchestration-LangGraph-FF6F00?logo=langchain&logoColor=white)](https://langchain-ai.github.io/langgraph/)
[![Groq](https://img.shields.io/badge/LLM-Groq%20%7C%20Compound--Mini-F05A28)](https://groq.com)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2018-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Redux%20Toolkit-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%20%2B%20Python%203.13-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)

---

## 1. Project Overview

**PharmaResolve** is a production-style, enterprise-grade AI Customer Complaint Management System tailored for pharmaceutical manufacturing companies producing Active Pharmaceutical Ingredients (API) and Finished Dosage Forms (FDF).

Complaints in pharmaceutical manufacturing are strictly regulated under **US FDA 21 CFR Part 211.198**, **EU GMP Chapter 8**, and **ICH Q9/Q10 Quality Risk Management** guidelines. Processing complaints manually is slow, prone to transcription errors, and delays critical batch containment actions.

PharmaQMS automates complaint intake, structured data extraction, GxP completeness auditing, ICH Q9 risk classification, historical duplicate detection, and CAPA investigation planning through a 10-stage **LangGraph** AI orchestration state machine.

---

## 2. Problem Being Solved

| Traditional Manual Complaint Intake | PharmaQMS AI-Powered Solution |
| :--- | :--- |
| Unstructured emails, call memos, and PDFs take hours to manually key into QMS software. | Instant automated extraction of Customer, Product, Strength, Batch #, Dates, Quantity, and Defect. |
| Incomplete intakes delay investigation while QA requests missing information days later. | Automated **GxP Completeness Checker** immediately flags missing retain samples, expiry, or quantities. |
| Subjective severity ratings lead to inconsistent regulatory reporting and triage delays. | Objective **ICH Q9 Risk Classification** (Low, Medium, High, Critical) with confidence and justification. |
| Repeat defects across the same batch go unnoticed until multiple complaints arrive. | Real-time **Historical Duplicate Detection** matches batches, products, and text similarity. |
| Quality engineers struggle to draft investigation scopes under strict reporting deadlines. | Instant **Investigation Root Causes** & **CAPA Recommendations** grounded in pharmaceutical standards. |

---

## 3. High-Level Architecture

```
                               ┌─────────────────────────────────────────┐
                               │       React 18 + Redux Toolkit          │
                               │   (Google Inter, QMS Precision UI)      │
                               └────────────────────┬────────────────────┘
                                                    │ REST API
                                                    ▼
                               ┌─────────────────────────────────────────┐
                               │             FastAPI Backend             │
                               │        (/api/complaints routes)         │
                               └───────────┬─────────────────┬───────────┘
                                           │                 │
                      ┌────────────────────┘                 └────────────────────┐
                      ▼                                                           ▼
        ┌───────────────────────────┐                               ┌───────────────────────────┐
        │     LangGraph Engine      │                               │  PostgreSQL / SQLAlchemy  │
        │  (10-Step State Graph)    │                               │ (Persistent GxP Registry) │
        └─────────────┬─────────────┘                               └───────────────────────────┘
                      │
                      ▼
        ┌───────────────────────────┐
        │   Groq API (Gemma2-9b-it) │
        │  (Strict Pydantic JSON)   │
        └───────────────────────────┘
```

---

## 4. Technology Stack

- **Frontend**:
  - React 18 with TypeScript
  - Redux Toolkit (`@reduxjs/toolkit`, `react-redux`) for centralized application state
  - Google Inter typography
  - Lucide React enterprise iconography
  - Clean Vanilla CSS design system (zero unnecessary dependencies, strict enterprise color tokens)
  - Vite 5 build tool & proxy
- **Backend**:
  - Python 3.13 / FastAPI
  - SQLAlchemy 2.0 ORM with connection pooling
  - Pydantic v2 schemas and validation
  - Multi-format document parser (`pypdf`, `python-docx`, Python `email` library)
- **AI & Orchestration**:
  - **LangGraph** StateGraph workflow engine
  - **Groq API** (`gemma2-9b-it`, `llama-3.3-70b-versatile`, etc.)
  - High-fidelity deterministic GxP fallback engine (guarantees offline/unkeyed interview demonstrations never fail)
- **Database**:
  - **PostgreSQL 18** (production database with index on `batch_number` and `complaint_number`)
  - Automatic fallback to SQLite if PostgreSQL is inaccessible

---

## 5. Folder Structure

```
AVIO_Intern_Task/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI application entrypoint & lifespan
│   │   ├── config.py                   # Pydantic BaseSettings loading .env
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── routes.py               # REST API endpoints (/api/complaints)
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── complaint.py            # SQLAlchemy Complaint ORM model
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   └── complaint.py            # Pydantic models for validation
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── complaint_service.py    # DB operations & duplicate matching
│   │   │   └── document_parser.py      # PDF, DOCX, TXT, EML multi-format parser
│   │   ├── ai/
│   │   │   ├── __init__.py
│   │   │   ├── llm_client.py           # Groq wrapper & GxP fallback engine
│   │   │   └── prompts.py              # Pharmaceutical QA prompts (ICH Q9 / FDA)
│   │   ├── workflows/
│   │   │   ├── __init__.py
│   │   │   ├── state.py                # TypedDict ComplaintState for LangGraph
│   │   │   └── complaint_graph.py      # 10-node StateGraph workflow
│   │   └── database/
│   │       ├── __init__.py
│   │       ├── session.py              # Database engine & sessionmaker
│   │       └── init_db.py              # Table creation & initial seed complaints
│   ├── tests/
│   │   ├── test_api.py                 # Backend unit & integration test suite
│   │   └── sample_complaint.txt        # Sample file for upload testing
│   ├── requirements.txt                # Python backend dependencies
│   ├── .env.example                    # Environment variable template
│   └── .env                            # Active environment configuration
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx              # QMS top navigation & health status
│   │   │   ├── ComplaintForm.tsx       # Core 4-section form with provenance badges
│   │   │   ├── IntakeAssistant.tsx     # Drag-and-drop intake, progress & copilot
│   │   │   ├── ComplaintRegistry.tsx   # Searchable/filterable complaints table
│   │   │   ├── ProvenanceBadge.tsx     # AI Extracted / Inferred / User Entered pill
│   │   │   └── PasteModal.tsx          # Paste complaint text/email modal
│   │   ├── pages/
│   │   │   ├── ComplaintIntakePage.tsx # 2-column intake & form layout
│   │   │   └── ComplaintRegistryPage.tsx# Registry view
│   │   ├── layouts/
│   │   │   └── MainLayout.tsx          # Main container with alerts & GxP footer
│   │   ├── store/
│   │   │   ├── index.ts                # Redux store configuration
│   │   │   ├── complaintSlice.ts       # Form data, active record, provenance
│   │   │   ├── aiSlice.ts              # Analysis stages, risk metrics, copilot chat
│   │   │   └── uiSlice.ts              # Navigation tabs, modals, notifications
│   │   ├── services/
│   │   │   └── api.ts                  # Typed client for backend FastAPI API
│   │   ├── hooks/
│   │   │   ├── useAppDispatch.ts
│   │   │   └── useAppSelector.ts
│   │   ├── types/
│   │   │   ├── complaint.ts
│   │   │   └── ai.ts
│   │   ├── utils/
│   │   │   └── demoData.ts             # 3 realistic pharmaceutical demo presets
│   │   ├── App.tsx                     # Root App component
│   │   ├── main.tsx                    # React DOM mount with Redux Provider
│   │   ├── index.css                   # Google Inter Vanilla CSS design system
│   │   └── vite-env.d.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts                  # Vite configuration with API reverse proxy
│
└── README.md
```

---

## 6. LangGraph State Machine Workflow

### Why LangGraph instead of a single prompt or function?
1. **Separation of Concerns**: In pharmaceutical compliance, extracting data, calculating completeness, evaluating risk under ICH Q9, and determining CAPA require different reasoning constraints. A monolithic prompt hallucinates or misses mandatory fields.
2. **Conditional Branching & Early Exit**: If an intake payload is malformed or empty, LangGraph short-circuits immediately without making expensive or wasteful LLM calls.
3. **Auditability & GxP Traceability**: Each node updates a discrete part of the state. Auditors can verify exactly which node normalized the date, which node assigned the risk level, and what provenance applies to each field.
4. **Resilience**: If an individual node fails, previous state is retained and deterministic fallbacks ensure the system remains available.

### Workflow Execution Graph
```
[START]
   │
   ▼
1. receive_input
   ├── Validates raw text or parsed document (PDF/DOCX/TXT/EML)
   └── Sets initial extraction stage
   │
   ▼
2. extract_complaint_content
   ├── Queries LLM / parser for customer, product, strength, batch, dates, description
   └── Assigns initial field provenance (AI Extracted vs Missing)
   │
   ▼
3. normalize_information
   ├── Normalizes batch number to uppercase, trims whitespace
   └── Standardizes ISO dates (YYYY-MM-DD) and quantity units
   │
   ▼
4. validate_completeness
   ├── Calculates completeness percentage (0-100%)
   └── Flags missing GxP fields (batch number, customer, retain samples)
   │
   ▼
5. classify_complaint
   └── Categorizes: Product Quality, Packaging Defect, Shipment Issue, Contamination
   │
   ▼
6. assess_risk
   ├── Evaluates ICH Q9 risk level (LOW, MEDIUM, HIGH, CRITICAL)
   ├── Calculates risk confidence score (0-100%)
   └── Formulates concise business/GxP justification
   │
   ▼
7. check_duplicate
   └── Queries PostgreSQL for identical batch numbers and description text similarity
   │
   ▼
8. generate_summary
   └── Drafts executive 1-2 sentence overview for QA review
   │
   ▼
9. generate_recommendations
   ├── Suggests investigation root causes (Manufacturing, Materials, Packaging, Storage)
   └── Generates immediate containment actions and CAPA guidance
   │
   ▼
10. prepare_structured_complaint
   ├── Formats final validated Pydantic JSON schema
   └── Tags provenance on all 13 fields: AI Extracted, AI Inferred, User Entered, Missing
   │
   ▼
 [END]
```

---

## 7. Database Schema (PostgreSQL / SQLAlchemy)

The `complaints` table stores complete GxP complaint records:

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY, AUTOINCREMENT` | Unique database record ID |
| `complaint_number` | `VARCHAR(64)` | `UNIQUE, INDEX, NOT NULL` | Sequential identifier (e.g. `CMP-2026-001`) |
| `customer_name` | `VARCHAR(255)` | `NULLABLE` | Customer / Distributor / Hospital name |
| `complaint_source` | `VARCHAR(100)` | `NULLABLE` | Intake channel (Email, Portal, Phone, Audit) |
| `product_name` | `VARCHAR(255)` | `NULLABLE` | Drug product name |
| `product_strength` | `VARCHAR(100)` | `NULLABLE` | Strength or grade (e.g. `500 mg`) |
| `batch_number` | `VARCHAR(100)` | `INDEX, NULLABLE` | Batch / Lot number |
| `manufacturing_date`| `VARCHAR(50)` | `NULLABLE` | Manufacturing date (YYYY-MM-DD) |
| `expiry_date` | `VARCHAR(50)` | `NULLABLE` | Expiry date (YYYY-MM-DD) |
| `quantity_affected`| `VARCHAR(100)` | `NULLABLE` | Affected units (e.g. `1,200 tablets`) |
| `complaint_type` | `VARCHAR(150)` | `NULLABLE` | Categorization of defect |
| `complaint_date` | `VARCHAR(50)` | `NULLABLE` | Date reported |
| `description` | `TEXT` | `NULLABLE` | Detailed defect report |
| `severity` | `VARCHAR(50)` | `NULLABLE` | Low, Moderate, High, Critical |
| `priority` | `VARCHAR(50)` | `NULLABLE` | Low, Medium, High, Critical |
| `risk_level` | `VARCHAR(50)` | `NULLABLE` | LOW, MEDIUM, HIGH, CRITICAL |
| `risk_confidence` | `FLOAT` | `NULLABLE` | Confidence percentage (0-100) |
| `risk_reasoning` | `TEXT` | `NULLABLE` | ICH Q9 business reasoning |
| `ai_summary` | `TEXT` | `NULLABLE` | Executive summary |
| `completeness_score`| `FLOAT` | `NULLABLE` | Intake completeness score (0-100) |
| `missing_information`| `JSON` | `DEFAULT '[]'` | List of missing items |
| `possible_root_causes`| `JSON`| `DEFAULT '[]'` | Suggested investigation areas |
| `recommendations` | `JSON` | `DEFAULT '[]'` | Immediate containment steps |
| `capa_recommendation`| `TEXT` | `NULLABLE` | Corrective/Preventive Action recommendation |
| `duplicate_found` | `BOOLEAN` | `DEFAULT FALSE` | Duplicate alert flag |
| `duplicate_notes` | `TEXT` | `NULLABLE` | Duplicate matching justification |
| `field_provenance` | `JSON` | `DEFAULT '{}'` | Provenance map for each field |
| `status` | `VARCHAR(50)` | `DEFAULT 'Pending Triage'` | Pending Triage, Investigating, CAPA Required, Closed |
| `created_at` | `TIMESTAMP` | `DEFAULT UTC_NOW` | Audit trail creation timestamp |
| `updated_at` | `TIMESTAMP` | `DEFAULT UTC_NOW` | Audit trail last update timestamp |

---

## 8. REST API Endpoints

All endpoints are prefixed with `/api`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/complaints/analyze` | Accepts text or uploaded file (PDF/DOCX/TXT/EML/Image) and runs the 10-node LangGraph workflow |
| `POST` | `/api/complaints` | Saves reviewed/edited complaint into PostgreSQL, generating sequential `complaint_number` |
| `GET` | `/api/complaints` | Lists saved complaints with search, `risk_level` filter, and `status` filter |
| `GET` | `/api/complaints/{id}` | Retrieves a single complaint record by primary key |
| `PUT` | `/api/complaints/{id}` | Updates complaint fields or status |
| `POST` | `/api/complaints/{id}/duplicate-check` | Re-evaluates duplicate matches against historical database records |
| `POST` | `/api/complaints/{id}/risk-assessment` | Re-evaluates ICH Q9 risk level and confidence |
| `POST` | `/api/complaints/{id}/recommendations` | Generates fresh root cause categories and CAPA guidance |
| `POST` | `/api/complaints/chat` | Interactive QA Copilot assistant grounded in the complaint context |
| `GET` | `/api/health` | System diagnostics: PostgreSQL connection, dialect, LangGraph status, Groq status |

---

## 9. Environment Setup

Create `.env` in `backend/` (a template is provided in `backend/.env.example`):

```bash
# Groq API Configuration
GROQ_API_KEY=gsk_your_groq_api_key_here
LLM_MODEL=gemma2-9b-it

# Database Configuration (PostgreSQL running locally)
DATABASE_URL=postgresql://bharathreddy@localhost:5432/pharma_qms

# Application Configuration
APP_ENV=development
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000","http://127.0.0.1:5173"]
```

> **Note**: If `GROQ_API_KEY` is not provided, the system automatically activates its deterministic GxP pharmaceutical parsing & reasoning engine, allowing the complete workflow to be evaluated without third-party API dependencies.

---

## 10. How to Run the Backend

```bash
cd backend

# 1. Activate virtual environment
source venv/bin/activate

# 2. Run database initialization and pre-seed records
python -m app.database.init_db

# 3. Start FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend starts at `http://localhost:8000`.
Interactive Swagger API documentation is available at `http://localhost:8000/docs`.

---

## 11. How to Run the Frontend

```bash
cd frontend

# 1. Install dependencies (if not already installed)
npm install

# 2. Start Vite development server
npm run dev
```

The frontend application opens at `http://localhost:5173`.
All API calls to `/api` are automatically proxied to `http://localhost:8000`.

---

## 12. Example Complaint Input & Structured AI Output

### Example Input (Pasted Email / Document)
```text
Customer ABC Pharma reported that Batch B240812 of Paracetamol
500 mg tablets had several tablets with broken edges and unusual
discoloration. The shipment was received on 12 August 2026.
Customer requests investigation and replacement.
```

### Example Structured Output (JSON Schema)
```json
{
  "customer_name": "ABC Pharma",
  "complaint_source": "Email",
  "product_name": "Paracetamol Tablets",
  "product_strength": "500 mg",
  "batch_number": "B240812",
  "manufacturing_date": "2026-02-15",
  "expiry_date": "2028-02-14",
  "complaint_type": "Product Quality Complaint",
  "complaint_date": "2026-08-12",
  "quantity_affected": "Several units affected",
  "description": "Customer ABC Pharma reported that Batch B240812 of Paracetamol 500 mg tablets had several tablets with broken edges and unusual discoloration...",
  "severity": "High",
  "priority": "High",
  "risk_level": "HIGH",
  "risk_confidence": 91.0,
  "risk_reasoning": "Potential product quality defect affecting physical tablet integrity and chemical/visual appearance. Indicates potential process irregularity during granulation, compression, or coating.",
  "summary": "Customer reported tablet physical defects and unusual discoloration. Immediate batch quarantine and retain sample visual inspection required.",
  "completeness_score": 85.0,
  "missing_information": [
    "Expiry Date not specified in intake document",
    "Customer sample availability / physical evidence confirmation"
  ],
  "possible_root_causes": [
    "Manufacturing - Compression tooling mechanical wear or excess punch pressure",
    "Formulation - Granulation binder distribution and moisture content variance",
    "Packaging - Primary blister sealing temperature or barrier integrity failure"
  ],
  "recommended_actions": [
    "Place remaining inventory of affected batch on immediate QA quarantine hold",
    "Retrieve and inspect QC retain samples from beginning, middle, and end of compression run",
    "Initiate formalized Deviation Investigation DEV-2026 per SOP-QA-104"
  ],
  "capa_recommendation": "Inspect and re-calibrate tablet press tooling; verify granulator moisture sensor calibration; update in-process inspection frequency for tablet friability.",
  "duplicate_found": true,
  "duplicate_notes": "High similarity detected with existing record CMP-2026-001 (Identical Batch/Lot #B240812; Matching Product 'Paracetamol Tablets').",
  "field_provenance": {
    "customer_name": "AI Extracted",
    "complaint_source": "AI Extracted",
    "product_name": "AI Extracted",
    "product_strength": "AI Extracted",
    "batch_number": "AI Extracted",
    "manufacturing_date": "AI Extracted",
    "expiry_date": "AI Extracted",
    "quantity_affected": "AI Extracted",
    "complaint_type": "AI Inferred",
    "complaint_date": "AI Extracted",
    "description": "AI Extracted",
    "severity": "AI Inferred",
    "priority": "AI Inferred"
  }
}
```

---

## 13. Interview Explanation Flow

Use this exact walkthrough during your technical interview:

```
      [USER]
         │  (Uploads PDF or clicks 1-Click Demo)
         ▼
    [REACT UI] ──> Dispatches action to Redux store
         │
    [REDUX STATE] ──> Calls typed api.analyzeText()
         │
  [FASTAPI ENDPOINT] ──> Receives POST /api/complaints/analyze
         │
    [LANGGRAPH] ──> Executes 10-node StateGraph pipeline
         │
   [GROQ / GEMMA] ──> Dispatches prompt with low temperature (0.1)
         │
[STRUCTURED AI OUTPUT] ──> Strict JSON response with risk & CAPA
         │
[FASTAPI VALIDATION] ──> Validates schema with Pydantic StructuredComplaintAI
         │
    [REACT FORM] ──> Auto-populates fields with provenance badges
         │
   [USER REVIEW] ──> Quality Officer edits or verifies values
         │
 [POSTGRES DATABASE] ──> Saves complaint via POST /api/complaints (CMP-2026-XXX)
         │
   [AI COPILOT] ──> Displays risk reasoning, CAPA, & answers QA chat queries
```

### Key Files for Quick Interview Reference:
1. `backend/app/workflows/complaint_graph.py`: The 10-step LangGraph StateMachine.
2. `backend/app/ai/llm_client.py`: Groq integration, model switching, and GxP fallback.
3. `backend/app/schemas/complaint.py`: Pydantic validation schemas.
4. `backend/app/services/complaint_service.py`: Sequential numbering & duplicate detection algorithm.
5. `frontend/src/components/ComplaintForm.tsx`: Form with field provenance badges.
6. `frontend/src/components/IntakeAssistant.tsx`: Dropzone, extraction progress, and Copilot Q&A chat.

---

## 14. 5–10 Minute Demo Sequence

1. **Open the Application** at `http://localhost:5173`. Point out the header: PostgreSQL connected, LangGraph active, and the two-column QMS layout matching the reference UI.
2. **Click 1-Click Demo 1: "Discoloration & Tablet Chipping"**:
   - Watch the **Extraction Progress** bar advance from 0% to 100%.
   - Notice the animated stage checklist: *Document received* → *Extracting complaint information* → *Identifying product and batch* → *Checking complaint completeness* → *Performing AI risk assessment* → *Preparing complaint record*.
3. **Inspect the Populated Form**:
   - Show how the form was populated automatically.
   - Point out the **Provenance Badges**: `AI Extracted` on Customer, Product, Batch #B240812; `AI Inferred` on Complaint Type, Severity, and Priority.
   - Show that every field is completely editable by the Quality Officer.
4. **Examine the AI Copilot Panel**:
   - Highlight the **Duplicate Complaint Warning**: Detected duplicate against pre-seeded record `CMP-2026-001` with identical Batch `B240812`.
   - Review the **ICH Q9 Risk Assessment**: HIGH Risk (89-91% confidence) with regulatory reasoning.
   - Review **Completeness Check**: 85% complete, missing retain sample confirmation.
   - Review **Suggested Root Causes** and **CAPA Recommendation**.
5. **Interactive Copilot Q&A**:
   - In the "Ask me anything about this complaint..." box, click one of the suggested follow-ups or type:
     *"What immediate SOP actions should we take for this batch?"*
   - Observe the authoritative answer with GxP citations (*FDA 21 CFR 211.198, ICH Q9*).
6. **Save Complaint**:
   - Click **Save Complaint**.
   - Observe the green success banner and badge change to "Saved & Triaged".
7. **Verify PostgreSQL Persistence in Registry**:
   - Switch to the **Complaint Registry** tab.
   - Point out the newly saved record (e.g. `CMP-2026-004`) alongside existing seeded records.
   - Test search by typing `B240812` or filter by `HIGH` risk.
   - Click **Inspect** to open the full modal audit trail.

---

## 15. Limitations & Future Roadmap

- **Production-grade OCR**: Currently parses digital text from PDF, DOCX, TXT, and EML. Scanned non-searchable PDFs/images can be enhanced with Tesseract or cloud Vision APIs in future phases.
- **21 CFR Part 11 Electronic Signatures**: Future roadmap includes cryptographic audit signing (e-signature approval by Qualified Person).
- **ERP/LIMS Integration**: Direct hooks into SAP or LabWare LIMS for automatic batch release holds.
