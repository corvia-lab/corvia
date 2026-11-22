"""PlantUML class diagrams for concrete models.

Item types become classes. A relationship type becomes a plain association when it
is binary, has no attributes, has only roles of count 1 and no other relationship
points to it. Otherwise it becomes a class with the stereotype <<relationship>>,
linked to the types that may play its roles (design D1: relationships are items).
"""

MULT = {"0..1": "0..1", "0..n": "0..*", "1": "1", "1..n": "1..*"}


def _attribute_line(name: str, spec: dict) -> str:
    kind = spec["type"]
    if kind == "enum":
        kind = "enum {" + ", ".join(spec["values"]) + "}"
    return f"  {name} : {kind}" + (" [1]" if spec.get("required") else "")


def _class(name: str, spec: dict, stereotype: str = "") -> list[str]:
    head = f"class {name}{f' <<{stereotype}>>' if stereotype else ''}"
    attrs = spec.get("attributes", {})
    if not attrs:
        return [head]
    return [head + " {", *(_attribute_line(n, s) for n, s in attrs.items()), "}"]


def _is_plain_association(name: str, spec: dict, targeted: set[str]) -> bool:
    roles = spec["roles"]
    return (
        len(roles) == 2
        and not spec.get("attributes")
        and all(r["count"] == "1" for r in roles.values())
        and name not in targeted
    )


def model_diagram(model: dict) -> str:
    types = model["types"]
    targeted = {t for spec in types.values() if spec["kind"] == "relationship"
                for role in spec["roles"].values() for t in role["types"] if types.get(t, {}).get("kind") == "relationship"}
    lines = [f"@startuml {model['model']}", "hide empty members", "skinparam classAttributeIconSize 0", ""]
    links: list[str] = []
    for name, spec in types.items():
        if spec["kind"] == "item":
            lines += _class(name, spec)
        elif _is_plain_association(name, spec, targeted):
            (r1, s1), (r2, s2) = spec["roles"].items()
            for t1 in s1["types"]:
                for t2 in s2["types"]:
                    # The multiplicity at one end is how often the *other* end's items take part.
                    links.append(f'{t1} "{MULT[s2["per_item"]]}" -- "{MULT[s1["per_item"]]}" {t2} : {name} >')
        else:
            lines += _class(name, spec, "relationship")
            for role, role_spec in spec["roles"].items():
                count = "1..*" if role_spec["count"] == "1..n" else "1"
                label = role + (" {ordered}" if role_spec.get("ordered") else "")
                for player in role_spec["types"]:
                    links.append(f'{name} "{MULT[role_spec["per_item"]]}" --> "{count}" {player} : {label}')
    return "\n".join(lines + [""] + links + ["", "@enduml", ""])
