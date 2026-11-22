"""Turn a model folder into one normalized JSON bundle for the prototypes."""

import datetime as dt
from pathlib import Path

from .load import load_folder


def _plain(value):
    if isinstance(value, (dt.date, dt.datetime)):
        return value.isoformat()
    if isinstance(value, dict):
        return {k: _plain(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_plain(v) for v in value]
    return value


def _normalize_item(item: dict) -> dict:
    out = {k: v for k, v in item.items() if k != "attributes"}
    attributes = {}
    for name, raw in (item.get("attributes") or {}).items():
        attributes[name] = raw if isinstance(raw, dict) else {"value": raw}
    out["attributes"] = attributes
    return out


def build_bundle(folder_path: str | Path) -> dict:
    folder = load_folder(folder_path)
    return _plain({
        "model": folder["model"],
        "items": [_normalize_item(i) for i in folder["items"]],
        "presentation": folder["presentation"],
    })
