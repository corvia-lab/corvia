"""Validate a corvia model folder: level 1 (structure), then level 2 (conformance).

Usage: python tools/validate.py <folder>
Prints one error per line. Exit code 0 when valid, 1 otherwise.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from corvia_tools.validation import validate_folder  # noqa: E402


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print(__doc__.strip())
        return 2
    errors = validate_folder(argv[1])
    for error in errors:
        print(error)
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
