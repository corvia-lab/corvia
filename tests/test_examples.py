"""The example models are valid and contain the cases the design asks for."""

from pathlib import Path

import pytest

from corvia_tools.load import load_folder
from corvia_tools.validation import validate_folder

EXAMPLES = Path(__file__).resolve().parents[1] / "examples"


def attr(item, name):
    raw = (item.get("attributes") or {}).get(name)
    return raw if isinstance(raw, dict) else ({"value": raw} if raw is not None else None)


def rels(items, rel_type):
    return [i for i in items if i["type"] == rel_type]


def players(rel, role):
    return rel["roles"][role]


@pytest.fixture(scope="module")
def smart_home():
    return load_folder(EXAMPLES / "smart-home")


def test_smart_home_is_valid():
    assert validate_folder(EXAMPLES / "smart-home") == []


def test_device_without_class(smart_home):
    items = smart_home["items"]
    classified = {players(r, "device")[0] for r in rels(items, "classified_as")}
    assert [i for i in items if i["type"] == "device" and i["id"] not in classified]


def test_same_name_in_two_sources(smart_home):
    by_name = {}
    for i in smart_home["items"]:
        if i["type"] == "device":
            name = attr(i, "name")
            by_name.setdefault(name["value"], set()).add((name.get("binding") or {}).get("connector"))
    assert any(len(connectors) >= 2 for connectors in by_name.values())


def test_moved_device(smart_home):
    items = smart_home["items"]
    located = {players(r, "thing")[0]: players(r, "location")[0] for r in rels(items, "located_at")}
    served = {}
    for r in rels(items, "serves"):
        served.setdefault(players(r, "instance")[0], set()).add(players(r, "location")[0])
    moved = [
        r for r in rels(items, "connection")
        if players(r, "source")[0] in located
        and players(r, "target")[0] in served
        and located[players(r, "source")[0]] not in served[players(r, "target")[0]]
    ]
    assert moved


def test_bound_next_to_unbound_attribute(smart_home):
    assert any(
        i["type"] == "device"
        and (attr(i, "name") or {}).get("binding")
        and attr(i, "purchase_date") and not attr(i, "purchase_date").get("binding")
        for i in smart_home["items"]
    )


def test_connection_with_note_only(smart_home):
    items = smart_home["items"]
    realized = {players(r, "realized")[0] for r in rels(items, "realized_by")}
    assert any(attr(c, "path_note") and c["id"] not in realized for c in rels(items, "connection"))


def test_unreachable_device(smart_home):
    assert any(i["type"] == "device" and (attr(i, "battery") or {}).get("value") == "empty" for i in smart_home["items"])


def test_instance_hosted_elsewhere_than_served(smart_home):
    items = smart_home["items"]
    host_of = {players(r, "guest")[0]: players(r, "host")[0] for r in rels(items, "runs_on")}
    location_of_host = {players(r, "host")[0]: players(r, "location")[0] for r in rels(items, "hosted_at")}
    assert any(
        players(r, "location")[0] != location_of_host.get(host_of.get(players(r, "instance")[0]))
        for r in rels(items, "serves")
    )


def test_conflicting_deltas(smart_home):
    assert any(
        (p := (attr(i, name) or {}).get("pending"))
        and "from_source" in p and p.get("to_source", {}).get("status") == "superseded_by_source"
        for i in smart_home["items"]
        for name in (i.get("attributes") or {})
    )
