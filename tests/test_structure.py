"""Level 1 checks: the files match the meta-model's JSON Schemas."""

import copy
from pathlib import Path

import yaml

from corvia_tools.load import load_folder
from corvia_tools.structure import structure_errors

MINIMAL = Path(__file__).parent / "fixtures" / "minimal"


def test_minimal_fixture_is_structurally_valid():
    folder = load_folder(MINIMAL)
    assert structure_errors(folder["model"], "model") == []
    assert structure_errors({"items": folder["items"]}, "items") == []
    assert structure_errors(folder["presentation"], "presentation") == []


def test_unknown_top_level_key_is_rejected():
    model = copy.deepcopy(load_folder(MINIMAL)["model"])
    model["foo"] = 1
    errors = structure_errors(model, "model")
    assert len(errors) == 1
    assert "foo" in errors[0]


def test_relationship_without_roles_is_rejected():
    model = copy.deepcopy(load_folder(MINIMAL)["model"])
    del model["types"]["link"]["roles"]
    assert structure_errors(model, "model") != []


def test_enum_without_values_is_rejected():
    model = copy.deepcopy(load_folder(MINIMAL)["model"])
    del model["types"]["thing"]["attributes"]["kind"]["values"]
    assert structure_errors(model, "model") != []


def test_utf8_names_load(tmp_path):
    for name in ("model.yaml", "presentation.yaml"):
        (tmp_path / name).write_bytes((MINIMAL / name).read_bytes())
    items = yaml.safe_load((MINIMAL / "items.yaml").read_text(encoding="utf-8"))
    items["items"][0]["attributes"]["name"] = "Küche Licht"
    (tmp_path / "items.yaml").write_text(
        yaml.safe_dump(items, allow_unicode=True), encoding="utf-8"
    )
    folder = load_folder(tmp_path)
    assert folder["items"][0]["attributes"]["name"] == "Küche Licht"
