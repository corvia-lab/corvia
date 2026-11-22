"""Level 2 checks: items conform to the types of their concrete model."""

import copy
import subprocess
import sys
from pathlib import Path

from corvia_tools.conformance import conformance_errors
from corvia_tools.load import load_folder

ROOT = Path(__file__).resolve().parents[1]
MINIMAL = ROOT / "tests" / "fixtures" / "minimal"


def folder():
    return copy.deepcopy(load_folder(MINIMAL))


def item(f, item_id):
    return next(i for i in f["items"] if i["id"] == item_id)


def single_error(f, fragment):
    errors = conformance_errors(f)
    assert len(errors) == 1, errors
    assert fragment in errors[0], errors


def test_minimal_fixture_conforms():
    assert conformance_errors(folder()) == []


def test_duplicate_item_id():
    f = folder()
    f["items"].append({"id": "thing-2", "type": "thing", "attributes": {"name": "Other"}})
    single_error(f, "duplicate id")


def test_unknown_type():
    f = folder()
    f["items"].append({"id": "x", "type": "ghost"})
    single_error(f, "unknown type")


def test_unknown_attribute():
    f = folder()
    item(f, "thing-1")["attributes"]["color"] = "red"
    single_error(f, "unknown attribute")


def test_missing_required_attribute():
    f = folder()
    del item(f, "thing-2")["attributes"]["name"]
    single_error(f, "required")


def test_wrong_value_type():
    f = folder()
    item(f, "thing-1")["attributes"]["name"] = False  # YAML reads `no` as False
    single_error(f, "expected string")


def test_enum_value_not_allowed():
    f = folder()
    item(f, "thing-1")["attributes"]["kind"] = "medium"
    single_error(f, "not in enum")


def test_role_player_type_not_allowed():
    f = folder()
    f["model"]["types"]["other"] = {"kind": "item"}
    f["items"].append({"id": "other-1", "type": "other"})
    item(f, "link-1")["roles"]["a"] = ["other-1"]
    single_error(f, "not allowed in role")


def test_role_count_violated():
    f = folder()
    item(f, "link-1")["roles"]["a"] = ["thing-1", "thing-2"]
    single_error(f, "count")


def test_per_item_violated():
    f = folder()
    f["model"]["types"]["link"]["roles"]["a"]["per_item"] = "0..1"
    f["items"].append({"id": "link-2", "type": "link", "roles": {"a": ["thing-1"], "b": ["thing-1"]}})
    single_error(f, "per_item")


def test_unique_relationship_duplicate():
    f = folder()
    f["items"].append({"id": "link-2", "type": "link", "roles": {"a": ["thing-1"], "b": ["thing-2"]}})
    single_error(f, "unique")


def test_dangling_reference():
    f = folder()
    item(f, "link-1")["roles"]["b"] = ["nope"]
    single_error(f, "unknown item")


def test_unknown_connector():
    f = folder()
    item(f, "thing-1")["binding"]["connector"] = "other"
    single_error(f, "unknown connector")


def test_pending_on_unbound_attribute():
    f = folder()
    item(f, "thing-2")["attributes"]["kind"] = {
        "value": "small",
        "pending": {"to_source": {"value": "large", "status": "open"}},
    }
    single_error(f, "pending requires binding")


def test_presentation_unknown_type():
    f = folder()
    f["presentation"]["types"]["ghost"] = {"label": "Ghost"}
    single_error(f, "unknown type")


def test_as_edge_on_non_binary_relationship():
    f = folder()
    role = {"types": ["thing"], "count": "1", "per_item": "0..n"}
    f["model"]["types"]["trio"] = {"kind": "relationship", "roles": {"x": role, "y": role, "z": role}}
    f["presentation"]["types"]["trio"] = {"as_edge": True}
    single_error(f, "as_edge requires exactly two roles with count 1")


def test_cli_exit_codes(tmp_path):
    ok = subprocess.run([sys.executable, "tools/validate.py", str(MINIMAL)], cwd=ROOT, capture_output=True, text=True)
    assert ok.returncode == 0 and ok.stdout == ""
    for name in ("model.yaml", "presentation.yaml"):
        (tmp_path / name).write_bytes((MINIMAL / name).read_bytes())
    (tmp_path / "items.yaml").write_text("items:\n  - id: x\n    type: ghost\n", encoding="utf-8")
    bad = subprocess.run([sys.executable, "tools/validate.py", str(tmp_path)], cwd=ROOT, capture_output=True, text=True)
    assert bad.returncode == 1 and "unknown type" in bad.stdout


def test_pending_needs_attribute_binding_even_on_bound_item():
    f = folder()
    item(f, "thing-1")["attributes"]["kind"] = {
        "value": "small",
        "pending": {"to_source": {"value": "large", "status": "open"}},
    }
    single_error(f, "pending requires binding")


def test_reference_to_deleted_item():
    f = folder()
    item(f, "thing-1")["sync_status"] = "deleted"
    single_error(f, "deleted item")


def test_invalid_yaml_date_is_reported(tmp_path):
    from corvia_tools.validation import validate_folder

    for name in ("model.yaml", "presentation.yaml"):
        (tmp_path / name).write_bytes((MINIMAL / name).read_bytes())
    text = (MINIMAL / "items.yaml").read_text(encoding="utf-8").replace("2025-03-01", "2025-02-30")
    (tmp_path / "items.yaml").write_text(text, encoding="utf-8")
    errors = validate_folder(tmp_path)
    assert len(errors) == 1 and "cannot load" in errors[0], errors
