# corvia – Architecture requirements

> **Status:** Draft (2026-11-26)
> **Review and revision:** Codex (AI agent)

These requirements cover qualities and behavior that shape the architecture of corvia. Feature details belong in the specifications. Sections marked **Open decision** identify choices for the maintainers. Proposed targets and examples give them a basis for deciding.

## Overview

| ID                                                      | Title                                   |
| ------------------------------------------------------- | --------------------------------------- |
| [AR-01](#ar-01-user-defined-models-at-runtime)          | User-defined models at runtime          |
| [AR-02](#ar-02-relationships-are-items)                 | Relationships are items                 |
| [AR-03](#ar-03-model-rules-are-enforced-on-every-write) | Model rules are enforced on every write |
| [AR-04](#ar-04-relationships-across-domains-and-models) | Relationships across domains and models |
| [AR-05](#ar-05-versioning-stages-and-merge)             | Versioning, stages and merge            |
| [AR-06](#ar-06-traceable-change-history)                | Traceable change history                |
| [AR-07](#ar-07-source-binding-without-source-knowledge) | Source binding without source knowledge |
| [AR-08](#ar-08-synchronization-on-demand)               | Synchronization on demand               |
| [AR-09](#ar-09-api-first)                               | API first                               |
| [AR-10](#ar-10-agent-access)                            | Agent access                            |
| [AR-11](#ar-11-transitive-queries)                      | Transitive queries                      |
| [AR-12](#ar-12-import-and-export-as-files)              | Import and export as files              |
| [AR-13](#ar-13-generic-views-and-domain-specific-views) | Generic views and domain-specific views |
| [AR-14](#ar-14-data-volume)                             | Data volume                             |
| [AR-15](#ar-15-response-times)                          | Response times                          |
| [AR-16](#ar-16-runs-in-docker-on-a-single-node)         | Runs in Docker on a single node         |
| [AR-17](#ar-17-authentication-and-authorization)        | Authentication and authorization        |
| [AR-18](#ar-18-licenses-of-components-and-dependencies) | Licenses of components and dependencies |
| [AR-19](#ar-19-small-agent-friendly-technology-stack)   | Small, agent-friendly technology stack  |

---

## AR-01: User-defined models at runtime

Users define their own item types, attributes and relationship types while the system is running.

**Explanation:** Creating or changing a model needs no code change, no database schema migration and no restart. Attributes are typed (string, text, number, boolean, date, enum, and possibly more later). A model change and any necessary data corrections can be submitted together under AR-03. For example, making an attribute required can include a default or explicit values for the affected items. If any item would still violate the new rule, corvia rejects the change and identifies the affected items.

**Rationale:** This is the core idea of corvia ([README](../../README.md), [initial concept §2](../drafts/initial-concept.md)). Iteration 1 confirmed that one generic meta-model can describe three very different domains ([findings](../findings/stage-1-findings.md)). See also [ADR 0001](decisions/0001-generic-core-model.md).

## AR-02: Relationships are items

Relationships are items themselves: they have attributes, can be n-ary and can be players of other relationships.

**Explanation:** A relationship has roles, each with allowed types, a count (`1`, `1..n`), a multiplicity per item and optionally an order. A relationship can point to another relationship, e.g. a logical connection that is _realized by_ a technical path, or a condition attached to "letter contains document". Relationships can be bound to sources like any item.

**Rationale:** Design decision D1 of Iteration 1 (see the [Iteration 1 design](https://github.com/corvia-lab/corvia/blob/c445a5fa9c89ff2a2179209fdbec637d63327a36/openspec/changes/stage-1-metamodel-exploration/design.md)), needed for n-ary relationships (initial concept §2.2) and for the drill-down from logical to technical connections. Confirmed by all three example models. This requirement has the largest effect on storage and queries.

## AR-03: Model rules are enforced on every write

Every committed change leaves the model and its data valid. Writers can submit related edits as one atomic change. The core checks the resulting state before making any part visible. If validation fails, it rejects the whole change and identifies the rule and affected items.

**Explanation:** Checked are attribute types, required attributes, allowed types per role, counts, multiplicities per item and uniqueness. The check applies to all writers alike: UI, API, imports, connectors and agents.

**Example — creating a letter and its group**

Every business letter belongs to exactly one group, and each group has at least one letter. To create the first letter in a new group, a writer submits the letter, the group and their `member_of` relationship together. All three become visible together. Submitting just the two items fails the membership rule and leaves neither item in the model. The same case must work through the public API used by the UI and by importers. [Business letter model](../../examples/business-letter/model.yaml)

**Rationale:** Derived from AR-01: with types defined at runtime, the compiler and the database schema cannot protect the data, so the core must do it. The Iteration 1 validator (`tools/validate.py`, level 2) shows the rules that are needed.

## AR-04: Relationships across domains and models

Users can relate items across domains, such as the chain from business process to application to infrastructure in the [enterprise example](../../examples/enterprise/README.md). Within one model this already works in Iteration 1. Whether relationships must also cross independently managed models is open.

**Open decision**

Does a use case require the application and its server to live in independently managed models? Iteration 1 gives each item an ID unique within its model. If references between models are required, the maintainers must decide how a reference identifies the target model and item, which target version or stage it resolves to (AR-05), and what a reader may see when they lack access to the target model (AR-17). [Iteration 1 item identity](../../spec/metamodel/README.md#item)

**Rationale:** _Relate_ across domains and sources is the central promise of corvia ([README](../../README.md), use case "processes → systems → infrastructure" in [initial concept §5](../drafts/initial-concept.md)). The Iteration 1 models are isolated and share no vocabulary ([findings](../findings/stage-1-findings.md), "Where it needed workarounds").

## AR-05: Versioning, stages and merge

Models, items and relationships are versioned. Versions can be merged in Development. Each promotion requires explicit approval to transfer the selected data from Development to Test or from Test to Production.

**Explanation:** Users can see a model as of a version or a point in time. The data model must support versioning from the start, even if it is built later. Editing data in Development leaves the Test version in place until the transfer is approved and completed. The same rule applies from Test to Production. Writing back to an external source requires a separate synchronization check under AR-08.

**Open decision**

What is versioned and promoted together (an item, a set of changes or a whole model), and can stages live in separate installations? The chosen unit must preserve AR-03 in the destination. For example, promoting the first letter of a new group must leave its membership valid in Test. Promotion of a bound item also requires a policy for pending changes, illustrated in [AR-08](#ar-08-synchronization-on-demand).

**Rationale:** Required by the [initial concept §4](../drafts/initial-concept.md) and the _V_ in the name ([README](../../README.md)). Deliberately left out of Iteration 1, so it is not covered by the current meta-model. Adding versioning to a data model that was not designed for it is expensive.

## AR-06: Traceable change history

Every change records who made it (person, connector or agent), when, and what changed. The history is kept after synchronization.

**Explanation:** This covers changes made in corvia as well as changes taken over from a source. It is the basis for the "as of" view in AR-05 and for reviewing what agents did.

**Rationale:** Derived from AR-05 and AR-08. Supports the project principle "AI proposes, people decide" ([README](../../README.md)): changes by agents must be visible and reversible. Iteration 1 deliberately kept no history (design D5).

## AR-07: Source binding without source knowledge

Items, relationships and single attributes can be bound to a source by connector name and external ID only.

**Explanation:** The core knows no API paths, protocols or credentials of sources. One item can combine attributes from several sources and attributes kept only in corvia. Credentials for sources live in the connectors, never in the core.

**Open decision**

How should users identify two source records as the same real-world object? In the smart home example, Home Assistant reports `dev-lr-plug` and the router reports `dev-lr-plug-router`. Both items are named “Living Room Plug”. The connector and external ID identify each source record. The maintainers still need to decide how a user confirms a match, whether to link or merge the records, and how a device count treats a confirmed match. Either representation must retain both source bindings and the provenance of their values. [Smart home items](../../examples/smart-home/items.yaml) · [Iteration 1 findings](../findings/stage-1-findings.md#where-it-needed-workarounds)

**Rationale:** Design decision D4 of Iteration 1; connectors are not part of the project ([README](../../README.md), [initial concept §3](../drafts/initial-concept.md)). Keeping credentials out of the core reduces the security risk of a corvia installation.

## AR-08: Synchronization on demand

Changes in both directions are collected as pending changes and synchronized on request, with an explicit check step.

**Explanation:** There is at most one pending change per direction and attribute. On conflicts the source value is preselected for confirmation by a person or system. Within corvia the last change wins. A failed write-back keeps the pending change with its error message.

**Example — promoting a bound item with a pending rename**

Test and Production both show `dev-lr-plug` as “Living Room Plug”. Its name is bound to `home-assistant` with external ID `switch.living_room_plug`. In Test, a user proposes “Reading Lamp Plug” and requests promotion while the rename is pending. Promotion alone must issue zero connector writes. Before anyone confirms a write-back, corvia must identify the stage, the intended connector target, the external ID and the proposed value. [Smart home items](../../examples/smart-home/items.yaml)

**Open decision**

Which stages may write to which connector targets, and how is each target selected? For the rename above, should promotion be blocked pending review, carry the proposal into Production for a fresh check, or leave it in Test and promote only the confirmed value? The policy must specify the resulting value and pending state in both stages. Whether a source can report a change to a relationship, such as a device moving between locations, is also open.

**Rationale:** Iteration 1 exercised the conflict rules with a simulated write-back. Stages and real connector writes were outside that experiment. [Prototype](../../prototypes/lib/deltas.js) · [Iteration 1 findings](../findings/stage-1-findings.md#editing-and-synchronization)

## AR-09: API first

All functions are available through a documented, versioned and machine-readable API. The UI, connectors, importers and agents use the same API.

**Explanation:** The UI has no private access to the core. The API is described in a machine-readable form (e.g. OpenAPI) so that clients and connector templates can be generated. Breaking changes get a new API version.

**Rationale:** Derived from AR-07 and AR-10: connectors and agents live outside the core and depend on a stable interface. corvia provides "skills and templates" for connectors built with AI ([README](../../README.md)), which needs a precise interface description.

## AR-10: Agent access

AI agents can read the collected information as a structured entry point and navigate it efficiently. Write access follows later.

**Explanation:** Agents need, besides reading items, the incoming relationships of an item ("what points to X"), items without a given relationship ("what has no Y"), and a place for known gaps such as stale data or unmerged duplicates. Access is offered through the API (AR-09) and an MCP server or equivalent.

**Rationale:** Requirement from the requirements exploration ([journal](../journal/2026-11-22-requirements-exploration.md)); results and gaps of the [agent check](../findings/stage-1-agent-check.md); open question 6 of the [findings](../findings/stage-1-findings.md).

## AR-11: Transitive queries

The system answers reachability queries along selected relationship types and roles through any number of hops. The query must terminate even when the data contains cycles and return each reachable result once.

**Reference query**

Which letters contain a given document part? Start with the part itself and follow `contains_subpart` from child to parent through all reachable parent parts. From each of these parts, including the starting part, follow `contains_part` from part to document, then `contains_document` from document to letter. Return the distinct letter IDs. This structural query includes conditional uses. For `part-tariff-row` the example yields exactly `let-change` and `let-welcome`. Adding the reverse edge between the tariff table and its row must yield the same two IDs. AR-15 uses this query to evaluate storage candidates. [Business letter items](../../examples/business-letter/items.yaml)

The smart home question “Which connections depend on this VPN tunnel?” is another use of role-aware traversal.

**Rationale:** Open question 8 of the [findings](../findings/stage-1-findings.md), decided there to be looked at in depth. Together with AR-02 and AR-14, this decides the choice of storage.

## AR-12: Import and export as files

Models and items can be imported and exported as files: CSV, XML and JSON, plus a model format that can be kept in git.

**Explanation:** Imports can be repeated without creating duplicates. An import of the reference volume (AR-14) completes in under 10 minutes. The YAML model format from Iteration 1 is the starting point for the model format.

**Backup acceptance test**

A full backup export must restore a consistent corvia state in an empty installation. In the AR-08 example, take the backup after the rename is proposed in Test and before promotion. After restore, query both stages and an earlier version. Compare the model, items, relationships, source bindings, stage versions and change history with their pre-export state. The pending rename must have the same value, direction and status in Test. Restoring it issues zero external writes. This recovery guarantee applies to the full backup export. Individual CSV, XML and JSON exchanges can cover a subset of the data.

**Rationale:** Required by the [initial concept §3](../drafts/initial-concept.md) as a connector variant. Models as files make examples reviewable and testable in CI, as in Iteration 1 (`examples/`, `tools/validate.py`). The import time is a proposed target.

## AR-13: Generic views and domain-specific views

Every model can be used with generic views (tree, table, details, pending changes). Domain-specific views can be added on top without changing the core.

**Explanation:** Generic views are driven only by the model and a presentation layer (labels, icons, title attribute, edges, drill-down, views). Domain-specific views use the public API (AR-09). List views and trees load data page by page or lazily, never a whole model at once.

**Rationale:** Design decisions D3 and D7 of Iteration 1. The decision on Iteration 2 in the [findings](../findings/stage-1-findings.md) doubts that a purely generic UI is accepted and proposes domain-specific views. Paging follows from the business letter volumes (findings, "UI fine-tuning deferred").

## AR-14: Data volume

The proposed single-node target is 1 million ordinary items and 5 million relationship items.

**Explanation:** Because relationships are items (AR-02), this means about 6 million items in total. Up to 20 users work in one installation at the same time. Horizontal scaling across several nodes is not required.

**Rationale:** The largest known case is quasipapa's business letter domain with about 800,000 letter-to-data relationships and up to 2,000 data items per letter (design D9). The proposed target adds headroom for enterprise landscapes. The maintainers still need to confirm the volume and concurrency targets.

## AR-15: Response times

The proposed API targets on the AR-16 reference machine at the AR-14 volume are under 300 ms (p95) to open an item with its direct relationships and under 2 s (p95) for the AR-11 business letter query.

**Proposed measurement**

Time the reference query from the API request to receipt of the complete set of distinct letter IDs. Verify the expected IDs on every run. Use a reproducible generated data set and a fixed set of starting parts, including deeply nested and heavily reused parts. Record the generator seed, relationship counts by type, nesting depths, fan-out, expected result sizes, concurrency, cache conditions and number of requests. The reported 800,000 letter-to-data relationships size the overall data set. The containment relationships traversed by this query need their own distribution. Reuse the workload in the CI performance smoke test. [Business letter volumes](../../examples/business-letter/README.md#volumes-in-practice)

**Open decision**

Before comparing storage candidates, agree on a representative workload and confirm the latency targets and measurement boundary. If the user-facing target is the first page, fix its size and record first-page and complete-result timings separately.

## AR-16: Runs in Docker on a single node

All components run in Docker containers. A single `docker compose up` starts a working installation, including demo data.

**Explanation:** The reference machine has 4 vCPU and 8 GB RAM, which matches a home lab VM or a small cloud VM. Images are built for linux/amd64 and linux/arm64. Configuration only through environment variables and mounted files. Stored data is migrated automatically on update.

**Rationale:** Docker is a given constraint (gp, 2026-11-26). corvia is self-hosted, by private users (smart home) and by companies ([initial concept §5](../drafts/initial-concept.md)), and maintainers work from tablets and Codespaces ([journal](../journal/2026-11-22-stage-1-implementation.md)). A single node keeps operation simple.

## AR-17: Authentication and authorization

A private installation works in a simple single-user mode. A company installation connects to an existing login through OpenID Connect. Permissions apply at least per model and role (read, write, administer).

**Explanation:** Connectors and agents authenticate with their own tokens, so their changes are recorded under their own identity (AR-06). Permissions per single item are not required.

**Rationale:** Derived from the two audiences in the [initial concept §5](../drafts/initial-concept.md) and from AR-06. Permissions were out of scope in Iteration 1 (design, non-goals) but are needed for any company use.

## AR-18: Licenses of components and dependencies

corvia is released under Apache 2.0. Code and content included in the repository must satisfy the project's license compatibility rule. [Project license](../../LICENSE) · [Contribution rules](../../AGENTS.md#7-license)

**Proposed distribution policy**

For dependencies shipped with corvia, the draft proposes allowing only permissive licenses such as Apache 2.0, MIT, BSD-2-Clause, BSD-3-Clause and the PostgreSQL License. Under this proposal GPL, AGPL, SSPL and BSL are excluded for components in scope. This is a project policy choice beyond the repository's compatibility rule.

**Open decision**

Before selecting dependencies, the maintainers must decide which license criterion applies to a library linked into corvia, to software included in a container image distributed by the project, and to a service supplied separately by the operator. Record which cases the proposed permissive-only rule covers and which criterion applies to the others. [Project licensing goals](../../README.md#why-apache-20)

## AR-19: Small, agent-friendly technology stack

The product uses as few programming languages and frameworks as possible. Preferred are widely used, well documented technologies.

**Explanation:** Each additional language or framework must be justified. The repository already uses Python (tools) and JavaScript (prototype). The development environment runs locally and in a GitHub Codespace / dev container. Specifications live in the same repository as the code.

**Rationale:** Two maintainers working in their spare time, and AI agents in every phase of development ([README](../../README.md)). Agents produce better code for widespread technologies, and a small stack keeps the project understandable. corvia is a research project and expects changes of direction ([README](../../README.md)), so the architecture must make it cheap to change or replace parts.
