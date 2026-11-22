# Stage 1 findings: generic meta-model

> **Status:** Draft, findings of stage 1, decision pending
> **Change:** [`stage-1-metamodel-exploration`](../../openspec/changes/stage-1-metamodel-exploration/design.md)
> **Written by:** Claude (AI agent) during implementation. Labels: **fact** (observed), **assumption**, **opinion**.

## Hypothesis and result

*(filled in at the end of stage 1)*

## What the meta-model could express directly

*(filled in at the end of stage 1)*

## Where it needed workarounds

Observed while building the example models (Tasks 3 and 4):

- **Fact:** A **change of a relationship reported by a source** (a device that moved, case 3) cannot be expressed. Deltas (D5) exist only on attributes. The move therefore shows up as an inconsistency: the device is still `located_at` the main house but connected to an instance that serves the second site.
- **Fact:** "The same device seen in two sources" (case 2) has no construct. It is modeled as two items with the same name and a note. A `same_as` relationship type would be possible but would be domain modeling, not meta-model support.
- **Fact:** **Attribute binding vs. item binding** needed a ruling: an attribute is bound only by its own binding, and that binding may omit the ID when it equals the item's external ID. Otherwise "bound name next to unbound purchase date" (case 4) would not be expressible on a bound item.
- **Fact:** Both example models define a type `runs_on`, with different roles. Models share no vocabulary, and there are **no supertypes** (e.g. `host` in the smart home and `server` in the enterprise model are the same kind of thing). For stage 1 this is fine; across many models it would lead to duplicated types.
- **Fact:** "Not applicable" and "unknown" cannot be told apart. The SaaS application without a server (enterprise model) and the device without a class (case 1) look the same: the relationship is simply missing.
- **Fact:** Validity periods of relationships (as in SAP LeanIX `activeFrom` / `activeUntil`) can only be expressed as ordinary date attributes. With no versioning in stage 1, there is no "as of" view.

## Presentation information that turned out to be needed

*(filled in after Task 8)*

## Editing and synchronization

*(filled in after Task 8)*

## Agent entry point

*(summary of [stage-1-agent-check.md](stage-1-agent-check.md), after Task 9)*

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

## Open questions for stage 2

*(filled in at the end of stage 1)*

## Decision on stage 2

*(left for quasipapa)*
