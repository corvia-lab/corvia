"""Level 1 validation against the meta-model's JSON Schemas."""

import datetime as dt
import json
from functools import cache
from pathlib import Path
from typing import Literal

from jsonschema import Draft202012Validator

SCHEMA_DIR = Path(__file__).resolve().parents[2] / "spec" / "metamodel"


@cache
def _validator(kind: str) -> Draft202012Validator:
    schema = json.loads((SCHEMA_DIR / f"{kind}.schema.json").read_text(encoding="utf-8"))
    return Draft202012Validator(schema)


def _plain(value):
    """YAML dates become ISO strings, so the schema sees what a bundle would contain."""
    if isinstance(value, dict):
        return {k: _plain(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_plain(v) for v in value]
    if isinstance(value, (dt.date, dt.datetime)):
        return value.isoformat()
    return value


def structure_errors(doc: dict, kind: Literal["model", "items", "presentation"]) -> list[str]:
    validator = _validator(kind)
    errors = sorted(validator.iter_errors(_plain(doc)), key=lambda e: list(e.absolute_path))
    return [f"{kind}: {e.json_path}: {e.message}" for e in errors]
