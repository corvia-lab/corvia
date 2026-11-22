"""Write one PlantUML class diagram per example model to docs/diagrams/.

Usage: python tools/build_diagrams.py
The meta-model diagram (docs/diagrams/metamodel.puml) is written by hand.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from corvia_tools.load import load_folder  # noqa: E402
from corvia_tools.plantuml import model_diagram  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    out = ROOT / "docs" / "diagrams"
    out.mkdir(parents=True, exist_ok=True)
    for folder in sorted(p for p in (ROOT / "examples").iterdir() if p.is_dir()):
        text = model_diagram(load_folder(folder)["model"])
        (out / f"{folder.name}.puml").write_text(text, encoding="utf-8")
        print(f"wrote docs/diagrams/{folder.name}.puml")
    return 0


if __name__ == "__main__":
    sys.exit(main())
