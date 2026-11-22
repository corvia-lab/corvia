## Why

corvia's central content hypothesis is that **one generic, flexible meta-model** (typed items, typed attributes, relationships) can describe very different domains, from a smart home to an enterprise landscape of processes, systems and infrastructure (see [README](../../../README.md) and [initial concept](../../../docs/drafts/initial-concept.md)).

Before any product code is written, stage 1 tests this hypothesis cheaply, and it tests a second question that decides whether the idea is usable at all: **can an intuitive user interface be built on a generic model, and what presentation information is needed in addition to the meta-model?**

Stage 1 has succeeded when there is a concrete **smart home model** built on the generic meta-model, together with throwaway UI prototypes that let the maintainers judge its usability.

## What Changes

- Define the **generic meta-model** as a specification (YAML files, validated by a schema).
- Define a **concrete smart home model** on top of it, with a small set of example items.
- Define a **rough enterprise model** (process → system → infrastructure) as a control case, so the meta-model is not tuned to one domain only.
- Define a **presentation layer** separate from the meta-model (display settings per type).
- Define how items and attributes are **bound to sources** (connector + unique ID) and how **pending changes** are recorded for an explicit, on-demand synchronization.
- Build **throwaway, clickable UI prototypes** that read the YAML files. Write-back to sources is only simulated.

**Out of scope for stage 1:** versioning, stages (Development → Test → Production), merge, permissions, audit, real connectors, real write-back to sources, a server or database, and a dedicated API for agents.

## Capabilities

Requirements are not yet written as spec deltas. Stage 1 is exploration, and binding requirements (SHALL) would be premature. The capabilities below are expected to get their own specs once the results of stage 1 are known.

### New Capabilities

- `metamodel`: Generic meta-model with typed items, typed attributes and relationships that are items themselves.
- `presentation`: Display settings per type, separate from the meta-model.
- `source-binding`: Binding of items and attributes to a connector and an external ID.
- `synchronization`: Pending changes as deltas and an explicit, on-demand synchronization with a check step.

### Modified Capabilities

None. There are no existing specs yet.

## Impact

- New files in the repository: the meta-model and example models as YAML, a schema for validation, and throwaway prototypes. Exact locations are left to the implementation plan.
- No effect on existing code (there is none yet).
- The results feed the decision on the next stage, including the choice of technology.
