"""Write one JSON bundle per example folder, plus an index, for the prototypes.

Usage: python tools/build_bundles.py [--examples DIR] [--out DIR]
Defaults: examples/ and prototypes/data/. Nothing is written if any folder is invalid.
"""

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from corvia_tools.bundle import build_bundle  # noqa: E402
from corvia_tools.validation import validate_folder  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--examples", type=Path, default=ROOT / "examples")
    parser.add_argument("--out", type=Path, default=ROOT / "prototypes" / "data")
    args = parser.parse_args(argv[1:])

    folders = sorted(p for p in args.examples.iterdir() if p.is_dir())
    failed = False
    for folder in folders:
        for error in validate_folder(folder):
            print(f"{folder.name}: {error}")
            failed = True
    if failed:
        return 1

    args.out.mkdir(parents=True, exist_ok=True)
    index = []
    for folder in folders:
        bundle = build_bundle(folder)
        (args.out / f"{folder.name}.json").write_text(
            json.dumps(bundle, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        index.append({"id": folder.name, "label": bundle["model"]["model"]})
    (args.out / "index.json").write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
