"""Alembic env：DATABASE_URL 由環境變數提供，target_metadata 取自 app.database.Base。

SQLite 不支援多數 ALTER TABLE，必須開 render_as_batch / batch_alter_table，否則 autogenerate
產生的 migration 在 SQLite 上會失敗。本專案 MVP 階段 DB 是 SQLite，正式環境換 PostgreSQL 時
batch 模式仍相容。
"""

import os
from logging.config import fileConfig

from dotenv import load_dotenv
from sqlalchemy import engine_from_config, pool

from alembic import context

# 讀 backend/.env 取得 DATABASE_URL
load_dotenv()

# 確保 import app.* 找得到。alembic 預期從 backend/ 執行，沒問題；
# 但 IDE / 子目錄呼叫時加保險。
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import Base  # noqa: E402
from app import models  # noqa: F401, E402  ← 確保所有 model class 註冊到 Base.metadata

config = context.config

# 用環境變數 DATABASE_URL 蓋掉 alembic.ini 內的 sqlalchemy.url
db_url = os.getenv("DATABASE_URL", "sqlite:///./carbon_saas.db")
config.set_main_option("sqlalchemy.url", db_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def _is_sqlite() -> bool:
    return db_url.startswith("sqlite")


def run_migrations_offline() -> None:
    context.configure(
        url=db_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=_is_sqlite(),
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=_is_sqlite(),
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
