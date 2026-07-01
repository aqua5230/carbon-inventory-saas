#!/bin/sh
# Backend 容器啟動腳本：先套用 DB migration，再啟 uvicorn。
# 用 exec uvicorn 確保 SIGTERM 能正確傳遞給應用程式。
set -e

echo "[entrypoint] alembic upgrade head ..."
alembic upgrade head

echo "[entrypoint] migration done, starting uvicorn ..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
