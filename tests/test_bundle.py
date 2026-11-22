"""JSON bundles: normalized, UTF-8, refused when invalid, committed files current."""

import json
import subprocess
import sys
from pathlib import Path

import yaml

from corvia_tools.bundle import build_bundle

ROOT = Path(__file__).resolve().parents[1]
MINIMAL = ROOT / "tests" / "fixtures" / "minimal"


def copy_minimal(tmp_path, items_mutator=None):
    for name in ("model.yaml", "presentation.yaml"):
        (tmp_path / name).write_bytes((MINIMAL / name).read_bytes())
    items = yaml.safe_load((MINIMAL / "items.yaml").read_text(encoding="utf-8"))
    if items_mutator:
        items_mutator(items)
    (tmp_path / "items.yaml").write_text(yaml.safe_dump(items, allow_unicode=True), encoding="utf-8")
    return tmp_path


def test_shorthand_is_normalized():
    bundle = build_bundle(MINIMAL)
    thing = next(i for i in bundle["items"] if i["id"] == "thing-1")
    assert thing["attributes"]["name"] == {"value": "Lamp"}
    assert set(bundle) == {"model", "items", "presentation"}


def test_dates_become_iso_strings():
    thing = next(i for i in build_bundle(MINIMAL)["items"] if i["id"] == "thing-1")
    assert thing["attributes"]["bought"] == {"value": "2025-03-01"}


def test_utf8_survives(tmp_path):
    def rename(items):
        items["items"][0]["attributes"]["name"] = "Küche"

    (tmp_path / "src").mkdir()
    copy_minimal(tmp_path / "src", rename)
    out = tmp_path / "out"
    result = subprocess.run(
        [sys.executable, "tools/build_bundles.py", "--examples", str(tmp_path), "--out", str(out)],
        cwd=ROOT, capture_output=True, text=True,
    )
    assert result.returncode == 0, result.stdout + result.stderr
    assert "Küche" in (out / "src.json").read_text(encoding="utf-8")
    assert json.loads((out / "index.json").read_text(encoding="utf-8"))[0]["id"] == "src"


def test_invalid_folder_is_refused(tmp_path):
    (tmp_path / "bad").mkdir()

    def break_it(items):
        items["items"].append({"id": "x", "type": "ghost"})

    copy_minimal(tmp_path / "bad", break_it)
    out = tmp_path / "out"
    result = subprocess.run(
        [sys.executable, "tools/build_bundles.py", "--examples", str(tmp_path), "--out", str(out)],
        cwd=ROOT, capture_output=True, text=True,
    )
    assert result.returncode == 1
    assert "unknown type" in result.stdout
    assert not (out / "bad.json").exists()


def test_committed_bundles_are_current():
    for folder in sorted((ROOT / "examples").iterdir()):
        if not folder.is_dir():
            continue
        committed = json.loads((ROOT / "prototypes" / "data" / f"{folder.name}.json").read_text(encoding="utf-8"))
        assert committed == build_bundle(folder), f"run python tools/build_bundles.py ({folder.name} is stale)"
