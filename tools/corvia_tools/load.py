"""Load a model folder (model.yaml, items.yaml, presentation.yaml)."""

from pathlib import Path

import yaml


def _read(path: Path):
    with path.open(encoding="utf-8") as handle:
        return yaml.safe_load(handle)


def load_folder(path: str | Path) -> dict:
    folder = Path(path)
    items_doc = _read(folder / "items.yaml") or {}
    return {
        "model": _read(folder / "model.yaml") or {},
        "items": items_doc.get("items", []),
        "presentation": _read(folder / "presentation.yaml") or {},
    }
