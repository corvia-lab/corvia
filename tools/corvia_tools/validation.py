"""Both validation levels for one folder."""

from pathlib import Path

from .conformance import conformance_errors
from .load import load_folder
from .structure import structure_errors


def validate_folder(path: str | Path) -> list[str]:
    """Level 1 first; level 2 runs only on structurally valid files."""
    folder = load_folder(path)
    errors = (
        structure_errors(folder["model"], "model")
        + structure_errors({"items": folder["items"]}, "items")
        + structure_errors(folder["presentation"], "presentation")
    )
    return errors or conformance_errors(folder)
