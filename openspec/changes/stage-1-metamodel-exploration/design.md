## Context

This design comes out of a requirements exploration on 2026-11-22 between quasipapa (maintainer) and Claude (AI agent), using the superpowers/brainstorming skill (see the [journal entry](../../../docs/journal/2026-11-22-requirements-exploration.md)). Each decision below says who made it: **decided** means decided by the maintainer, **agent's call** means proposed by the agent and open for correction.

Starting point is the [initial concept](../../../docs/drafts/initial-concept.md). It combines several large topics: a generic model, versioning with stages, merge, and bidirectional synchronization. Stage 1 isolates the first one.

## Goals / Non-Goals

**Goals**

- Test whether a generic meta-model is flexible enough for two very different domains (decided).
- Produce a concrete smart home model on the meta-model. This is the success criterion (decided).
- Find out with prototypes whether an intuitive UI can be built on a generic model, and which presentation information is needed beyond the meta-model (decided).
- Give AI agents a structured entry point into the collected information, from which they can research details in the connected systems (decided).

**Non-Goals for stage 1** (decided)

- Versioning, stages, merge
- Permissions and audit
- Real connectors and real write-back to sources
- History of changes after synchronization

**Anti-goals** (agent's call)

- A smart home schema that only looks generic. The enterprise control model exists to catch this.
- Prototypes that quietly become the product. They are throwaway and decide no technology.
- A meta-model that needs to know details of source systems (APIs, protocols, credentials).

## Use case: the smart home overview

The maintainer wants a quick overview of (decided):

- which Home Assistant instances run, and at which location,
- which devices are connected to each instance, optionally grouped by device class,
- which connections are used, internal and external (network, Matter, MQTT, …).

The **logical connection** is shown first, for example "device X talks to instance Y via Zigbee". The **technical path** (bridges, brokers, hosts, networks) is a drill-down from the logical connection (decided).

Item types this suggests (agent's call, to be refined while modeling): location, Home Assistant instance, host, device, device class, gateway (coordinator, border router, radio receiver, ESP32, Raspberry Pi), broker, VPN tunnel, protocol / connection type, and connection.

### Invented example setup (decided with the maintainer)

All names and details are invented.

**Location 1 (main house)**
- Home Assistant instance 1 runs as a VM on a virtualization host.
- Zigbee sensors → Zigbee coordinator (USB stick passed through to the VM) → instance 1
- Matter-over-Thread devices → Thread border router → instance 1
- 433 MHz sensors → radio receiver → MQTT broker → instance 1 (n-ary case: one broker serves several sources and consumers)
- Wi-Fi plugs → router / access point → instance 1
- External: a weather service, a vendor cloud, remote access via VPN or reverse proxy

**Location 2 (second site)**
- The devices are physically at location 2, but Home Assistant instance 2 **runs in the network of location 1**.
- Bluetooth devices → ESP32 → VPN → instance 2
- 433 MHz sensors → Raspberry Pi → VPN → instance 2
- The VPN tunnel between the two locations is an item of its own, shared by several technical paths.

The two instances are **independent** and exchange no information.

**Messy cases the model must handle**
1. A device without a device class, or with a wrong one
2. The same device in two sources with different names (e.g. Home Assistant and the router's device list)
3. A device that moved to another location and instance
4. A bound attribute next to an unbound one (name from Home Assistant, purchase date only in corvia)
5. A connection whose technical path is unknown and only described as text (D2)
6. An unreachable device (e.g. empty battery)
7. An instance whose **host location** (location 1) differs from the **location it serves** (location 2): two distinct relationships between the same types

The enterprise control model covers a short chain **business process → application → infrastructure**, with a handful of items (agent's call).

## Decisions

### D1: "Everything is an item" (decided)

Relationships are typed items themselves. They have attributes, can bind to sources and can be the target of other relationships.

This is needed because of two requirements:

- **n-ary relationships** (the initial concept allows relationships between 2..n items),
- **"connection *realized by* element X"**: the drill-down from a logical connection to its technical path is a relationship that points to a relationship.

**Alternatives considered**

| Approach | Trade-off | Why not chosen |
|---|---|---|
| Property graph (nodes and edges with attributes) | Intuitive and easy to visualize | Relationships between relationships and n-ary relationships need special constructs, and that is exactly where our requirements lie. |
| RDF/OWL with SHACL | Mature standard, well known to agents | Heavyweight and hard to learn, and it makes an intuitive UI harder. |

**Research on other tools** (verified on 2026-11-22):

- SAP LeanIX, Ardoq and the ServiceNow CMDB model relationships as typed edges between two objects, with fields on the edge.
- When a connection needs more detail, LeanIX turns it into an object of its own (an Interface fact sheet per interface between two applications). In i-doit, relationships are objects as well.
- ArchiMate allows a relationship from an element to a relationship, but no relationship between two relationships.
- TypeDB treats relations as first-class: they are n-ary and can play roles in other relations. This is closest to D1.

The pattern "start with edges, turn them into objects when needed" in EA tools supports making relationships items from the start.

Sources: [LeanIX data model](https://community.leanix.net/it-s-all-about-community-7/factsheets-entity-relation-diagram-1510), [LeanIX fields on relations](https://docs-eam.leanix.net/docs/fact-sheet-relations), [LeanIX interface fact sheet](https://www.slideshare.net/leanIX_net/new-interface-fact-sheet), [Ardoq fields](https://help.ardoq.com/en/articles/44158-what-is-a-field), [ServiceNow CI relationships](https://www.servicenow.com/docs/r/zurich/servicenow-platform/configuration-management-database-cmdb/c_CIRelationships.html), [i-doit relationship objects](https://community.i-doit.com/post/2917), [ArchiMate 3 relationships](https://pubs.opengroup.org/architecture/archimate3-doc/ch-Relationships-and-Relationship-Connectors.html), [TypeDB hypergraph](https://typedb.com/docs/use-cases/hypergraph/).

### D2: Slim start for technical paths (decided)

At first, the technical path of a connection may be recorded as text or as attributes on the logical connection. The full form ("realized by") is modeled where it adds value. The meta-model must allow both, so a model can start slim and be detailed later.

### D3: Presentation layer separate from the meta-model (decided as a question to answer, agent's call on the content)

Presentation information lives in its own layer per type, not in the meta-model. Candidates to test with the prototypes: display name, icon, order and grouping of attributes, a "title" attribute per type, preferred views (list, tree, graph), and whether a relationship type **can be shown as an edge**.

Showing a relationship as an edge only works for relationships with exactly two ends. Relationships with more ends are shown as a node with several lines (agent's call).

Grouping and counting (e.g. devices per device class) is a requirement on views and evaluation, not on the meta-model (agent's call).

### D4: Source binding by connector + unique ID (decided)

An item or an individual attribute stores only the **connector** and the **unique ID** in the source. How a source is read or updated is the connector's job. The meta-model knows no API paths, protocols or credentials.

- **Bound** items and attributes come from an external source.
- **Unbound** items and attributes exist only in corvia.

Binding works at attribute level, so one item can combine attributes from several sources and attributes kept only in corvia.

The same connector + ID pair is the entry point for agents: an agent can use it to research details through the connector (agent's call).

### D5: Synchronization on demand, with deltas (decided)

Changes are not written through immediately. They are collected as **pending changes** and synchronized in both directions on request by a person or a system, with an explicit check of the result.

- A pending change is stored as a **delta on the element**: current value, pending value, direction and status. It is not a separate change object.
- There is at most **one delta per direction** (corvia → source, source → corvia) per attribute.
- Creating or deleting an item or a relationship is marked by a **status on the element** ("new, not synchronized", "deleted, not synchronized") (agent's call).
- **Conflict rules** (working hypothesis):
  - A change in corvia and a change in the source at the same time: the source wins. In the check step this is a pre-selected proposal that a person or a system confirms. The corvia delta is marked as "superseded by source".
  - Parallel changes within corvia: the last change wins.
- After a successful check, the delta disappears. Stage 1 keeps no history.
- For bound attributes the source is leading; for unbound attributes corvia is leading. No separate ownership flag is needed (agent's call, confirmed).

In stage 1, write-back to sources is **simulated**: the prototype shows which change would go to which connector (decided).

### D6: Deliverables and their form (agent's call, confirmed)

- The meta-model, the smart home model, the enterprise control model and the example items are **YAML files** in the repository, validated against a schema.
- The UI prototypes are **static, clickable HTML pages** that read these YAML files. They have no backend and are throwaway.
- Agents read the YAML files directly. A dedicated interface (API, MCP) comes later.

### D7: What the prototypes must show (agent's call, based on the exploration)

- **Editing, not only viewing.** Users can change values in the browser (e.g. rename a device). The prototype creates the deltas from D5, shows the list of pending changes, runs the check step (including the pre-selected "source wins" proposal on conflicts) and shows which change would go to which connector. State is kept in memory only. Reloading the page restores the YAML state. This follows from the maintainer's wish to judge changes as well as display.
- **One UI for both domains.** At least one prototype renders both the smart home model and the enterprise control model **without type-specific code**, driven only by the meta-model and the presentation layer. This is the sharpest test of the hypothesis.
- **Validation in two levels.** The files are checked (1) against the meta-model's structure and (2) against the types of their concrete model (attribute types, allowed relationship ends, multiplicities). Level 2 needs a small validator script. Its technology is left to the builder.
- **Agent entry point check.** An agent answers a few use-case questions from the YAML files alone, for example "which devices talk to instance Y via Zigbee?" and "which connector and ID does device Z come from?". The answers and any difficulties are recorded as findings.

### D8: Example data and evaluation (decided)

- **Example data is invented**, modeled on a typical private setup. It contains no real hostnames, addresses or personal data. The invented setup and its messy cases are agreed with the maintainer before modeling starts.
- **quasipapa judges the results.** gp may join later.
- **Stage 1 ends with a findings document** that records what was learned and the decision on stage 2.
- **No time box for now.** How long a cycle of modeling, prototyping and evaluation takes is itself part of the exploration and is recorded in the findings.

## Risks / Trade-offs

- **The generic model is harder to use than a specific one.** Mitigation: the prototypes test exactly this, and the presentation layer is where usability is added.
- **"Everything is an item" makes the model more abstract.** Mitigation: the presentation layer shows binary relationships as edges.
- **Too little real data.** Example items are entered by hand, so the prototypes may look tidier than reality. The example data should include some messy cases (agent's call).
- **Version-dependent tooling.** The OpenSpec structure of this change was written by hand, because the OpenSpec CLI was not available in the agent's environment. It should be checked with `openspec validate`.

## Left to the builder

- The concrete YAML structure and the schema technology (e.g. JSON Schema).
- File and folder layout of the models and prototypes.
- The exact set of example items, as long as they cover the use case above and include messy cases.
- Prototype technology, as long as the pages are static and read the YAML files.

## Open Questions

- How far does the generic approach go? Where do we need domain-specific extensions? (open research question from the README)
- Which presentation settings are really needed? (answered by the prototypes)
- What does the meta-model need to describe the types themselves (e.g. which attribute types, multiplicities, uniqueness) — and is the description of types itself made of items? (to be answered during modeling)
