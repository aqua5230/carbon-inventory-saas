"""/health endpoint 測試。給 Docker healthcheck / 外部監控用，不需 auth。"""


def test_health_returns_ok(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["db"] == "ok"
    assert body["version"]  # 不空即可，避免測試與 main.py 版本字串耦合
    assert body["standard"].startswith("ISO 14064")
    assert body["dataset_version"]


def test_health_does_not_require_auth(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert "WWW-Authenticate" not in resp.headers
