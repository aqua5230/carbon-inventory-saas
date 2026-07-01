import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import organizations, activity, reports, auth
from . import models  # noqa: F401  ← 確保 model class 註冊到 Base.metadata（給 alembic 用）

load_dotenv()

# Schema 由 alembic 管理：本機開發 `alembic upgrade head`，Docker 啟動會自動跑（見 backend/Dockerfile）。
# conftest.py 用 in-memory SQLite + Base.metadata.create_all，不受此移除影響。

app = FastAPI(
    title="碳排放 SaaS API",
    description="台灣中小企業溫室氣體盤查系統（符合 ISO 14064-1）",
    version="0.1.0"
)

# CORS 來源白名單；逗號分隔。未設定時退回到本機開發 origin。
_allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
allowed_origins = [o.strip() for o in _allowed_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(organizations.router)
app.include_router(activity.router)
app.include_router(reports.router)

@app.get("/")
def root():
    return {
        "service": "碳盤查 SaaS",
        "version": "0.1.0",
        "docs": "/docs",
        "status": "running"
    }
