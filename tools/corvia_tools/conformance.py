"""Level 2 validation: items and presentation conform to their concrete model."""

import datetime as dt
import re
from collections import Counter, defaultdict

ISO_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
LOWER_BOUND = {"0..1": 0, "0..n": 0, "1": 1, "1..n": 1}
UPPER_BOUND = {"0..1": 1, "0..n": None, "1": 1, "1..n": None}


def _as_object(raw):
    return raw if isinstance(raw, dict) else {"value": raw}


def _value_error(spec: dict, value) -> str | None:
    kind = spec["type"]
    if value is None:
        return None
    if kind in ("string", "text"):
        return None if isinstance(value, str) else f"expected string, got {type(value).__name__} {value!r}"
    if kind == "number":
        ok = isinstance(value, (int, float)) and not isinstance(value, bool)
        return None if ok else f"expected number, got {value!r}"
    if kind == "boolean":
        return None if isinstance(value, bool) else f"expected boolean, got {value!r}"
    if kind == "date":
        if isinstance(value, dt.date) and not isinstance(value, dt.datetime):
            return None
        if isinstance(value, str) and ISO_DATE.match(value):
            try:
                dt.date.fromisoformat(value)
                return None
            except ValueError:
                pass
        return f"expected date YYYY-MM-DD, got {value!r}"
    if kind == "enum":
        return None if value in spec["values"] else f"value {value!r} not in enum {spec['values']}"
    return f"unsupported attribute type {kind}"


def _check_items(model: dict, items: list[dict]) -> list[str]:
    errors: list[str] = []
    types = model.get("types", {})
    connectors = set(model.get("connectors", []))
    counts = Counter(i.get("id") for i in items)
    for item_id, n in counts.items():
        if n > 1:
            errors.append(f"items: duplicate id {item_id!r}")
    by_id = {i["id"]: i for i in items}

    def check_binding(where: str, binding: dict | None):
        if binding and binding.get("connector") not in connectors:
            errors.append(f"{where}: unknown connector {binding.get('connector')!r}")

    participation: dict[tuple[str, str, str], int] = defaultdict(int)  # (rel type, role, item id) -> n
    seen_players: dict[str, set] = defaultdict(set)

    for it in items:
        where = f"item {it['id']!r}"
        spec = types.get(it["type"])
        if spec is None:
            errors.append(f"{where}: unknown type {it['type']!r}")
            continue
        check_binding(where, it.get("binding"))
        attr_specs = spec.get("attributes", {})
        attrs = {k: _as_object(v) for k, v in (it.get("attributes") or {}).items()}
        for name, attr_spec in attr_specs.items():
            if attr_spec.get("required") and attrs.get(name, {}).get("value") is None:
                errors.append(f"{where}: required attribute {name!r} is missing")
        for name, attr in attrs.items():
            attr_where = f"{where}, attribute {name!r}"
            if name not in attr_specs:
                errors.append(f"{attr_where}: unknown attribute")
                continue
            problem = _value_error(attr_specs[name], attr.get("value"))
            if problem:
                errors.append(f"{attr_where}: {problem}")
            check_binding(attr_where, attr.get("binding"))
            pending = attr.get("pending")
            if pending:
                if not (attr.get("binding") or it.get("binding")):
                    errors.append(f"{attr_where}: pending requires binding")
                for direction, delta in pending.items():
                    problem = _value_error(attr_specs[name], delta.get("value"))
                    if problem:
                        errors.append(f"{attr_where}, pending {direction}: {problem}")

        roles = it.get("roles") or {}
        if spec["kind"] == "item":
            if roles:
                errors.append(f"{where}: type {it['type']!r} is not a relationship but has roles")
            continue
        role_specs = spec["roles"]
        for role in roles:
            if role not in role_specs:
                errors.append(f"{where}: unknown role {role!r}")
        signature = []
        for role, role_spec in role_specs.items():
            players = roles.get(role)
            if not players:
                errors.append(f"{where}: missing role {role!r}")
                continue
            if role_spec["count"] == "1" and len(players) != 1:
                errors.append(f"{where}: role {role!r} has count 1 but {len(players)} players")
            for player in players:
                target = by_id.get(player)
                if target is None:
                    errors.append(f"{where}: role {role!r} references unknown item {player!r}")
                    continue
                if target["type"] not in role_spec["types"]:
                    errors.append(f"{where}: type {target['type']!r} not allowed in role {role!r}")
                participation[(it["type"], role, player)] += 1
            signature.append((role, tuple(players) if role_spec.get("ordered") else tuple(sorted(players))))
        if spec.get("unique"):
            key = tuple(signature)
            if key in seen_players[it["type"]]:
                errors.append(f"{where}: duplicates another {it['type']!r} relationship, but the type is unique")
            seen_players[it["type"]].add(key)

    for rel_type, spec in types.items():
        if spec["kind"] != "relationship":
            continue
        for role, role_spec in spec["roles"].items():
            low, high = LOWER_BOUND[role_spec["per_item"]], UPPER_BOUND[role_spec["per_item"]]
            for it in items:
                if it["type"] not in role_spec["types"]:
                    continue
                n = participation[(rel_type, role, it["id"])]
                if n < low or (high is not None and n > high):
                    errors.append(
                        f"item {it['id']!r}: is in role {role!r} of {rel_type!r} {n} times, per_item is {role_spec['per_item']}"
                    )
    return errors


def _check_presentation(model: dict, presentation: dict) -> list[str]:
    errors: list[str] = []
    types = model.get("types", {})

    def rel_role(where, rel_type, *role_names):
        spec = types.get(rel_type)
        if spec is None or spec["kind"] != "relationship":
            errors.append(f"{where}: unknown relationship type {rel_type!r}")
            return
        for role in role_names:
            if role not in spec["roles"]:
                errors.append(f"{where}: unknown role {role!r} of {rel_type!r}")

    for type_name, settings in (presentation.get("types") or {}).items():
        where = f"presentation type {type_name!r}"
        spec = types.get(type_name)
        if spec is None:
            errors.append(f"{where}: unknown type")
            continue
        attrs = spec.get("attributes", {})
        named = [settings.get("title_attribute"), settings.get("edge_label_attribute")]
        named += settings.get("attribute_order", [])
        if settings.get("drill_down"):
            named.append(settings["drill_down"].get("note_attribute"))
        for name in filter(None, named):
            if name not in attrs:
                errors.append(f"{where}: unknown attribute {name!r}")
        if settings.get("as_edge"):
            roles = spec.get("roles", {})
            if spec["kind"] != "relationship" or len(roles) != 2 or any(r["count"] != "1" for r in roles.values()):
                errors.append(f"{where}: as_edge requires exactly two roles with count 1")
        if settings.get("drill_down"):
            d = settings["drill_down"]
            rel_role(f"{where}, drill_down", d["via"], d["target_role"], d["path_role"])

    for view in presentation.get("views") or []:
        where = f"view {view['id']!r}"
        for key in ("root_type", "type"):
            if key in view and view[key] not in types:
                errors.append(f"{where}: unknown type {view[key]!r}")
        for level in view.get("levels", []):
            rel_role(where, level["via"], level["from_role"], level["to_role"])
            if "group_by" in level:
                g = level["group_by"]
                rel_role(f"{where}, group_by", g["via"], g["from_role"], g["to_role"])
    return errors


def conformance_errors(folder: dict) -> list[str]:
    model = folder["model"]
    return _check_items(model, folder["items"]) + _check_presentation(model, folder["presentation"])
