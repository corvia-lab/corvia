# ADR 0001: A generic core model for corvia

> **Status:** Proposed (2026-11-26)
> **Proposed by:** gp, drafted with Claude (AI agent)
> **Review and revision:** Codex (AI agent)
> **To decide:** quasipapa and gp
> **Related:** [Iteration 1 findings](../../findings/stage-1-findings.md), [architecture requirements](../architecture-requirements.md)

## Context

corvia collects metadata from very different domains: a smart home, an enterprise landscape of processes, systems and infrastructure, business letters. Users choose their own types. The value of the tool lies in *Relate*: connecting items across domains and sources.

Iteration 1 tested whether one generic meta-model (typed items, typed attributes, relationships as items) can describe such domains. Three very different example models were expressed with the same meta-model, validated by the same tools and shown by the same prototype without type-specific code (findings, **fact**).

The same findings also show the limits: whether users accept a purely generic UI is open, and quasipapa suggested building the UI on a concrete model instead of making one generic UI fit all use cases.

Before any product code is written, we have to decide whether the **inside** of corvia (storage, versioning, synchronization, API) is generic, or whether each domain gets its own data model.

## Decision

corvia works internally with **one generic core model**. Concrete domains are captured *as data* on top of it (types, attributes, relationship types, presentation), not as code or database schemas.

This decides the **logical** model: the concepts every part of corvia shares (item, type, attribute, relationship, role, binding). How this model is stored physically is a separate decision (see "Open decisions").

Within this decision:

1. **The core is generic, not everything.** Storage, versioning, synchronization, validation and the API know only the meta-model. They contain no domain type names.
2. **Domain-specific behavior lives above the core:** in the presentation layer (configuration) and in optional domain-specific views or extensions that use the public API. The core does not depend on them.
3. **The meta-model does not describe itself as items** for now. The findings show it would be possible (structure types as items), but it adds a level of abstraction we do not need yet. This can be revisited.
4. **The Iteration 1 meta-model is the starting point**, not a fixed contract. It will change with versioning, stages and the open questions from the findings.

## Alternatives considered

| Alternative | Pros | Why not chosen |
|---|---|---|
| **A specific data model per domain** (e.g. tables for devices, applications, letters) | Simple queries, strong typing, easy to optimize, a UI that fits each domain | Every new domain needs code and a schema migration. Relationships across domains have to be built per pair. Contradicts the core idea (user-defined types, any domain) and the confirmed Iteration 1 hypothesis. |
| **Generic model and a generic UI only** | Least code, every domain works at once | The Iteration 1 findings doubt that users accept it. Excludes tailored workflows (e.g. composing a business letter). |
| **Adopt a standard such as RDF/OWL with SHACL** | Mature standard, known to agents, existing tools | Already considered in design D1: heavy to learn, makes an intuitive UI harder, and n-ary relationships and relationships on relationships need extra constructs (reification). |

## Consequences

**Positive**

- New domains need no code changes. This keeps the promise of the README.
- One storage, one versioning, one synchronization and one API for all domains. Agents and connectors learn one interface.
- Relationships across domains within one model need no special construct, because all domains use the same meta-model. Relationships across independently managed models are still open (AR-04).

**Negative / risks**

- **Persistence and query cost.** Compare storage candidates on the AR-11 part-to-letter query at the AR-14 volume under the workload agreed for AR-15. If a candidate returns incorrect results or misses the agreed latency target, revisit that storage design and measure an alternative, such as a derived read model. If satisfying the workload requires changing the shared model's semantics, reopen this ADR. [Reference query](../architecture-requirements.md#ar-11-transitive-queries) · [Measurement](../architecture-requirements.md#ar-15-response-times)
- **Weaker typing in code.** The core handles items generically, so domain rules are checked at runtime by the validator, not by the compiler. Mitigation: model validation on every write (AR-03) and good test coverage.
- **Risk of over-generalization.** A generic system invites building features "for every domain". Mitigation: each feature must be justified by at least one concrete example model.
- **UI effort moves up.** Good usability needs a strong presentation layer and the option of domain-specific views (AR-13).

## Open decisions

- **Model boundaries.** Decide whether users need references between independently managed models. If they do, define the target's identity, how its version is resolved and which access rights apply. [AR-04](../architecture-requirements.md#ar-04-relationships-across-domains-and-models)
- **Versioning, promotion and synchronization.** Choose the versioning and promotion unit, the write-back targets permitted for each stage and the fate of a pending change on promotion. Walk through the Test-stage rename of the Home Assistant plug. The decision must say what remains pending in Test and Production and which subsequent confirmation can write to which source. [AR-05](../architecture-requirements.md#ar-05-versioning-stages-and-merge) · [AR-08](../architecture-requirements.md#ar-08-synchronization-on-demand)
- **Identity across sources.** Decide how to represent and count a device that Home Assistant and the router each describe, while retaining the two source bindings. [AR-07](../architecture-requirements.md#ar-07-source-binding-without-source-knowledge)
- **Physical storage.** Select a representation after the correctness and latency experiment. Both the workload and its proposed targets need maintainer confirmation. [AR-15](../architecture-requirements.md#ar-15-response-times)
