from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import organizations, activity, reports, auth
from . import models

# 建立資料表 (確保在 models import 之後)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="碳排放 SaaS API",
    description="台灣中小企業溫室氣體盤查系統（符合 ISO 14064-1）",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # 簡化開發，允許所有來源
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
