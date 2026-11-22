# 2026-11-22 – Second session: exploring requirements with the brainstorming skill

> **Status:** Draft, journal entry
> **Participants:** quasipapa (human), Claude (AI agent, chat session in the Claude mobile app)
> **Purpose:** A rough record of how we worked and what we learned. It is part of the research question on how Business, IT and AI work together in one project.
> **Previous session:** [Project kickoff](2026-11-22-kickoff-with-an-ai-agent.md)

---

## 1. What happened

The session took about **1.5 hours** (18:50–20:25). It started from the [initial concept](../drafts/initial-concept.md) and turned it into a scope and a set of design decisions for a first stage.

### 1.1 Choosing a tool for the exploration

quasipapa asked which skill could support exploring requirements. The agent searched the available skills and the plugin catalog and listed several candidates. **superpowers/brainstorming** was already installed and was used for the rest of the session.

The skill makes the agent work in a fixed pattern: understand the current state first, ask **one question at a time**, play back what it understood, lay out **alternatives with trade-offs and a recommendation**, and only then write a design document.

### 1.2 Results

| Topic | Decision | How it came about |
|---|---|---|
| **Scope of stage 1** | No versioning, staging, merge, permissions or audit. Focus on the flexibility of the generic meta-model. | quasipapa narrowed the scope after the agent pointed out that the concept combines several large topics at once. |
| **Success criterion** | A concrete smart home model built on the generic meta-model. A rough enterprise model (process → system → infrastructure) serves as a control case. | quasipapa set the criterion. The control case was the agent's proposal, so the model is not tuned to one domain only. |
| **Form of the results** | The model as a specification first, plus throwaway UI prototypes | The agent recommended "specification only". quasipapa added prototypes to test whether a generic model can carry an intuitive UI, and which presentation information is needed in addition to the meta-model. |
| **Smart home view** | Overview of Home Assistant instances, their locations, connected devices (grouped by device class) and the connections they use (internal and external, e.g. Matter, MQTT) | quasipapa described a concrete everyday need when asked what "intuitive" means for him. |
| **Logical vs. technical connections** | Show the logical connection first. The technical path is a drill-down ("connection *realized by* element X"). | quasipapa's idea. It implies that a relationship must be able to point to another relationship. |
| **AI agents as consumers** | The model gives agents a structured entry point, from which they research details in the connected systems. | A new requirement raised by quasipapa during the session. |
| **Source binding** | Items and attributes store only *connector + unique ID*. How a source is updated is the connector's job. Attributes are either *bound* (from a source) or *unbound* (corvia only). | quasipapa found a leaner variant than the agent's first proposal. |
| **Synchronization** | Not written through immediately. Pending changes are collected and synchronized on request by a person or a system, with an explicit check. In stage 1, write-back is only simulated. | quasipapa's requirement. The agent derived what it means for the model. |
| **Pending changes** | Stored as a delta on the element (one per direction), not as separate change objects. The source wins on conflicts (as a pre-selected proposal that is confirmed), the last change wins within corvia. The delta disappears after a successful check. | The agent laid out both variants. quasipapa questioned whether a full change object is needed and set the conflict rules as a working hypothesis. |
| **Meta-model approach** | "Everything is an item": relationships are typed items themselves. Whether a type is shown as an edge is controlled by its presentation settings. | Three approaches were compared (everything is an item, property graph, RDF/OWL). At quasipapa's request, the agent researched how other tools model relationships (SAP LeanIX, Ardoq, ServiceNow CMDB, i-doit, ArchiMate, TypeDB). |
| **Specification format** | Write specifications in the [OpenSpec](https://github.com/Fission-AI/OpenSpec) structure | quasipapa's choice. The design for stage 1 will be the first OpenSpec change. |

---

## 2. Observations

### 2.1 Brainstorming skill (as seen by quasipapa)

**What worked well:**

- **The question-and-answer pattern.** One question at a time keeps the discussion focused and builds each step on the previous answer.
- **Alternatives laid out for a decision.** The options came with their trade-offs and a recommendation, which made decisions quick.
- **Explicit questioning.** The agent challenged statements and pointed out consequences and contradictions, for example between "the source wins" and "changes from the source are checked explicitly".

**What does not work without human competence:**

- **The alternatives must be checked by a person.** The human has to judge whether the options presented are enough, or whether there are other starting points the agent did not mention. In this session several of the best ideas came from the human, not from the list of options: the drill-down from logical to technical connections, the agent entry point, connector + ID instead of a full source description, and the delta instead of a separate change object.
- **Prioritization stays with the human.** What is important and what can stay out for now was decided by quasipapa, not by the agent.

### 2.2 Observed by the agent

- **Research on demand helps decisions.** The question "how do others do this?" was answered in a few minutes with sources. The finding that EA tools start with simple edges but turn connections into objects when they need more detail (e.g. LeanIX interface fact sheets) supported the chosen approach.
- **Playback catches misunderstandings early.** Short summaries after each part gave quasipapa the chance to correct or extend them, and he used it several times.
- **Process rules vs. session flow.** The skill asks for approaches to be presented in a message of their own. In practice, new requirements kept arriving during the decision (synchronization, deltas), so the decision on the approach took several rounds. That was useful, not a problem, but it made the session longer than a fixed script would suggest.
- **Version-dependent facts remain a limit.** The current OpenSpec version and its exact schema could not be verified from the chat. Running `openspec init` in the repository settles the structure.
- **Working from a phone.** The whole session ran in the mobile app. Short answers with one question at a time suited the small screen.
