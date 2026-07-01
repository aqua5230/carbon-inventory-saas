"""
全測試共用 fixture。

設計原則：
- 不碰實機 SQLite (backend/carbon_saas.db)，全部用 in-memory。
- SECRET_KEY 在 import app 前就要設好，否則 auth_utils 會 raise。
- 每個測試一份 fresh DB schema，避免互相污染。
"""

import os

# 一定要在 import app 前設定 SECRET_KEY，否則 auth_utils 啟動會 raise。
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-pytest-only")
# 一般測試關閉 login rate limit，避免反覆 register/login 觸發 429。
# 專門驗證 rate limit 的測試自己重新開啟。
os.environ.setdefault("RATE_LIMIT_ENABLED", "false")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app


@pytest.fixture()
def test_db():
    """每個測試一份新的 in-memory SQLite，含完整 schema。"""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield TestingSessionLocal
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture()
def client(test_db):
    """注入隔離 DB 的 TestClient。"""
    with TestClient(app) as c:
        yield c


def _register_and_login(client: TestClient, email: str, password: str = "passw0rd") -> str:
    client.post("/api/auth/register", json={"email": email, "password": password})
    resp = client.post(
        "/api/auth/login",
        data={"username": email, "password": password},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


@pytest.fixture()
def user_a(client):
    token = _register_and_login(client, "userA@test.com")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def user_b(client):
    token = _register_and_login(client, "userB@test.com")
    return {"Authorization": f"Bearer {token}"}
