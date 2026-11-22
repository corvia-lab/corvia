# Diagrams

> **Status:** Draft, stage 1

PlantUML class diagrams of the meta-model and the example models.

| File | Content | How it is made |
|---|---|---|
| [`metamodel.puml`](metamodel.puml) | The corvia meta-model: model, types, roles, items, bindings, pending deltas, presentation | By hand |
| [`smart-home.puml`](smart-home.puml) | Example model smart home | Generated |
| [`enterprise.puml`](enterprise.puml) | Example model enterprise | Generated |
| [`business-letter.puml`](business-letter.puml) | Example model business letters | Generated |

The model diagrams are generated from `examples/*/model.yaml` with `python tools/build_diagrams.py`. A test fails if they are out of date.

## How to read the model diagrams

- Item types are classes with their attributes. `[1]` means required.
- A simple relationship type (two roles, no attributes, nobody points to it) is an **association**, labeled with its name. The multiplicity at each end says how many items of that end one item at the other end can have.
- Any other relationship type is a **class** with the stereotype `<<relationship>>`. Its lines lead to the types that may play its roles. This shows design D1: relationships are items, so they can have attributes, more than two roles, and other relationships can point to them (e.g. `appears_when` from a "contains" relationship to a condition).

## How to view them

GitHub does not render PlantUML in the file view. Options:

- Paste the file content into the online editor at plantuml.com.
- Use a PlantUML extension in VS Code (also in a Codespace) or in a JetBrains IDE.
- Run PlantUML locally (needs Java): `java -jar plantuml.jar docs/diagrams/*.puml`.
