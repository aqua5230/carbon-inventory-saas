"""多租戶隔離測試。取代 test_multitenant.sh，用 in-memory DB，重跑無副作用。"""

import uuid


def _rand_tax_id() -> str:
    return "T-" + uuid.uuid4().hex[:8].upper()


def test_unauthenticated_request_returns_401(client):
    resp = client.get("/api/organizations")
    assert resp.status_code == 401


def test_owner_sees_only_their_orgs(client, user_a, user_b):
    a_resp = client.post(
        "/api/organizations",
        json={"name": "OrgA", "tax_id": _rand_tax_id()},
        headers=user_a,
    )
    b_resp = client.post(
        "/api/organizations",
        json={"name": "OrgB", "tax_id": _rand_tax_id()},
        headers=user_b,
    )
    assert a_resp.status_code == 200
    assert b_resp.status_code == 200

    a_list = client.get("/api/organizations", headers=user_a).json()
    b_list = client.get("/api/organizations", headers=user_b).json()

    a_names = {o["name"] for o in a_list}
    b_names = {o["name"] for o in b_list}

    assert a_names == {"OrgA"}, f"A 看到 B 的資料：{a_names}"
    assert b_names == {"OrgB"}, f"B 看到 A 的資料：{b_names}"


def test_cross_tenant_facility_create_returns_404(client, user_a, user_b):
    """B 不應能對 A 的組織建立 facility；用 404 而非 403 避免洩漏資源存在。"""
    a_resp = client.post(
        "/api/organizations",
        json={"name": "OrgA", "tax_id": _rand_tax_id()},
        headers=user_a,
    )
    org_a_id = a_resp.json()["id"]

    bad = client.post(
        f"/api/organizations/{org_a_id}/facilities",
        json={"name": "BadFacility"},
        headers=user_b,
    )
    assert bad.status_code == 404


def test_cross_tenant_org_summary_returns_404(client, user_a, user_b):
    a_resp = client.post(
        "/api/organizations",
        json={"name": "OrgA", "tax_id": _rand_tax_id()},
        headers=user_a,
    )
    org_a_id = a_resp.json()["id"]

    bad = client.get(f"/api/organizations/{org_a_id}/summary", headers=user_b)
    assert bad.status_code == 404


def test_duplicate_tax_id_returns_400(client, user_a):
    tax = _rand_tax_id()
    first = client.post(
        "/api/organizations",
        json={"name": "OrgA1", "tax_id": tax},
        headers=user_a,
    )
    second = client.post(
        "/api/organizations",
        json={"name": "OrgA2", "tax_id": tax},
        headers=user_a,
    )
    assert first.status_code == 200
    assert second.status_code == 400


def test_create_org_preserves_profile_fields(client, user_a):
    response = client.post(
        "/api/organizations",
        json={
            "name": "OrgA",
            "tax_id": _rand_tax_id(),
            "industry_type": "製造業",
            "contact_email": "contact@example.com",
        },
        headers=user_a,
    )
    assert response.status_code == 200
    assert response.json()["industry_type"] == "製造業"
    assert response.json()["contact_email"] == "contact@example.com"
    listed = client.get("/api/organizations", headers=user_a).json()
    assert listed[0]["industry_type"] == "製造業"
    assert listed[0]["contact_email"] == "contact@example.com"


def test_period_status_update_owner_only(client, user_a, user_b):
    org = client.post(
        "/api/organizations",
        json={"name": "OrgA", "tax_id": _rand_tax_id()},
        headers=user_a,
    ).json()
    facility = client.post(
        f"/api/organizations/{org['id']}/facilities",
        json={"name": "Plant1"},
        headers=user_a,
    ).json()
    period = client.post(
        f"/api/facilities/{facility['id']}/periods",
        json={"year": 2026},
        headers=user_a,
    ).json()

    # A 自己更新 OK
    ok = client.patch(
        f"/api/periods/{period['id']}/status",
        json={"status": "submitted"},
        headers=user_a,
    )
    assert ok.status_code == 200
    assert ok.json()["status"] == "submitted"

    # B 越權應 404
    bad = client.patch(
        f"/api/periods/{period['id']}/status",
        json={"status": "draft"},
        headers=user_b,
    )
    assert bad.status_code == 404


def test_negative_activity_amount_is_rejected(client, user_a):
    org = client.post(
        "/api/organizations",
        json={"name": "OrgA", "tax_id": _rand_tax_id()},
        headers=user_a,
    ).json()
    facility = client.post(
        f"/api/organizations/{org['id']}/facilities",
        json={"name": "Plant1"},
        headers=user_a,
    ).json()
    period = client.post(
        f"/api/facilities/{facility['id']}/periods",
        json={"year": 2026},
        headers=user_a,
    ).json()

    response = client.post(
        f"/api/periods/{period['id']}/activity",
        json={"month": 1, "source_type": "electricity", "amount": -100},
        headers=user_a,
    )
    assert response.status_code == 422
