"""calculator 純函數測試。不需要 DB / FastAPI。"""

from types import SimpleNamespace

import pytest

from app.services.calculator import (
    EMISSION_DATA,
    calculate,
    get_factor,
    get_factor_metadata,
    get_period_summary,
    list_factors,
)


def test_calculate_electricity_uses_scope2_factor():
    result = calculate("electricity", 1000)
    # 1000 kWh × 0.494 = 494 kg
    assert result["co2e_kg"] == 494.0
    assert result["co2e_tonnes"] == 0.494
    assert result["scope"] == 2
    assert result["unit"] == "kWh"


def test_calculate_diesel_is_scope1():
    result = calculate("diesel", 100)
    # 100 L × 2.701 = 270.1 kg
    assert result["co2e_kg"] == pytest.approx(270.1, abs=1e-3)
    assert result["scope"] == 1


def test_calculate_unknown_source_raises():
    with pytest.raises(ValueError, match="未知的排放源類型"):
        calculate("UFO_fuel", 1)


def test_get_factor_unknown_raises():
    with pytest.raises(ValueError):
        get_factor("not_exist")


def _fake_record(co2e_kg, scope, **kw):
    return SimpleNamespace(
        co2e_kg=co2e_kg,
        co2e_tonnes=(co2e_kg or 0) / 1000,
        scope=scope,
        month=kw.get("month", 1),
        source_type=kw.get("source_type", "electricity"),
        amount=kw.get("amount", 0),
        unit=kw.get("unit", "kWh"),
    )


def test_period_summary_groups_by_scope_including_unclassified():
    records = [
        _fake_record(1000, 1),
        _fake_record(2000, 2),
        _fake_record(3000, 3),
        _fake_record(500, None),  # scope=None → unclassified（Phase 1 修正）
    ]
    summary = get_period_summary(records)

    assert summary["scope1_kg"] == 1000
    assert summary["scope2_kg"] == 2000
    assert summary["scope3_kg"] == 3000
    assert summary["unclassified_kg"] == 500
    assert summary["total_kg"] == 6500
    assert summary["scope_breakdown"]["unclassified"] == 0.5
    assert len(summary["sources"]) == 4


def test_period_summary_skips_records_with_null_co2():
    records = [_fake_record(None, 1), _fake_record(100, 1)]
    summary = get_period_summary(records)
    assert summary["scope1_kg"] == 100
    assert summary["total_kg"] == 100
    assert len(summary["sources"]) == 1


def test_period_summary_empty_returns_zeros():
    summary = get_period_summary([])
    assert summary["total_kg"] == 0
    assert summary["scope1_kg"] == 0
    assert summary["scope2_kg"] == 0
    assert summary["scope3_kg"] == 0
    assert summary["unclassified_kg"] == 0
    assert summary["sources"] == []


def test_factor_metadata_matches_emission_factors_json():
    meta = get_factor_metadata()
    assert meta["dataset_version"] == EMISSION_DATA["version"]
    assert meta["dataset_source"] == EMISSION_DATA["source"]
    assert meta["factors_count"] == len(EMISSION_DATA["factors"])
    assert meta["standard"].startswith("ISO 14064")


def test_period_summary_includes_factor_metadata():
    summary = get_period_summary([])
    meta = summary["factor_metadata"]
    assert meta["dataset_version"] == EMISSION_DATA["version"]
    assert meta["factors_count"] == len(EMISSION_DATA["factors"])


def test_list_factors_contains_required_sources():
    keys = {f["key"] for f in list_factors()}
    # 至少要有 scope1/2/3 各一代表
    assert "electricity" in keys  # scope2
    assert "diesel" in keys  # scope1
    # scope3 任一即可，挑一個 Step 1 加進來的
    assert any(k.startswith("business_travel") or k.startswith("commute") for k in keys)
