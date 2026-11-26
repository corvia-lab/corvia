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
- Use the official PlantUML browser extension for Chrome or Firefox, which renders PlantUML inside GitHub pages ([plantuml.com/news](https://plantuml.com/news)).
- Run PlantUML locally (needs Java): `java -jar plantuml.jar docs/diagrams/*.puml`.

## Decision: keep PlantUML, render SVGs in CI

> **Decided** by quasipapa on 2026-11-26. Analysis by Claude (AI agent). Labels: **fact** (verified), **assumption**, **opinion**.

**Decision:** the diagrams stay in PlantUML. A GitHub Actions workflow will render them to SVG, and this README will embed the SVGs, so readers can see the diagrams on GitHub without any tools. Status: the workflow is planned, not built yet.

**Options considered**

| Option | Why not chosen |
|---|---|
| Move to Mermaid (rendered natively by GitHub) | Loses expressiveness the diagrams need (see below). |
| PlantUML proxy service (`plantuml.com/plantuml/proxy?src=<raw URL>`) | Depends on an external server for every view. Kept as a possible quick fix only. |
| Own PlantUML server | Needs a public service to run and maintain. |
| Documentation site on GitHub Pages | More setup than needed today. Worth revisiting if we build a documentation site. |

**Why not Mermaid**

- **Fact:** Mermaid sets the direction only for the whole diagram (`direction RL`). It has no reading-direction marker on a relation, which our associations use (`runs_on >`, `supports >`). Source: [Mermaid class diagram docs](https://mermaid.js.org/syntax/classDiagram.html), version 12.3.0.
- **Fact:** the Mermaid docs do not cover curly braces in member text (we use `kind : enum {a, b}`), custom stereotypes such as `<<relationship>>` (central to design D1), or two relations with different labels between the same pair of classes (`connection` in the smart home model has `source` and `target` edges to the same types). Same source.
- **Fact:** PlantUML lays out class diagrams with Graphviz (dot), Mermaid uses Dagre by default ([comparison, 2026](https://dev.to/levi_liu/mermaid-vs-plantuml-in-2026-which-to-pick-for-engineering-docs-59dm)).
- **Assumption, not tested:** with 13 to 20 classes and up to about 35 edges, `smart-home` and `metamodel` would be noticeably harder to read with Dagre.
- **Opinion:** a full move is not worth it. Mermaid could still be added later as a second, simplified output of `tools/build_diagrams.py` if a native preview turns out to matter.
