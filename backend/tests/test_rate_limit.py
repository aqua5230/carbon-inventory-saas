"""Login rate limit 行為測試。

conftest 預設關閉 limiter，這裡的測試在 fixture 內重新開啟，跑完還原，
避免污染其他需要連續 register/login 的測試。
"""

import pytest

from app.limiter import limiter


@pytest.fixture()
def rate_limit_on():
    """暫時打開 limiter；測試結束強制關閉，並嘗試重置內部 storage。"""
    limiter.enabled = True
    try:
        yield
    finally:
        limiter.enabled = False
        # slowapi 沒公開 reset，但 in-memory backend 內部 storage 可清掉，避免污染。
        try:
            limiter._storage.storage.clear()  # type: ignore[attr-defined]
        except Exception:  # noqa: BLE001 — 不同版本內部結構不同，清不掉就算了
            pass


def test_limiter_attached_to_app(client):
    """app.state.limiter 必須是同一個 limiter 物件（middleware 才能查到）。"""
    assert client.app.state.limiter is limiter


def test_login_rate_limit_blocks_after_threshold(client, rate_limit_on):
    """預設 5/minute；連續 7 次錯誤 login，前 5 次回 401，後 2 次必有 429。"""
    statuses = []
    for _ in range(7):
        r = client.post(
            "/api/auth/login",
            data={"username": "nobody@example.com", "password": "wrong"},
        )
        statuses.append(r.status_code)

    assert statuses[:5] == [401, 401, 401, 401, 401], statuses
    assert 429 in statuses[5:], statuses


def test_login_rate_limit_disabled_does_not_block(client):
    """conftest 預設 disabled；連打 8 次仍應回 401，不該出現 429。"""
    statuses = []
    for _ in range(8):
        r = client.post(
            "/api/auth/login",
            data={"username": "nobody2@example.com", "password": "wrong"},
        )
        statuses.append(r.status_code)

    assert 429 not in statuses, statuses
