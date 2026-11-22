# Stage 1 findings: generic meta-model

> **Status:** Draft, findings of stage 1, decision pending
> **Change:** [`stage-1-metamodel-exploration`](../../openspec/changes/stage-1-metamodel-exploration/design.md)
> **Written by:** Claude (AI agent) during implementation. Labels: **fact** (observed), **assumption**, **opinion**.

## Hypothesis and result

**Hypothesis:** A generic, versioned meta-model (typed items, typed attributes, relationships with multiplicities) can describe very different domains, from a smart home to enterprise architecture.

**Result so far (opinion, pending the maintainer's evaluation):** Confirmed for stage 1, with limits. Both example models could be expressed with the same meta-model, validated by the same tools and shown by the same prototype without type-specific code (**fact**: `app.js` contains no type names, checked in Task 8). The limits are listed under "Where it needed workarounds". None of them breaks the approach, but several are candidates for meta-model features. Whether the prototype is *intuitive* has not been judged yet; that is the maintainer's evaluation.

## What the meta-model could express directly

All **facts**, shown by the example models and their tests:

- Different domains with user-chosen type names: 9 item types and 9 relationship types (smart home), 4 and 3 (enterprise).
- **Relationships as items** (D1): connections have attributes (protocol, scope), can be opened like any item, and can be the target of other relationships.
- **"Realized by"** (D1, D2): the technical path of a logical connection is a relationship that points to a relationship, with an ordered path. Example: Bluetooth device → instance 2, realized by ESP32 → VPN tunnel → Mini PC.
- **n-ary relationships**: the MQTT broker link (one broker, n publishers, n subscribers) and the tunnel endpoints.
- **Two different relationships between the same types** (case 7): instance 2 *runs on* a host at the main house and *serves* the second site.
- **Slim start** (D2): a connection whose path is only text (`path_note`).
- **Source binding** (D4): item and attribute level, several connectors on one item (name from Home Assistant, manufacturer from a vendor cloud, purchase date only in corvia).
- **Pending changes** (D5): deltas in both directions, including a conflict, stored in the YAML and handled by the prototype.
- **Multiplicities** (`count`, `per_item`) and **uniqueness**, checked by the validator.

## Where it needed workarounds

Observed while building the example models (Tasks 3 and 4):

- **Fact:** A **change of a relationship reported by a source** (a device that moved, case 3) cannot be expressed. Deltas (D5) exist only on attributes. The move therefore shows up as an inconsistency: the device is still `located_at` the main house but connected to an instance that serves the second site.
- **Fact:** "The same device seen in two sources" (case 2) has no construct. It is modeled as two items with the same name and a note. A `same_as` relationship type would be possible but would be domain modeling, not meta-model support.
- **Fact:** **Attribute binding vs. item binding** needed a ruling: an attribute is bound only by its own binding, and that binding may omit the ID when it equals the item's external ID. Otherwise "bound name next to unbound purchase date" (case 4) would not be expressible on a bound item.
- **Fact:** Both example models define a type `runs_on`, with different roles. Models share no vocabulary, and there are **no supertypes** (e.g. `host` in the smart home and `server` in the enterprise model are the same kind of thing). For stage 1 this is fine; across many models it would lead to duplicated types.
- **Fact:** "Not applicable" and "unknown" cannot be told apart. The SaaS application without a server (enterprise model) and the device without a class (case 1) look the same: the relationship is simply missing.
- **Fact:** Validity periods of relationships (as in SAP LeanIX `activeFrom` / `activeUntil`) can only be expressed as ordinary date attributes. With no versioning in stage 1, there is no "as of" view.

## Presentation information that turned out to be needed

**Facts** from building the prototype (Task 8):

| Setting | Kept? | Why |
|---|---|---|
| `label`, `icon` | yes | Without them, type names like `ha_instance` show up in the UI. |
| `title_attribute` | yes | Items need a readable name; IDs are not names. The agent check confirmed this. |
| `attribute_order` | yes | Puts the important attributes first. |
| `as_edge` + `edge_label_attribute` | yes | Shows binary relationships as `A → runs on → B` and connections with their protocol. |
| `drill_down` (`via`, `target_role`, `path_role`, `note_attribute`) | **new** | The meta-model says *that* a relationship can point to a relationship, but not *which* relationship type is "the technical path" of another. This had to be added to the presentation. |
| Views: `tree` with `levels` and `group_by`, `list` | yes | The smart home overview needs two hops plus grouping by device class. |
| Preferred graph view | not built | Not needed for the use case so far. Open. |

**Found while using it (fact):** tree levels follow a relationship without filtering by type. In the overview, "Remote access" (an external service that connects *to* instance 1) appears under instance 1 in the "(none)" group, next to devices. A level needs an optional **type filter**. Not fixed in the prototype, so the effect stays visible.

## Editing and synchronization

**Facts** from the prototype and the tests of `deltas.js`:

- The D5 rules can be implemented as written: one delta per direction, the last corvia change wins, the source wins on conflicts as a preselected proposal, failed write-backs keep the delta with a message, a successful check removes it.
- **Delete** needed a rule the design did not state: if the source reports a change for an item that was deleted in corvia, the proposal is to discard the delete (the source wins).
- **Creating items** is not supported in the prototype (decided in the plan). Open: how does an item created in corvia get its external ID? The connector would have to return it.
- **Changes to relationships** from a source (e.g. a device that moved) are not covered by attribute deltas. See "Where it needed workarounds".
- **Assumption:** reviewing pending changes in one table with preselected decisions is understandable. To be judged by the maintainer.

## Agent entry point

Details in [stage-1-agent-check.md](stage-1-agent-check.md). **Fact:** a fresh agent with access to only the meta-model README and the three smart home YAML files answered five of five questions correctly, with traceable IDs. It flagged the stale location of the moved device and the pending name conflict without being asked.

**Opinion:** the model works as a structured entry point. What agents miss is navigation help (a reverse index, "what has no Y") and an explicit place for known gaps, rather than more structure.

## Cycle time

Agent working time per task, from commit times (approximate, **fact**). Human review time is not included.

| Task | Content | Time |
|---|---|---|
| Brainstorming and design | Exploration with the maintainer | about 2.5 h (18:50–21:20, with breaks) |
| Plan | `tasks.md` | about 10 min |
| 1 | Meta-model schemas | about 6 min |
| 2 | Conformance validator | about 2 min |
| 3 | Smart home model | about 5 min |
| 4 | Enterprise model | about 3 min |
| 5 | JSON bundles | about 1 min |
| 6 | `model.js` | about 1 min |
| 7 | `deltas.js` | about 1 min |
| 8 | Prototype and checklist | about 3 min |
| 9 | Agent check | about 1 min |
| 10 | This document | about 2 min |

**Observation (opinion):** once the design and the plan were agreed, implementation took about 20 minutes of agent time. The exploration with the human took about 2.5 hours. The evaluation by the maintainer is still to come, so a full cycle cannot be measured yet.
## Open questions for stage 2

1. **Relationship deltas:** should a source be able to report changes of relationships (a device that moved), with the same check step as attributes?
2. **Identity across sources:** how are "the same thing seen in two sources" handled: a `same_as` relationship, merging, or a meta-model feature?
3. **Supertypes and shared vocabulary:** do models need type inheritance or shared types (host / server)?
4. **"Not applicable" vs. "unknown":** should a model be able to say that a relationship is intentionally missing?
5. **Presentation:** type filters per tree level; is a graph view needed?
6. **Agent support:** a reverse index and a place for known gaps; later an API or MCP server.
7. **Creating items** in corvia that belong to a source.
8. **Technology** for stage 2: the prototype decided none.

## Decision on stage 2

*(left for quasipapa)*
