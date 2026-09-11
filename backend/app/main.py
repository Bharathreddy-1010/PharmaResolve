import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database.init_db import init_database
from app.database.session import engine
from app.api.routes import router
from app.ai.llm_client import llm_client

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("pharma_qms")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables and seed records
    logger.info("Initializing Pharma QMS Database...")
    init_database()
    logger.info(f"Pharma QMS Backend started. LLM: {settings.LLM_MODEL} (Groq Active: {llm_client.is_groq_available()})")
    yield
    logger.info("Pharma QMS Backend shutting down...")

app = FastAPI(
    title="Pharma QMS - AI Customer Complaint Management API",
    description="GxP-compliant AI-powered customer complaint intake, risk assessment, and copilot orchestration for pharmaceutical manufacturing.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Open for development / Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(router)

@app.get("/")
def root():
    return {
        "system": "Pharma QMS Customer Complaint Management System",
        "status": "operational",
        "version": "1.0.0",
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health_check():
    db_connected = False
    try:
        with engine.connect() as conn:
            db_connected = True
    except Exception:
        db_connected = False

    return {
        "status": "healthy" if db_connected else "degraded",
        "database": {
            "connected": db_connected,
            "dialect": engine.dialect.name
        },
        "ai": {
            "orchestrator": "LangGraph StateGraph (10 Nodes)",
            "llm_provider": "Groq",
            "model": settings.LLM_MODEL,
            "groq_api_key_configured": bool(settings.GROQ_API_KEY.strip()),
            "fallback_active": not llm_client.is_groq_available()
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
