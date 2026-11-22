"""PlantUML class diagrams generated from concrete models."""

from pathlib import Path

from corvia_tools.load import load_folder
from corvia_tools.plantuml import model_diagram

ROOT = Path(__file__).resolve().parents[1]


def diagram(name):
    return model_diagram(load_folder(ROOT / "examples" / name)["model"])


def test_item_type_becomes_class_with_typed_attributes():
    text = model_diagram(load_folder(ROOT / "tests" / "fixtures" / "minimal")["model"])
    assert "class thing {\n  name : string [1]\n  kind : enum {small, large}\n  bought : date\n}" in text
    assert text.startswith("@startuml minimal") and text.rstrip().endswith("@enduml")


def test_plain_binary_relationship_becomes_association():
    text = diagram("smart-home")
    assert 'ha_instance "0..*" -- "1" host : runs_on >' in text
    assert 'broker "0..*" -- "1" host : runs_on >' in text
    assert "class runs_on" not in text


def test_relationship_with_attributes_becomes_relationship_class():
    text = diagram("smart-home")
    assert "class connection <<relationship>> {\n  protocol : enum {zigbee, thread, matter, mqtt, ble, rf433, wifi, https, vpn} [1]" in text
    assert 'connection "0..*" --> "1" device : source' in text


def test_relationship_pointing_to_relationship_becomes_relationship_class():
    text = diagram("business-letter")
    assert "class contains_document <<relationship>>" in text
    assert 'contains_document "0..*" -- "0..1" condition : appears_when >' in text


def test_ordered_role_is_marked():
    assert 'has_fields "1" --> "1..*" data_structure_field : fields {ordered}' in diagram("business-letter")


def test_committed_diagrams_are_current():
    for folder in sorted((ROOT / "examples").iterdir()):
        if folder.is_dir():
            committed = (ROOT / "docs" / "diagrams" / f"{folder.name}.puml").read_text(encoding="utf-8")
            assert committed == diagram(folder.name), f"run python tools/build_diagrams.py ({folder.name} is stale)"
